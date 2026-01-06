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
} from '@nestjs/common';

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

@ApiTags('Redirect')
@Controller()
export class RedirectController {
  constructor(
    private readonly redirectService: RedirectService,
    private readonly configService: ConfigService,
    private readonly turnstileService: TurnstileService
  ) {}

  /**
   * Handle favicon.ico requests
   */
  @Get('favicon.ico')
  async handleFavicon(@Res() reply: FastifyReply) {
    // Redirect to SVG favicon in static folder
    return reply.redirect('/static/favicon.svg', 301);
  }

  /**
   * Handle robots.txt requests
   */
  @Get('robots.txt')
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
    description: 'Check if the short URL requires password verification',
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
    description:
      'Access short URL and redirect to the original URL (when no password is required)',
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
    description: 'Provide password to access protected short URL',
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
      // Verify password and redirect
      const originalUrl = await this.redirectService.redirectWithPassword(
        slug,
        verifyPasswordDto.password,
        clickData
      );

      // Return HTML page with JavaScript redirect to avoid CSP issues
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
  <script>
    // Redirect to original URL
    window.location.href = ${JSON.stringify(originalUrl)};
  </script>
</body>
</html>`;

      return reply
        ?.type('text/html; charset=utf-8')
        .code(200)
        .send(redirectHtml);
    } catch (err: unknown) {
      // Password incorrect, redirect back to short URL page with error
      if (isUnauthorizedError(err)) {
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
    // TRUSTED_PROXY can be 'true', '1', or a comma-separated list of IPs
    const trustedProxy = this.configService.get<string>('TRUSTED_PROXY', '');
    const isTrustedProxy = trustedProxy === 'true' || trustedProxy === '1' || trustedProxy.length > 0;

    if (isTrustedProxy) {
      // Only read proxy headers when behind a trusted proxy
      const forwarded = request.headers['x-forwarded-for'] as string;
      if (forwarded) {
        // Take the first IP (client IP) from the chain
        return forwarded.split(',')[0].trim();
      }

      const realIp = request.headers['x-real-ip'] as string;
      if (realIp) {
        return realIp;
      }
    }

    // Direct connection or untrusted proxy: use socket IP
    return request.ip;
  }
}
