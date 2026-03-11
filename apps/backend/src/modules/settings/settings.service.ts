import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/common/database/prisma.service';
import { CacheService } from '@/common/cache/cache.service';
import { AuditLogService } from '@/modules/audit-log/audit-log.service';
import { RequestMeta } from '@/common/decorators/request-meta.decorator';
import { SystemSettingsResponseDto } from './dto/system-settings.dto';

@Injectable()
export class SettingsService {
  private readonly CACHE_TTL = 3600; // 1 hour
  private readonly CACHE_PREFIX = 'settings:';

  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
    private auditLogService: AuditLogService,
  ) {}

  /**
   * Get system setting
   */
  async getSystemSetting(key: string): Promise<SystemSettingsResponseDto | null> {
    // Try to get from cache first
    const cacheKey = `${this.CACHE_PREFIX}system:${key}`;
    const cached = await this.cacheService.get<SystemSettingsResponseDto>(
      cacheKey,
    );

    if (cached) {
      return cached;
    }

    // Query from database
    const setting = await this.prisma.systemSettings.findUnique({
      where: { key },
    });

    if (!setting) {
      return null;
    }

    // Convert null to undefined to match DTO type
    const response: SystemSettingsResponseDto = {
      ...setting,
      description: setting.description ?? undefined,
    };

    // Cache result
    await this.cacheService.set(cacheKey, response, this.CACHE_TTL);

    return response;
  }

  /**
   * Get all system settings
   */
  async getAllSystemSettings(): Promise<SystemSettingsResponseDto[]> {
    const settings = await this.prisma.systemSettings.findMany({
      orderBy: { key: 'asc' },
    });

    // Convert null to undefined to match DTO type
    return settings.map((setting) => ({
      ...setting,
      description: setting.description ?? undefined,
    }));
  }

  /**
   * Update system setting
   */
  async updateSystemSetting(
    key: string,
    value: Prisma.InputJsonValue,
    description?: string,
    userId?: string,
    meta?: RequestMeta,
  ): Promise<SystemSettingsResponseDto> {
    // Get old value for audit trail
    const oldSetting = await this.prisma.systemSettings.findUnique({
      where: { key },
    });

    const setting = await this.prisma.systemSettings.upsert({
      where: { key },
      update: {
        value,
        description,
      },
      create: {
        key,
        value,
        description,
      },
    });

    // Clear cache
    const cacheKey = `${this.CACHE_PREFIX}system:${key}`;
    await this.cacheService.del(cacheKey);

    // Audit log
    await this.auditLogService.create({
      userId,
      action: 'SYSTEM_SETTING_UPDATED',
      entityType: 'system_setting',
      entityId: setting.id,
      oldValue: oldSetting ? { key, value: oldSetting.value as Record<string, unknown> } : null,
      newValue: { key, value: value as Record<string, unknown> },
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    // Convert null to undefined to match DTO type
    return {
      ...setting,
      description: setting.description ?? undefined,
    };
  }

  /**
   * Delete system setting
   */
  async deleteSystemSetting(
    key: string,
    userId?: string,
    meta?: RequestMeta,
  ): Promise<void> {
    const oldSetting = await this.prisma.systemSettings.findUnique({
      where: { key },
    });

    await this.prisma.systemSettings.delete({
      where: { key },
    });

    // Clear cache
    const cacheKey = `${this.CACHE_PREFIX}system:${key}`;
    await this.cacheService.del(cacheKey);

    // Audit log
    await this.auditLogService.create({
      userId,
      action: 'SYSTEM_SETTING_DELETED',
      entityType: 'system_setting',
      entityId: oldSetting?.id,
      oldValue: oldSetting ? { key, value: oldSetting.value as Record<string, unknown> } : null,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });
  }
}
