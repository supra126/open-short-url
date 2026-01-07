import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { UrlVariant } from '@prisma/client';
import { PrismaService } from '@/common/database/prisma.service';
import { CacheService } from '@/common/cache/cache.service';
import { AuditLogService } from '@/modules/audit-log/audit-log.service';
import { RequestMeta } from '@/common/decorators/request-meta.decorator';
import {
  CreateVariantDto,
  UpdateVariantDto,
  VariantResponseDto,
  VariantListResponseDto,
} from './dto/variant.dto';
import { ERROR_MESSAGES } from '@/common/constants/errors';

/**
 * URL Variant Service
 * Handles A/B testing variant management (CRUD operations)
 * Separated from UrlService for better maintainability and single responsibility
 */
@Injectable()
export class UrlVariantService {
  private readonly logger = new Logger(UrlVariantService.name);
  private readonly CACHE_PREFIX = 'url:';

  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
    private auditLogService: AuditLogService,
  ) {}

  /**
   * Create a new variant for A/B testing
   */
  async createVariant(
    urlId: string,
    userId: string,
    createVariantDto: CreateVariantDto,
    userRole?: 'ADMIN' | 'USER',
    meta?: RequestMeta,
  ): Promise<VariantResponseDto> {
    // Check if URL exists and belongs to the user
    const url = await this.prisma.url.findFirst({
      where: {
        id: urlId,
        ...(userRole !== 'ADMIN' && { userId }),
      },
    });

    if (!url) {
      throw new NotFoundException(ERROR_MESSAGES.URL_NOT_FOUND);
    }

    // Enable A/B testing mode if not already enabled
    if (!url.isAbTest) {
      await this.prisma.url.update({
        where: { id: urlId },
        data: { isAbTest: true },
      });
    }

    // Create variant
    const variant = await this.prisma.urlVariant.create({
      data: {
        urlId,
        name: createVariantDto.name,
        targetUrl: createVariantDto.targetUrl,
        weight: createVariantDto.weight ?? 50,
        isActive: createVariantDto.isActive ?? true,
      },
    });

    // Clear URL cache to reload with new variants
    await this.clearUrlCache(urlId, url.slug);

    // Audit log
    await this.auditLogService.create({
      userId,
      action: 'VARIANT_CREATED',
      entityType: 'variant',
      entityId: variant.id,
      newValue: {
        urlId,
        name: variant.name,
        targetUrl: variant.targetUrl,
        weight: variant.weight,
      },
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return this.mapVariantToResponse(variant);
  }

  /**
   * Get all variants for a URL with statistics
   */
  async findAllVariants(
    urlId: string,
    userId: string,
    userRole?: 'ADMIN' | 'USER',
  ): Promise<VariantListResponseDto> {
    // Check if URL exists and belongs to the user
    const url = await this.prisma.url.findFirst({
      where: {
        id: urlId,
        ...(userRole !== 'ADMIN' && { userId }),
      },
      include: {
        variants: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!url) {
      throw new NotFoundException(ERROR_MESSAGES.URL_NOT_FOUND);
    }

    // Get control group clicks (clicks where variantId is null)
    const controlGroupClicks = await this.prisma.click.count({
      where: {
        urlId,
        variantId: null,
      },
    });

    // Calculate total clicks including control group
    const variantsClicks = url.variants.reduce(
      (sum, variant) => sum + variant.clickCount,
      0,
    );
    const totalClicks = variantsClicks + controlGroupClicks;

    // Calculate control group weight (100 - sum of all variant weights)
    const variantsWeight = url.variants.reduce(
      (sum, variant) => sum + variant.weight,
      0,
    );
    const controlGroupWeight = Math.max(0, 100 - variantsWeight);

    // Create stats for variants
    const stats = url.variants.map((variant) => ({
      variant: this.mapVariantToResponse(variant),
      clickThroughRate:
        totalClicks > 0
          ? Math.round((variant.clickCount / totalClicks) * 1000) / 10
          : 0,
    }));

    // Add control group to stats if it has weight or clicks
    if (controlGroupWeight > 0 || controlGroupClicks > 0) {
      stats.unshift({
        variant: {
          id: 'control-group',
          urlId,
          name: 'Control Group (Original URL)',
          targetUrl: url.originalUrl,
          weight: controlGroupWeight,
          isActive: true,
          clickCount: controlGroupClicks,
          createdAt: url.createdAt,
          updatedAt: url.updatedAt,
        },
        clickThroughRate:
          totalClicks > 0
            ? Math.round((controlGroupClicks / totalClicks) * 1000) / 10
            : 0,
      });
    }

    return {
      variants: url.variants.map((v) => this.mapVariantToResponse(v)),
      totalClicks,
      stats,
    };
  }

  /**
   * Get a single variant
   */
  async findOneVariant(
    urlId: string,
    variantId: string,
    userId: string,
    userRole?: 'ADMIN' | 'USER',
  ): Promise<VariantResponseDto> {
    // Check if URL exists and belongs to the user
    const url = await this.prisma.url.findFirst({
      where: {
        id: urlId,
        ...(userRole !== 'ADMIN' && { userId }),
      },
    });

    if (!url) {
      throw new NotFoundException(ERROR_MESSAGES.URL_NOT_FOUND);
    }

    // Get variant
    const variant = await this.prisma.urlVariant.findFirst({
      where: {
        id: variantId,
        urlId,
      },
    });

    if (!variant) {
      throw new NotFoundException('Variant not found');
    }

    return this.mapVariantToResponse(variant);
  }

  /**
   * Update a variant
   */
  async updateVariant(
    urlId: string,
    variantId: string,
    userId: string,
    updateVariantDto: UpdateVariantDto,
    userRole?: 'ADMIN' | 'USER',
    meta?: RequestMeta,
  ): Promise<VariantResponseDto> {
    // Check if URL exists and belongs to the user
    const url = await this.prisma.url.findFirst({
      where: {
        id: urlId,
        ...(userRole !== 'ADMIN' && { userId }),
      },
    });

    if (!url) {
      throw new NotFoundException(ERROR_MESSAGES.URL_NOT_FOUND);
    }

    // Check if variant exists
    const existing = await this.prisma.urlVariant.findFirst({
      where: {
        id: variantId,
        urlId,
      },
    });

    if (!existing) {
      throw new NotFoundException('Variant not found');
    }

    // Update variant
    const variant = await this.prisma.urlVariant.update({
      where: { id: variantId },
      data: updateVariantDto,
    });

    // Clear URL cache to reload with updated variants
    await this.clearUrlCache(urlId, url.slug);

    // Audit log
    await this.auditLogService.create({
      userId,
      action: 'VARIANT_UPDATED',
      entityType: 'variant',
      entityId: variantId,
      oldValue: {
        name: existing.name,
        targetUrl: existing.targetUrl,
        weight: existing.weight,
        isActive: existing.isActive,
      },
      newValue: { ...updateVariantDto },
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return this.mapVariantToResponse(variant);
  }

  /**
   * Delete a variant
   */
  async deleteVariant(
    urlId: string,
    variantId: string,
    userId: string,
    userRole?: 'ADMIN' | 'USER',
    meta?: RequestMeta,
  ): Promise<void> {
    // Check if URL exists and belongs to the user
    const url = await this.prisma.url.findFirst({
      where: {
        id: urlId,
        ...(userRole !== 'ADMIN' && { userId }),
      },
      include: {
        variants: true,
      },
    });

    if (!url) {
      throw new NotFoundException(ERROR_MESSAGES.URL_NOT_FOUND);
    }

    // Check if variant exists
    const variant = url.variants.find((v) => v.id === variantId);
    if (!variant) {
      throw new NotFoundException('Variant not found');
    }

    // Delete variant
    await this.prisma.urlVariant.delete({
      where: { id: variantId },
    });

    // If no variants left, disable A/B testing mode
    if (url.variants.length === 1) {
      await this.prisma.url.update({
        where: { id: urlId },
        data: { isAbTest: false },
      });
    }

    // Clear URL cache
    await this.clearUrlCache(urlId, url.slug);

    // Audit log
    await this.auditLogService.create({
      userId,
      action: 'VARIANT_DELETED',
      entityType: 'variant',
      entityId: variantId,
      oldValue: {
        urlId,
        name: variant.name,
        targetUrl: variant.targetUrl,
        weight: variant.weight,
      },
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });
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
   * Map variant to response DTO
   */
  private mapVariantToResponse(variant: UrlVariant): VariantResponseDto {
    return {
      id: variant.id,
      urlId: variant.urlId,
      name: variant.name,
      targetUrl: variant.targetUrl,
      weight: variant.weight,
      isActive: variant.isActive,
      clickCount: variant.clickCount,
      createdAt: variant.createdAt,
      updatedAt: variant.updatedAt,
    };
  }
}
