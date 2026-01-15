import { Injectable, Logger } from '@nestjs/common';
import { AuditAction, Prisma } from '@prisma/client';
import { PrismaService } from '@/common/database/prisma.service';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';
import { AuditLogDto, AuditLogListResponseDto } from './dto/audit-log-response.dto';

export interface CreateAuditLogParams {
  userId?: string | null;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * List of sensitive field names that should be redacted in audit logs
 */
const SENSITIVE_FIELDS = [
  'password',
  'secret',
  'key',
  'token',
  'twoFactorSecret',
  'apiKey',
  'refreshToken',
  'accessToken',
  'credential',
  'privateKey',
  'secretKey',
  'authToken',
  'bearerToken',
  'encryptionKey',
];

/**
 * Sanitize sensitive data before logging
 */
function sanitizeValue(value: Record<string, unknown> | null | undefined): Record<string, unknown> | null {
  if (!value) return null;

  const sanitized = { ...value };

  for (const field of SENSITIVE_FIELDS) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
    // Also check for case-insensitive matches (e.g., 'Password', 'PASSWORD')
    for (const key of Object.keys(sanitized)) {
      if (key.toLowerCase() === field.toLowerCase() && key !== field) {
        sanitized[key] = '[REDACTED]';
      }
    }
  }

  return sanitized;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create an audit log entry
   */
  async create(params: CreateAuditLogParams): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: params.userId,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          oldValue: sanitizeValue(params.oldValue) as Prisma.InputJsonValue,
          newValue: sanitizeValue(params.newValue) as Prisma.InputJsonValue,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
          metadata: params.metadata as Prisma.InputJsonValue,
        },
      });
    } catch (error) {
      // Log error but don't throw - audit logging should not break main operations
      this.logger.error('Failed to create audit log', error);
    }
  }

  /**
   * Get audit logs with pagination and filtering
   */
  async findAll(queryDto: AuditLogQueryDto): Promise<AuditLogListResponseDto> {
    const {
      action,
      entityType,
      entityId,
      userId,
      startDate,
      endDate,
      page = 1,
      pageSize = 10,
      sortOrder = 'desc',
    } = queryDto;

    // Build where clause
    const where: Prisma.AuditLogWhereInput = {};

    if (action) {
      where.action = action;
    }

    if (entityType) {
      where.entityType = entityType;
    }

    if (entityId) {
      where.entityId = entityId;
    }

    if (userId) {
      where.userId = userId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        // Include the entire end date
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDateTime;
      }
    }

    // Get total count and paginated results in parallel for better performance
    const [total, items] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return {
      data: items.map((item) => this.toDto(item)),
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  /**
   * Get audit logs for a specific entity
   */
  async findByEntity(
    entityType: string,
    entityId: string,
    limit: number = 20,
  ): Promise<AuditLogDto[]> {
    const items = await this.prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return items.map((item) => this.toDto(item));
  }

  /**
   * Convert database model to DTO
   */
  private toDto(
    item: Prisma.AuditLogGetPayload<{
      include: { user: { select: { id: true; email: true; name: true } } };
    }>,
  ): AuditLogDto {
    return {
      id: item.id,
      user: item.user
        ? {
            id: item.user.id,
            email: item.user.email,
            name: item.user.name,
          }
        : null,
      action: item.action,
      entityType: item.entityType,
      entityId: item.entityId,
      oldValue: item.oldValue as Record<string, unknown> | null,
      newValue: item.newValue as Record<string, unknown> | null,
      ipAddress: item.ipAddress,
      userAgent: item.userAgent,
      metadata: item.metadata as Record<string, unknown> | null,
      createdAt: item.createdAt,
    };
  }
}
