import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UrlService } from '@/modules/url/url.service';
import { RoutingService } from '@/modules/routing/routing.service';
import { RoutingEvaluatorService } from '@/modules/routing/routing-evaluator.service';
import { ClickDataEnricherService } from '@/common/services/click-data-enricher.service';
import { comparePassword } from '@/common/utils/password-hasher';
import { ERROR_MESSAGES } from '@/common/constants/errors';

interface RedirectInfo {
  originalUrl: string;
  requiresPassword: boolean;
}

interface ClickData {
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

interface UrlVariant {
  id: string;
  name: string;
  targetUrl: string;
  weight: number;
  isActive: boolean;
}

/**
 * URL record from database with optional relations
 */
interface UrlRecord {
  id: string;
  originalUrl: string;
  password: string | null;
  isAbTest: boolean;
  isSmartRouting: boolean;
  defaultUrl: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmTerm: string | null;
  utmContent: string | null;
  variants?: UrlVariant[];
}

@Injectable()
export class RedirectService {
  private readonly logger = new Logger(RedirectService.name);

  constructor(
    private eventEmitter: EventEmitter2,
    private urlService: UrlService,
    private routingService: RoutingService,
    private routingEvaluator: RoutingEvaluatorService,
    private clickDataEnricher: ClickDataEnricherService,
  ) {}

  /**
   * Get redirect information
   */
  async getRedirectInfo(slug: string): Promise<RedirectInfo> {
    const url = (await this.urlService.findBySlug(slug)) as UrlRecord;

    return {
      originalUrl: url.originalUrl,
      requiresPassword: !!url.password,
    };
  }

  /**
   * Select a variant based on weighted random selection
   * @param variants Active variants with weights
   * @returns Selected variant or null if control group (original URL) is selected
   */
  private selectVariant(variants: UrlVariant[]): UrlVariant | null {
    if (!variants || variants.length === 0) {
      return null;
    }

    // Calculate total weight of all variants
    const variantsWeight = variants.reduce((sum, variant) => sum + variant.weight, 0);

    // Control group (original URL) gets the remaining weight (100 - variants weight)
    // If variants weight >= 100, control group gets 0 weight
    const controlGroupWeight = Math.max(0, 100 - variantsWeight);

    // Total weight including control group
    const totalWeight = variantsWeight + controlGroupWeight;

    if (totalWeight === 0) {
      // If all weights are 0, select randomly with equal probability among variants
      // (control group gets equal chance too)
      const randomIndex = Math.floor(Math.random() * (variants.length + 1));
      return randomIndex === variants.length ? null : variants[randomIndex];
    }

    // Generate random number between 0 and totalWeight
    const random = Math.random() * totalWeight;

    // Select variant based on accumulated weight
    let accumulatedWeight = 0;

    // First check variants
    for (const variant of variants) {
      accumulatedWeight += variant.weight;
      if (random < accumulatedWeight) {
        return variant;
      }
    }

    // If not selected any variant, return null (control group selected)
    // This happens when random falls in the control group weight range
    return null;
  }

  /**
   * Execute redirect (no password required)
   */
  async redirect(slug: string, clickData: ClickData): Promise<string> {
    const url = (await this.urlService.findBySlug(slug)) as UrlRecord;

    // If password required, throw error
    if (url.password) {
      throw new UnauthorizedException(ERROR_MESSAGES.URL_PASSWORD_REQUIRED);
    }

    return this.processRedirect(url, clickData);
  }

  /**
   * Execute redirect (with password verification)
   */
  async redirectWithPassword(
    slug: string,
    password: string,
    clickData: ClickData,
  ): Promise<string> {
    const url = (await this.urlService.findBySlug(slug)) as UrlRecord;

    // Check if password required
    if (!url.password) {
      throw new BadRequestException('This short URL does not require a password');
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, url.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException(ERROR_MESSAGES.URL_PASSWORD_INCORRECT);
    }

    return this.processRedirect(url, clickData);
  }

  /**
   * Process redirect with routing, A/B testing, and click tracking
   * Shared logic between redirect() and redirectWithPassword()
   */
  private async processRedirect(url: UrlRecord, clickData: ClickData): Promise<string> {
    // Determine target URL based on routing priority:
    // 1. Smart Routing (if enabled and matches)
    // 2. A/B Testing (if enabled)
    // 3. Default URL or Original URL
    let targetUrl = url.originalUrl;
    let selectedVariant: UrlVariant | null = null;
    let matchedRoutingRuleId: string | null = null;

    // Priority 1: Smart Routing
    if (url.isSmartRouting) {
      const routingResult = await this.evaluateSmartRouting(url.id, clickData);
      if (routingResult.matched) {
        targetUrl = routingResult.targetUrl!;
        matchedRoutingRuleId = routingResult.ruleId!;
        this.logger.debug(`Smart Routing matched rule: ${routingResult.ruleId} for URL ${url.id}`);
      } else if (url.defaultUrl) {
        // Use defaultUrl if no routing rules match
        targetUrl = url.defaultUrl;
      }
    }

    // Priority 2: A/B Testing (only if Smart Routing didn't match)
    if (!matchedRoutingRuleId && url.isAbTest && url.variants && url.variants.length > 0) {
      selectedVariant = this.selectVariant(url.variants);
      if (selectedVariant) {
        targetUrl = selectedVariant.targetUrl;
      }
    }

    // Merge UTM parameters: dynamic (clickData) > preset (url)
    const mergedClickData = {
      ...clickData,
      utmSource: clickData.utmSource || url.utmSource,
      utmMedium: clickData.utmMedium || url.utmMedium,
      utmCampaign: clickData.utmCampaign || url.utmCampaign,
      utmTerm: clickData.utmTerm || url.utmTerm,
      utmContent: clickData.utmContent || url.utmContent,
    };

    // Emit async event to record click (fire and forget)
    this.eventEmitter.emit('url.clicked', {
      urlId: url.id,
      variantId: selectedVariant?.id || null,
      routingRuleId: matchedRoutingRuleId,
      clickData: mergedClickData,
    });

    // Build redirect URL with merged UTM parameters
    return this.buildRedirectUrl(targetUrl, url, clickData);
  }

  /**
   * Build redirect URL with merged UTM parameters
   * Dynamic UTM parameters (from clickData) take precedence over preset UTM parameters (from url)
   * @param targetUrl The target URL (from variant or original URL)
   * @param url The URL record with preset UTM parameters
   * @param clickData The click data with dynamic UTM parameters
   */
  private buildRedirectUrl(targetUrl: string, url: UrlRecord, clickData: ClickData): string {
    try {
      const redirectUrl = new URL(targetUrl);

      // Merge UTM parameters: dynamic (clickData) > preset (url)
      const utmParams = {
        utm_source: clickData.utmSource || url.utmSource,
        utm_medium: clickData.utmMedium || url.utmMedium,
        utm_campaign: clickData.utmCampaign || url.utmCampaign,
        utm_term: clickData.utmTerm || url.utmTerm,
        utm_content: clickData.utmContent || url.utmContent,
      };

      // Append UTM parameters to redirect URL
      Object.entries(utmParams).forEach(([key, value]) => {
        if (value) {
          redirectUrl.searchParams.set(key, value);
        }
      });

      return redirectUrl.toString();
    } catch {
      // If URL parsing fails, return target URL as-is
      return targetUrl;
    }
  }

  /**
   * Evaluate smart routing rules and return the matched result
   * @param urlId - The URL ID to evaluate routing rules for
   * @param clickData - Click data containing visitor information
   * @returns Routing result with match status and optional fallback reason
   */
  private async evaluateSmartRouting(
    urlId: string,
    clickData: ClickData,
  ): Promise<{
    matched: boolean;
    targetUrl?: string;
    ruleId?: string;
    fallbackReason?: 'NO_RULES_MATCHED' | 'EVALUATION_ERROR';
  }> {
    try {
      // Use enricher to parse user agent and geo-location data
      const enriched = this.clickDataEnricher.enrich(clickData);

      // Build visitor context for routing evaluation
      const visitorContext = this.routingEvaluator.buildVisitorContext({
        ip: clickData.ip,
        userAgent: clickData.userAgent,
        referer: clickData.referer,
        language: clickData.language,
        country: enriched.country,
        region: enriched.region,
        city: enriched.city,
        device: enriched.device,
        os: enriched.os,
        browser: enriched.browser,
        utmSource: clickData.utmSource,
        utmMedium: clickData.utmMedium,
        utmCampaign: clickData.utmCampaign,
        utmTerm: clickData.utmTerm,
        utmContent: clickData.utmContent,
        timezone: clickData.timezone,
      });

      // Evaluate routing rules
      const result = await this.routingService.evaluateRules(urlId, visitorContext);

      if (result.rule && result.targetUrl) {
        // Increment match count (buffered, will be flushed periodically)
        this.routingService.incrementMatchCount(result.rule.id);

        // Emit routing rule matched event for webhooks
        this.eventEmitter.emit('routing.rule_matched', {
          ruleId: result.rule.id,
          urlId,
          ruleName: result.rule.name,
          targetUrl: result.targetUrl,
          clickData: {
            ip: clickData.ip,
            userAgent: clickData.userAgent,
            referer: clickData.referer,
            country: enriched.country,
            device: enriched.device,
            browser: enriched.browser,
            os: enriched.os,
          },
        });

        return {
          matched: true,
          targetUrl: result.targetUrl,
          ruleId: result.rule.id,
        };
      }

      return { matched: false, fallbackReason: 'NO_RULES_MATCHED' };
    } catch (error) {
      this.logger.error(
        `Error evaluating smart routing for URL ${urlId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      return { matched: false, fallbackReason: 'EVALUATION_ERROR' };
    }
  }
}
