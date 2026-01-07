import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '@/common/database/prisma.service';
import { CacheService } from '@/common/cache/cache.service';
import { LoggerService } from '@/common/logger/logger.service';
import { ClickDataEnricherService } from '@/common/services/click-data-enricher.service';
import { UrlService } from '@/modules/url/url.service';

interface ClickRecordedEvent {
  urlId: string;
  variantId?: string | null;
  routingRuleId?: string | null;
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
export class ClickRecorderService implements OnModuleDestroy {
  private readonly ANALYTICS_CACHE_PREFIX = 'analytics:';

  // Debounced cache clearing buffer
  private readonly cacheClearBuffer = new Set<string>();
  private readonly userIdBuffer = new Set<string>();
  private readonly CACHE_CLEAR_DELAY_MS = 5000; // 5 seconds
  private cacheClearTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private prisma: PrismaService,
    private urlService: UrlService,
    private cacheService: CacheService,
    private loggerService: LoggerService,
    private clickDataEnricher: ClickDataEnricherService,
  ) {}

  /**
   * Flush remaining cache clears on shutdown
   */
  async onModuleDestroy() {
    if (this.cacheClearTimeout) {
      clearTimeout(this.cacheClearTimeout);
      this.cacheClearTimeout = null;
    }
    await this.flushCacheClearBuffer();
  }

  /**
   * Handle URL clicked event (asynchronous execution)
   */
  @OnEvent('url.clicked', { async: true })
  async handleClickRecorded(payload: ClickRecordedEvent): Promise<void> {
    try {
      const { urlId, variantId, routingRuleId, clickData } = payload;

      // Enrich click data once and use for both bot detection and recording
      const enriched = this.clickDataEnricher.enrich({
        ip: clickData.ip,
        userAgent: clickData.userAgent,
        referer: clickData.referer,
      });

      // Execute database operations
      // Only increment click count for real users (not bots)
      if (enriched.isBot) {
        // Bot detected - only record the click, don't increment counter
        await this.recordClickWithEnrichedData(urlId, variantId, routingRuleId, clickData, enriched);
      } else {
        // Real user - record click and increment counters in parallel
        const operations: Promise<void>[] = [
          this.recordClickWithEnrichedData(urlId, variantId, routingRuleId, clickData, enriched),
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
   * Record click data to database with pre-enriched data
   */
  private async recordClickWithEnrichedData(
    urlId: string,
    variantId: string | null | undefined,
    routingRuleId: string | null | undefined,
    clickData: ClickRecordedEvent['clickData'],
    enriched: ReturnType<ClickDataEnricherService['enrich']>,
  ): Promise<void> {
    const { ip, userAgent, referer, ...utmParams } = clickData;

    if (enriched.isBot) {
      this.loggerService.debug(
        `Bot detected: ${enriched.botName} - UserAgent: ${userAgent?.substring(0, 50)}...`,
        'ClickRecorderService',
      );
    }

    // Write to database
    await this.prisma.click.create({
      data: {
        urlId,
        variantId: variantId || null,
        routingRuleId: routingRuleId || null,
        ip,
        userAgent,
        referer,
        browser: enriched.browser,
        os: enriched.os,
        device: enriched.device,
        isBot: enriched.isBot,
        botName: enriched.botName,
        country: enriched.country,
        region: enriched.region,
        city: enriched.city,
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
   * Schedule analytics cache clear for a URL (debounced)
   * This buffers multiple clears and executes them in a single batch
   */
  private async clearAnalyticsCache(urlId: string): Promise<void> {
    try {
      // Get the URL to find the user ID
      const url = await this.prisma.url.findUnique({
        where: { id: urlId },
        select: { userId: true },
      });

      if (!url) return;

      // Add to buffer instead of clearing immediately
      this.cacheClearBuffer.add(urlId);
      this.userIdBuffer.add(url.userId);

      // Schedule debounced flush
      this.scheduleCacheClearFlush();
    } catch (error: unknown) {
      // Log but don't fail - cache clearing is non-critical
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.loggerService.debug(
        `Failed to buffer analytics cache clear: ${errorMessage}`,
        'ClickRecorderService',
      );
    }
  }

  /**
   * Schedule a debounced cache clear flush
   */
  private scheduleCacheClearFlush(): void {
    // If already scheduled, let it run
    if (this.cacheClearTimeout) {
      return;
    }

    this.cacheClearTimeout = setTimeout(() => {
      this.cacheClearTimeout = null;
      this.flushCacheClearBuffer().catch((error) => {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.loggerService.debug(
          `Failed to flush cache clear buffer: ${errorMessage}`,
          'ClickRecorderService',
        );
      });
    }, this.CACHE_CLEAR_DELAY_MS);
  }

  /**
   * Flush buffered cache clears in a single batch
   */
  private async flushCacheClearBuffer(): Promise<void> {
    if (this.cacheClearBuffer.size === 0 && this.userIdBuffer.size === 0) {
      return;
    }

    // Copy and clear buffers
    const urlIds = Array.from(this.cacheClearBuffer);
    const userIds = Array.from(this.userIdBuffer);
    this.cacheClearBuffer.clear();
    this.userIdBuffer.clear();

    try {
      // Clear all URL patterns
      const clearPromises: Promise<void>[] = [];

      for (const urlId of urlIds) {
        const urlPattern = `${this.ANALYTICS_CACHE_PREFIX}${urlId}:*`;
        clearPromises.push(this.cacheService.delPattern(urlPattern));
      }

      // Clear all user patterns (deduplicated)
      for (const userId of userIds) {
        const userPattern = `${this.ANALYTICS_CACHE_PREFIX}${userId}:*`;
        clearPromises.push(this.cacheService.delPattern(userPattern));
      }

      await Promise.all(clearPromises);

      this.loggerService.debug(
        `Flushed analytics cache for ${urlIds.length} URLs and ${userIds.length} users`,
        'ClickRecorderService',
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.loggerService.debug(
        `Failed to clear analytics cache: ${errorMessage}`,
        'ClickRecorderService',
      );
    }
  }
}
