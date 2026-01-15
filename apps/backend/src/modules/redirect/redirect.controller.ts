import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Req,
  Res,
  HttpStatus,
  Query,
  Ip,
  NotFoundException,
  HttpException,
  BadRequestException,
} from '@nestjs/common';
import * as crypto from 'crypto';

/**
 * Type guard to check if an error is an HTTP exception with status
 */
function isHttpException(error: unknown): error is HttpException {
  return error instanceof HttpException;
}

/**
 * Check if error indicates unauthorized (401) status
 */
function isUnauthorizedError(error: unknown): boolean {
  if (isHttpException(error)) {
    return error.getStatus() === 401;
  }
  // Check for response object with statusCode (NestJS format)
  if (
    error &&
    typeof error === 'object' &&
    'response' in error &&
    error.response &&
    typeof error.response === 'object' &&
    'statusCode' in error.response
  ) {
    return error.response.statusCode === 401;
  }
  return false;
}
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { FastifyRequest, FastifyReply } from 'fastify';
import { RedirectService } from './redirect.service';
import { VerifyPasswordDto } from './dto/verify-password.dto';
import {
  RedirectInfoResponseDto,
  VerifyPasswordResponseDto,
} from './dto/redirect-response.dto';
import { ErrorResponseDto } from '@/common/dto/error-response.dto';
import { generatePasswordPage } from './templates/password-page.template';
import { TurnstileService } from '@/modules/turnstile/turnstile.service';
import { PasswordRateLimiterService } from '@/common/services';

@ApiTags('Redirect')
@Controller()
export class RedirectController {
  constructor(
    private readonly redirectService: RedirectService,
    private readonly configService: ConfigService,
    private readonly turnstileService: TurnstileService,
    private readonly passwordRateLimiter: PasswordRateLimiterService,
  ) {}

  /**
   * Handle favicon.ico requests
   */
  @Get('favicon.ico')
  @ApiOperation({
    summary: 'Get favicon',
    description: 'Redirects to the SVG favicon. This is a public endpoint.',
  })
  @ApiResponse({
    status: HttpStatus.MOVED_PERMANENTLY,
    description: 'Redirects to /static/favicon.svg',
  })
  async handleFavicon(@Res() reply: FastifyReply) {
    // Redirect to SVG favicon in static folder
    return reply.redirect('/static/favicon.svg', 301);
  }

  /**
   * Handle robots.txt requests
   */
  @Get('robots.txt')
  @ApiOperation({
    summary: 'Get robots.txt',
    description: 'Returns the robots.txt file for search engine crawlers. This is a public endpoint.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns robots.txt content',
  })
  async handleRobots(@Res() reply: FastifyReply) {
    return reply.type('text/plain').code(200).send('User-agent: *\nAllow: /');
  }

  /**
   * Get redirect information (check if password is required)
   * Route pattern: matches /{slug}/info where slug doesn't start with reserved keywords
   */
  @Get(':slug/info')
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 requests per minute
  @ApiOperation({
    summary: 'Get short URL information',
    description: `Check if the short URL requires password verification before redirecting.

**Public Endpoint** - No authentication required.

**Use Case:**
- Use this endpoint to check if a short URL is password-protected before attempting to redirect
- Useful for client-side applications that need to show a password input form

**Rate Limit:** 30 requests per minute per IP`,
  })
  @ApiParam({
    name: 'slug',
    description: 'Short URL code',
    example: 'abc123',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Query successful',
    type: RedirectInfoResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Short URL not found',
    type: ErrorResponseDto,
  })
  async getInfo(@Param('slug') slug: string, @Req() _request?: FastifyRequest): Promise<RedirectInfoResponseDto> {
    // Validate slug - reject reserved paths and API routes
    this.validateSlug(slug);
    const info = await this.redirectService.getRedirectInfo(slug);
    return {
      requiresPassword: info.requiresPassword,
    };
  }

  /**
   * Execute redirect (no password required)
   * This catch-all route matches any GET request to /{slug}
   * More specific routes (like /api/*, /static/*) must be defined before this in the app
   * Route pattern excludes paths starting with reserved prefixes (api, static, swagger, etc.)
   */
  @Get(':slug')
  @Throttle({ default: { limit: 100, ttl: 60000 } }) // 100 requests per minute
  @ApiOperation({
    summary: 'Redirect to original URL',
    description: `Access a short URL and redirect to the original URL.

**Public Endpoint** - No authentication required.

**Behavior:**
- If the URL has no password protection: Immediately redirects (302) to the original URL
- If the URL requires password: Returns HTML password verification page (200)
- If smart routing is enabled: Redirects to the matched routing rule target URL
- If A/B testing is enabled: Randomly selects a variant based on weights

**UTM Parameters:**
- All UTM parameters (utm_source, utm_medium, etc.) are tracked and passed through to the original URL
- Click analytics are recorded including IP, device, browser, country, etc.

**Rate Limit:** 100 requests per minute per IP`,
  })
  @ApiParam({
    name: 'slug',
    description: 'Short URL code',
    example: 'abc123',
  })
  @ApiQuery({
    name: 'utm_source',
    required: false,
    description: 'UTM Source',
  })
  @ApiQuery({
    name: 'utm_medium',
    required: false,
    description: 'UTM Medium',
  })
  @ApiQuery({
    name: 'utm_campaign',
    required: false,
    description: 'UTM Campaign',
  })
  @ApiQuery({
    name: 'utm_term',
    required: false,
    description: 'UTM Term',
  })
  @ApiQuery({
    name: 'utm_content',
    required: false,
    description: 'UTM Content',
  })
  @ApiResponse({
    status: HttpStatus.FOUND,
    description: 'Redirect successful',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Short URL not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Password verification required',
    type: ErrorResponseDto,
  })
  async redirect(
    @Param('slug') slug: string,
    @Query('utm_source') utmSource?: string,
    @Query('utm_medium') utmMedium?: string,
    @Query('utm_campaign') utmCampaign?: string,
    @Query('utm_term') utmTerm?: string,
    @Query('utm_content') utmContent?: string,
    @Query('error') error?: string,
    @Req() request?: FastifyRequest,
    @Res() reply?: FastifyReply
  ) {
    // Validate slug - reject empty or reserved paths and API routes
    this.validateSlug(slug);

    // Extract click data
    const clickData = {
      ip: this.extractIp(request),
      userAgent: request?.headers['user-agent'],
      referer: request?.headers['referer'] as string,
      utmSource,
      utmMedium,
      utmCampaign,
      utmTerm,
      utmContent,
    };

    try {
      // Attempt to redirect
      const originalUrl = await this.redirectService.redirect(slug, clickData);

      // 302 redirect
      return reply?.redirect(originalUrl, 302);
    } catch (err: unknown) {
      // If password required, return HTML password page
      if (isUnauthorizedError(err)) {
        // Get branding settings from environment variables with defaults
        const brandName =
          this.configService.get<string>('BRAND_NAME') || 'Open Short URL';
        const brandLogoUrl = this.configService.get<string>('BRAND_LOGO_URL');

        // Only enable Turnstile if BOTH keys are configured
        const turnstileSiteKey =
          this.configService.get<string>('TURNSTILE_SITE_KEY');
        const turnstileSecretKey = this.configService.get<string>(
          'TURNSTILE_SECRET_KEY'
        );
        const turnstileEnabled =
          turnstileSiteKey && turnstileSecretKey ? turnstileSiteKey : undefined;

        // Build UTM parameters string
        const utmParams = new URLSearchParams();
        if (utmSource) utmParams.append('utm_source', utmSource);
        if (utmMedium) utmParams.append('utm_medium', utmMedium);
        if (utmCampaign) utmParams.append('utm_campaign', utmCampaign);
        if (utmTerm) utmParams.append('utm_term', utmTerm);
        if (utmContent) utmParams.append('utm_content', utmContent);

        const html = generatePasswordPage({
          slug,
          brandName,
          brandLogoUrl,
          error:
            error === 'invalid_password'
              ? 'Incorrect password, please try again'
              : undefined,
          utmParams: utmParams.toString(),
          turnstileSiteKey: turnstileEnabled,
        });

        return reply?.type('text/html; charset=utf-8').code(200).send(html);
      }

      // Throw other errors
      throw err;
    }
  }

  /**
   * Verify password and redirect
   * Route pattern: matches POST /{slug}/verify where slug doesn't start with reserved keywords
   */
  @Post(':slug/verify')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute (prevent brute force)
  @ApiOperation({
    summary: 'Verify password and redirect',
    description: `Verify the password for a password-protected short URL and redirect to the original URL.

**Public Endpoint** - No authentication required.

**Request Body:**
- \`password\`: The password to verify
- \`turnstileToken\`: Cloudflare Turnstile verification token (required if Turnstile is enabled)

**Behavior:**
- On success: Returns HTML page with JavaScript redirect to the original URL
- On failure: Redirects back to the short URL page with error parameter

**Security:**
- Rate limited to 5 requests per minute to prevent brute force attacks
- Supports Cloudflare Turnstile for additional bot protection`,
  })
  @ApiParam({
    name: 'slug',
    description: 'Short URL code',
    example: 'abc123',
  })
  @ApiQuery({
    name: 'utm_source',
    required: false,
    description: 'UTM Source',
  })
  @ApiQuery({
    name: 'utm_medium',
    required: false,
    description: 'UTM Medium',
  })
  @ApiQuery({
    name: 'utm_campaign',
    required: false,
    description: 'UTM Campaign',
  })
  @ApiQuery({
    name: 'utm_term',
    required: false,
    description: 'UTM Term',
  })
  @ApiQuery({
    name: 'utm_content',
    required: false,
    description: 'UTM Content',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Verification successful, returns original URL',
    type: VerifyPasswordResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Incorrect password',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Short URL not found',
    type: ErrorResponseDto,
  })
  async verifyPassword(
    @Param('slug') slug: string,
    @Body() verifyPasswordDto: VerifyPasswordDto,
    @Query('utm_source') utmSource?: string,
    @Query('utm_medium') utmMedium?: string,
    @Query('utm_campaign') utmCampaign?: string,
    @Query('utm_term') utmTerm?: string,
    @Query('utm_content') utmContent?: string,
    @Ip() clientIp?: string,
    @Req() request?: FastifyRequest,
    @Res() reply?: FastifyReply
  ) {
    // Validate slug - reject reserved paths and API routes
    this.validateSlug(slug);

    // Extract IP for rate limiting
    const extractedIp = this.extractIp(request);

    // Check rate limiter FIRST (before any other processing)
    // This prevents brute force attacks even with distributed IPs
    this.passwordRateLimiter.checkAttempt(slug, extractedIp);

    // Only verify Turnstile if BOTH keys are configured
    const turnstileSiteKey =
      this.configService.get<string>('TURNSTILE_SITE_KEY');
    const turnstileSecretKey = this.configService.get<string>(
      'TURNSTILE_SECRET_KEY'
    );
    const turnstileEnabled = turnstileSiteKey && turnstileSecretKey;

    if (turnstileEnabled) {
      // Verify Turnstile token first to prevent brute force attacks
      await this.turnstileService.verifyOrThrow(
        verifyPasswordDto.turnstileToken,
        clientIp
      );
    }

    // Extract click data
    const clickData = {
      ip: extractedIp,
      userAgent: request?.headers['user-agent'],
      referer: request?.headers['referer'] as string,
      utmSource,
      utmMedium,
      utmCampaign,
      utmTerm,
      utmContent,
    };

    try {
      // Verify password and redirect
      const originalUrl = await this.redirectService.redirectWithPassword(
        slug,
        verifyPasswordDto.password,
        clickData
      );

      // Password correct - reset rate limiter for this slug/IP
      this.passwordRateLimiter.recordSuccess(slug, extractedIp);

      // Validate URL before redirect to prevent XSS via malicious URLs
      const validatedUrl = this.validateRedirectUrl(originalUrl);
      if (!validatedUrl) {
        throw new BadRequestException('Invalid redirect URL');
      }

      // Generate a random nonce for CSP
      const nonce = crypto.randomBytes(16).toString('base64');

      // Return HTML page with JavaScript redirect
      const redirectHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <title>Redirecting...</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .container {
      text-align: center;
      padding: 2rem;
    }
    .spinner {
      width: 50px;
      height: 50px;
      margin: 0 auto 1rem;
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: white;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    h1 {
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0;
    }
    p {
      margin-top: 0.5rem;
      opacity: 0.9;
      font-size: 0.875rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="spinner"></div>
    <h1>✓ Verification Successful</h1>
    <p>Redirecting you now...</p>
  </div>
  <script nonce="${nonce}">
    // Redirect to original URL
    window.location.href = ${JSON.stringify(validatedUrl)};
  </script>
</body>
</html>`;

      return reply
        ?.header('Content-Security-Policy', `default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}'; frame-ancestors 'none'`)
        .header('X-Content-Type-Options', 'nosniff')
        .header('X-Frame-Options', 'DENY')
        .type('text/html; charset=utf-8')
        .code(200)
        .send(redirectHtml);
    } catch (err: unknown) {
      // Password incorrect, redirect back to short URL page with error
      if (isUnauthorizedError(err)) {
        // Record failed attempt for rate limiting
        this.passwordRateLimiter.recordFailedAttempt(slug, extractedIp);

        // Build UTM parameters
        const utmParams = new URLSearchParams();
        if (utmSource) utmParams.append('utm_source', utmSource);
        if (utmMedium) utmParams.append('utm_medium', utmMedium);
        if (utmCampaign) utmParams.append('utm_campaign', utmCampaign);
        if (utmTerm) utmParams.append('utm_term', utmTerm);
        if (utmContent) utmParams.append('utm_content', utmContent);

        // Add error parameter
        utmParams.append('error', 'invalid_password');

        // Redirect back to short URL page
        return reply?.redirect(
          `/${slug}${utmParams.toString() ? '?' + utmParams.toString() : ''}`,
          302
        );
      }

      // Throw other errors
      throw err;
    }
  }

  /**
   * Validate slug - reject empty values and reserved paths
   */
  private validateSlug(slug: string): void {
    if (!slug || slug.trim() === '') {
      throw new NotFoundException('Short URL not found');
    }

    // Reject any path containing slashes (these should be API routes)
    if (slug.includes('/')) {
      throw new NotFoundException('Short URL not found');
    }

    // Reject reserved paths
    const reservedPrefixes = [
      'api',
      'api-json',
      'static',
      'swagger',
      'swagger-ui',
      'info',
      'verify',
    ];
    const slugLower = slug.toLowerCase();

    for (const prefix of reservedPrefixes) {
      if (slugLower === prefix || slugLower.startsWith(prefix)) {
        throw new NotFoundException('Short URL not found');
      }
    }

    // Validate slug format (alphanumeric, underscore, dot, hyphen only)
    if (!/^[a-zA-Z0-9_.-]+$/.test(slug)) {
      throw new NotFoundException('Short URL not found');
    }
  }

  /**
   * Extract real IP from request
   * Only trusts X-Forwarded-For/X-Real-IP when behind a trusted proxy
   */
  private extractIp(request?: FastifyRequest): string | undefined {
    if (!request) return undefined;

    // Check if we're behind a trusted proxy
    // TRUSTED_PROXY can be 'true', '1', or a comma-separated list of trusted proxy IPs
    const trustedProxy = this.configService.get<string>('TRUSTED_PROXY', '').trim();
    const isTrustedProxy =
      trustedProxy === 'true' ||
      trustedProxy === '1' ||
      this.isRequestFromTrustedProxy(request.ip, trustedProxy);

    if (isTrustedProxy) {
      // Only read proxy headers when behind a trusted proxy
      const forwarded = request.headers['x-forwarded-for'] as string;
      if (forwarded) {
        // Take the first IP (client IP) from the chain
        const clientIp = forwarded.split(',')[0].trim();
        // Validate and sanitize the IP
        const sanitizedIp = this.sanitizeIp(clientIp);
        if (sanitizedIp) {
          return sanitizedIp;
        }
      }

      const realIp = request.headers['x-real-ip'] as string;
      if (realIp) {
        const sanitizedIp = this.sanitizeIp(realIp.trim());
        if (sanitizedIp) {
          return sanitizedIp;
        }
      }
    }

    // Direct connection or untrusted proxy: use socket IP
    return request.ip;
  }

  /**
   * Check if request comes from a trusted proxy IP
   */
  private isRequestFromTrustedProxy(
    requestIp: string | undefined,
    trustedProxyConfig: string,
  ): boolean {
    if (!requestIp || !trustedProxyConfig) return false;

    // Skip if config is just 'true' or '1' (handled separately)
    if (trustedProxyConfig === 'true' || trustedProxyConfig === '1') {
      return false;
    }

    // Parse comma-separated list of trusted proxy IPs/CIDRs
    const trustedProxies = trustedProxyConfig
      .split(',')
      .map((ip) => ip.trim())
      .filter((ip) => ip.length > 0);

    // Simple IP matching (for production, consider using a CIDR library)
    return trustedProxies.some((proxy) => {
      // Exact match
      if (proxy === requestIp) return true;
      // Localhost variations
      if (
        proxy === 'localhost' &&
        (requestIp === '127.0.0.1' || requestIp === '::1')
      ) {
        return true;
      }
      return false;
    });
  }

  /**
   * Sanitize and validate IP address
   * Returns undefined if IP is invalid or potentially malicious
   */
  private sanitizeIp(ip: string): string | undefined {
    if (!ip) return undefined;

    // Remove any port suffix (e.g., "192.168.1.1:8080" -> "192.168.1.1")
    let cleanIp = ip;

    // Handle IPv6 with port: [::1]:8080 -> ::1
    if (cleanIp.startsWith('[') && cleanIp.includes(']:')) {
      cleanIp = cleanIp.substring(1, cleanIp.indexOf(']:'));
    } else if (cleanIp.includes(':') && !cleanIp.includes('::')) {
      // IPv4 with port: 192.168.1.1:8080 -> 192.168.1.1
      // But not IPv6 without port (contains multiple colons)
      const lastColon = cleanIp.lastIndexOf(':');
      const potentialPort = cleanIp.substring(lastColon + 1);
      if (/^\d+$/.test(potentialPort)) {
        cleanIp = cleanIp.substring(0, lastColon);
      }
    }

    // Validate IPv4
    const ipv4Regex =
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (ipv4Regex.test(cleanIp)) {
      return cleanIp;
    }

    // Validate IPv6 (simplified - accepts valid IPv6 formats)
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::(?:[0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4}$|^[0-9a-fA-F]{1,4}::(?:[0-9a-fA-F]{1,4}:){0,5}[0-9a-fA-F]{1,4}$|^(?:[0-9a-fA-F]{1,4}:){1,2}:(?:[0-9a-fA-F]{1,4}:){0,4}[0-9a-fA-F]{1,4}$|^(?:[0-9a-fA-F]{1,4}:){1,3}:(?:[0-9a-fA-F]{1,4}:){0,3}[0-9a-fA-F]{1,4}$|^(?:[0-9a-fA-F]{1,4}:){1,4}:(?:[0-9a-fA-F]{1,4}:){0,2}[0-9a-fA-F]{1,4}$|^(?:[0-9a-fA-F]{1,4}:){1,5}:(?:[0-9a-fA-F]{1,4}:)?[0-9a-fA-F]{1,4}$|^(?:[0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}$|^::$|^::1$/;
    if (ipv6Regex.test(cleanIp)) {
      return cleanIp;
    }

    // Invalid IP format - return undefined
    return undefined;
  }

  /**
   * Validate and sanitize redirect URL to prevent XSS attacks
   * Returns the validated URL or undefined if invalid
   */
  private validateRedirectUrl(url: string): string | undefined {
    if (!url || typeof url !== 'string') {
      return undefined;
    }

    try {
      const parsed = new URL(url);

      // Only allow http and https protocols (strict check on parsed protocol)
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return undefined;
      }

      // Normalize URL for checking dangerous patterns
      const normalizedUrl = url.toLowerCase().trim();

      // Block all dangerous protocols (case-insensitive, handles URL encoding)
      // Note: URL() parsing should already catch these, but we add defense in depth
      const dangerousProtocols = [
        'javascript:',
        'data:',
        'vbscript:',
        'file:',
        'about:',
        'blob:',
      ];

      for (const protocol of dangerousProtocols) {
        if (normalizedUrl.startsWith(protocol)) {
          return undefined;
        }
      }

      // Block URL-encoded dangerous patterns (e.g., %6A%61%76%61%73%63%72%69%70%74 = javascript)
      try {
        const decodedUrl = decodeURIComponent(normalizedUrl);
        for (const protocol of dangerousProtocols) {
          if (decodedUrl.startsWith(protocol)) {
            return undefined;
          }
        }
      } catch {
        // decodeURIComponent may throw on malformed URLs, which is fine
      }

      // Ensure no newlines or special characters that could break out of context
      if (/[\r\n<>]/.test(url)) {
        return undefined;
      }

      return url;
    } catch {
      // Invalid URL
      return undefined;
    }
  }
}
