import {
  Controller,
  Get,
  Param,
  Query,
  Req,
  Res,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { FastifyRequest, FastifyReply } from 'fastify';
import { ConfigService } from '@nestjs/config';
import { OidcAuthService } from './oidc-auth.service';
import { OidcProviderService } from './oidc-provider.service';
import { OidcProviderPublicDto } from './dto/oidc-provider.dto';

type RequestWithCookies = FastifyRequest & {
  cookies?: { [cookieName: string]: string | undefined };
};

interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax' | 'strict' | 'none';
  maxAge?: number;
  path: string;
  domain?: string;
}

/**
 * Sanitize a redirect path to prevent open redirect attacks.
 * Only allows relative paths starting with a single `/`.
 * Rejects protocol-relative URLs (`//`), absolute URLs, and any URL containing `://`.
 */
function sanitizeRedirectPath(redirect: string | undefined): string {
  if (!redirect) return '/';
  if (redirect.includes('://')) return '/';
  if (redirect.startsWith('//')) return '/';
  if (!redirect.startsWith('/')) return '/';
  return redirect;
}

@ApiTags('SSO Authentication')
@Controller('api/auth/sso')
export class OidcAuthController {
  private readonly logger = new Logger(OidcAuthController.name);

  constructor(
    private readonly oidcAuthService: OidcAuthService,
    private readonly oidcProviderService: OidcProviderService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List active SSO providers' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved active providers', type: [OidcProviderPublicDto] })
  async getProviders(): Promise<OidcProviderPublicDto[]> {
    return this.oidcProviderService.findActiveProviders();
  }

  @Get(':slug/login')
  @ApiOperation({ summary: 'Initiate SSO login' })
  @ApiParam({ name: 'slug', description: 'Provider slug' })
  @ApiQuery({ name: 'redirect', required: false, description: 'Redirect path after login' })
  @ApiResponse({ status: 302, description: 'Redirects to OIDC provider authorization URL' })
  async initiateLogin(
    @Param('slug') slug: string,
    @Query('redirect') redirect: string | undefined,
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:4100',
    );

    try {
      const backendUrl = this.getBackendPublicUrl(req);
      const callbackUrl = `${backendUrl}/api/auth/sso/${slug}/callback`;
      const redirectAfter = sanitizeRedirectPath(redirect);

      const { authorizationUrl, stateCookie } =
        await this.oidcAuthService.initiateLogin(
          slug,
          callbackUrl,
          redirectAfter,
        );

      // Set state cookie (10 minutes)
      const cookieOptions = this.getStateCookieOptions(req);
      void res.setCookie('oidc_state', stateCookie, cookieOptions);

      res.status(302).redirect(authorizationUrl);
    } catch (error) {
      this.logger.error(
        `SSO initiation failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      const errorCode = this.mapErrorToCode(error);
      res.status(302).redirect(`${frontendUrl}/login?error=${errorCode}`);
    }
  }

  @Get(':slug/callback')
  @ApiOperation({ summary: 'OIDC callback handler' })
  @ApiParam({ name: 'slug', description: 'Provider slug' })
  @ApiResponse({ status: 302, description: 'Redirects to frontend with authentication cookie' })
  async handleCallback(
    @Param('slug') slug: string,
    @Req() req: RequestWithCookies,
    @Res() res: FastifyReply,
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:4100',
    );

    try {
      const stateCookie = req.cookies?.oidc_state;
      if (!stateCookie) {
        res
          .status(302)
          .redirect(`${frontendUrl}/login?error=sso_state_invalid`);
        return;
      }

      // Reconstruct the current URL for openid-client
      const backendUrl = this.getBackendPublicUrl(req);
      const currentUrl = new URL(`${backendUrl}${req.url}`);

      // Extract request meta for audit logging
      const forwarded = req.headers['x-forwarded-for'] as string;
      let ipAddress: string | undefined;
      if (forwarded) {
        ipAddress = forwarded.split(',')[0].trim();
      } else {
        const realIp = req.headers['x-real-ip'] as string;
        ipAddress = realIp || req.ip;
      }

      const { accessToken, redirectAfter } =
        await this.oidcAuthService.handleCallback(
          slug,
          `${backendUrl}/api/auth/sso/${slug}/callback`,
          currentUrl,
          stateCookie,
          {
            ipAddress,
            userAgent: req.headers['user-agent'] as string | undefined,
          },
        );

      // Set access_token cookie (same maxAge as auth.controller.ts)
      const accessCookieOptions = this.getAccessTokenCookieOptions(req);
      void res.setCookie('access_token', accessToken, accessCookieOptions);

      // Clear state cookie
      void res.clearCookie('oidc_state', this.getClearCookieOptions(req));

      res.status(302).redirect(`${frontendUrl}${redirectAfter}`);
    } catch (error) {
      this.logger.error(
        `SSO callback failed: ${error instanceof Error ? error.message : String(error)}`,
      );

      // Clear state cookie on error
      void res.clearCookie('oidc_state', this.getClearCookieOptions(req));

      const errorCode = this.mapErrorToCode(error);
      res.status(302).redirect(`${frontendUrl}/login?error=${errorCode}`);
    }
  }

  private getBackendPublicUrl(req: FastifyRequest): string {
    const configured = this.configService.get<string>('SHORT_URL_DOMAIN');
    if (configured) return configured.replace(/\/+$/, '');

    const protocol =
      req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const host = req.headers.host || 'localhost:4101';
    return `${protocol}://${host}`;
  }

  private getCookieDomain(req: FastifyRequest): string | undefined {
    if (process.env.COOKIE_DOMAIN) {
      return process.env.COOKIE_DOMAIN;
    }

    const frontendUrl = process.env.FRONTEND_URL;
    const currentHost = req.headers?.host;

    if (!frontendUrl || !currentHost) return undefined;
    if (
      currentHost.includes('localhost') ||
      currentHost.includes('127.0.0.1')
    ) {
      return undefined;
    }

    try {
      const frontendHost = new URL(frontendUrl).hostname;
      const apiHost = currentHost.split(':')[0];
      if (frontendHost === apiHost) return undefined;

      const parts = frontendHost.split('.');
      if (parts.length >= 2) {
        return '.' + parts.slice(-2).join('.');
      }
    } catch {
      // URL parsing failed
    }

    return undefined;
  }

  private getStateCookieOptions(req: FastifyRequest): CookieOptions {
    const options: CookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60, // 10 minutes (in seconds, per @fastify/cookie spec)
      path: '/',
    };

    const domain = this.getCookieDomain(req);
    if (domain) options.domain = domain;

    return options;
  }

  private getAccessTokenCookieOptions(req: FastifyRequest): CookieOptions {
    const options: CookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 1 day (in seconds, per @fastify/cookie spec)
      path: '/',
    };

    const domain = this.getCookieDomain(req);
    if (domain) options.domain = domain;

    return options;
  }

  private getClearCookieOptions(req: FastifyRequest): Omit<CookieOptions, 'maxAge'> {
    const options: Omit<CookieOptions, 'maxAge'> = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    };

    const domain = this.getCookieDomain(req);
    if (domain) (options as CookieOptions).domain = domain;

    return options;
  }

  private mapErrorToCode(error: unknown): string {
    if (error instanceof Error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('no account found')) return 'sso_user_not_found';
      if (msg.includes('deactivated')) return 'sso_account_inactive';
      if (msg.includes('email not verified')) return 'sso_email_not_verified';
      if (msg.includes('state')) return 'sso_state_invalid';
      if (msg.includes('disabled')) return 'sso_provider_disabled';
      if (msg.includes('not found')) return 'sso_provider_not_found';
    }
    return 'sso_failed';
  }
}
