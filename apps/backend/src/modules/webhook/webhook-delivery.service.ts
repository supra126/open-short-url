import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Prisma, Webhook } from '@prisma/client';
import * as dns from 'dns';
import { promisify } from 'util';
import { PrismaService } from '@/common/database/prisma.service';
import { LoggerService } from '@/common/logger/logger.service';
import { WebhookService } from './webhook.service';
import { parseUserAgent } from '@/common/utils/user-agent-parser';
import { getGeoLocation } from '@/common/utils/geo-location';
import { isBot } from '@/common/utils/bot-detector';
import { validateResolvedIPs } from '@/common/validators/safe-url.validator';

// Promisify DNS lookup functions
const dnsLookup = promisify(dns.lookup);
const dnsResolve4 = promisify(dns.resolve4);
const dnsResolve6 = promisify(dns.resolve6);

/**
 * Available webhook events
 */
export enum WebhookEvent {
  URL_CREATED = 'url.created',
  URL_UPDATED = 'url.updated',
  URL_DELETED = 'url.deleted',
  URL_CLICKED = 'url.clicked',
  // Smart Routing events
  ROUTING_RULE_CREATED = 'routing.rule_created',
  ROUTING_RULE_UPDATED = 'routing.rule_updated',
  ROUTING_RULE_DELETED = 'routing.rule_deleted',
  ROUTING_RULE_MATCHED = 'routing.rule_matched',
}

interface UrlCreatedPayload {
  id: string;
  slug: string;
  originalUrl: string;
  userId: string;
}

interface UrlClickedPayload {
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

interface UrlUpdatedPayload {
  id: string;
  slug: string;
  originalUrl: string;
  userId: string;
}

interface UrlDeletedPayload {
  id: string;
  slug: string;
  originalUrl: string;
  userId: string;
}

interface RoutingRulePayload {
  ruleId: string;
  urlId: string;
  name: string;
  targetUrl: string;
  priority: number;
  userId: string;
}

interface RoutingRuleMatchedPayload {
  ruleId: string;
  urlId: string;
  ruleName: string;
  targetUrl: string;
  clickData: {
    ip?: string;
    userAgent?: string;
    referer?: string;
    country?: string;
    device?: string;
    browser?: string;
    os?: string;
  };
}

interface WebhookEventPayload {
  event: WebhookEvent;
  timestamp: string;
  data: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Webhook delivery service with retry mechanism
 */
@Injectable()
export class WebhookDeliveryService {
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAYS = [1000, 5000, 15000]; // 1s, 5s, 15s

  constructor(
    private prisma: PrismaService,
    private webhookService: WebhookService,
    private loggerService: LoggerService,
  ) {}

  /**
   * Listen to URL created event
   */
  @OnEvent('url.created', { async: true })
  async handleUrlCreated(payload: UrlCreatedPayload): Promise<void> {
    await this.triggerWebhooks(WebhookEvent.URL_CREATED, {
      urlId: payload.id,
      slug: payload.slug,
      originalUrl: payload.originalUrl,
      userId: payload.userId,
    });
  }

  /**
   * Listen to URL clicked event
   */
  @OnEvent('url.clicked', { async: true })
  async handleUrlClicked(payload: UrlClickedPayload): Promise<void> {
    try {
      const { urlId, variantId, clickData } = payload;

      // Fetch URL information
      const url = await this.prisma.url.findUnique({
        where: { id: urlId },
        select: {
          slug: true,
          originalUrl: true,
          isAbTest: true,
        },
      });

      if (!url) {
        this.loggerService.warn(`URL not found for webhook: ${urlId}`, 'WebhookDeliveryService');
        return;
      }

      // Fetch variant information if exists
      let variant = null;
      let targetUrl = url.originalUrl;

      if (variantId) {
        variant = await this.prisma.urlVariant.findUnique({
          where: { id: variantId },
          select: {
            name: true,
            targetUrl: true,
          },
        });

        if (variant) {
          targetUrl = variant.targetUrl;
        }
      }

      // Parse clickData
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

      // Parse geo-location
      let country: string | undefined;

      if (ip) {
        const geo = getGeoLocation(ip, this.loggerService);
        if (geo) {
          country = geo.country;
        }
      }

      // Build enhanced click data
      const enhancedClickData = {
        ip,
        userAgent,
        referer,
        browser,
        os,
        device,
        country,
        isBot: botDetected,
        ...utmParams,
      };

      // Trigger webhooks with enhanced data
      await this.triggerWebhooks(WebhookEvent.URL_CLICKED, {
        urlId,
        slug: url.slug,
        targetUrl,
        variantId: variantId || null,
        variantName: variant?.name || null,
        clickData: enhancedClickData,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.loggerService.error(
        `Failed to process URL clicked event for webhook: ${errorMessage}`,
        errorStack,
        'WebhookDeliveryService',
      );
    }
  }

  /**
   * Listen to URL updated event
   */
  @OnEvent('url.updated', { async: true })
  async handleUrlUpdated(payload: UrlUpdatedPayload): Promise<void> {
    await this.triggerWebhooks(WebhookEvent.URL_UPDATED, {
      urlId: payload.id,
      slug: payload.slug,
      originalUrl: payload.originalUrl,
      userId: payload.userId,
    });
  }

  /**
   * Listen to URL deleted event
   */
  @OnEvent('url.deleted', { async: true })
  async handleUrlDeleted(payload: UrlDeletedPayload): Promise<void> {
    await this.triggerWebhooks(WebhookEvent.URL_DELETED, {
      urlId: payload.id,
      slug: payload.slug,
      originalUrl: payload.originalUrl,
      userId: payload.userId,
    });
  }

  /**
   * Listen to routing rule created event
   */
  @OnEvent('routing.rule_created', { async: true })
  async handleRoutingRuleCreated(payload: RoutingRulePayload): Promise<void> {
    await this.triggerWebhooks(WebhookEvent.ROUTING_RULE_CREATED, {
      ruleId: payload.ruleId,
      urlId: payload.urlId,
      name: payload.name,
      targetUrl: payload.targetUrl,
      priority: payload.priority,
      userId: payload.userId,
    });
  }

  /**
   * Listen to routing rule updated event
   */
  @OnEvent('routing.rule_updated', { async: true })
  async handleRoutingRuleUpdated(payload: RoutingRulePayload): Promise<void> {
    await this.triggerWebhooks(WebhookEvent.ROUTING_RULE_UPDATED, {
      ruleId: payload.ruleId,
      urlId: payload.urlId,
      name: payload.name,
      targetUrl: payload.targetUrl,
      priority: payload.priority,
      userId: payload.userId,
    });
  }

  /**
   * Listen to routing rule deleted event
   */
  @OnEvent('routing.rule_deleted', { async: true })
  async handleRoutingRuleDeleted(payload: RoutingRulePayload): Promise<void> {
    await this.triggerWebhooks(WebhookEvent.ROUTING_RULE_DELETED, {
      ruleId: payload.ruleId,
      urlId: payload.urlId,
      name: payload.name,
      targetUrl: payload.targetUrl,
      priority: payload.priority,
      userId: payload.userId,
    });
  }

  /**
   * Listen to routing rule matched event
   */
  @OnEvent('routing.rule_matched', { async: true })
  async handleRoutingRuleMatched(payload: RoutingRuleMatchedPayload): Promise<void> {
    await this.triggerWebhooks(WebhookEvent.ROUTING_RULE_MATCHED, {
      ruleId: payload.ruleId,
      urlId: payload.urlId,
      ruleName: payload.ruleName,
      targetUrl: payload.targetUrl,
      clickData: payload.clickData,
    });
  }

  /**
   * Trigger webhooks for a specific event
   */
  private async triggerWebhooks(
    event: WebhookEvent,
    data: Record<string, unknown>,
  ): Promise<void> {
    try {
      // Find all active webhooks subscribed to this event
      // Use raw query for JSON array filtering
      const webhooks = await this.prisma.$queryRaw<Webhook[]>`
        SELECT * FROM webhooks
        WHERE "isActive" = true
        AND events::jsonb ? ${event}
      `;

      // Trigger webhooks in parallel
      await Promise.allSettled(
        webhooks.map((webhook: Webhook) =>
          this.deliverWebhook(webhook, event, data, 1),
        ),
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.loggerService.error(
        `Failed to trigger webhooks for event ${event}: ${errorMessage}`,
        errorStack,
        'WebhookDeliveryService',
      );
    }
  }

  /**
   * Resolve DNS and validate IPs to prevent DNS rebinding attacks
   * @returns Array of resolved IP addresses if safe, null if blocked
   */
  private async validateDNS(hostname: string): Promise<{ isValid: boolean; reason?: string }> {
    try {
      // Skip IP addresses - they were already validated during URL creation
      if (/^[\d.:[\]]+$/.test(hostname)) {
        return { isValid: true };
      }

      // Resolve IPv4 and IPv6 addresses
      const resolvedIPs: string[] = [];

      try {
        const ipv4Addresses = await dnsResolve4(hostname);
        resolvedIPs.push(...ipv4Addresses);
      } catch {
        // IPv4 resolution failed, try IPv6
      }

      try {
        const ipv6Addresses = await dnsResolve6(hostname);
        resolvedIPs.push(...ipv6Addresses);
      } catch {
        // IPv6 resolution failed
      }

      // If no IPs resolved, try general lookup
      if (resolvedIPs.length === 0) {
        try {
          const result = await dnsLookup(hostname, { all: true });
          const addresses = Array.isArray(result) ? result : [result];
          resolvedIPs.push(...addresses.map((r) => r.address));
        } catch {
          return { isValid: false, reason: `DNS resolution failed for hostname: ${hostname}` };
        }
      }

      // Validate resolved IPs against private IP ranges
      return validateResolvedIPs(hostname, resolvedIPs);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown DNS error';
      return { isValid: false, reason: `DNS validation error: ${errorMessage}` };
    }
  }

  /**
   * Deliver webhook with retry mechanism (exponential backoff)
   */
  private async deliverWebhook(
    webhook: Webhook,
    event: WebhookEvent,
    data: Record<string, unknown>,
    attempt: number,
  ): Promise<void> {
    const payload: WebhookEventPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };

    const startTime = Date.now();
    let statusCode: number | undefined;
    let response: string | undefined;
    let error: string | undefined;
    let isSuccess = false;

    // Flag to prevent retry on security blocks
    let isSecurityBlock = false;

    try {
      // DNS rebinding protection: validate resolved IPs before making request
      const parsedUrl = new URL(webhook.url);
      const dnsValidation = await this.validateDNS(parsedUrl.hostname);

      if (!dnsValidation.isValid) {
        this.loggerService.error(
          `Webhook blocked due to DNS rebinding protection: ${webhook.name} (${webhook.id}) - ${dnsValidation.reason}`,
          undefined,
          'WebhookDeliveryService',
        );
        error = dnsValidation.reason || 'DNS rebinding attack detected';
        isSecurityBlock = true;
        // Continue to finally block to save log and update stats
        throw new Error(error);
      }

      // Decrypt secret and generate signature
      const decryptedSecret = this.webhookService.decryptSecret(webhook.secret);
      const signature = this.webhookService.generateSignature(payload, decryptedSecret);

      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'OpenShortURL-Webhook/1.0',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': event,
        'X-Webhook-Delivery-Id': `${webhook.id}-${Date.now()}`,
        'X-Webhook-Attempt': attempt.toString(),
        ...((webhook.headers as Record<string, string>) || {}),
      };

      // Send webhook
      const fetchResponse = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      statusCode = fetchResponse.status;
      response = (await fetchResponse.text()).substring(0, 1000);
      isSuccess = fetchResponse.ok; // 2xx status codes

      // Log successful delivery
      if (isSuccess) {
        this.loggerService.debug(
          `Webhook delivered successfully: ${webhook.name} (${webhook.id}) - Event: ${event}`,
          'WebhookDeliveryService',
        );
      } else {
        this.loggerService.warn(
          `Webhook delivery failed with status ${statusCode}: ${webhook.name} (${webhook.id})`,
          'WebhookDeliveryService',
        );
      }
    } catch (err: unknown) {
      error = err instanceof Error ? err.message : 'Unknown error';
      const errStack = err instanceof Error ? err.stack : undefined;
      this.loggerService.error(
        `Webhook delivery error: ${webhook.name} (${webhook.id}) - ${error}`,
        errStack,
        'WebhookDeliveryService',
      );
    } finally {
      const duration = Date.now() - startTime;

      // Save webhook log
      await this.saveWebhookLog({
        webhookId: webhook.id,
        event,
        payload,
        statusCode,
        response,
        error,
        duration,
        attempt,
        isSuccess,
      });

      // Update webhook statistics
      await this.updateWebhookStats(webhook.id, isSuccess, error);
    }

    // Retry if failed and haven't exceeded max retries
    // Don't retry for security blocks (DNS rebinding, SSRF protection)
    if (!isSuccess && !isSecurityBlock && attempt < this.MAX_RETRIES) {
      const delay = this.RETRY_DELAYS[attempt - 1] || 15000;
      this.loggerService.log(
        `Retrying webhook ${webhook.name} (${webhook.id}) in ${delay}ms (attempt ${attempt + 1}/${this.MAX_RETRIES})`,
        'WebhookDeliveryService',
      );

      // Schedule retry with exponential backoff
      await new Promise((resolve) => setTimeout(resolve, delay));
      await this.deliverWebhook(webhook, event, data, attempt + 1);
    }
  }

  /**
   * Save webhook delivery log
   */
  private async saveWebhookLog(data: {
    webhookId: string;
    event: string;
    payload: Record<string, unknown>;
    statusCode?: number;
    response?: string;
    error?: string;
    duration: number;
    attempt: number;
    isSuccess: boolean;
  }): Promise<void> {
    try {
      await this.prisma.webhookLog.create({
        data: {
          webhookId: data.webhookId,
          event: data.event,
          payload: data.payload as Prisma.InputJsonValue,
          statusCode: data.statusCode,
          response: data.response,
          error: data.error,
          duration: data.duration,
          attempt: data.attempt,
          isSuccess: data.isSuccess,
        },
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.loggerService.error(
        `Failed to save webhook log: ${errorMessage}`,
        errorStack,
        'WebhookDeliveryService',
      );
    }
  }

  /**
   * Update webhook statistics
   */
  private async updateWebhookStats(
    webhookId: string,
    isSuccess: boolean,
    lastError?: string,
  ): Promise<void> {
    try {
      await this.prisma.webhook.update({
        where: { id: webhookId },
        data: {
          totalSent: { increment: 1 },
          ...(isSuccess
            ? { totalSuccess: { increment: 1 } }
            : { totalFailed: { increment: 1 } }),
          lastSentAt: new Date(),
          ...(lastError && { lastError }),
        },
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.loggerService.error(
        `Failed to update webhook stats: ${errorMessage}`,
        errorStack,
        'WebhookDeliveryService',
      );
    }
  }
}
