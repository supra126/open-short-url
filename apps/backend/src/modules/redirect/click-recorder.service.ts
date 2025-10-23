import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '@/common/database/prisma.service';
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
  private readonly logger = new Logger(ClickRecorderService.name);

  constructor(
    private prisma: PrismaService,
    private urlService: UrlService,
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
    } catch (error) {
      // Log error but don't affect user experience
      this.logger.error(
        `Failed to record click: ${error.message}`,
        error.stack,
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
      this.logger.debug(
        `Bot detected: ${botName} - UserAgent: ${userAgent?.substring(0, 50)}...`,
      );
    }

    // Parse geo-location
    let country: string | undefined;
    let region: string | undefined;
    let city: string | undefined;

    if (ip) {
      const geo = getGeoLocation(ip);
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
}
