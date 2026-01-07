import { Injectable, Logger } from '@nestjs/common';
import { parseUserAgent } from '@/common/utils/user-agent-parser';
import { getGeoLocation } from '@/common/utils/geo-location';
import { isBot, getBotName } from '@/common/utils/bot-detector';

/**
 * Raw click data before enrichment
 */
export interface RawClickData {
  ip?: string;
  userAgent?: string;
  referer?: string;
  language?: string;
  timezone?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
}

/**
 * Enriched click data with parsed information
 */
export interface EnrichedClickData extends RawClickData {
  // Device & Browser
  browser?: string;
  os?: string;
  device?: string;
  // Geo Location
  country?: string;
  region?: string;
  city?: string;
  // Bot Detection
  isBot: boolean;
  botName?: string | null;
}

/**
 * Service for enriching click data with parsed user agent, geo location, and bot detection
 * Centralizes the data enrichment logic to avoid duplication across services
 */
@Injectable()
export class ClickDataEnricherService {
  private readonly logger = new Logger(ClickDataEnricherService.name);

  /**
   * Enrich raw click data with parsed information
   * @param rawData - Raw click data from request
   * @returns Enriched click data with browser, OS, device, geo, and bot info
   */
  enrich(rawData: RawClickData): EnrichedClickData {
    const enriched: EnrichedClickData = {
      ...rawData,
      isBot: false,
    };

    // Parse User Agent
    if (rawData.userAgent) {
      const parsed = parseUserAgent(rawData.userAgent);
      enriched.browser = parsed.browser;
      enriched.os = parsed.os;
      enriched.device = parsed.deviceType; // Use deviceType (mobile/tablet/desktop) not device model

      // Bot detection
      enriched.isBot = isBot(rawData.userAgent);
      if (enriched.isBot) {
        enriched.botName = getBotName(rawData.userAgent);
      }
    }

    // Parse Geo Location
    if (rawData.ip) {
      const geo = getGeoLocation(rawData.ip, this.logger);
      if (geo) {
        enriched.country = geo.country;
        enriched.region = geo.region;
        enriched.city = geo.city;
      }
    }

    return enriched;
  }
}
