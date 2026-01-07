import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma, AuditAction } from '@prisma/client';
import { PrismaService } from '@/common/database/prisma.service';
import { CacheService } from '@/common/cache/cache.service';
import { AuditLogService } from '@/modules/audit-log/audit-log.service';
import { RequestMeta } from '@/common/decorators/request-meta.decorator';
import { UrlService } from './url.service';
import {
  BulkCreateUrlDto,
  BulkCreateResultDto,
} from './dto/bulk-create-url.dto';
import {
  BulkUpdateOperation,
  BulkUpdateResultDto,
} from './dto/bulk-update-url.dto';
import { BulkDeleteResultDto } from './dto/bulk-delete-url.dto';

/**
 * URL Bulk Service
 * Handles bulk operations (create, update, delete) for URLs
 * Separated from UrlService for better maintainability and single responsibility
 */
@Injectable()
export class UrlBulkService {
  private readonly logger = new Logger(UrlBulkService.name);
  private readonly CACHE_PREFIX = 'url:';

  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
    private eventEmitter: EventEmitter2,
    private auditLogService: AuditLogService,
    private urlService: UrlService,
  ) {}

  /**
   * Process items in batches with controlled concurrency
   */
  private async processBatch<T, R>(
    items: T[],
    processor: (item: T, index: number) => Promise<R>,
    batchSize: number = 10,
  ): Promise<
    Array<
      | { status: 'fulfilled'; value: R; index: number }
      | { status: 'rejected'; reason: string; data: T; index: number }
    >
  > {
    const results: Array<
      | { status: 'fulfilled'; value: R; index: number }
      | { status: 'rejected'; reason: string; data: T; index: number }
    > = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchPromises = batch.map(async (item, batchIndex) => {
        const globalIndex = i + batchIndex;
        try {
          const value = await processor(item, globalIndex);
          return { status: 'fulfilled' as const, value, index: globalIndex };
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          return {
            status: 'rejected' as const,
            reason: errorMessage,
            data: item,
            index: globalIndex,
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Bulk create URLs (partial success strategy with batch optimization)
   */
  async bulkCreate(
    userId: string,
    urls: BulkCreateUrlDto['urls'],
    meta?: RequestMeta,
  ): Promise<BulkCreateResultDto> {
    const results: BulkCreateResultDto = {
      total: urls.length,
      successCount: 0,
      failureCount: 0,
      succeeded: [],
      failed: [],
    };

    // Step 1: Batch pre-check custom slugs to reduce N+1 queries
    const customSlugs = urls
      .map((u, i) => ({ slug: u.customSlug, index: i }))
      .filter((s) => s.slug);

    const existingSlugsSet = new Set<string>();
    if (customSlugs.length > 0) {
      const existingSlugs = await this.prisma.url.findMany({
        where: { slug: { in: customSlugs.map((s) => s.slug!) } },
        select: { slug: true },
      });
      existingSlugs.forEach((s) => existingSlugsSet.add(s.slug));
    }

    // Step 2: Pre-mark failed items (duplicate slugs in DB and within batch)
    // Track slugs to detect duplicates within the same batch (synchronously before parallel processing)
    const slugsInBatch = new Set<string>();
    const urlsWithValidation = urls.map((urlDto, index) => {
      if (urlDto.customSlug) {
        // Check if slug exists in database
        if (existingSlugsSet.has(urlDto.customSlug)) {
          return { urlDto, index, preValidationError: 'Slug already exists' };
        }
        // Check if slug is duplicate within this batch
        if (slugsInBatch.has(urlDto.customSlug)) {
          return {
            urlDto,
            index,
            preValidationError: 'Duplicate slug within batch',
          };
        }
        slugsInBatch.add(urlDto.customSlug);
      }
      return { urlDto, index, preValidationError: null };
    });

    // Add pre-validation failures to results
    for (const item of urlsWithValidation) {
      if (item.preValidationError) {
        results.failureCount++;
        results.failed.push({
          index: item.index,
          data: item.urlDto,
          error: item.preValidationError,
        });
      }
    }

    // Step 3: Process valid URLs in batches with controlled concurrency
    const validUrls = urlsWithValidation.filter(
      (item) => !item.preValidationError,
    );

    const settledResults = await this.processBatch(
      validUrls,
      async (item) => {
        // Skip individual audit logs - bulk operation will log all at once
        return this.urlService.create(userId, item.urlDto, meta, {
          skipAuditLog: true,
        });
      },
      10, // Process 10 URLs concurrently
    );

    for (const result of settledResults) {
      if (result.status === 'fulfilled') {
        results.successCount++;
        results.succeeded.push({ index: result.index, url: result.value });
      } else {
        results.failureCount++;
        results.failed.push({
          index: result.index,
          data: result.data.urlDto,
          error: result.reason,
        });
      }
    }

    // Audit log for bulk operation
    await this.auditLogService.create({
      userId,
      action: AuditAction.URL_BULK_CREATED,
      entityType: 'url',
      newValue: {
        total: urls.length,
        successCount: results.successCount,
        failureCount: results.failureCount,
        succeededIds: results.succeeded.map((s) => s.url.id),
      },
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return results;
  }

  /**
   * Bulk update URLs
   */
  async bulkUpdate(
    userId: string,
    urlIds: string[],
    operation: BulkUpdateOperation,
    userRole?: 'ADMIN' | 'USER',
    meta?: RequestMeta,
  ): Promise<BulkUpdateResultDto> {
    // Early validation: check for empty or invalid input
    if (!urlIds || urlIds.length === 0) {
      throw new BadRequestException('URL IDs cannot be empty');
    }

    // Filter out any invalid IDs (null, undefined, empty strings)
    const validInputIds = urlIds.filter(
      (id) => id && typeof id === 'string' && id.trim().length > 0,
    );
    if (validInputIds.length === 0) {
      throw new BadRequestException('No valid URL IDs provided');
    }

    // Single query to get all needed data (existence, ownership, cache clearing)
    const urls = await this.prisma.url.findMany({
      where: { id: { in: validInputIds } },
      select: {
        id: true,
        userId: true,
        slug: true,
      },
    });

    if (urls.length === 0) {
      throw new NotFoundException('No URLs found with the provided IDs');
    }

    // Check for non-existent IDs (use validInputIds instead of urlIds)
    const existingIds = new Set(urls.map((u) => u.id));
    const notFoundIds = validInputIds.filter((id) => !existingIds.has(id));
    if (notFoundIds.length > 0) {
      throw new NotFoundException(`${notFoundIds.length} URL(s) not found`);
    }

    // Check permissions (non-admin users can only update their own URLs)
    if (userRole !== 'ADMIN') {
      const unauthorizedUrls = urls.filter((url) => url.userId !== userId);
      if (unauthorizedUrls.length > 0) {
        throw new ForbiddenException(
          `You do not have permission to update ${unauthorizedUrls.length} URL(s)`,
        );
      }
    }

    const validIds = urls.map((url) => url.id);

    // Use transaction for atomic update and audit log
    const result = await this.prisma.$transaction(async (tx) => {
      let message: string | undefined;

      // Execute operation based on type
      if (operation.type === 'status') {
        await tx.url.updateMany({
          where: { id: { in: validIds } },
          data: { status: operation.status },
        });
        message = `Status updated to ${operation.status}`;
      } else if (operation.type === 'bundle') {
        // Check if bundle exists and belongs to user
        const bundle = await tx.bundle.findFirst({
          where: {
            id: operation.bundleId,
            ...(userRole !== 'ADMIN' && { userId }),
          },
        });

        if (!bundle) {
          throw new NotFoundException('Bundle not found or no permission');
        }

        // Get existing URLs in bundle
        const existingBundleUrls = await tx.bundleUrl.findMany({
          where: { bundleId: operation.bundleId },
          select: { urlId: true },
        });
        const existingUrlIds = new Set(
          existingBundleUrls.map((bu) => bu.urlId),
        );

        // Filter out already-added URLs
        const newUrlIds = validIds.filter((id) => !existingUrlIds.has(id));

        if (newUrlIds.length > 0) {
          await tx.bundleUrl.createMany({
            data: newUrlIds.map((urlId, index) => ({
              bundleId: operation.bundleId,
              urlId,
              order: existingBundleUrls.length + index,
            })),
          });
        }

        message = `Added ${newUrlIds.length} URLs to bundle (${validIds.length - newUrlIds.length} already existed)`;
      } else if (operation.type === 'expiration') {
        const expirationDate = operation.expiresAt
          ? new Date(operation.expiresAt)
          : null;
        await tx.url.updateMany({
          where: { id: { in: validIds } },
          data: { expiresAt: expirationDate },
        });
        message = operation.expiresAt
          ? `Expiration set to ${operation.expiresAt}`
          : 'Expiration removed';
      } else if (operation.type === 'utm') {
        const utmData: Record<string, string | undefined> = {};
        if (operation.utmSource !== undefined)
          utmData.utmSource = operation.utmSource;
        if (operation.utmMedium !== undefined)
          utmData.utmMedium = operation.utmMedium;
        if (operation.utmCampaign !== undefined)
          utmData.utmCampaign = operation.utmCampaign;
        if (operation.utmTerm !== undefined)
          utmData.utmTerm = operation.utmTerm;
        if (operation.utmContent !== undefined)
          utmData.utmContent = operation.utmContent;

        await tx.url.updateMany({
          where: { id: { in: validIds } },
          data: utmData,
        });
        message = 'UTM parameters updated';
      }

      // Create audit log in same transaction
      await tx.auditLog.create({
        data: {
          userId,
          action: AuditAction.URL_BULK_UPDATED,
          entityType: 'url',
          newValue: {
            urlIds: validIds,
            operation: { ...operation },
            count: validIds.length,
          } as unknown as Prisma.InputJsonValue,
          ipAddress: meta?.ipAddress,
          userAgent: meta?.userAgent,
        },
      });

      return { message };
    });

    // Non-critical operations after transaction success
    try {
      await this.bulkClearUrlCache(urls);
    } catch (error) {
      this.logger.error(
        `Failed to clear cache for bulk updated URLs: ${error}`,
      );
      this.eventEmitter.emit('cache.clear.failed', {
        operation: 'bulkUpdate',
        urlIds: validIds,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return {
      updatedCount: validIds.length,
      updatedIds: validIds,
      message: result.message,
    };
  }

  /**
   * Bulk delete URLs
   */
  async bulkDelete(
    userId: string,
    urlIds: string[],
    userRole?: 'ADMIN' | 'USER',
    meta?: RequestMeta,
  ): Promise<BulkDeleteResultDto> {
    // Early validation: check for empty or invalid input
    if (!urlIds || urlIds.length === 0) {
      throw new BadRequestException('URL IDs cannot be empty');
    }

    // Filter out any invalid IDs (null, undefined, empty strings)
    const validInputIds = urlIds.filter(
      (id) => id && typeof id === 'string' && id.trim().length > 0,
    );
    if (validInputIds.length === 0) {
      throw new BadRequestException('No valid URL IDs provided');
    }

    // Single query to get all needed data (existence, ownership, cache clearing, events)
    const urls = await this.prisma.url.findMany({
      where: { id: { in: validInputIds } },
      select: {
        id: true,
        userId: true,
        slug: true,
        originalUrl: true,
      },
    });

    if (urls.length === 0) {
      throw new NotFoundException('No URLs found with the provided IDs');
    }

    // Check for non-existent IDs (use validInputIds instead of urlIds)
    const existingIds = new Set(urls.map((u) => u.id));
    const notFoundIds = validInputIds.filter((id) => !existingIds.has(id));
    if (notFoundIds.length > 0) {
      throw new NotFoundException(`${notFoundIds.length} URL(s) not found`);
    }

    // Check permissions (non-admin users can only delete their own URLs)
    if (userRole !== 'ADMIN') {
      const unauthorizedUrls = urls.filter((url) => url.userId !== userId);
      if (unauthorizedUrls.length > 0) {
        throw new ForbiddenException(
          `You do not have permission to delete ${unauthorizedUrls.length} URL(s)`,
        );
      }
    }

    const validIds = urls.map((url) => url.id);

    // Use transaction for atomic delete and audit log
    const result = await this.prisma.$transaction(async (tx) => {
      // Delete URLs (cascade deletes clicks)
      const deleteResult = await tx.url.deleteMany({
        where: { id: { in: validIds } },
      });

      // Create audit log in same transaction
      await tx.auditLog.create({
        data: {
          userId,
          action: AuditAction.URL_BULK_DELETED,
          entityType: 'url',
          oldValue: {
            urlIds: validIds,
            count: deleteResult.count,
            urls: urls.map((u) => ({
              id: u.id,
              slug: u.slug,
              originalUrl: u.originalUrl,
            })),
          } as Prisma.InputJsonValue,
          ipAddress: meta?.ipAddress,
          userAgent: meta?.userAgent,
        },
      });

      return deleteResult;
    });

    // Non-critical operations after transaction success
    // Clear cache (failure won't affect the main operation)
    try {
      await this.bulkClearUrlCache(urls);
    } catch (error) {
      this.logger.error(
        `Failed to clear cache for bulk deleted URLs: ${error}`,
      );
      this.eventEmitter.emit('cache.clear.failed', {
        operation: 'bulkDelete',
        urlIds: validIds,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Update URL count in UrlService
    this.urlService.decrementUrlCount(validIds.length);

    // Emit events asynchronously (don't block response)
    setImmediate(() => {
      try {
        for (const url of urls) {
          this.eventEmitter.emit('url.deleted', {
            id: url.id,
            slug: url.slug,
            originalUrl: url.originalUrl,
            userId: url.userId,
          });
        }
      } catch (error) {
        // Log but don't throw - this is fire-and-forget
        this.logger.error(
          `Failed to emit url.deleted events: ${error instanceof Error ? error.message : String(error)}`,
          error instanceof Error ? error.stack : undefined,
        );
      }
    });

    return {
      deletedCount: result.count,
      deletedIds: validIds,
    };
  }

  /**
   * Clear URL cache
   */
  private async clearUrlCache(id: string, slug: string): Promise<void> {
    const idKey = `${this.CACHE_PREFIX}${id}`;
    const slugKey = `${this.CACHE_PREFIX}slug:${slug}`;

    await Promise.all([
      this.cacheService.del(idKey),
      this.cacheService.del(slugKey),
    ]);
  }

  /**
   * Bulk clear URL cache with batching to prevent Redis overload
   */
  private async bulkClearUrlCache(
    urls: { id: string; slug: string }[],
  ): Promise<void> {
    const BATCH_SIZE = 50;

    for (let i = 0; i < urls.length; i += BATCH_SIZE) {
      const batch = urls.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map((url) => this.clearUrlCache(url.id, url.slug)),
      );

      // Add small delay between batches to prevent Redis overload
      if (i + BATCH_SIZE < urls.length) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    }
  }
}
