import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { Prisma, Webhook, WebhookLog } from '@prisma/client';
import { PrismaService } from '@/common/database/prisma.service';
import { AuditLogService } from '@/modules/audit-log/audit-log.service';
import { RequestMeta } from '@/common/decorators/request-meta.decorator';
import {
  CreateWebhookDto,
  UpdateWebhookDto,
  WebhookResponseDto,
  WebhookListResponseDto,
  WebhookLogResponseDto,
  WebhookLogsListResponseDto,
  WebhookTestResponseDto,
} from './dto/webhook.dto';
import { WebhookQueryDto, WebhookLogsQueryDto } from './dto/webhook-query.dto';
import * as crypto from 'crypto';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) {}

  /**
   * Create a new webhook
   */
  async create(
    userId: string,
    createWebhookDto: CreateWebhookDto,
    meta?: RequestMeta,
  ): Promise<WebhookResponseDto> {
    // Encrypt secret before storing
    const encryptedSecret = this.encryptSecret(createWebhookDto.secret);

    const webhook = await this.prisma.webhook.create({
      data: {
        userId,
        name: createWebhookDto.name,
        url: createWebhookDto.url,
        secret: encryptedSecret,
        events: createWebhookDto.events,
        headers: createWebhookDto.headers || Prisma.JsonNull,
        isActive: createWebhookDto.isActive ?? true,
      },
    });

    // Audit log
    await this.auditLogService.create({
      userId,
      action: 'WEBHOOK_CREATED',
      entityType: 'webhook',
      entityId: webhook.id,
      newValue: { name: webhook.name, url: webhook.url, events: webhook.events },
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return this.mapToResponse(webhook);
  }

  /**
   * Get all webhooks for a user with pagination
   */
  async findAll(
    userId: string,
    query: WebhookQueryDto,
    userRole?: 'ADMIN' | 'USER',
  ): Promise<WebhookListResponseDto> {
    const { page = 1, pageSize = 10 } = query;
    const skip = (page - 1) * pageSize;

    const where = {
      // ADMIN can see all webhooks, USER only their own
      ...(userRole !== 'ADMIN' && { userId }),
    };

    const [webhooks, total] = await Promise.all([
      this.prisma.webhook.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.webhook.count({ where }),
    ]);

    return {
      data: webhooks.map((w) => this.mapToResponse(w)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Get a single webhook
   */
  async findOne(
    id: string,
    userId: string,
    userRole?: 'ADMIN' | 'USER',
  ): Promise<WebhookResponseDto> {
    const webhook = await this.prisma.webhook.findFirst({
      where: {
        id,
        ...(userRole !== 'ADMIN' && { userId }),
      },
    });

    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }

    return this.mapToResponse(webhook);
  }

  /**
   * Update a webhook
   */
  async update(
    id: string,
    userId: string,
    updateWebhookDto: UpdateWebhookDto,
    userRole?: 'ADMIN' | 'USER',
    meta?: RequestMeta,
  ): Promise<WebhookResponseDto> {
    // Check if webhook exists
    const existing = await this.prisma.webhook.findFirst({
      where: {
        id,
        ...(userRole !== 'ADMIN' && { userId }),
      },
    });

    if (!existing) {
      throw new NotFoundException('Webhook not found');
    }

    // Encrypt secret if provided
    const data: Prisma.WebhookUpdateInput = { ...updateWebhookDto };
    if (updateWebhookDto.secret) {
      data.secret = this.encryptSecret(updateWebhookDto.secret);
    }

    const webhook = await this.prisma.webhook.update({
      where: { id },
      data,
    });

    // Audit log (redact secret)
    const auditNewValue = { ...updateWebhookDto };
    if (auditNewValue.secret) {
      auditNewValue.secret = '[REDACTED]';
    }
    await this.auditLogService.create({
      userId,
      action: 'WEBHOOK_UPDATED',
      entityType: 'webhook',
      entityId: id,
      oldValue: { name: existing.name, url: existing.url, isActive: existing.isActive },
      newValue: auditNewValue,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return this.mapToResponse(webhook);
  }

  /**
   * Delete a webhook
   */
  async delete(
    id: string,
    userId: string,
    userRole?: 'ADMIN' | 'USER',
    meta?: RequestMeta,
  ): Promise<void> {
    const existing = await this.prisma.webhook.findFirst({
      where: {
        id,
        ...(userRole !== 'ADMIN' && { userId }),
      },
    });

    if (!existing) {
      throw new NotFoundException('Webhook not found');
    }

    await this.prisma.webhook.delete({
      where: { id },
    });

    // Audit log
    await this.auditLogService.create({
      userId,
      action: 'WEBHOOK_DELETED',
      entityType: 'webhook',
      entityId: id,
      oldValue: { name: existing.name, url: existing.url },
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });
  }

  /**
   * Get webhook logs (paginated)
   */
  async getLogs(
    id: string,
    userId: string,
    query: WebhookLogsQueryDto,
    userRole?: 'ADMIN' | 'USER',
  ): Promise<WebhookLogsListResponseDto> {
    const { page = 1, pageSize = 20 } = query;

    // Check if webhook exists and belongs to user
    const webhook = await this.prisma.webhook.findFirst({
      where: {
        id,
        ...(userRole !== 'ADMIN' && { userId }),
      },
    });

    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }

    const [logs, total] = await Promise.all([
      this.prisma.webhookLog.findMany({
        where: { webhookId: id },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.webhookLog.count({
        where: { webhookId: id },
      }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return {
      data: logs.map((log) => this.mapLogToResponse(log)),
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  /**
   * Test webhook delivery
   */
  async test(
    id: string,
    userId: string,
    userRole?: 'ADMIN' | 'USER',
  ): Promise<WebhookTestResponseDto> {
    const webhook = await this.prisma.webhook.findFirst({
      where: {
        id,
        ...(userRole !== 'ADMIN' && { userId }),
      },
    });

    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }

    // Prepare test payload
    const testPayload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook delivery',
        webhookId: webhook.id,
        webhookName: webhook.name,
      },
    };

    // Send test delivery
    const startTime = Date.now();
    try {
      const decryptedSecret = this.decryptSecret(webhook.secret);
      const signature = this.generateSignature(testPayload, decryptedSecret);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'OpenShortURL-Webhook/1.0',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': 'webhook.test',
        ...((webhook.headers as Record<string, string>) || {}),
      };

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(testPayload),
      });

      const duration = Date.now() - startTime;
      const responseText = await response.text();

      return {
        success: response.ok,
        statusCode: response.status,
        response: responseText.substring(0, 1000),
        duration,
      };
    } catch (error: unknown) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      };
    }
  }

  /**
   * Encrypt secret for storage
   */
  private encryptSecret(secret: string): string {
    // Simple encryption using AES-256-GCM
    // In production, use a proper KMS or encryption service
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(
      process.env.WEBHOOK_SECRET_KEY || 'default-secret-key-change-me-in-production',
      'utf-8',
    ).slice(0, 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);

    let encrypted = cipher.update(secret, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    // Store iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt secret from storage
   */
  private decryptSecret(encryptedSecret: string): string {
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(
      process.env.WEBHOOK_SECRET_KEY || 'default-secret-key-change-me-in-production',
      'utf-8',
    ).slice(0, 32);

    const [ivHex, authTagHex, encrypted] = encryptedSecret.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Generate HMAC-SHA256 signature for webhook payload
   */
  generateSignature(payload: Record<string, unknown>, secret: string): string {
    const payloadString = JSON.stringify(payload);
    return crypto
      .createHmac('sha256', secret)
      .update(payloadString)
      .digest('hex');
  }

  /**
   * Map webhook to response DTO
   */
  private mapToResponse(webhook: Webhook): WebhookResponseDto {
    return {
      id: webhook.id,
      userId: webhook.userId,
      name: webhook.name,
      url: webhook.url,
      isActive: webhook.isActive,
      events: webhook.events as string[],
      headers: webhook.headers as Record<string, string> | undefined,
      totalSent: webhook.totalSent,
      totalSuccess: webhook.totalSuccess,
      totalFailed: webhook.totalFailed,
      lastSentAt: webhook.lastSentAt ?? undefined,
      lastError: webhook.lastError ?? undefined,
      createdAt: webhook.createdAt,
      updatedAt: webhook.updatedAt,
    };
  }

  /**
   * Map webhook log to response DTO
   */
  private mapLogToResponse(log: WebhookLog): WebhookLogResponseDto {
    return {
      id: log.id,
      webhookId: log.webhookId,
      event: log.event,
      payload: log.payload as Record<string, unknown>,
      statusCode: log.statusCode ?? undefined,
      response: log.response ?? undefined,
      error: log.error ?? undefined,
      duration: log.duration ?? undefined,
      attempt: log.attempt,
      isSuccess: log.isSuccess,
      createdAt: log.createdAt,
    };
  }
}
