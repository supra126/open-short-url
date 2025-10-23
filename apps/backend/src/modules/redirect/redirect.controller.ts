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
} from '@nestjs/common';
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
import { ErrorResponseDto } from '@/common/dto/error-response.dto';
import { generatePasswordPage } from './templates/password-page.template';
import { TurnstileService } from '@/modules/turnstile/turnstile.service';

@ApiTags('Redirect')
@Controller()
export class RedirectController {
  constructor(
    private readonly redirectService: RedirectService,
    private readonly configService: ConfigService,
    private readonly turnstileService: TurnstileService,
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
    return reply
      .type('text/plain')
      .code(200)
      .send('User-agent: *\nAllow: /');
  }

  /**
   * Get redirect information (check if password is required)
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
    schema: {
      type: 'object',
      properties: {
        requiresPassword: {
          type: 'boolean',
          example: true,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Short URL not found',
    type: ErrorResponseDto,
  })
  async getInfo(@Param('slug') slug: string) {
    const info = await this.redirectService.getRedirectInfo(slug);
    return {
      requiresPassword: info.requiresPassword,
    };
  }

  /**
   * Execute redirect (no password required)
   */
  @Get(':slug')
  @Throttle({ default: { limit: 100, ttl: 60000 } }) // 100 requests per minute
  @ApiOperation({
    summary: 'Redirect to original URL',
    description: 'Access short URL and redirect to the original URL (when no password is required)',
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
    @Res() reply?: FastifyReply,
  ) {
    // Validate slug - reject empty or reserved paths
    if (!slug || slug.trim() === '') {
      throw new NotFoundException('Short URL not found');
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
      // Attempt to redirect
      const originalUrl = await this.redirectService.redirect(slug, clickData);

      // 302 redirect
      return reply?.redirect(originalUrl, 302);
    } catch (err) {
      // If password required, return HTML password page
      if (err.status === 401 || err.response?.statusCode === 401) {
        // Get branding settings from environment variables with defaults
        const brandName = this.configService.get<string>('BRAND_NAME') || 'Open Short URL';
        const brandLogoUrl = this.configService.get<string>('BRAND_LOGO_URL');

        // Only enable Turnstile if BOTH keys are configured
        const turnstileSiteKey = this.configService.get<string>('TURNSTILE_SITE_KEY');
        const turnstileSecretKey = this.configService.get<string>('TURNSTILE_SECRET_KEY');
        const turnstileEnabled = turnstileSiteKey && turnstileSecretKey ? turnstileSiteKey : undefined;

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
          error: error === 'invalid_password' ? 'Incorrect password, please try again' : undefined,
          utmParams: utmParams.toString(),
          turnstileSiteKey: turnstileEnabled,
        });

        return reply
          ?.type('text/html; charset=utf-8')
          .code(200)
          .send(html);
      }

      // Throw other errors
      throw err;
    }
  }

  /**
   * Verify password and redirect
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
    schema: {
      type: 'object',
      properties: {
        originalUrl: {
          type: 'string',
          example: 'https://example.com',
        },
      },
    },
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
    @Res() reply?: FastifyReply,
  ) {
    // Only verify Turnstile if BOTH keys are configured
    const turnstileSiteKey = this.configService.get<string>('TURNSTILE_SITE_KEY');
    const turnstileSecretKey = this.configService.get<string>('TURNSTILE_SECRET_KEY');
    const turnstileEnabled = turnstileSiteKey && turnstileSecretKey;

    if (turnstileEnabled) {
      // Verify Turnstile token first to prevent brute force attacks
      await this.turnstileService.verifyOrThrow(
        verifyPasswordDto.turnstileToken,
        clientIp,
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
        clickData,
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
    } catch (err) {
      // Password incorrect, redirect back to short URL page with error
      if (err.status === 401 || err.response?.statusCode === 401) {
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
          302,
        );
      }

      // Throw other errors
      throw err;
    }
  }

  /**
   * Extract real IP from request
   */
  private extractIp(request?: FastifyRequest): string | undefined {
    if (!request) return undefined;

    // Priority: X-Forwarded-For or X-Real-IP headers
    const forwarded = request.headers['x-forwarded-for'] as string;
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }

    const realIp = request.headers['x-real-ip'] as string;
    if (realIp) {
      return realIp;
    }

    // Fallback: socket IP
    return request.ip;
  }
}
