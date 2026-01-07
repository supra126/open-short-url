import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
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
  RecentClicksResponseDto,
  RecentClickDto,
  RoutingAnalyticsResponseDto,
  RoutingRuleStat,
  RoutingRuleTimeSeriesDataPoint,
  RoutingRuleGeoStat,
  RoutingRuleDeviceStat,
} from './dto/analytics-response.dto';
import { ERROR_MESSAGES, ANALYTICS_CONFIG } from '@/common/constants';
import { User, UserRole, Prisma } from '@prisma/client';

/**
 * Click data interface for analytics processing
 */
interface ClickDataForAnalytics {
  id: string;
  ip: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  browser: string | null;
  os: string | null;
  device: string | null;
  referer: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  isBot: boolean;
  createdAt: Date;
}

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
   * Check if user has access to a URL
   * Admins can access all URLs, regular users can only access their own
   */
  private async checkUrlOwnership(urlId: string, user: User): Promise<void> {
    // Build where condition - admins can access all URLs
    const whereCondition: Prisma.UrlWhereInput = { id: urlId };

    // Non-admin users can only access their own URLs
    if (user.role !== UserRole.ADMIN) {
      whereCondition.userId = user.id;
    }

    const url = await this.prisma.url.findFirst({
      where: whereCondition,
    });

    if (!url) {
      throw new NotFoundException(ERROR_MESSAGES.URL_NOT_FOUND);
    }
  }

  /**
   * Get analytics data for a URL
   * Uses hybrid approach: in-memory processing for small datasets,
   * database aggregation for large datasets to prevent memory exhaustion
   */
  async getUrlAnalytics(
    urlId: string,
    user: User,
    queryDto: AnalyticsQueryDto,
  ): Promise<AnalyticsResponseDto> {
    // Verify URL exists and user has access (admins can access all URLs)
    await this.checkUrlOwnership(urlId, user);

    // Try to get from cache
    const cacheKey = this.getCacheKey(urlId, queryDto);
    const cached = await this.cacheService.get<AnalyticsResponseDto>(cacheKey);
    if (cached) {
      return cached;
    }

    // Calculate date range
    const { startDate, endDate } = this.calculateDateRange(queryDto);

    // Check click count to decide processing strategy
    const clickCount = await this.prisma.click.count({
      where: {
        urlId,
        isBot: false,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    let result: AnalyticsResponseDto;

    // Use database aggregation for large datasets to prevent memory exhaustion
    if (clickCount > ANALYTICS_CONFIG.AGGREGATION_THRESHOLD) {
      result = await this.getUrlAnalyticsWithAggregation(urlId, startDate, endDate);
    } else {
      // Use in-memory processing for small datasets (faster)
      result = await this.getUrlAnalyticsInMemory(urlId, startDate, endDate);
    }

    // Cache result
    await this.cacheService.set(cacheKey, result, this.CACHE_TTL);

    return result;
  }

  /**
   * Get URL analytics using in-memory processing (for small datasets)
   */
  private async getUrlAnalyticsInMemory(
    urlId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<AnalyticsResponseDto> {
    // Query click data with limit to prevent memory exhaustion
    const allClicks = await this.prisma.click.findMany({
      where: {
        urlId,
        isBot: false,
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
        isBot: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: ANALYTICS_CONFIG.MAX_IN_MEMORY_CLICKS,
    });

    const clicks = allClicks;

    // Calculate various statistics
    const overview = await this.calculateOverview(urlId, clicks, startDate, endDate);
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
   * Get URL analytics using database aggregation (for large datasets)
   * Uses GROUP BY queries to avoid loading all data into memory
   */
  private async getUrlAnalyticsWithAggregation(
    urlId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<AnalyticsResponseDto> {
    // Execute all aggregation queries in parallel for efficiency
    const [
      overviewData,
      timeSeriesData,
      countryStats,
      regionStats,
      cityStats,
      browserStats,
      osStats,
      deviceStats,
      refererStats,
      utmSourceStats,
      utmMediumStats,
      utmCampaignStats,
    ] = await Promise.all([
      // Overview statistics
      this.getOverviewWithAggregation(urlId, startDate, endDate),
      // Time series using database GROUP BY
      this.getTimeSeriesWithAggregation(urlId, startDate, endDate),
      // Geographic stats
      this.getGroupedStats(urlId, startDate, endDate, 'country'),
      this.getGroupedStats(urlId, startDate, endDate, 'region'),
      this.getGroupedStats(urlId, startDate, endDate, 'city'),
      // Device stats
      this.getGroupedStats(urlId, startDate, endDate, 'browser'),
      this.getGroupedStats(urlId, startDate, endDate, 'os'),
      this.getGroupedStats(urlId, startDate, endDate, 'device'),
      // Referer stats
      this.getGroupedStats(urlId, startDate, endDate, 'referer'),
      // UTM stats
      this.getGroupedStats(urlId, startDate, endDate, 'utmSource'),
      this.getGroupedStats(urlId, startDate, endDate, 'utmMedium'),
      this.getGroupedStats(urlId, startDate, endDate, 'utmCampaign'),
    ]);

    return {
      overview: overviewData,
      timeSeries: timeSeriesData,
      countries: countryStats as GeoLocationStat[],
      regions: regionStats as GeoLocationStat[],
      cities: cityStats as GeoLocationStat[],
      browsers: browserStats as DeviceStat[],
      operatingSystems: osStats as DeviceStat[],
      devices: deviceStats as DeviceStat[],
      referers: refererStats.map((s) => ({ referer: s.name, clicks: s.clicks, percentage: s.percentage })) as RefererStat[],
      utmSources: utmSourceStats.map((s) => ({ value: s.name, clicks: s.clicks, percentage: s.percentage })) as UtmStat[],
      utmMediums: utmMediumStats.map((s) => ({ value: s.name, clicks: s.clicks, percentage: s.percentage })) as UtmStat[],
      utmCampaigns: utmCampaignStats.map((s) => ({ value: s.name, clicks: s.clicks, percentage: s.percentage })) as UtmStat[],
    };
  }

  /**
   * Get overview statistics using database aggregation
   */
  private async getOverviewWithAggregation(
    urlId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<OverviewStats> {
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const previousStartDate = new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime()));

    const [currentStats, previousStats] = await Promise.all([
      this.prisma.$queryRaw<[{ total: bigint; unique_ips: bigint }]>`
        SELECT COUNT(*)::bigint as total, COUNT(DISTINCT ip)::bigint as unique_ips
        FROM "clicks"
        WHERE "urlId" = ${urlId}
          AND "isBot" = false
          AND "createdAt" >= ${startDate}
          AND "createdAt" <= ${endDate}
      `,
      this.prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*)::bigint as count
        FROM "clicks"
        WHERE "urlId" = ${urlId}
          AND "isBot" = false
          AND "createdAt" >= ${previousStartDate}
          AND "createdAt" < ${startDate}
      `,
    ]);

    const totalClicks = Number(currentStats[0]?.total || 0);
    const uniqueVisitors = Number(currentStats[0]?.unique_ips || 0);
    const previousClicks = Number(previousStats[0]?.count || 0);
    const averageClicksPerDay = days > 0 ? Math.round((totalClicks / days) * 10) / 10 : 0;
    const growthRate = previousClicks > 0
      ? Math.round(((totalClicks - previousClicks) / previousClicks) * 1000) / 10
      : totalClicks > 0 ? 100 : 0;

    return { totalClicks, uniqueVisitors, averageClicksPerDay, growthRate };
  }

  /**
   * Get time series data using database aggregation
   */
  private async getTimeSeriesWithAggregation(
    urlId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<TimeSeriesDataPoint[]> {
    const rawData = await this.prisma.$queryRaw<{ date: Date; count: bigint }[]>`
      SELECT DATE("createdAt") as date, COUNT(*)::bigint as count
      FROM "clicks"
      WHERE "urlId" = ${urlId}
        AND "isBot" = false
        AND "createdAt" >= ${startDate}
        AND "createdAt" <= ${endDate}
      GROUP BY DATE("createdAt")
      ORDER BY date
    `;

    // Create a map for all dates in range
    const dateMap = new Map<string, number>();
    const current = new Date(startDate);
    while (current <= endDate) {
      dateMap.set(this.formatDateToString(current), 0);
      current.setDate(current.getDate() + 1);
    }

    // Fill in actual counts
    rawData.forEach((row) => {
      const dateStr = row.date instanceof Date
        ? this.formatDateToString(row.date)
        : String(row.date).split('T')[0];
      dateMap.set(dateStr, Number(row.count));
    });

    return Array.from(dateMap.entries())
      .map(([date, clicks]) => ({ date, clicks }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get grouped statistics using database aggregation
   */
  private async getGroupedStats(
    urlId: string,
    startDate: Date,
    endDate: Date,
    field: string,
  ): Promise<{ name: string; clicks: number; percentage: number }[]> {
    // Use parameterized column name safely
    const columnMap: Record<string, string> = {
      country: 'country',
      region: 'region',
      city: 'city',
      browser: 'browser',
      os: 'os',
      device: 'device',
      referer: 'referer',
      utmSource: '"utmSource"',
      utmMedium: '"utmMedium"',
      utmCampaign: '"utmCampaign"',
    };

    const column = columnMap[field];
    if (!column) {
      return [];
    }

    // Get total count for percentage calculation
    const totalResult = await this.prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*)::bigint as count
      FROM "clicks"
      WHERE "urlId" = ${urlId}
        AND "isBot" = false
        AND "createdAt" >= ${startDate}
        AND "createdAt" <= ${endDate}
    `;
    const total = Number(totalResult[0]?.count || 0);

    // Get grouped counts - use raw SQL with dynamic column
    const rawStats = await this.prisma.$queryRawUnsafe<{ name: string; count: bigint }[]>(`
      SELECT COALESCE(${column}, 'Unknown') as name, COUNT(*)::bigint as count
      FROM "clicks"
      WHERE "urlId" = $1
        AND "isBot" = false
        AND "createdAt" >= $2
        AND "createdAt" <= $3
      GROUP BY ${column}
      ORDER BY count DESC
      LIMIT 10
    `, urlId, startDate, endDate);

    return rawStats.map((row) => ({
      name: row.name || 'Unknown',
      clicks: Number(row.count),
      percentage: total > 0 ? Math.round((Number(row.count) / total) * 1000) / 10 : 0,
    }));
  }

  /**
   * Get analytics data for all user URLs
   * Uses hybrid approach: in-memory processing for small datasets,
   * database aggregation for large datasets to prevent memory exhaustion
   */
  async getUserAnalytics(
    user: User,
    queryDto: AnalyticsQueryDto,
  ): Promise<AnalyticsResponseDto> {
    // Calculate date range
    const { startDate, endDate } = this.calculateDateRange(queryDto);

    // Check click count to decide processing strategy
    const clickCount = await this.prisma.click.count({
      where: {
        url: { userId: user.id },
        isBot: false,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Use database aggregation for large datasets to prevent memory exhaustion
    if (clickCount > ANALYTICS_CONFIG.AGGREGATION_THRESHOLD) {
      return this.getUserAnalyticsWithAggregation(user.id, startDate, endDate);
    }

    // Use in-memory processing for small datasets (faster)
    const allClicks = await this.prisma.click.findMany({
      where: {
        url: { userId: user.id },
        isBot: false,
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
        isBot: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: ANALYTICS_CONFIG.MAX_IN_MEMORY_CLICKS,
    });

    const clicks = allClicks;

    // Calculate statistics (same logic as single URL)
    const overview = await this.calculateUserOverview(user.id, clicks, startDate, endDate);
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
   * Get user analytics using database aggregation (for large datasets)
   */
  private async getUserAnalyticsWithAggregation(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<AnalyticsResponseDto> {
    // Execute all aggregation queries in parallel
    const [
      overviewData,
      timeSeriesData,
      countryStats,
      regionStats,
      cityStats,
      browserStats,
      osStats,
      deviceStats,
      refererStats,
      utmSourceStats,
      utmMediumStats,
      utmCampaignStats,
    ] = await Promise.all([
      this.getUserOverviewWithAggregation(userId, startDate, endDate),
      this.getUserTimeSeriesWithAggregation(userId, startDate, endDate),
      this.getUserGroupedStats(userId, startDate, endDate, 'country'),
      this.getUserGroupedStats(userId, startDate, endDate, 'region'),
      this.getUserGroupedStats(userId, startDate, endDate, 'city'),
      this.getUserGroupedStats(userId, startDate, endDate, 'browser'),
      this.getUserGroupedStats(userId, startDate, endDate, 'os'),
      this.getUserGroupedStats(userId, startDate, endDate, 'device'),
      this.getUserGroupedStats(userId, startDate, endDate, 'referer'),
      this.getUserGroupedStats(userId, startDate, endDate, 'utmSource'),
      this.getUserGroupedStats(userId, startDate, endDate, 'utmMedium'),
      this.getUserGroupedStats(userId, startDate, endDate, 'utmCampaign'),
    ]);

    return {
      overview: overviewData,
      timeSeries: timeSeriesData,
      countries: countryStats as GeoLocationStat[],
      regions: regionStats as GeoLocationStat[],
      cities: cityStats as GeoLocationStat[],
      browsers: browserStats as DeviceStat[],
      operatingSystems: osStats as DeviceStat[],
      devices: deviceStats as DeviceStat[],
      referers: refererStats.map((s) => ({ referer: s.name, clicks: s.clicks, percentage: s.percentage })) as RefererStat[],
      utmSources: utmSourceStats.map((s) => ({ value: s.name, clicks: s.clicks, percentage: s.percentage })) as UtmStat[],
      utmMediums: utmMediumStats.map((s) => ({ value: s.name, clicks: s.clicks, percentage: s.percentage })) as UtmStat[],
      utmCampaigns: utmCampaignStats.map((s) => ({ value: s.name, clicks: s.clicks, percentage: s.percentage })) as UtmStat[],
    };
  }

  /**
   * Get user overview statistics using database aggregation
   */
  private async getUserOverviewWithAggregation(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<OverviewStats> {
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const previousStartDate = new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime()));

    const [currentStats, previousStats] = await Promise.all([
      this.prisma.$queryRaw<[{ total: bigint; unique_ips: bigint }]>`
        SELECT COUNT(*)::bigint as total, COUNT(DISTINCT c.ip)::bigint as unique_ips
        FROM "clicks" c
        INNER JOIN "urls" u ON c."urlId" = u."id"
        WHERE u."userId" = ${userId}
          AND c."isBot" = false
          AND c."createdAt" >= ${startDate}
          AND c."createdAt" <= ${endDate}
      `,
      this.prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*)::bigint as count
        FROM "clicks" c
        INNER JOIN "urls" u ON c."urlId" = u."id"
        WHERE u."userId" = ${userId}
          AND c."isBot" = false
          AND c."createdAt" >= ${previousStartDate}
          AND c."createdAt" < ${startDate}
      `,
    ]);

    const totalClicks = Number(currentStats[0]?.total || 0);
    const uniqueVisitors = Number(currentStats[0]?.unique_ips || 0);
    const previousClicks = Number(previousStats[0]?.count || 0);
    const averageClicksPerDay = days > 0 ? Math.round((totalClicks / days) * 10) / 10 : 0;
    const growthRate = previousClicks > 0
      ? Math.round(((totalClicks - previousClicks) / previousClicks) * 1000) / 10
      : totalClicks > 0 ? 100 : 0;

    return { totalClicks, uniqueVisitors, averageClicksPerDay, growthRate };
  }

  /**
   * Get user time series data using database aggregation
   */
  private async getUserTimeSeriesWithAggregation(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<TimeSeriesDataPoint[]> {
    const rawData = await this.prisma.$queryRaw<{ date: Date; count: bigint }[]>`
      SELECT DATE(c."createdAt") as date, COUNT(*)::bigint as count
      FROM "clicks" c
      INNER JOIN "urls" u ON c."urlId" = u."id"
      WHERE u."userId" = ${userId}
        AND c."isBot" = false
        AND c."createdAt" >= ${startDate}
        AND c."createdAt" <= ${endDate}
      GROUP BY DATE(c."createdAt")
      ORDER BY date
    `;

    const dateMap = new Map<string, number>();
    const current = new Date(startDate);
    while (current <= endDate) {
      dateMap.set(this.formatDateToString(current), 0);
      current.setDate(current.getDate() + 1);
    }

    rawData.forEach((row) => {
      const dateStr = row.date instanceof Date
        ? this.formatDateToString(row.date)
        : String(row.date).split('T')[0];
      dateMap.set(dateStr, Number(row.count));
    });

    return Array.from(dateMap.entries())
      .map(([date, clicks]) => ({ date, clicks }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get user grouped statistics using database aggregation
   */
  private async getUserGroupedStats(
    userId: string,
    startDate: Date,
    endDate: Date,
    field: string,
  ): Promise<{ name: string; clicks: number; percentage: number }[]> {
    const columnMap: Record<string, string> = {
      country: 'country',
      region: 'region',
      city: 'city',
      browser: 'browser',
      os: 'os',
      device: 'device',
      referer: 'referer',
      utmSource: '"utmSource"',
      utmMedium: '"utmMedium"',
      utmCampaign: '"utmCampaign"',
    };

    const column = columnMap[field];
    if (!column) return [];

    const totalResult = await this.prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*)::bigint as count
      FROM "clicks" c
      INNER JOIN "urls" u ON c."urlId" = u."id"
      WHERE u."userId" = ${userId}
        AND c."isBot" = false
        AND c."createdAt" >= ${startDate}
        AND c."createdAt" <= ${endDate}
    `;
    const total = Number(totalResult[0]?.count || 0);

    const rawStats = await this.prisma.$queryRawUnsafe<{ name: string; count: bigint }[]>(`
      SELECT COALESCE(c.${column}, 'Unknown') as name, COUNT(*)::bigint as count
      FROM "clicks" c
      INNER JOIN "urls" u ON c."urlId" = u."id"
      WHERE u."userId" = $1
        AND c."isBot" = false
        AND c."createdAt" >= $2
        AND c."createdAt" <= $3
      GROUP BY c.${column}
      ORDER BY count DESC
      LIMIT 10
    `, userId, startDate, endDate);

    return rawStats.map((row) => ({
      name: row.name || 'Unknown',
      clicks: Number(row.count),
      percentage: total > 0 ? Math.round((Number(row.count) / total) * 1000) / 10 : 0,
    }));
  }

  /**
   * Calculate date range
   * Returns dates with proper time boundaries:
   * - startDate: Start of the day (00:00:00)
   * - endDate: End of current day or specified day (23:59:59.999)
   */
  private calculateDateRange(queryDto: AnalyticsQueryDto): {
    startDate: Date;
    endDate: Date;
  } {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    if (queryDto.timeRange === TimeRange.CUSTOM) {
      if (!queryDto.startDate || !queryDto.endDate) {
        throw new Error('Custom time range requires both startDate and endDate');
      }
      startDate = new Date(queryDto.startDate);
      startDate.setHours(0, 0, 0, 0); // Start of day

      endDate = new Date(queryDto.endDate);
      endDate.setHours(23, 59, 59, 999); // End of day
    } else {
      // Set end date to end of today
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);

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
        case TimeRange.LAST_365_DAYS:
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      // Set start date to beginning of that day
      startDate.setHours(0, 0, 0, 0);
    }

    return { startDate, endDate };
  }

  /**
   * Calculate overview statistics (single URL)
   * Optimized: Use aggregation query to get current and previous period counts in one query
   */
  private async calculateOverview(
    urlId: string,
    clicks: ClickDataForAnalytics[],
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
    clicks: ClickDataForAnalytics[],
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
  /**
   * Convert Date to YYYY-MM-DD format using server timezone
   * This ensures consistent date formatting across all operations
   */
  private formatDateToString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private calculateTimeSeries(
    clicks: ClickDataForAnalytics[],
    startDate: Date,
    endDate: Date,
  ): TimeSeriesDataPoint[] {
    const dateMap = new Map<string, number>();

    // Initialize all dates to 0
    // Important: Use server local time, not UTC, to maintain consistency with database records
    const current = new Date(startDate);
    while (current <= endDate) {
      const dateStr = this.formatDateToString(current);
      dateMap.set(dateStr, 0);
      current.setDate(current.getDate() + 1);
    }

    // Count daily clicks
    clicks.forEach((click) => {
      // Convert createdAt to local date string consistently
      const clickDate = new Date(click.createdAt);
      const dateStr = this.formatDateToString(clickDate);
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
    clicks: ClickDataForAnalytics[],
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
    clicks: ClickDataForAnalytics[],
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
  private calculateRefererStats(clicks: ClickDataForAnalytics[]): RefererStat[] {
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
    clicks: ClickDataForAnalytics[],
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
    user: User,
    limit: number = 20,
    includeBots: boolean = false,
  ): Promise<RecentClicksResponseDto> {
    // Verify URL exists and user has access (admins can access all URLs)
    await this.checkUrlOwnership(urlId, user);

    // Build where condition
    const whereCondition: Prisma.ClickWhereInput = { urlId };
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
        variantId: true,
        routingRuleId: true,
        ip: true,
        browser: true,
        os: true,
        device: true,
        country: true,
        region: true,
        city: true,
        referer: true,
        utmSource: true,
        utmMedium: true,
        utmCampaign: true,
        utmTerm: true,
        utmContent: true,
        isBot: true,
        botName: true,
        createdAt: true,
      },
    });

    return {
      clicks: clicks.map((click) => ({
        id: click.id,
        variantId: click.variantId || undefined,
        routingRuleId: click.routingRuleId || undefined,
        ip: click.ip || undefined,
        browser: click.browser || undefined,
        os: click.os || undefined,
        device: click.device || undefined,
        country: click.country || undefined,
        region: click.region || undefined,
        city: click.city || undefined,
        referer: click.referer || undefined,
        utmSource: click.utmSource || undefined,
        utmMedium: click.utmMedium || undefined,
        utmCampaign: click.utmCampaign || undefined,
        utmTerm: click.utmTerm || undefined,
        utmContent: click.utmContent || undefined,
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
    user: User,
    queryDto: AnalyticsQueryDto,
  ): Promise<{
    totalBotClicks: number;
    botTypes: { botName: string; clicks: number; percentage: number }[];
  }> {
    // Verify URL exists and user has access (admins can access all URLs)
    await this.checkUrlOwnership(urlId, user);

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
    user: User,
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
      where: { userId: user.id },
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
   * Optimized to use database aggregation instead of loading all clicks into memory
   */
  async getUserAbTestAnalytics(
    user: User,
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
        userId: user.id,
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

    // Step 1: Use database aggregation to count clicks by urlId and variantId
    // This is much more efficient than loading all clicks into memory
    const [clicksByVariant, totalClicksResult, controlClicksResult] = await Promise.all([
      // Get click counts grouped by urlId and variantId
      this.prisma.click.groupBy({
        by: ['urlId', 'variantId'],
        where: {
          urlId: { in: urlIds },
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          variantId: { not: null }, // Only variant clicks
        },
        _count: {
          id: true,
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
      // Get control group clicks count (variantId is null)
      this.prisma.click.count({
        where: {
          urlId: { in: urlIds },
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          variantId: null,
        },
      }),
    ]);

    const totalTestClicks = totalClicksResult;
    const controlGroupClicks = controlClicksResult;
    const variantClicks = totalTestClicks - controlGroupClicks;

    const controlGroupPercentage =
      totalTestClicks > 0
        ? Math.round((controlGroupClicks / totalTestClicks) * 1000) / 10
        : 0;
    const variantPercentage =
      totalTestClicks > 0
        ? Math.round((variantClicks / totalTestClicks) * 1000) / 10
        : 0;

    // Step 2: Get total clicks per URL for click-through rate calculation
    const clicksByUrl = await this.prisma.click.groupBy({
      by: ['urlId'],
      where: {
        urlId: { in: urlIds },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: {
        id: true,
      },
    });

    // Create URL clicks map for quick lookup
    const urlClicksMap = new Map(clicksByUrl.map((c) => [c.urlId, c._count.id]));

    // Step 3: Build variant info lookup maps
    const urlMap = new Map(abTestUrls.map((url) => [url.id, url]));
    const variantMap = new Map<string, { name: string; urlSlug: string }>();

    abTestUrls.forEach((url) => {
      url.variants.forEach((variant) => {
        variantMap.set(variant.id, { name: variant.name, urlSlug: url.slug });
      });
    });

    // Step 4: Calculate top performing variants using aggregated data
    const topPerformingVariants = clicksByVariant
      .filter((c) => c.variantId !== null)
      .map((clickData) => {
        const variantInfo = variantMap.get(clickData.variantId!);
        const totalUrlClicks = urlClicksMap.get(clickData.urlId) || 0;

        if (!variantInfo) return null;

        return {
          urlSlug: variantInfo.urlSlug,
          variantName: variantInfo.name,
          clicks: clickData._count.id,
          clickThroughRate:
            totalUrlClicks > 0
              ? Math.round((clickData._count.id / totalUrlClicks) * 1000) / 10
              : 0,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
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

  /**
   * Get export data for a single URL
   */
  async getExportData(
    urlId: string,
    user: User,
    queryDto: AnalyticsQueryDto,
  ): Promise<{
    analytics: AnalyticsResponseDto;
    clicks: RecentClickDto[];
    urlSlug: string;
    dateRange: { startDate: string; endDate: string };
  }> {
    // Check ownership
    const url = await this.prisma.url.findUnique({
      where: { id: urlId },
      select: { id: true, userId: true, slug: true },
    });

    if (!url) {
      throw new NotFoundException('URL not found');
    }

    if (url.userId !== user.id && user.role !== 'ADMIN') {
      throw new ForbiddenException('You do not have permission to export this URL');
    }

    // Get analytics data
    const analytics = await this.getUrlAnalytics(urlId, user, queryDto);

    // Get clicks within date range using cursor-based pagination
    // to avoid loading too many records at once
    const { startDate, endDate } = this.calculateDateRange(queryDto);
    const clicks = await this.fetchClicksInBatches(urlId, startDate, endDate);

    const recentClicks: RecentClickDto[] = clicks.map((click) => ({
      id: click.id,
      variantId: click.variantId ?? undefined,
      routingRuleId: click.routingRuleId ?? undefined,
      ip: click.ip ?? undefined,
      browser: click.browser ?? undefined,
      os: click.os ?? undefined,
      device: click.device ?? undefined,
      country: click.country ?? undefined,
      region: click.region ?? undefined,
      city: click.city ?? undefined,
      referer: click.referer ?? undefined,
      utmSource: click.utmSource ?? undefined,
      utmMedium: click.utmMedium ?? undefined,
      utmCampaign: click.utmCampaign ?? undefined,
      utmTerm: click.utmTerm ?? undefined,
      utmContent: click.utmContent ?? undefined,
      isBot: click.isBot,
      botName: click.botName ?? undefined,
      createdAt: click.createdAt,
    }));

    return {
      analytics,
      clicks: recentClicks,
      urlSlug: url.slug,
      dateRange: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      },
    };
  }

  /**
   * Get export data for all user URLs
   */
  async getUserExportData(
    user: User,
    queryDto: AnalyticsQueryDto,
  ): Promise<{
    analytics: AnalyticsResponseDto;
    dateRange: { startDate: string; endDate: string };
  }> {
    const analytics = await this.getUserAnalytics(user, queryDto);
    const { startDate, endDate } = this.calculateDateRange(queryDto);

    return {
      analytics,
      dateRange: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      },
    };
  }

  /**
   * Get routing analytics for a URL
   * Shows statistics for each routing rule including match counts, trends, and distributions
   * Uses database aggregations to avoid loading all clicks into memory
   */
  async getRoutingAnalytics(
    urlId: string,
    user: User,
    queryDto: AnalyticsQueryDto,
  ): Promise<RoutingAnalyticsResponseDto> {
    // Check ownership
    await this.checkUrlOwnership(urlId, user);

    // Calculate date range
    const { startDate, endDate } = this.calculateDateRange(queryDto);

    // Get URL with routing rules
    const url = await this.prisma.url.findUnique({
      where: { id: urlId },
      include: {
        routingRules: {
          orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
        },
      },
    });

    if (!url) {
      throw new NotFoundException(ERROR_MESSAGES.URL_NOT_FOUND);
    }

    // Build rule name map for later use
    const ruleNameMap = new Map(url.routingRules.map((r) => [r.id, r.name]));

    // Use database aggregations instead of loading all clicks
    const whereClause = {
      urlId,
      createdAt: { gte: startDate, lte: endDate },
      isBot: false,
    };

    // Execute all aggregation queries in parallel
    const [
      totalClicksCount,
      totalMatchesCount,
      ruleStats,
      timeSeriesStats,
      geoStats,
      deviceStats,
    ] = await Promise.all([
      // Total clicks count
      this.prisma.click.count({ where: whereClause }),

      // Total matches count (clicks with routingRuleId)
      this.prisma.click.count({
        where: { ...whereClause, routingRuleId: { not: null } },
      }),

      // Rule match counts using groupBy
      this.prisma.click.groupBy({
        by: ['routingRuleId'],
        where: { ...whereClause, routingRuleId: { not: null } },
        _count: { id: true },
      }),

      // Time series by rule using raw SQL with DATE() for proper date grouping
      this.prisma.$queryRaw<{ routingRuleId: string; date: Date; count: bigint }[]>`
        SELECT "routingRuleId", DATE("createdAt") as date, COUNT(*)::bigint as count
        FROM "clicks"
        WHERE "urlId" = ${urlId}
          AND "createdAt" >= ${startDate}
          AND "createdAt" <= ${endDate}
          AND "isBot" = false
          AND "routingRuleId" IS NOT NULL
        GROUP BY "routingRuleId", DATE("createdAt")
        ORDER BY date
      `,

      // Geographic distribution by rule
      this.prisma.click.groupBy({
        by: ['routingRuleId', 'country'],
        where: { ...whereClause, routingRuleId: { not: null }, country: { not: null } },
        _count: { id: true },
      }),

      // Device distribution by rule
      this.prisma.click.groupBy({
        by: ['routingRuleId', 'device'],
        where: { ...whereClause, routingRuleId: { not: null }, device: { not: null } },
        _count: { id: true },
      }),
    ]);

    const totalClicks = totalClicksCount;
    const totalMatches = totalMatchesCount;
    const matchRate = totalClicks > 0
      ? Math.round((totalMatches / totalClicks) * 1000) / 10
      : 0;

    // Build rule statistics map for quick lookup
    const ruleMatchCounts = new Map(
      ruleStats.map((s) => [s.routingRuleId, s._count.id]),
    );

    // Build rule statistics
    const rules: RoutingRuleStat[] = url.routingRules.map((rule) => {
      const matchCount = ruleMatchCounts.get(rule.id) || 0;
      const matchPercentage = totalMatches > 0
        ? Math.round((matchCount / totalMatches) * 1000) / 10
        : 0;

      return {
        ruleId: rule.id,
        ruleName: rule.name,
        targetUrl: rule.targetUrl,
        matchCount,
        matchPercentage,
        isActive: rule.isActive,
      };
    });

    // Build time series data - already grouped by date from raw SQL query
    const timeSeries: RoutingRuleTimeSeriesDataPoint[] = timeSeriesStats.map((stat) => ({
      date: stat.date instanceof Date
        ? stat.date.toISOString().split('T')[0]
        : String(stat.date).split('T')[0],
      ruleId: stat.routingRuleId,
      ruleName: ruleNameMap.get(stat.routingRuleId) || 'Unknown',
      matches: Number(stat.count),
    }));
    timeSeries.sort((a, b) => a.date.localeCompare(b.date));

    // Build geographic distribution
    const geoDistribution: RoutingRuleGeoStat[] = [];
    geoStats.forEach((stat) => {
      if (stat.routingRuleId && stat.country) {
        const ruleTotal = ruleMatchCounts.get(stat.routingRuleId) || 0;
        geoDistribution.push({
          ruleId: stat.routingRuleId,
          ruleName: ruleNameMap.get(stat.routingRuleId) || 'Unknown',
          country: stat.country,
          matches: stat._count.id,
          percentage: ruleTotal > 0
            ? Math.round((stat._count.id / ruleTotal) * 1000) / 10
            : 0,
        });
      }
    });

    // Build device distribution
    const deviceDistribution: RoutingRuleDeviceStat[] = [];
    deviceStats.forEach((stat) => {
      if (stat.routingRuleId && stat.device) {
        const ruleTotal = ruleMatchCounts.get(stat.routingRuleId) || 0;
        deviceDistribution.push({
          ruleId: stat.routingRuleId,
          ruleName: ruleNameMap.get(stat.routingRuleId) || 'Unknown',
          device: stat.device,
          matches: stat._count.id,
          percentage: ruleTotal > 0
            ? Math.round((stat._count.id / ruleTotal) * 1000) / 10
            : 0,
        });
      }
    });

    return {
      urlId,
      isSmartRouting: url.isSmartRouting,
      totalMatches,
      totalClicks,
      matchRate,
      rules,
      timeSeries,
      geoDistribution,
      deviceDistribution,
    };
  }

  /**
   * Fetch clicks in batches using cursor-based pagination
   * to reduce memory usage for large exports
   */
  private async fetchClicksInBatches(
    urlId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<
    {
      id: string;
      variantId: string | null;
      routingRuleId: string | null;
      ip: string | null;
      browser: string | null;
      os: string | null;
      device: string | null;
      country: string | null;
      region: string | null;
      city: string | null;
      referer: string | null;
      utmSource: string | null;
      utmMedium: string | null;
      utmCampaign: string | null;
      utmTerm: string | null;
      utmContent: string | null;
      isBot: boolean;
      botName: string | null;
      createdAt: Date;
    }[]
  > {
    const BATCH_SIZE = ANALYTICS_CONFIG.EXPORT_BATCH_SIZE;
    const MAX_RECORDS = ANALYTICS_CONFIG.EXPORT_MAX_RECORDS;
    type ClickRecord = Awaited<ReturnType<typeof this.prisma.click.findMany>>[number];
    const allClicks: ClickRecord[] = [];
    let cursor: string | undefined = undefined;

    while (allClicks.length < MAX_RECORDS) {
      const batch: ClickRecord[] = await this.prisma.click.findMany({
        where: {
          urlId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { createdAt: 'desc' },
        take: BATCH_SIZE,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      });

      if (batch.length === 0) {
        break;
      }

      allClicks.push(...batch);
      cursor = batch[batch.length - 1].id;

      if (batch.length < BATCH_SIZE) {
        break;
      }
    }

    return allClicks;
  }

  /**
   * Get top performing URLs by click count within a time range
   * Optimized to use database aggregation instead of loading all clicks into memory
   */
  async getTopPerformingUrls(
    user: User,
    queryDto: AnalyticsQueryDto,
    limit: number = 5,
  ): Promise<
    Array<{
      id: string;
      slug: string;
      title: string | null;
      originalUrl: string;
      clickCount: number;
      status: string;
      createdAt: Date;
    }>
  > {
    const { startDate, endDate } = this.calculateDateRange(queryDto);

    // Build user filter for admin/non-admin access
    const isAdmin = user.role === UserRole.ADMIN;

    // Step 1: Get top URL IDs by click count using database aggregation
    // This is much more efficient than loading all clicks into memory
    const clickCounts = await this.prisma.click.groupBy({
      by: ['urlId'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        // Filter by user's URLs if not admin
        ...(isAdmin
          ? {}
          : {
              url: {
                userId: user.id,
              },
            }),
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: limit,
    });

    // If no clicks found, return empty array
    if (clickCounts.length === 0) {
      return [];
    }

    // Step 2: Get URL details for the top URLs
    const urlIds = clickCounts.map((c) => c.urlId);
    const urls = await this.prisma.url.findMany({
      where: {
        id: { in: urlIds },
      },
      select: {
        id: true,
        slug: true,
        title: true,
        originalUrl: true,
        status: true,
        createdAt: true,
      },
    });

    // Step 3: Create a map for quick lookup
    const urlMap = new Map(urls.map((url) => [url.id, url]));

    // Step 4: Merge click counts with URL details, maintaining sort order
    const result = clickCounts
      .map((clickCount) => {
        const url = urlMap.get(clickCount.urlId);
        if (!url) return null;

        return {
          id: url.id,
          slug: url.slug,
          title: url.title,
          originalUrl: url.originalUrl,
          clickCount: clickCount._count.id,
          status: url.status,
          createdAt: url.createdAt,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    return result;
  }
}
