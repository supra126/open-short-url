import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/database/prisma.service';
import { CacheService } from '@/common/cache/cache.service';
import { AnalyticsQueryDto, TimeRange } from './dto/analytics-query.dto';
import {
  AnalyticsResponseDto,
  OverviewStats,
  TimeSeriesDataPoint,
  GeoLocationStat,
  DeviceStat,
  RefererStat,
  UtmStat,
  RecentClickDto,
  RecentClicksResponseDto,
} from './dto/analytics-response.dto';
import { ERROR_MESSAGES } from '@/common/constants/errors';

@Injectable()
export class AnalyticsService {
  // Optimized cache TTL for analytics data
  private readonly CACHE_TTL = 1800; // 30 minutes (analytics can tolerate slight delays)
  private readonly CACHE_PREFIX = 'analytics:';

  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  /**
   * Get analytics data for a URL
   */
  async getUrlAnalytics(
    urlId: string,
    userId: string,
    queryDto: AnalyticsQueryDto,
  ): Promise<AnalyticsResponseDto> {
    // Verify URL exists and belongs to the user
    const url = await this.prisma.url.findFirst({
      where: {
        id: urlId,
        userId,
      },
    });

    if (!url) {
      throw new NotFoundException(ERROR_MESSAGES.URL_NOT_FOUND);
    }

    // Try to get from cache
    const cacheKey = this.getCacheKey(urlId, queryDto);
    const cached = await this.cacheService.get<AnalyticsResponseDto>(cacheKey);
    if (cached) {
      return cached;
    }

    // Calculate date range
    const { startDate, endDate } = this.calculateDateRange(queryDto);

    // Query click data - optimized to select only necessary fields
    // Exclude bot traffic from analytics
    const clicks = await this.prisma.click.findMany({
      where: {
        urlId,
        isBot: false, // Exclude bot traffic
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        ip: true,
        country: true,
        region: true,
        city: true,
        browser: true,
        os: true,
        device: true,
        referer: true,
        utmSource: true,
        utmMedium: true,
        utmCampaign: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Calculate various statistics
    const overview = await this.calculateOverview(
      urlId,
      clicks,
      startDate,
      endDate,
    );
    const timeSeries = this.calculateTimeSeries(clicks, startDate, endDate);
    const countries = this.calculateGeoStats(clicks, 'country');
    const regions = this.calculateGeoStats(clicks, 'region');
    const cities = this.calculateGeoStats(clicks, 'city');
    const browsers = this.calculateDeviceStats(clicks, 'browser');
    const operatingSystems = this.calculateDeviceStats(clicks, 'os');
    const devices = this.calculateDeviceStats(clicks, 'device');
    const referers = this.calculateRefererStats(clicks);
    const utmSources = this.calculateUtmStats(clicks, 'utmSource');
    const utmMediums = this.calculateUtmStats(clicks, 'utmMedium');
    const utmCampaigns = this.calculateUtmStats(clicks, 'utmCampaign');

    const result: AnalyticsResponseDto = {
      overview,
      timeSeries,
      countries,
      regions,
      cities,
      browsers,
      operatingSystems,
      devices,
      referers,
      utmSources,
      utmMediums,
      utmCampaigns,
    };

    // Cache result
    await this.cacheService.set(cacheKey, result, this.CACHE_TTL);

    return result;
  }

  /**
   * Get analytics data for all user URLs
   */
  async getUserAnalytics(
    userId: string,
    queryDto: AnalyticsQueryDto,
  ): Promise<AnalyticsResponseDto> {
    // Calculate date range
    const { startDate, endDate } = this.calculateDateRange(queryDto);

    // Query click data for all user URLs - optimized to select only necessary fields
    // Exclude bot traffic from analytics
    const clicks = await this.prisma.click.findMany({
      where: {
        url: {
          userId,
        },
        isBot: false, // Exclude bot traffic
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        ip: true,
        country: true,
        region: true,
        city: true,
        browser: true,
        os: true,
        device: true,
        referer: true,
        utmSource: true,
        utmMedium: true,
        utmCampaign: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Calculate statistics (same logic as single URL)
    const overview = await this.calculateUserOverview(
      userId,
      clicks,
      startDate,
      endDate,
    );
    const timeSeries = this.calculateTimeSeries(clicks, startDate, endDate);
    const countries = this.calculateGeoStats(clicks, 'country');
    const regions = this.calculateGeoStats(clicks, 'region');
    const cities = this.calculateGeoStats(clicks, 'city');
    const browsers = this.calculateDeviceStats(clicks, 'browser');
    const operatingSystems = this.calculateDeviceStats(clicks, 'os');
    const devices = this.calculateDeviceStats(clicks, 'device');
    const referers = this.calculateRefererStats(clicks);
    const utmSources = this.calculateUtmStats(clicks, 'utmSource');
    const utmMediums = this.calculateUtmStats(clicks, 'utmMedium');
    const utmCampaigns = this.calculateUtmStats(clicks, 'utmCampaign');

    return {
      overview,
      timeSeries,
      countries,
      regions,
      cities,
      browsers,
      operatingSystems,
      devices,
      referers,
      utmSources,
      utmMediums,
      utmCampaigns,
    };
  }

  /**
   * Calculate date range
   */
  private calculateDateRange(queryDto: AnalyticsQueryDto): {
    startDate: Date;
    endDate: Date;
  } {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    if (queryDto.timeRange === TimeRange.CUSTOM) {
      if (!queryDto.startDate || !queryDto.endDate) {
        throw new Error('Custom time range requires both startDate and endDate');
      }
      startDate = new Date(queryDto.startDate);
      endDate = new Date(queryDto.endDate);
    } else {
      switch (queryDto.timeRange) {
        case TimeRange.LAST_7_DAYS:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case TimeRange.LAST_30_DAYS:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case TimeRange.LAST_90_DAYS:
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }
    }

    return { startDate, endDate };
  }

  /**
   * Calculate overview statistics (single URL)
   * Optimized: Use aggregation query to get current and previous period counts in one query
   */
  private async calculateOverview(
    urlId: string,
    clicks: any[],
    startDate: Date,
    endDate: Date,
  ): Promise<OverviewStats> {
    const totalClicks = clicks.length;
    const uniqueVisitors = new Set(clicks.map((c) => c.ip)).size;
    const days = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const averageClicksPerDay =
      days > 0 ? Math.round((totalClicks / days) * 10) / 10 : 0;

    // Calculate growth rate (compared to previous period)
    // Optimized: Use single aggregation query
    const previousStartDate = new Date(
      startDate.getTime() - (endDate.getTime() - startDate.getTime()),
    );

    const [previousResult] = await this.prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*)::bigint as count
      FROM "clicks"
      WHERE "urlId" = ${urlId}
        AND "isBot" = false
        AND "createdAt" >= ${previousStartDate}
        AND "createdAt" < ${startDate}
    `;

    const previousClicks = Number(previousResult?.count || 0);

    const growthRate =
      previousClicks > 0
        ? Math.round(((totalClicks - previousClicks) / previousClicks) * 1000) /
          10
        : totalClicks > 0
          ? 100
          : 0;

    return {
      totalClicks,
      uniqueVisitors,
      averageClicksPerDay,
      growthRate,
    };
  }

  /**
   * Calculate overview statistics (all user URLs)
   * Optimized: Use aggregation query to get current and previous period counts in one query
   */
  private async calculateUserOverview(
    userId: string,
    clicks: any[],
    startDate: Date,
    endDate: Date,
  ): Promise<OverviewStats> {
    const totalClicks = clicks.length;
    const uniqueVisitors = new Set(clicks.map((c) => c.ip)).size;
    const days = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const averageClicksPerDay =
      days > 0 ? Math.round((totalClicks / days) * 10) / 10 : 0;

    // Calculate growth rate
    // Optimized: Use single aggregation query with JOIN
    const previousStartDate = new Date(
      startDate.getTime() - (endDate.getTime() - startDate.getTime()),
    );

    const [previousResult] = await this.prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*)::bigint as count
      FROM "clicks" c
      INNER JOIN "urls" u ON c."urlId" = u."id"
      WHERE u."userId" = ${userId}
        AND c."isBot" = false
        AND c."createdAt" >= ${previousStartDate}
        AND c."createdAt" < ${startDate}
    `;

    const previousClicks = Number(previousResult?.count || 0);

    const growthRate =
      previousClicks > 0
        ? Math.round(((totalClicks - previousClicks) / previousClicks) * 1000) /
          10
        : totalClicks > 0
          ? 100
          : 0;

    return {
      totalClicks,
      uniqueVisitors,
      averageClicksPerDay,
      growthRate,
    };
  }

  /**
   * Calculate time series data
   */
  private calculateTimeSeries(
    clicks: any[],
    startDate: Date,
    endDate: Date,
  ): TimeSeriesDataPoint[] {
    const dateMap = new Map<string, number>();

    // Initialize all dates to 0
    const current = new Date(startDate);
    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      dateMap.set(dateStr, 0);
      current.setDate(current.getDate() + 1);
    }

    // Count daily clicks
    clicks.forEach((click) => {
      const dateStr = new Date(click.createdAt).toISOString().split('T')[0];
      const count = dateMap.get(dateStr) || 0;
      dateMap.set(dateStr, count + 1);
    });

    // Convert to array and sort
    return Array.from(dateMap.entries())
      .map(([date, clicks]) => ({ date, clicks }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Calculate geolocation statistics
   */
  private calculateGeoStats(
    clicks: any[],
    field: 'country' | 'region' | 'city',
  ): GeoLocationStat[] {
    const stats = new Map<string, number>();
    const total = clicks.length;

    clicks.forEach((click) => {
      const value = click[field] || 'Unknown';
      stats.set(value, (stats.get(value) || 0) + 1);
    });

    return Array.from(stats.entries())
      .map(([name, clicks]) => ({
        name,
        clicks,
        percentage: total > 0 ? Math.round((clicks / total) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10); // Top 10
  }

  /**
   * Calculate device statistics
   */
  private calculateDeviceStats(
    clicks: any[],
    field: 'browser' | 'os' | 'device',
  ): DeviceStat[] {
    const stats = new Map<string, number>();
    const total = clicks.length;

    clicks.forEach((click) => {
      const value = click[field] || 'Unknown';
      stats.set(value, (stats.get(value) || 0) + 1);
    });

    return Array.from(stats.entries())
      .map(([name, clicks]) => ({
        name,
        clicks,
        percentage: total > 0 ? Math.round((clicks / total) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10); // Top 10
  }

  /**
   * Calculate referer statistics
   */
  private calculateRefererStats(clicks: any[]): RefererStat[] {
    const stats = new Map<string, number>();
    const total = clicks.length;

    clicks.forEach((click) => {
      const referer = click.referer || 'Direct';
      stats.set(referer, (stats.get(referer) || 0) + 1);
    });

    return Array.from(stats.entries())
      .map(([referer, clicks]) => ({
        referer,
        clicks,
        percentage: total > 0 ? Math.round((clicks / total) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10); // Top 10
  }

  /**
   * Calculate UTM parameter statistics
   */
  private calculateUtmStats(
    clicks: any[],
    field: 'utmSource' | 'utmMedium' | 'utmCampaign',
  ): UtmStat[] {
    const stats = new Map<string, number>();
    const total = clicks.length;

    clicks.forEach((click) => {
      const value = click[field];
      if (value) {
        stats.set(value, (stats.get(value) || 0) + 1);
      }
    });

    return Array.from(stats.entries())
      .map(([value, clicks]) => ({
        value,
        clicks,
        percentage: total > 0 ? Math.round((clicks / total) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10); // Top 10
  }

  /**
   * Get recent clicks for a URL
   */
  async getRecentClicks(
    urlId: string,
    userId: string,
    limit: number = 20,
    includeBots: boolean = false,
  ): Promise<RecentClicksResponseDto> {
    // Verify URL exists and belongs to the user
    const url = await this.prisma.url.findFirst({
      where: {
        id: urlId,
        userId,
      },
    });

    if (!url) {
      throw new NotFoundException(ERROR_MESSAGES.URL_NOT_FOUND);
    }

    // Build where condition
    const whereCondition: any = { urlId };
    if (!includeBots) {
      whereCondition.isBot = false; // Filter out bots by default
    }

    // Get total count
    const total = await this.prisma.click.count({
      where: whereCondition,
    });

    // Get recent clicks
    const clicks = await this.prisma.click.findMany({
      where: whereCondition,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      select: {
        id: true,
        ip: true,
        browser: true,
        os: true,
        device: true,
        country: true,
        city: true,
        referer: true,
        utmSource: true,
        utmMedium: true,
        utmCampaign: true,
        isBot: true,
        botName: true,
        createdAt: true,
      },
    });

    return {
      clicks: clicks.map((click) => ({
        id: click.id,
        ip: click.ip || undefined,
        browser: click.browser || undefined,
        os: click.os || undefined,
        device: click.device || undefined,
        country: click.country || undefined,
        city: click.city || undefined,
        referer: click.referer || undefined,
        utmSource: click.utmSource || undefined,
        utmMedium: click.utmMedium || undefined,
        utmCampaign: click.utmCampaign || undefined,
        isBot: click.isBot,
        botName: click.botName || undefined,
        createdAt: click.createdAt,
      })),
      total,
    };
  }

  /**
   * Get bot analytics for a URL
   */
  async getBotAnalytics(
    urlId: string,
    userId: string,
    queryDto: AnalyticsQueryDto,
  ): Promise<{
    totalBotClicks: number;
    botTypes: { botName: string; clicks: number; percentage: number }[];
  }> {
    // Verify URL exists and belongs to the user
    const url = await this.prisma.url.findFirst({
      where: {
        id: urlId,
        userId,
      },
    });

    if (!url) {
      throw new NotFoundException(ERROR_MESSAGES.URL_NOT_FOUND);
    }

    // Calculate date range
    const { startDate, endDate } = this.calculateDateRange(queryDto);

    // Query bot clicks only
    const botClicks = await this.prisma.click.findMany({
      where: {
        urlId,
        isBot: true,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        botName: true,
      },
    });

    const totalBotClicks = botClicks.length;

    // Count by bot type
    const botTypeMap = new Map<string, number>();
    botClicks.forEach((click) => {
      const name = click.botName || 'Unknown Bot';
      botTypeMap.set(name, (botTypeMap.get(name) || 0) + 1);
    });

    const botTypes = Array.from(botTypeMap.entries())
      .map(([botName, clicks]) => ({
        botName,
        clicks,
        percentage:
          totalBotClicks > 0
            ? Math.round((clicks / totalBotClicks) * 1000) / 10
            : 0,
      }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10); // Top 10

    return {
      totalBotClicks,
      botTypes,
    };
  }

  /**
   * Get bot analytics for all user URLs
   */
  async getUserBotAnalytics(
    userId: string,
    queryDto: AnalyticsQueryDto,
  ): Promise<{
    totalBotClicks: number;
    botPercentage: number;
    botTypes: { botName: string; clicks: number; percentage: number }[];
  }> {
    // Calculate date range
    const { startDate, endDate } = this.calculateDateRange(queryDto);

    // Get all URLs for the user
    const userUrls = await this.prisma.url.findMany({
      where: { userId },
      select: { id: true },
    });

    const urlIds = userUrls.map((url) => url.id);

    if (urlIds.length === 0) {
      return {
        totalBotClicks: 0,
        botPercentage: 0,
        botTypes: [],
      };
    }

    // Query all clicks in the time range
    const [botClicks, totalClicks] = await Promise.all([
      // Get bot clicks
      this.prisma.click.findMany({
        where: {
          urlId: { in: urlIds },
          isBot: true,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          botName: true,
        },
      }),
      // Get total clicks count
      this.prisma.click.count({
        where: {
          urlId: { in: urlIds },
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
    ]);

    const totalBotClicks = botClicks.length;
    const botPercentage =
      totalClicks > 0
        ? Math.round((totalBotClicks / totalClicks) * 1000) / 10
        : 0;

    // Count by bot type
    const botTypeMap = new Map<string, number>();
    botClicks.forEach((click) => {
      const name = click.botName || 'Unknown Bot';
      botTypeMap.set(name, (botTypeMap.get(name) || 0) + 1);
    });

    const botTypes = Array.from(botTypeMap.entries())
      .map(([botName, clicks]) => ({
        botName,
        clicks,
        percentage:
          totalBotClicks > 0
            ? Math.round((clicks / totalBotClicks) * 1000) / 10
            : 0,
      }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10); // Top 10

    return {
      totalBotClicks,
      botPercentage,
      botTypes,
    };
  }

  /**
   * Get user-level A/B Testing analytics
   * Aggregates statistics across all URLs with A/B Testing enabled
   */
  async getUserAbTestAnalytics(
    userId: string,
    queryDto: AnalyticsQueryDto,
  ): Promise<{
    totalAbTestUrls: number;
    totalTestClicks: number;
    controlGroupClicks: number;
    variantClicks: number;
    controlGroupPercentage: number;
    variantPercentage: number;
    topPerformingVariants: {
      urlSlug: string;
      variantName: string;
      clicks: number;
      clickThroughRate: number;
    }[];
  }> {
    // Calculate date range
    const { startDate, endDate } = this.calculateDateRange(queryDto);

    // Get all URLs with A/B Testing enabled for the user
    const abTestUrls = await this.prisma.url.findMany({
      where: {
        userId,
        isAbTest: true,
      },
      select: {
        id: true,
        slug: true,
        variants: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const totalAbTestUrls = abTestUrls.length;

    if (totalAbTestUrls === 0) {
      return {
        totalAbTestUrls: 0,
        totalTestClicks: 0,
        controlGroupClicks: 0,
        variantClicks: 0,
        controlGroupPercentage: 0,
        variantPercentage: 0,
        topPerformingVariants: [],
      };
    }

    // Get all URL IDs
    const urlIds = abTestUrls.map((url) => url.id);

    // Get all clicks for A/B Test URLs in the time range
    const allClicks = await this.prisma.click.findMany({
      where: {
        urlId: { in: urlIds },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        variantId: true,
        urlId: true,
      },
    });

    const totalTestClicks = allClicks.length;

    // Separate control group clicks (variantId is null) and variant clicks
    const controlGroupClicks = allClicks.filter(
      (click) => click.variantId === null,
    ).length;
    const variantClicks = totalTestClicks - controlGroupClicks;

    const controlGroupPercentage =
      totalTestClicks > 0
        ? Math.round((controlGroupClicks / totalTestClicks) * 1000) / 10
        : 0;
    const variantPercentage =
      totalTestClicks > 0
        ? Math.round((variantClicks / totalTestClicks) * 1000) / 10
        : 0;

    // Calculate top performing variants
    const variantClicksMap = new Map<
      string,
      {
        urlSlug: string;
        variantName: string;
        clicks: number;
        totalUrlClicks: number;
      }
    >();

    // Count clicks by variant
    allClicks.forEach((click) => {
      if (click.variantId) {
        const key = `${click.urlId}-${click.variantId}`;
        const existing = variantClicksMap.get(key);
        if (existing) {
          existing.clicks++;
        } else {
          // Find the variant info
          const url = abTestUrls.find((u) => u.id === click.urlId);
          const variant = url?.variants.find((v) => v.id === click.variantId);
          if (url && variant) {
            variantClicksMap.set(key, {
              urlSlug: url.slug,
              variantName: variant.name,
              clicks: 1,
              totalUrlClicks: 0, // Will calculate below
            });
          }
        }
      }
    });

    // Calculate total clicks per URL for click-through rate
    const urlClicksMap = new Map<string, number>();
    allClicks.forEach((click) => {
      urlClicksMap.set(click.urlId, (urlClicksMap.get(click.urlId) || 0) + 1);
    });

    // Update totalUrlClicks for each variant
    variantClicksMap.forEach((value, key) => {
      const urlId = key.split('-')[0];
      value.totalUrlClicks = urlClicksMap.get(urlId) || 0;
    });

    const topPerformingVariants = Array.from(variantClicksMap.values())
      .map((variant) => ({
        urlSlug: variant.urlSlug,
        variantName: variant.variantName,
        clicks: variant.clicks,
        clickThroughRate:
          variant.totalUrlClicks > 0
            ? Math.round((variant.clicks / variant.totalUrlClicks) * 1000) / 10
            : 0,
      }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10); // Top 10

    return {
      totalAbTestUrls,
      totalTestClicks,
      controlGroupClicks,
      variantClicks,
      controlGroupPercentage,
      variantPercentage,
      topPerformingVariants,
    };
  }

  /**
   * Generate cache key
   */
  private getCacheKey(urlId: string, queryDto: AnalyticsQueryDto): string {
    const { timeRange, startDate, endDate } = queryDto;
    return `${this.CACHE_PREFIX}${urlId}:${timeRange}:${startDate || ''}:${endDate || ''}`;
  }
}
