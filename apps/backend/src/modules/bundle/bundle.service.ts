import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, BundleStatus, UserRole } from '@prisma/client';
import { PrismaService } from '@/common/database/prisma.service';
import { CreateBundleDto } from './dto/create-bundle.dto';
import { UpdateBundleDto } from './dto/update-bundle.dto';
import { BundleQueryDto } from './dto/bundle-query.dto';
import {
  BundleResponseDto,
  BundleListResponseDto,
  BundleStatsDto,
} from './dto/bundle-response.dto';
import { AddUrlToBundleDto, AddMultipleUrlsDto } from './dto/add-url-to-bundle.dto';

@Injectable()
export class BundleService {
  private readonly logger = new Logger(BundleService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  /**
   * Create a new bundle
   */
  async create(
    userId: string,
    createBundleDto: CreateBundleDto,
  ): Promise<BundleResponseDto> {
    const { urlIds, ...bundleData } = createBundleDto;

    // Check if URLs exist and belong to the user
    if (urlIds && urlIds.length > 0) {
      const urls = await this.prisma.url.findMany({
        where: {
          id: { in: urlIds },
          userId,
        },
      });

      if (urls.length !== urlIds.length) {
        throw new BadRequestException('Some URLs do not exist or do not belong to you');
      }
    }

    const bundle = await this.prisma.bundle.create({
      data: {
        ...bundleData,
        userId,
        urls: urlIds && urlIds.length > 0 ? {
          create: urlIds.map((urlId, index) => ({
            urlId,
            order: index,
          })),
        } : undefined,
      },
      include: {
        urls: {
          include: {
            url: {
              select: {
                id: true,
                slug: true,
                originalUrl: true,
                title: true,
                clickCount: true,
                status: true,
                createdAt: true,
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    return this.mapToResponseDto(bundle);
  }

  /**
   * Find all bundles (admins can see all, users see only their own)
   */
  async findAll(
    userId: string,
    query: BundleQueryDto,
    userRole?: UserRole,
  ): Promise<BundleListResponseDto> {
    const { page = 1, pageSize = 10, status, search } = query;
    const skip = (page - 1) * pageSize;

    const where: Prisma.BundleWhereInput = {
      ...(userRole !== UserRole.ADMIN && { userId }),
      ...(status && { status }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [bundles, total] = await Promise.all([
      this.prisma.bundle.findMany({
        where,
        include: {
          urls: {
            include: {
              url: {
                select: {
                  id: true,
                  slug: true,
                  originalUrl: true,
                  title: true,
                  clickCount: true,
                  status: true,
                  createdAt: true,
                },
              },
            },
            orderBy: {
              order: 'asc',
            },
          },
        },
        skip,
        take: pageSize,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.bundle.count({ where }),
    ]);

    const data = bundles.map((bundle) => this.mapToResponseDto(bundle));

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Find a bundle by ID (admins can access all, users can access only their own)
   */
  async findOne(userId: string, id: string, userRole?: UserRole): Promise<BundleResponseDto> {
    const bundle = await this.prisma.bundle.findFirst({
      where: {
        id,
        ...(userRole !== UserRole.ADMIN && { userId }),
      },
      include: {
        urls: {
          include: {
            url: {
              select: {
                id: true,
                slug: true,
                originalUrl: true,
                title: true,
                clickCount: true,
                status: true,
                createdAt: true,
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!bundle) {
      throw new NotFoundException('Bundle not found');
    }

    return this.mapToResponseDto(bundle);
  }

  /**
   * Update a bundle (admins can update all, users can update only their own)
   */
  async update(
    userId: string,
    id: string,
    updateBundleDto: UpdateBundleDto,
    userRole?: UserRole,
  ): Promise<BundleResponseDto> {
    // Check if bundle exists and user has access
    const existingBundle = await this.prisma.bundle.findFirst({
      where: {
        id,
        ...(userRole !== UserRole.ADMIN && { userId }),
      },
    });

    if (!existingBundle) {
      throw new NotFoundException('Bundle not found');
    }

    const bundle = await this.prisma.bundle.update({
      where: { id },
      data: updateBundleDto,
      include: {
        urls: {
          include: {
            url: {
              select: {
                id: true,
                slug: true,
                originalUrl: true,
                title: true,
                clickCount: true,
                status: true,
                createdAt: true,
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    return this.mapToResponseDto(bundle);
  }

  /**
   * Delete a bundle (admins can delete all, users can delete only their own)
   */
  async remove(userId: string, id: string, userRole?: UserRole): Promise<void> {
    const bundle = await this.prisma.bundle.findFirst({
      where: {
        id,
        ...(userRole !== UserRole.ADMIN && { userId }),
      },
    });

    if (!bundle) {
      throw new NotFoundException('Bundle not found');
    }

    await this.prisma.bundle.delete({ where: { id } });
  }

  /**
   * Add a URL to a bundle
   */
  async addUrl(
    userId: string,
    bundleId: string,
    addUrlDto: AddUrlToBundleDto,
  ): Promise<BundleResponseDto> {
    // Check if bundle exists and belongs to user
    const bundle = await this.prisma.bundle.findFirst({
      where: { id: bundleId, userId },
    });

    if (!bundle) {
      throw new NotFoundException('Bundle not found');
    }

    // Check if URL exists and belongs to user
    const url = await this.prisma.url.findFirst({
      where: { id: addUrlDto.urlId, userId },
    });

    if (!url) {
      throw new NotFoundException('URL not found');
    }

    // Check if URL is already in bundle
    const existing = await this.prisma.bundleUrl.findFirst({
      where: {
        bundleId,
        urlId: addUrlDto.urlId,
      },
    });

    if (existing) {
      throw new ConflictException('URL is already in this bundle');
    }

    // Add URL to bundle
    await this.prisma.bundleUrl.create({
      data: {
        bundleId,
        urlId: addUrlDto.urlId,
        order: addUrlDto.order ?? 0,
      },
    });

    return this.findOne(userId, bundleId);
  }

  /**
   * Add multiple URLs to a bundle
   */
  async addMultipleUrls(
    userId: string,
    bundleId: string,
    addUrlsDto: AddMultipleUrlsDto,
  ): Promise<BundleResponseDto> {
    // Check if bundle exists and belongs to user
    const bundle = await this.prisma.bundle.findFirst({
      where: { id: bundleId, userId },
    });

    if (!bundle) {
      throw new NotFoundException('Bundle not found');
    }

    // Check if URLs exist and belong to user
    const urls = await this.prisma.url.findMany({
      where: {
        id: { in: addUrlsDto.urlIds },
        userId,
      },
    });

    if (urls.length !== addUrlsDto.urlIds.length) {
      throw new BadRequestException('Some URLs do not exist or do not belong to you');
    }

    // Get existing URLs in bundle
    const existingUrls = await this.prisma.bundleUrl.findMany({
      where: { bundleId },
      select: { urlId: true },
    });
    const existingUrlIds = new Set(existingUrls.map((bu) => bu.urlId));

    // Filter out URLs that are already in the bundle
    const newUrlIds = addUrlsDto.urlIds.filter((id) => !existingUrlIds.has(id));

    if (newUrlIds.length === 0) {
      throw new ConflictException('All URLs are already in this bundle');
    }

    // Add URLs to bundle
    await this.prisma.bundleUrl.createMany({
      data: newUrlIds.map((urlId, index) => ({
        bundleId,
        urlId,
        order: existingUrls.length + index,
      })),
    });

    return this.findOne(userId, bundleId);
  }

  /**
   * Remove a URL from a bundle
   */
  async removeUrl(
    userId: string,
    bundleId: string,
    urlId: string,
  ): Promise<BundleResponseDto> {
    // Check if bundle exists and belongs to user
    const bundle = await this.prisma.bundle.findFirst({
      where: { id: bundleId, userId },
    });

    if (!bundle) {
      throw new NotFoundException('Bundle not found');
    }

    // Check if URL is in bundle
    const bundleUrl = await this.prisma.bundleUrl.findFirst({
      where: { bundleId, urlId },
    });

    if (!bundleUrl) {
      throw new NotFoundException('URL not found in this bundle');
    }

    // Remove URL from bundle
    await this.prisma.bundleUrl.delete({
      where: { id: bundleUrl.id },
    });

    return this.findOne(userId, bundleId);
  }

  /**
   * Update URL order in a bundle
   */
  async updateUrlOrder(
    userId: string,
    bundleId: string,
    urlId: string,
    order: number,
  ): Promise<BundleResponseDto> {
    // Check if bundle exists and belongs to user
    const bundle = await this.prisma.bundle.findFirst({
      where: { id: bundleId, userId },
    });

    if (!bundle) {
      throw new NotFoundException('Bundle not found');
    }

    // Check if URL is in bundle
    const bundleUrl = await this.prisma.bundleUrl.findFirst({
      where: { bundleId, urlId },
    });

    if (!bundleUrl) {
      throw new NotFoundException('URL not found in this bundle');
    }

    // Update order
    await this.prisma.bundleUrl.update({
      where: { id: bundleUrl.id },
      data: { order },
    });

    return this.findOne(userId, bundleId);
  }

  /**
   * Get bundle statistics
   */
  async getStats(userId: string, bundleId: string): Promise<BundleStatsDto> {
    const bundle = await this.prisma.bundle.findFirst({
      where: { id: bundleId, userId },
      include: {
        urls: {
          include: {
            url: {
              select: {
                id: true,
                slug: true,
                clickCount: true,
                clicks: {
                  select: {
                    createdAt: true,
                  },
                  where: {
                    createdAt: {
                      gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!bundle) {
      throw new NotFoundException('Bundle not found');
    }

    // Calculate total clicks
    const totalClicks = bundle.urls.reduce(
      (sum, bundleUrl) => sum + bundleUrl.url.clickCount,
      0,
    );

    // Find top performing URL
    const topUrl = bundle.urls
      .map((bundleUrl) => ({
        slug: bundleUrl.url.slug,
        clicks: bundleUrl.url.clickCount,
      }))
      .sort((a, b) => b.clicks - a.clicks)[0];

    // Generate click trend (last 7 days)
    const clickTrend: Array<{ date: string; clicks: number }> = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const clicksOnDate = bundle.urls.reduce((sum, bundleUrl) => {
        const urlClicksOnDate = bundleUrl.url.clicks.filter((click) => {
          const clickDate = new Date(click.createdAt);
          return clickDate >= date && clickDate < nextDate;
        }).length;
        return sum + urlClicksOnDate;
      }, 0);

      clickTrend.push({
        date: date.toISOString().split('T')[0],
        clicks: clicksOnDate,
      });
    }

    return {
      bundleId,
      totalClicks,
      urlCount: bundle.urls.length,
      topUrl,
      clickTrend,
    };
  }

  /**
   * Archive a bundle
   */
  async archive(userId: string, id: string): Promise<BundleResponseDto> {
    return this.update(userId, id, { status: BundleStatus.ARCHIVED });
  }

  /**
   * Restore an archived bundle
   */
  async restore(userId: string, id: string): Promise<BundleResponseDto> {
    return this.update(userId, id, { status: BundleStatus.ACTIVE });
  }

  /**
   * Map Prisma bundle to response DTO
   */
  private mapToResponseDto(bundle: any): BundleResponseDto {
    try {
      const totalClicks = bundle.urls?.reduce(
        (sum: number, bundleUrl: any) => sum + (bundleUrl.url?.clickCount || 0),
        0,
      ) || 0;

      return {
        id: bundle.id,
        name: bundle.name,
        description: bundle.description,
        color: bundle.color,
        icon: bundle.icon,
        status: bundle.status,
        userId: bundle.userId,
        urlCount: bundle.urls?.length || 0,
        totalClicks,
        urls: bundle.urls?.map((bundleUrl: any) => {
          if (!bundleUrl.url) {
            this.logger.warn(`BundleUrl ${bundleUrl.id} is missing url relation`);
            return null;
          }
          const shortUrlDomain = this.configService.get<string>('SHORT_URL_DOMAIN');
          return {
            id: bundleUrl.url.id,
            slug: bundleUrl.url.slug,
            shortUrl: `${shortUrlDomain}/${bundleUrl.url.slug}`,
            originalUrl: bundleUrl.url.originalUrl,
            title: bundleUrl.url.title,
            clickCount: bundleUrl.url.clickCount,
            status: bundleUrl.url.status,
            createdAt: bundleUrl.url.createdAt,
            order: bundleUrl.order,
          };
        }).filter((url: any) => url !== null),
        createdAt: bundle.createdAt,
        updatedAt: bundle.updatedAt,
      };
    } catch (error) {
      this.logger.error('Error mapping bundle to response DTO:', error);
      this.logger.error('Bundle data:', JSON.stringify(bundle, null, 2));
      throw error;
    }
  }
}
