import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma, UrlStatus, Url, UrlVariant, AuditAction } from '@prisma/client';
import { PrismaService } from '@/common/database/prisma.service';
import { CacheService } from '@/common/cache/cache.service';
import { AuditLogService } from '@/modules/audit-log/audit-log.service';
import { RequestMeta } from '@/common/decorators/request-meta.decorator';
import { CreateUrlDto } from './dto/create-url.dto';
import { UpdateUrlDto } from './dto/update-url.dto';
import { UrlQueryDto } from './dto/url-query.dto';
import { UrlResponseDto, UrlListResponseDto } from './dto/url-response.dto';
import {
  CreateVariantDto,
  UpdateVariantDto,
  VariantResponseDto,
  VariantListResponseDto,
} from './dto/variant.dto';
import {
  generateCustomSlug,
  validateSlug,
} from '@/common/utils/slug-generator';
import { hashPassword } from '@/common/utils/password-hasher';
import { ERROR_MESSAGES } from '@/common/constants/errors';
import * as QRCode from 'qrcode';

/**
 * URL with variants for A/B testing
 */
interface UrlWithVariants extends Url {
  variants?: Array<{
    id: string;
    name: string;
    targetUrl: string;
    weight: number;
    isActive: boolean;
    clickCount: number;
  }>;
}

@Injectable()
export class UrlService implements OnModuleInit {
  private readonly logger = new Logger(UrlService.name);
  // Optimized cache strategy with tiered TTLs
  private readonly CACHE_TTL = 7200; // 2 hours (default)
  private readonly HOT_URL_CACHE_TTL = 86400; // 24 hours (for popular URLs)
  private readonly HOT_URL_THRESHOLD = 100; // URLs with >100 clicks are considered "hot"
  private readonly CACHE_PREFIX = 'url:';

  // Dynamic slug length strategy
  private urlCount = 0;
  private readonly slugLengthThresholds: number[];
  private readonly slugLengths: number[];

  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
    private auditLogService: AuditLogService,
  ) {
    // Parse environment variables with defaults
    const thresholdsStr = this.configService.get<string>(
      'SLUG_LENGTH_THRESHOLDS',
      '1000,50000,500000',
    );
    const lengthsStr = this.configService.get<string>(
      'SLUG_LENGTHS',
      '4,5,6,7',
    );

    this.slugLengthThresholds = thresholdsStr
      .split(',')
      .map((t) => parseInt(t.trim(), 10));
    this.slugLengths = lengthsStr
      .split(',')
      .map((l) => parseInt(l.trim(), 10));

    if (this.slugLengthThresholds.length !== this.slugLengths.length - 1) {
      this.logger.warn(
        'SLUG_LENGTH_THRESHOLDS and SLUG_LENGTHS configuration mismatch. Using defaults.',
      );
      this.slugLengthThresholds = [1000, 50000, 500000];
      this.slugLengths = [4, 5, 6, 7];
    }
  }

  /**
   * Load current URL count on service initialization
   * Optimized: Non-blocking async initialization to improve startup time
   */
  async onModuleInit() {
    // Initialize with 0, then load count asynchronously
    this.urlCount = 0;
    this.logger.log('URL Service initializing...');
    this.logger.log(
      `Dynamic slug length strategy: Thresholds=${this.slugLengthThresholds.join(',')}, Lengths=${this.slugLengths.join(',')}`,
    );

    // Load URL count asynchronously without blocking initialization
    this.loadUrlCount().catch((error) => {
      this.logger.error('Failed to load URL count during initialization', error);
    });
  }

  /**
   * Asynchronously load URL count
   */
  private async loadUrlCount(): Promise<void> {
    try {
      const count = await this.prisma.url.count();
      this.urlCount = count;
      this.logger.log(`URL count loaded: ${this.urlCount}`);
    } catch (error) {
      this.logger.error('Failed to load URL count', error);
    }
  }

  /**
   * Create short URL
   */
  async create(
    userId: string,
    createUrlDto: CreateUrlDto,
    meta?: RequestMeta,
  ): Promise<UrlResponseDto> {
    const {
      originalUrl,
      customSlug,
      title,
      password,
      expiresAt,
      utmSource,
      utmMedium,
      utmCampaign,
      utmTerm,
      utmContent,
    } = createUrlDto;

    // Generate or validate slug
    let slug: string;
    if (customSlug) {
      // Validate custom slug format
      if (!validateSlug(customSlug)) {
        throw new BadRequestException('Invalid custom slug format');
      }

      // Check if slug already exists
      const existing = await this.prisma.url.findUnique({
        where: { slug: customSlug },
      });

      if (existing) {
        throw new ConflictException(ERROR_MESSAGES.URL_SLUG_EXISTS);
      }

      slug = customSlug;
    } else {
      // Auto-generate slug and handle collisions
      slug = await this.generateUniqueSlug();
    }

    // Hash password if provided
    const hashedPassword = password ? await hashPassword(password) : null;

    // Process expiration date
    const expirationDate = expiresAt ? new Date(expiresAt) : null;

    // Create URL
    const url = await this.prisma.url.create({
      data: {
        slug,
        originalUrl,
        title,
        userId,
        password: hashedPassword,
        expiresAt: expirationDate,
        utmSource,
        utmMedium,
        utmCampaign,
        utmTerm,
        utmContent,
      },
    });

    // Cache the newly created URL with dynamic TTL
    await this.cacheUrl(url);

    // Update in-memory counter (for dynamic length strategy)
    this.urlCount++;

    // Emit url.created event for webhooks
    this.eventEmitter.emit('url.created', url);

    // Audit log
    await this.auditLogService.create({
      userId,
      action: 'URL_CREATED',
      entityType: 'url',
      entityId: url.id,
      newValue: {
        slug: url.slug,
        originalUrl: url.originalUrl,
        title: url.title,
      },
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return this.mapToResponse(url);
  }

  /**
   * Query all URLs (with pagination, search, and sorting)
   */
  async findAll(
    userId: string,
    queryDto: UrlQueryDto,
    userRole?: 'ADMIN' | 'USER',
  ): Promise<UrlListResponseDto> {
    const { page = 1, pageSize = 10, search, status, sortBy, sortOrder } = queryDto;

    // Build query conditions
    const where: Prisma.UrlWhereInput = {
      // ADMIN can see all URLs, USER only sees their own
      ...(userRole !== 'ADMIN' && { userId }),
      ...(status && { status: status as UrlStatus }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { originalUrl: { contains: search, mode: 'insensitive' } },
          { slug: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    // Build sorting conditions
    const orderBy: Prisma.UrlOrderByWithRelationInput = {
      [sortBy || 'createdAt']: sortOrder || 'desc',
    };

    // Execute paginated query
    const [urls, total] = await Promise.all([
      this.prisma.url.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.url.count({ where }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return {
      data: urls.map((url) => this.mapToResponse(url)),
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  /**
   * Find a single URL by ID
   */
  async findOne(
    id: string,
    userId: string,
    userRole?: 'ADMIN' | 'USER',
  ): Promise<UrlResponseDto> {
    // Try to get from cache first
    const cacheKey = `${this.CACHE_PREFIX}${id}`;
    const cached = await this.cacheService.get<Url>(cacheKey);

    if (cached && (userRole === 'ADMIN' || cached.userId === userId)) {
      return this.mapToResponse(cached);
    }

    // Query from database
    const url = await this.prisma.url.findFirst({
      where: {
        id,
        // ADMIN can view any URL, USER only their own
        ...(userRole !== 'ADMIN' && { userId }),
      },
    });

    if (!url) {
      throw new NotFoundException(ERROR_MESSAGES.URL_NOT_FOUND);
    }

    // Cache the result
    await this.cacheUrl(url);

    return this.mapToResponse(url);
  }

  /**
   * Find URL by slug (for redirects)
   */
  async findBySlug(slug: string): Promise<UrlWithVariants> {
    // Try to get from cache first
    const cacheKey = `${this.CACHE_PREFIX}slug:${slug}`;
    const cached = await this.cacheService.get<UrlWithVariants>(cacheKey);

    if (cached) {
      return cached;
    }

    // Query from database (include variants for A/B Testing)
    const url = await this.prisma.url.findUnique({
      where: { slug },
      include: {
        variants: {
          where: { isActive: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!url) {
      throw new NotFoundException(ERROR_MESSAGES.URL_NOT_FOUND);
    }

    // Check status
    if (url.status !== 'ACTIVE') {
      throw new BadRequestException(ERROR_MESSAGES.URL_INACTIVE);
    }

    // Check if expired
    if (url.expiresAt && new Date() > url.expiresAt) {
      // Automatically mark as expired
      await this.prisma.url.update({
        where: { id: url.id },
        data: { status: 'EXPIRED' },
      });
      throw new BadRequestException(ERROR_MESSAGES.URL_EXPIRED);
    }

    // Cache the result with dynamic TTL based on popularity
    const ttl = this.getDynamicTTL(url.clickCount);
    await this.cacheService.set(cacheKey, url, ttl);

    return url;
  }

  /**
   * Update URL
   */
  async update(
    id: string,
    userId: string,
    updateUrlDto: UpdateUrlDto,
    userRole?: 'ADMIN' | 'USER',
    meta?: RequestMeta,
  ): Promise<UrlResponseDto> {
    // Check if URL exists and belongs to the user (or user is ADMIN)
    const existing = await this.prisma.url.findFirst({
      where: {
        id,
        // ADMIN can update any URL, USER only their own
        ...(userRole !== 'ADMIN' && { userId }),
      },
    });

    if (!existing) {
      throw new NotFoundException(ERROR_MESSAGES.URL_NOT_FOUND);
    }

    const { password, expiresAt, ...restDto } = updateUrlDto;

    // Process password
    let hashedPassword: string | null | undefined = undefined;
    if (password !== undefined) {
      hashedPassword = password === null ? null : await hashPassword(password);
    }

    // Process expiration date
    let expirationDate: Date | null | undefined = undefined;
    if (expiresAt !== undefined) {
      expirationDate = expiresAt === null ? null : new Date(expiresAt);
    }

    // Update URL
    const url = await this.prisma.url.update({
      where: { id },
      data: {
        ...restDto,
        ...(hashedPassword !== undefined && { password: hashedPassword }),
        ...(expirationDate !== undefined && { expiresAt: expirationDate }),
      },
    });

    // Clear cache
    await this.clearUrlCache(id, url.slug);

    // Emit url.updated event for webhooks
    this.eventEmitter.emit('url.updated', url);

    // Audit log
    await this.auditLogService.create({
      userId,
      action: 'URL_UPDATED',
      entityType: 'url',
      entityId: url.id,
      oldValue: {
        slug: existing.slug,
        originalUrl: existing.originalUrl,
        title: existing.title,
        status: existing.status,
      },
      newValue: {
        slug: url.slug,
        originalUrl: url.originalUrl,
        title: url.title,
        status: url.status,
      },
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return this.mapToResponse(url);
  }

  /**
   * Delete URL
   */
  async delete(
    id: string,
    userId: string,
    userRole?: 'ADMIN' | 'USER',
    meta?: RequestMeta,
  ): Promise<void> {
    // Check if URL exists and belongs to the user (or user is ADMIN)
    const existing = await this.prisma.url.findFirst({
      where: {
        id,
        // ADMIN can delete any URL, USER only their own
        ...(userRole !== 'ADMIN' && { userId }),
      },
    });

    if (!existing) {
      throw new NotFoundException(ERROR_MESSAGES.URL_NOT_FOUND);
    }

    // Delete URL (will cascade delete related Click records)
    await this.prisma.url.delete({
      where: { id },
    });

    // Clear cache
    await this.clearUrlCache(id, existing.slug);

    // Update in-memory counter (for dynamic length strategy)
    this.urlCount = Math.max(0, this.urlCount - 1);

    // Emit url.deleted event for webhooks
    this.eventEmitter.emit('url.deleted', {
      id: existing.id,
      slug: existing.slug,
      originalUrl: existing.originalUrl,
      userId: existing.userId,
    });

    // Audit log
    await this.auditLogService.create({
      userId,
      action: 'URL_DELETED',
      entityType: 'url',
      entityId: existing.id,
      oldValue: {
        slug: existing.slug,
        originalUrl: existing.originalUrl,
        title: existing.title,
      },
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });
  }

  /**
   * Increment click count (used by Redirect module)
   * Optimization: Merge two queries into one to avoid N+1 problem
   */
  async incrementClickCount(urlId: string): Promise<void> {
    // Use update's return value to get slug, avoiding additional findUnique query
    const url = await this.prisma.url.update({
      where: { id: urlId },
      data: {
        clickCount: {
          increment: 1,
        },
      },
      select: {
        slug: true, // Only select required fields
      },
    });

    // Clear cache to reload fresh data on next query
    await this.clearUrlCache(urlId, url.slug);
  }

  /**
   * Determine slug length based on current URL count
   */
  private determineSlugLength(): number {
    const count = this.urlCount;

    for (let i = 0; i < this.slugLengthThresholds.length; i++) {
      if (count < this.slugLengthThresholds[i]) {
        return this.slugLengths[i];
      }
    }

    // If exceeds all thresholds, use the last length
    return this.slugLengths[this.slugLengths.length - 1];
  }

  /**
   * Generate unique slug (handle collisions with dynamic length strategy)
   */
  private async generateUniqueSlug(
    maxAttempts: number = 5,
  ): Promise<string> {
    const baseLength = this.determineSlugLength();

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const slug = generateCustomSlug(baseLength);

      // Check if already exists
      const existing = await this.prisma.url.findUnique({
        where: { slug },
      });

      if (!existing) {
        return slug;
      }
    }

    // If multiple collision attempts, use +2 length slug
    const fallbackLength = baseLength + 2;
    const longSlug = generateCustomSlug(fallbackLength);
    const existing = await this.prisma.url.findUnique({
      where: { slug: longSlug },
    });

    if (existing) {
      throw new ConflictException('Unable to generate unique short URL code, please try again later');
    }

    this.logger.warn(
      `Used fallback slug length ${fallbackLength} after ${maxAttempts} collision attempts`,
    );

    return longSlug;
  }

  /**
   * Get dynamic TTL based on URL popularity
   * Hot URLs (high click count) get longer cache times
   */
  private getDynamicTTL(clickCount: number): number {
    if (clickCount >= this.HOT_URL_THRESHOLD) {
      return this.HOT_URL_CACHE_TTL; // 24 hours for popular URLs
    }
    return this.CACHE_TTL; // 2 hours for normal URLs
  }

  /**
   * Cache URL data with dynamic TTL based on popularity
   */
  private async cacheUrl(url: Url | UrlWithVariants): Promise<void> {
    const ttl = this.getDynamicTTL(url.clickCount);

    // Use ID as key
    const idKey = `${this.CACHE_PREFIX}${url.id}`;
    await this.cacheService.set(idKey, url, ttl);

    // Use slug as key (for redirects) - hot URLs get longer cache
    const slugKey = `${this.CACHE_PREFIX}slug:${url.slug}`;
    await this.cacheService.set(slugKey, url, ttl);

    // Log cache strategy for hot URLs
    if (url.clickCount >= this.HOT_URL_THRESHOLD) {
      this.logger.debug(
        `Hot URL cached: ${url.slug} (${url.clickCount} clicks) with TTL ${ttl}s`,
      );
    }
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
  private async bulkClearUrlCache(urls: { id: string; slug: string }[]): Promise<void> {
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

  /**
   * Map to response DTO
   */
  private mapToResponse(url: Url): UrlResponseDto {
    const shortUrlDomain = this.configService.get<string>('SHORT_URL_DOMAIN');
    return {
      id: url.id,
      slug: url.slug,
      shortUrl: `${shortUrlDomain}/${url.slug}`,
      originalUrl: url.originalUrl,
      title: url.title ?? undefined,
      userId: url.userId,
      status: url.status,
      clickCount: url.clickCount,
      hasPassword: !!url.password,
      expiresAt: url.expiresAt ?? undefined,
      utmSource: url.utmSource ?? undefined,
      utmMedium: url.utmMedium ?? undefined,
      utmCampaign: url.utmCampaign ?? undefined,
      utmTerm: url.utmTerm ?? undefined,
      utmContent: url.utmContent ?? undefined,
      createdAt: url.createdAt,
      updatedAt: url.updatedAt,
    };
  }

  /**
   * Generate QR Code (Base64 format)
   */
  async generateQRCode(
    id: string,
    userId: string,
    options?: {
      width?: number;
      margin?: number;
      color?: { dark?: string; light?: string };
    },
    userRole?: 'ADMIN' | 'USER',
  ): Promise<string> {
    // Check if URL exists and belongs to the user (or user is ADMIN)
    const url = await this.prisma.url.findFirst({
      where: {
        id,
        // ADMIN can generate QR code for any URL, USER only their own
        ...(userRole !== 'ADMIN' && { userId }),
      },
    });

    if (!url) {
      throw new NotFoundException(ERROR_MESSAGES.URL_NOT_FOUND);
    }

    // Build complete short URL
    const shortUrlDomain = this.configService.get<string>('SHORT_URL_DOMAIN');
    const shortUrl = `${shortUrlDomain}/${url.slug}`;

    // Generate QR Code (Data URL format)
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(shortUrl, {
        width: options?.width || 512,
        margin: options?.margin || 2,
        color: {
          dark: options?.color?.dark || '#000000',
          light: options?.color?.light || '#ffffff',
        },
        errorCorrectionLevel: 'M',
      });

      return qrCodeDataUrl;
    } catch (error) {
      this.logger.error(`Failed to generate QR Code for URL ${id}`, error);
      throw new BadRequestException('Failed to generate QR Code');
    }
  }

  // ==================== A/B Testing Variant Management ====================

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

  // ==================== Bulk Operations ====================

  /**
   * Process items in batches with controlled concurrency
   */
  private async processBatch<T, R>(
    items: T[],
    processor: (item: T, index: number) => Promise<R>,
    batchSize: number = 10,
  ): Promise<Array<{ status: 'fulfilled'; value: R; index: number } | { status: 'rejected'; reason: string; data: T; index: number }>> {
    const results: Array<{ status: 'fulfilled'; value: R; index: number } | { status: 'rejected'; reason: string; data: T; index: number }> = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchPromises = batch.map(async (item, batchIndex) => {
        const globalIndex = i + batchIndex;
        try {
          const value = await processor(item, globalIndex);
          return { status: 'fulfilled' as const, value, index: globalIndex };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          return { status: 'rejected' as const, reason: errorMessage, data: item, index: globalIndex };
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
    urls: import('./dto/bulk-create-url.dto').BulkCreateUrlDto['urls'],
    meta?: RequestMeta,
  ): Promise<import('./dto/bulk-create-url.dto').BulkCreateResultDto> {
    const results: import('./dto/bulk-create-url.dto').BulkCreateResultDto = {
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

    // Step 2: Pre-mark failed items (duplicate slugs)
    const urlsWithValidation = urls.map((urlDto, index) => {
      if (urlDto.customSlug && existingSlugsSet.has(urlDto.customSlug)) {
        return { urlDto, index, preValidationError: 'Slug already exists' };
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
    const validUrls = urlsWithValidation.filter((item) => !item.preValidationError);

    // Track slugs being created in this batch to prevent duplicates within the same request
    const slugsBeingCreated = new Set<string>();

    const settledResults = await this.processBatch(
      validUrls,
      async (item) => {
        // Check for duplicates within this batch
        if (item.urlDto.customSlug && slugsBeingCreated.has(item.urlDto.customSlug)) {
          throw new Error('Duplicate slug within batch');
        }
        if (item.urlDto.customSlug) {
          slugsBeingCreated.add(item.urlDto.customSlug);
        }

        return this.create(userId, item.urlDto, meta);
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
    operation: import('./dto/bulk-update-url.dto').BulkUpdateOperation,
    userRole?: 'ADMIN' | 'USER',
    meta?: RequestMeta,
  ): Promise<import('./dto/bulk-update-url.dto').BulkUpdateResultDto> {
    // Single query to get all needed data (existence, ownership, cache clearing)
    const urls = await this.prisma.url.findMany({
      where: { id: { in: urlIds } },
      select: {
        id: true,
        userId: true,
        slug: true,
      },
    });

    if (urls.length === 0) {
      throw new NotFoundException('No URLs found');
    }

    // Check for non-existent IDs
    const existingIds = new Set(urls.map((u) => u.id));
    const notFoundIds = urlIds.filter((id) => !existingIds.has(id));
    if (notFoundIds.length > 0) {
      throw new NotFoundException(
        `${notFoundIds.length} URL(s) not found`,
      );
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
        const existingUrlIds = new Set(existingBundleUrls.map((bu) => bu.urlId));

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
        const expirationDate = operation.expiresAt ? new Date(operation.expiresAt) : null;
        await tx.url.updateMany({
          where: { id: { in: validIds } },
          data: { expiresAt: expirationDate },
        });
        message = operation.expiresAt ? `Expiration set to ${operation.expiresAt}` : 'Expiration removed';
      } else if (operation.type === 'utm') {
        const utmData: Record<string, string | undefined> = {};
        if (operation.utmSource !== undefined) utmData.utmSource = operation.utmSource;
        if (operation.utmMedium !== undefined) utmData.utmMedium = operation.utmMedium;
        if (operation.utmCampaign !== undefined) utmData.utmCampaign = operation.utmCampaign;
        if (operation.utmTerm !== undefined) utmData.utmTerm = operation.utmTerm;
        if (operation.utmContent !== undefined) utmData.utmContent = operation.utmContent;

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
      this.logger.error(`Failed to clear cache for bulk updated URLs: ${error}`);
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
  ): Promise<import('./dto/bulk-delete-url.dto').BulkDeleteResultDto> {
    // Single query to get all needed data (existence, ownership, cache clearing, events)
    const urls = await this.prisma.url.findMany({
      where: { id: { in: urlIds } },
      select: {
        id: true,
        userId: true,
        slug: true,
        originalUrl: true,
      },
    });

    if (urls.length === 0) {
      throw new NotFoundException('No URLs found');
    }

    // Check for non-existent IDs
    const existingIds = new Set(urls.map((u) => u.id));
    const notFoundIds = urlIds.filter((id) => !existingIds.has(id));
    if (notFoundIds.length > 0) {
      throw new NotFoundException(
        `${notFoundIds.length} URL(s) not found`,
      );
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
            urls: urls.map((u) => ({ id: u.id, slug: u.slug, originalUrl: u.originalUrl })),
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
      this.logger.error(`Failed to clear cache for bulk deleted URLs: ${error}`);
      this.eventEmitter.emit('cache.clear.failed', {
        operation: 'bulkDelete',
        urlIds: validIds,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Update URL count (use validIds.length for accuracy in concurrent scenarios)
    this.urlCount = Math.max(0, this.urlCount - validIds.length);

    // Emit events asynchronously (don't block response)
    setImmediate(() => {
      for (const url of urls) {
        this.eventEmitter.emit('url.deleted', {
          id: url.id,
          slug: url.slug,
          originalUrl: url.originalUrl,
          userId: url.userId,
        });
      }
    });

    return {
      deletedCount: result.count,
      deletedIds: validIds,
    };
  }
}
