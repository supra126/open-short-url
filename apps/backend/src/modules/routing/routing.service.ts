import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma, RoutingRule } from '@prisma/client';
import { PrismaService } from '@/common/database/prisma.service';
import { CacheService } from '@/common/cache/cache.service';
import { AuditLogService } from '@/modules/audit-log/audit-log.service';
import { RequestMeta } from '@/common/decorators/request-meta.decorator';
import { RoutingEvaluatorService } from './routing-evaluator.service';
import {
  CreateRoutingRuleDto,
  UpdateRoutingRuleDto,
  RoutingRuleResponseDto,
  RoutingRulesListResponseDto,
  UpdateSmartRoutingSettingsDto,
  CreateFromTemplateDto,
  TemplateListResponseDto,
} from './dto/routing-rule.dto';
import {
  RoutingConditionsDto,
  VisitorContext,
  ROUTING_RULE_TEMPLATES,
} from './dto/routing-condition.dto';
import { ERROR_MESSAGES } from '@/common/constants/errors';
import { isSafeUrl } from '@/common/validators/safe-url.validator';

/**
 * Routing rule with parsed conditions
 */
interface RoutingRuleWithConditions extends Omit<RoutingRule, 'conditions'> {
  conditions: RoutingConditionsDto;
}

/**
 * Type-safe conversion of RoutingConditionsDto to Prisma JsonValue
 * This avoids unsafe `as unknown as` type assertions while maintaining type safety
 */
function conditionsToPrismaJson(conditions: RoutingConditionsDto): Prisma.InputJsonValue {
  // RoutingConditionsDto is a validated DTO that only contains JSON-serializable values
  // This function serves as a type-safe bridge between our DTO types and Prisma's JSON types
  return JSON.parse(JSON.stringify(conditions)) as Prisma.InputJsonValue;
}

/**
 * Service for managing smart routing rules
 */
@Injectable()
export class RoutingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RoutingService.name);
  private readonly CACHE_TTL = 3600; // 1 hour
  private readonly CACHE_PREFIX = 'routing:';
  private readonly MAX_RULES_PER_URL = 50;

  // Batch update buffer for match counts
  private readonly matchCountBuffer = new Map<string, number>();
  private readonly matchCountRetries = new Map<string, number>();
  private readonly FLUSH_INTERVAL_MS = 30000; // 30 seconds
  private readonly MAX_FLUSH_RETRIES = 3; // Maximum retry attempts before dropping
  private flushIntervalHandle: ReturnType<typeof setInterval> | null = null;

  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
    private auditLogService: AuditLogService,
    private evaluator: RoutingEvaluatorService,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Start the batch update timer on module init
   */
  onModuleInit() {
    this.flushIntervalHandle = setInterval(() => {
      this.flushMatchCounts().catch((error) => {
        this.logger.error(
          `Failed to flush match counts: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      });
    }, this.FLUSH_INTERVAL_MS);
    this.logger.log(`Match count batch updater started (interval: ${this.FLUSH_INTERVAL_MS}ms)`);
  }

  /**
   * Flush remaining counts and stop timer on module destroy
   * Includes error handling to ensure graceful shutdown
   */
  async onModuleDestroy() {
    if (this.flushIntervalHandle) {
      clearInterval(this.flushIntervalHandle);
      this.flushIntervalHandle = null;
    }

    // Flush any remaining counts before shutdown with error handling
    try {
      const pendingCount = this.matchCountBuffer.size;
      if (pendingCount > 0) {
        this.logger.log(`Flushing ${pendingCount} pending match count updates before shutdown...`);
        await this.flushMatchCounts();
      }
      this.logger.log('Match count batch updater stopped successfully');
    } catch (error) {
      // Log the error but don't throw - we want graceful shutdown
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const pendingUpdates = Array.from(this.matchCountBuffer.entries());

      this.logger.error(
        `Failed to flush ${pendingUpdates.length} match count updates on shutdown: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );

      // Log the lost data for potential manual recovery
      if (pendingUpdates.length > 0) {
        this.logger.warn(
          `Lost match count updates: ${JSON.stringify(pendingUpdates.slice(0, 10))}${pendingUpdates.length > 10 ? '...' : ''}`,
        );
      }
    }
  }

  /**
   * Create a new routing rule
   */
  async create(
    urlId: string,
    userId: string,
    dto: CreateRoutingRuleDto,
    userRole?: 'ADMIN' | 'USER',
    meta?: RequestMeta,
  ): Promise<RoutingRuleResponseDto> {
    // Check if URL exists and belongs to user
    const url = await this.prisma.url.findFirst({
      where: {
        id: urlId,
        ...(userRole !== 'ADMIN' && { userId }),
      },
    });

    if (!url) {
      throw new NotFoundException(ERROR_MESSAGES.URL_NOT_FOUND);
    }

    // Check if max rules limit reached
    const existingRuleCount = await this.prisma.routingRule.count({
      where: { urlId },
    });
    if (existingRuleCount >= this.MAX_RULES_PER_URL) {
      throw new BadRequestException(ERROR_MESSAGES.ROUTING_MAX_RULES_EXCEEDED);
    }

    // Enable smart routing if not already enabled
    if (!url.isSmartRouting) {
      await this.prisma.url.update({
        where: { id: urlId },
        data: { isSmartRouting: true },
      });
    }

    // Create routing rule
    const rule = await this.prisma.routingRule.create({
      data: {
        urlId,
        name: dto.name,
        targetUrl: dto.targetUrl,
        priority: dto.priority ?? 0,
        isActive: dto.isActive ?? true,
        conditions: conditionsToPrismaJson(dto.conditions),
      },
    });

    // Clear cache
    await this.clearRoutingCache(urlId);

    // Audit log
    await this.auditLogService.create({
      userId,
      action: 'ROUTING_RULE_CREATED',
      entityType: 'routing_rule',
      entityId: rule.id,
      newValue: {
        urlId,
        name: rule.name,
        targetUrl: rule.targetUrl,
        priority: rule.priority,
        conditions: dto.conditions,
      },
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    // Emit webhook event
    this.eventEmitter.emit('routing.rule_created', {
      ruleId: rule.id,
      urlId,
      name: rule.name,
      targetUrl: rule.targetUrl,
      priority: rule.priority,
      userId,
    });

    return this.mapToResponse(rule);
  }

  /**
   * Create routing rule from template
   */
  async createFromTemplate(
    urlId: string,
    userId: string,
    dto: CreateFromTemplateDto,
    userRole?: 'ADMIN' | 'USER',
    meta?: RequestMeta,
  ): Promise<RoutingRuleResponseDto> {
    const template = ROUTING_RULE_TEMPLATES[dto.templateKey];
    if (!template) {
      throw new BadRequestException(ERROR_MESSAGES.ROUTING_TEMPLATE_NOT_FOUND);
    }

    const createDto: CreateRoutingRuleDto = {
      name: dto.name || template.name,
      targetUrl: dto.targetUrl,
      priority: dto.priority ?? 0,
      isActive: true,
      conditions: template.conditions,
    };

    return this.create(urlId, userId, createDto, userRole, meta);
  }

  /**
   * Get all routing rules for a URL with statistics
   */
  async findAll(
    urlId: string,
    userId: string,
    userRole?: 'ADMIN' | 'USER',
  ): Promise<RoutingRulesListResponseDto> {
    // Check if URL exists and belongs to user
    const url = await this.prisma.url.findFirst({
      where: {
        id: urlId,
        ...(userRole !== 'ADMIN' && { userId }),
      },
      include: {
        routingRules: {
          orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
        },
      },
    });

    if (!url) {
      throw new NotFoundException(ERROR_MESSAGES.URL_NOT_FOUND);
    }

    const rules = url.routingRules;
    const totalMatches = rules.reduce((sum, rule) => sum + rule.matchCount, 0);

    const stats = rules.map((rule) => ({
      ruleId: rule.id,
      name: rule.name,
      matchCount: rule.matchCount,
      matchPercentage: totalMatches > 0
        ? Math.round((rule.matchCount / totalMatches) * 1000) / 10
        : 0,
    }));

    return {
      rules: rules.map((rule) => this.mapToResponse(rule)),
      totalMatches,
      stats,
    };
  }

  /**
   * Get a single routing rule
   */
  async findOne(
    urlId: string,
    ruleId: string,
    userId: string,
    userRole?: 'ADMIN' | 'USER',
  ): Promise<RoutingRuleResponseDto> {
    // Check if URL exists and belongs to user
    const url = await this.prisma.url.findFirst({
      where: {
        id: urlId,
        ...(userRole !== 'ADMIN' && { userId }),
      },
    });

    if (!url) {
      throw new NotFoundException(ERROR_MESSAGES.URL_NOT_FOUND);
    }

    const rule = await this.prisma.routingRule.findFirst({
      where: {
        id: ruleId,
        urlId,
      },
    });

    if (!rule) {
      throw new NotFoundException(ERROR_MESSAGES.ROUTING_RULE_NOT_FOUND);
    }

    return this.mapToResponse(rule);
  }

  /**
   * Update a routing rule
   */
  async update(
    urlId: string,
    ruleId: string,
    userId: string,
    dto: UpdateRoutingRuleDto,
    userRole?: 'ADMIN' | 'USER',
    meta?: RequestMeta,
  ): Promise<RoutingRuleResponseDto> {
    // Check if URL exists and belongs to user
    const url = await this.prisma.url.findFirst({
      where: {
        id: urlId,
        ...(userRole !== 'ADMIN' && { userId }),
      },
    });

    if (!url) {
      throw new NotFoundException(ERROR_MESSAGES.URL_NOT_FOUND);
    }

    // Check if rule exists
    const existing = await this.prisma.routingRule.findFirst({
      where: {
        id: ruleId,
        urlId,
      },
    });

    if (!existing) {
      throw new NotFoundException(ERROR_MESSAGES.ROUTING_RULE_NOT_FOUND);
    }

    // Update rule
    const rule = await this.prisma.routingRule.update({
      where: { id: ruleId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.targetUrl !== undefined && { targetUrl: dto.targetUrl }),
        ...(dto.priority !== undefined && { priority: dto.priority }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.conditions !== undefined && {
          conditions: conditionsToPrismaJson(dto.conditions),
        }),
      },
    });

    // Clear cache
    await this.clearRoutingCache(urlId);

    // Audit log
    await this.auditLogService.create({
      userId,
      action: 'ROUTING_RULE_UPDATED',
      entityType: 'routing_rule',
      entityId: ruleId,
      oldValue: {
        name: existing.name,
        targetUrl: existing.targetUrl,
        priority: existing.priority,
        isActive: existing.isActive,
      },
      newValue: dto as unknown as Record<string, unknown>,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    // Emit webhook event
    this.eventEmitter.emit('routing.rule_updated', {
      ruleId: rule.id,
      urlId,
      name: rule.name,
      targetUrl: rule.targetUrl,
      priority: rule.priority,
      userId,
    });

    return this.mapToResponse(rule);
  }

  /**
   * Delete a routing rule
   */
  async delete(
    urlId: string,
    ruleId: string,
    userId: string,
    userRole?: 'ADMIN' | 'USER',
    meta?: RequestMeta,
  ): Promise<void> {
    // Check if URL exists and belongs to user
    const url = await this.prisma.url.findFirst({
      where: {
        id: urlId,
        ...(userRole !== 'ADMIN' && { userId }),
      },
      include: {
        routingRules: true,
      },
    });

    if (!url) {
      throw new NotFoundException(ERROR_MESSAGES.URL_NOT_FOUND);
    }

    // Check if rule exists
    const rule = url.routingRules.find((r) => r.id === ruleId);
    if (!rule) {
      throw new NotFoundException(ERROR_MESSAGES.ROUTING_RULE_NOT_FOUND);
    }

    // Calculate remaining rules count before deletion
    const remainingRulesCount = url.routingRules.length - 1;

    // Delete rule
    await this.prisma.routingRule.delete({
      where: { id: ruleId },
    });

    // If no rules left, disable smart routing
    if (remainingRulesCount === 0) {
      await this.prisma.url.update({
        where: { id: urlId },
        data: { isSmartRouting: false },
      });
    }

    // Clear cache
    await this.clearRoutingCache(urlId);

    // Audit log
    await this.auditLogService.create({
      userId,
      action: 'ROUTING_RULE_DELETED',
      entityType: 'routing_rule',
      entityId: ruleId,
      oldValue: {
        urlId,
        name: rule.name,
        targetUrl: rule.targetUrl,
        priority: rule.priority,
      },
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    // Emit webhook event
    this.eventEmitter.emit('routing.rule_deleted', {
      ruleId,
      urlId,
      name: rule.name,
      targetUrl: rule.targetUrl,
      priority: rule.priority,
      userId,
    });
  }

  /**
   * Update smart routing settings for a URL
   */
  async updateSettings(
    urlId: string,
    userId: string,
    dto: UpdateSmartRoutingSettingsDto,
    userRole?: 'ADMIN' | 'USER',
    meta?: RequestMeta,
  ): Promise<{ isSmartRouting: boolean; defaultUrl: string | null }> {
    // Check if URL exists and belongs to user
    const url = await this.prisma.url.findFirst({
      where: {
        id: urlId,
        ...(userRole !== 'ADMIN' && { userId }),
      },
    });

    if (!url) {
      throw new NotFoundException(ERROR_MESSAGES.URL_NOT_FOUND);
    }

    // Update settings
    const updated = await this.prisma.url.update({
      where: { id: urlId },
      data: {
        ...(dto.isSmartRouting !== undefined && { isSmartRouting: dto.isSmartRouting }),
        ...(dto.defaultUrl !== undefined && { defaultUrl: dto.defaultUrl }),
      },
    });

    // Clear cache
    await this.clearRoutingCache(urlId);

    // Audit log
    await this.auditLogService.create({
      userId,
      action: 'URL_UPDATED',
      entityType: 'url',
      entityId: urlId,
      oldValue: {
        isSmartRouting: url.isSmartRouting,
        defaultUrl: url.defaultUrl,
      },
      newValue: dto as unknown as Record<string, unknown>,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return {
      isSmartRouting: updated.isSmartRouting,
      defaultUrl: updated.defaultUrl,
    };
  }

  /**
   * Get available templates
   */
  getTemplates(): TemplateListResponseDto {
    return {
      templates: Object.entries(ROUTING_RULE_TEMPLATES).map(([key, template]) => ({
        key,
        name: template.name,
        description: template.description,
        conditions: template.conditions,
      })),
    };
  }

  /**
   * Evaluate routing rules for a URL and return matched rule
   * This is called from the redirect service
   */
  async evaluateRules(
    urlId: string,
    context: VisitorContext,
  ): Promise<{ rule: RoutingRuleWithConditions | null; targetUrl: string | null }> {
    // Try to get from cache first
    const cacheKey = `${this.CACHE_PREFIX}${urlId}`;
    let rules = await this.cacheService.get<RoutingRuleWithConditions[]>(cacheKey);

    if (!rules) {
      // Fetch from database
      const dbRules = await this.prisma.routingRule.findMany({
        where: {
          urlId,
          isActive: true,
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
      });

      rules = dbRules.map((rule) => ({
        ...rule,
        conditions: rule.conditions as unknown as RoutingConditionsDto,
      }));

      // Cache the rules
      if (rules.length > 0) {
        await this.cacheService.set(cacheKey, rules, this.CACHE_TTL);
      }
    }

    // Evaluate rules in priority order
    for (const rule of rules) {
      if (this.evaluator.evaluate(rule.conditions, context)) {
        // SECURITY: Secondary validation of targetUrl to prevent SSRF
        // Even though DTO validation exists, this protects against:
        // 1. Direct database manipulation
        // 2. Race conditions during validation
        // 3. Data migration issues
        if (!isSafeUrl(rule.targetUrl)) {
          this.logger.warn(
            `SECURITY: Unsafe targetUrl detected for routing rule ${rule.id}, skipping. URL: ${rule.targetUrl.substring(0, 50)}...`,
          );
          continue; // Skip this rule and evaluate the next one
        }
        return { rule, targetUrl: rule.targetUrl };
      }
    }

    return { rule: null, targetUrl: null };
  }

  /**
   * Increment match count for a routing rule (buffered for batch updates)
   * Counts are accumulated in memory and flushed to the database periodically
   */
  incrementMatchCount(ruleId: string): void {
    const currentCount = this.matchCountBuffer.get(ruleId) || 0;
    this.matchCountBuffer.set(ruleId, currentCount + 1);
  }

  /**
   * Flush accumulated match counts to the database
   * Uses batch transactions for efficiency
   * Implements retry limit to prevent infinite buffer growth
   */
  private async flushMatchCounts(): Promise<void> {
    if (this.matchCountBuffer.size === 0) {
      return;
    }

    // Copy and clear the buffer atomically
    const updates = Array.from(this.matchCountBuffer.entries());
    this.matchCountBuffer.clear();

    if (updates.length === 0) {
      return;
    }

    this.logger.debug(`Flushing ${updates.length} match count updates`);

    try {
      // Use transaction for batch update
      await this.prisma.$transaction(
        updates.map(([ruleId, count]) =>
          this.prisma.routingRule.update({
            where: { id: ruleId },
            data: { matchCount: { increment: count } },
          }),
        ),
      );
      this.logger.debug(`Successfully flushed ${updates.length} match count updates`);

      // Clear retry counts for successful updates
      updates.forEach(([ruleId]) => {
        this.matchCountRetries.delete(ruleId);
      });
    } catch (error) {
      this.logger.error(
        `Failed to flush match counts: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );

      // Re-add failed updates back to buffer with retry limit
      let droppedCount = 0;
      updates.forEach(([ruleId, count]) => {
        const currentRetries = this.matchCountRetries.get(ruleId) || 0;
        const newRetries = currentRetries + 1;

        if (newRetries >= this.MAX_FLUSH_RETRIES) {
          // Drop the update after max retries
          this.matchCountRetries.delete(ruleId);
          droppedCount++;
        } else {
          // Re-add to buffer for retry
          const existingCount = this.matchCountBuffer.get(ruleId) || 0;
          this.matchCountBuffer.set(ruleId, existingCount + count);
          this.matchCountRetries.set(ruleId, newRetries);
        }
      });

      if (droppedCount > 0) {
        this.logger.warn(
          `Dropped ${droppedCount} match count updates after ${this.MAX_FLUSH_RETRIES} failed attempts`,
        );
      }
    }
  }

  /**
   * Clear routing cache for a URL
   * Also clears the URL slug cache to ensure redirect uses updated routing rules
   */
  private async clearRoutingCache(urlId: string): Promise<void> {
    // Clear routing rules cache
    const routingCacheKey = `${this.CACHE_PREFIX}${urlId}`;
    await this.cacheService.del(routingCacheKey);

    // Also clear the URL slug cache to ensure redirect picks up changes
    const url = await this.prisma.url.findUnique({
      where: { id: urlId },
      select: { slug: true },
    });

    if (url) {
      const urlSlugCacheKey = `url:slug:${url.slug}`;
      await this.cacheService.del(urlSlugCacheKey);
    }
  }

  /**
   * Map to response DTO
   */
  private mapToResponse(rule: RoutingRule): RoutingRuleResponseDto {
    return {
      id: rule.id,
      urlId: rule.urlId,
      name: rule.name,
      targetUrl: rule.targetUrl,
      priority: rule.priority,
      isActive: rule.isActive,
      conditions: rule.conditions as unknown as RoutingConditionsDto,
      matchCount: rule.matchCount,
      createdAt: rule.createdAt,
      updatedAt: rule.updatedAt,
    };
  }
}
