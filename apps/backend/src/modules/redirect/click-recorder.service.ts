import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '@/common/database/prisma.service';
import { CacheService } from '@/common/cache/cache.service';
import { LoggerService } from '@/common/logger/logger.service';
import { UrlService } from '@/modules/url/url.service';
import { parseUserAgent } from '@/common/utils/user-agent-parser';
import { getGeoLocation } from '@/common/utils/geo-location';
import { isBot, getBotName } from '@/common/utils/bot-detector';

interface ClickRecordedEvent {
  urlId: string;
  variantId?: string | null;
  clickData: {
    ip?: string;
    userAgent?: string;
    referer?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmTerm?: string;
    utmContent?: string;
  };
}

/**
 * Asynchronous click recording service
 * Uses event-driven architecture to handle click recording without blocking redirect responses
 */
@Injectable()
export class ClickRecorderService {
  private readonly ANALYTICS_CACHE_PREFIX = 'analytics:';

  constructor(
    private prisma: PrismaService,
    private urlService: UrlService,
    private cacheService: CacheService,
    private loggerService: LoggerService,
  ) {}

  /**
   * Handle URL clicked event (asynchronous execution)
   */
  @OnEvent('url.clicked', { async: true })
  async handleClickRecorded(payload: ClickRecordedEvent): Promise<void> {
    try {
      const { urlId, variantId, clickData } = payload;

      // Detect if this is a bot
      const { userAgent } = clickData;
      const botDetected = isBot(userAgent);

      // Execute database operations
      // Only increment click count for real users (not bots)
      if (botDetected) {
        // Bot detected - only record the click, don't increment counter
        await this.recordClick(urlId, variantId, clickData);
      } else {
        // Real user - record click and increment counters in parallel
        const operations = [
          this.recordClick(urlId, variantId, clickData),
          this.urlService.incrementClickCount(urlId),
        ];

        // If A/B Testing variant is selected, also increment variant click count
        if (variantId) {
          operations.push(this.incrementVariantClickCount(variantId));
        }

        await Promise.all(operations);
      }

      // Clear analytics cache for this URL to ensure fresh data on next query
      await this.clearAnalyticsCache(urlId);
    } catch (error: unknown) {
      // Log error but don't affect user experience
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.loggerService.error(
        `Failed to record click: ${errorMessage}`,
        errorStack,
        'ClickRecorderService',
      );
    }
  }

  /**
   * Record click data to database
   */
  private async recordClick(
    urlId: string,
    variantId: string | null | undefined,
    clickData: ClickRecordedEvent['clickData'],
  ): Promise<void> {
    const { ip, userAgent, referer, ...utmParams } = clickData;

    // Parse User Agent
    let browser: string | undefined;
    let os: string | undefined;
    let device: string | undefined;

    if (userAgent) {
      const parsed = parseUserAgent(userAgent);
      browser = parsed.browser;
      os = parsed.os;
      device = parsed.device;
    }

    // Detect Bot
    const botDetected = isBot(userAgent);
    const botName = botDetected ? getBotName(userAgent) : null;

    if (botDetected) {
      this.loggerService.debug(
        `Bot detected: ${botName} - UserAgent: ${userAgent?.substring(0, 50)}...`,
        'ClickRecorderService',
      );
    }

    // Parse geo-location
    let country: string | undefined;
    let region: string | undefined;
    let city: string | undefined;

    if (ip) {
      const geo = getGeoLocation(ip, this.loggerService);
      if (geo) {
        country = geo.country;
        region = geo.region;
        city = geo.city;
      }
    }

    // Write to database
    await this.prisma.click.create({
      data: {
        urlId,
        variantId: variantId || null,
        ip,
        userAgent,
        referer,
        browser,
        os,
        device,
        isBot: botDetected,
        botName,
        country,
        region,
        city,
        ...utmParams,
      },
    });
  }

  /**
   * Increment variant click count (for A/B Testing)
   */
  private async incrementVariantClickCount(variantId: string): Promise<void> {
    await this.prisma.urlVariant.update({
      where: { id: variantId },
      data: {
        clickCount: {
          increment: 1,
        },
      },
    });
  }

  /**
   * Clear analytics cache for a URL
   * This ensures fresh data is retrieved when analytics is queried next
   */
  private async clearAnalyticsCache(urlId: string): Promise<void> {
    try {
      // Get the URL to find the user ID
      const url = await this.prisma.url.findUnique({
        where: { id: urlId },
        select: { userId: true },
      });

      if (!url) return;

      // Clear cache keys for this URL's analytics using pattern matching
      // Format: analytics:{urlId}:{timeRange}:*
      // The * matches any startDate:endDate combination
      const urlPattern = `${this.ANALYTICS_CACHE_PREFIX}${urlId}:*`;
      const userPattern = `${this.ANALYTICS_CACHE_PREFIX}${url.userId}:*`;

      // Use delPattern to clear all matching keys
      await this.cacheService.delPattern(urlPattern);
      await this.cacheService.delPattern(userPattern);

      this.loggerService.debug(
        `Cleared analytics cache for URL: ${urlId} and user: ${url.userId}`,
        'ClickRecorderService',
      );
    } catch (error: unknown) {
      // Log but don't fail - cache clearing is non-critical
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.loggerService.debug(
        `Failed to clear analytics cache: ${errorMessage}`,
        'ClickRecorderService',
      );
    }
  }
}
