import {
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/common/database/prisma.service';
import { AuditLogService } from '@/modules/audit-log/audit-log.service';
import { RequestMeta } from '@/common/decorators/request-meta.decorator';
import { hashPassword } from '@/common/utils';
import { OidcClientFactory, getOpenidClient } from './oidc-client.factory';
import { OidcProviderService } from './oidc-provider.service';

interface OidcState {
  codeVerifier: string;
  nonce: string;
  redirectAfter: string;
  providerSlug: string;
  stateParam: string;
}

interface InitiateResult {
  authorizationUrl: string;
  stateCookie: string;
}

@Injectable()
export class OidcAuthService {
  private readonly logger = new Logger(OidcAuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly auditLogService: AuditLogService,
    private readonly oidcClientFactory: OidcClientFactory,
    private readonly oidcProviderService: OidcProviderService,
  ) {}

  async initiateLogin(
    providerSlug: string,
    callbackUrl: string,
    redirectAfter: string,
  ): Promise<InitiateResult> {
    const provider = await this.oidcProviderService.findBySlug(providerSlug);

    if (!provider.isActive) {
      throw new UnauthorizedException('This SSO provider is currently disabled');
    }

    const oidc = await getOpenidClient();
    const client = await this.oidcClientFactory.getClient(provider);

    // Generate PKCE parameters
    const codeVerifier = oidc.randomPKCECodeVerifier();
    const codeChallenge = await oidc.calculatePKCECodeChallenge(codeVerifier);

    // Generate nonce and state
    const nonce = oidc.randomNonce();
    const stateParam = oidc.randomState();

    // Build authorization URL
    const authorizationUrl = oidc.buildAuthorizationUrl(client.config, {
      redirect_uri: callbackUrl,
      scope: provider.scopes,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      nonce,
      state: stateParam,
    });

    // Sign state as JWT cookie (10 min expiry)
    const oidcState: OidcState = {
      codeVerifier,
      nonce,
      redirectAfter,
      providerSlug,
      stateParam,
    };

    const stateCookie = this.jwtService.sign(oidcState, { expiresIn: '10m' });

    return {
      authorizationUrl: authorizationUrl.href,
      stateCookie,
    };
  }

  async handleCallback(
    providerSlug: string,
    callbackUrl: string,
    currentUrl: URL,
    stateCookie: string,
    meta?: RequestMeta,
  ): Promise<{ accessToken: string; redirectAfter: string }> {
    // Verify and decode state cookie
    let state: OidcState;
    try {
      state = this.jwtService.verify(stateCookie) as OidcState;
    } catch {
      await this.logSsoLoginFailed(providerSlug, 'State expired or invalid', meta);
      throw new UnauthorizedException('SSO state expired or invalid');
    }

    if (state.providerSlug !== providerSlug) {
      await this.logSsoLoginFailed(providerSlug, 'State mismatch', meta);
      throw new UnauthorizedException('SSO state mismatch');
    }

    const oidc = await getOpenidClient();
    const provider = await this.oidcProviderService.findBySlug(providerSlug);
    const client = await this.oidcClientFactory.getClient(provider);

    // Exchange authorization code for tokens
    let tokens: Awaited<ReturnType<typeof oidc.authorizationCodeGrant>>;
    try {
      tokens = await oidc.authorizationCodeGrant(client.config, currentUrl, {
        pkceCodeVerifier: state.codeVerifier,
        expectedNonce: state.nonce,
        expectedState: state.stateParam,
        idTokenExpected: true,
      });
    } catch (error) {
      this.logger.error(
        `OIDC token exchange failed for provider ${providerSlug}: ${error instanceof Error ? error.message : String(error)}`,
      );
      await this.logSsoLoginFailed(providerSlug, 'Token exchange failed', meta);
      throw new UnauthorizedException('SSO authentication failed');
    }

    // Extract claims from ID token
    const claims = tokens.claims();
    if (!claims) {
      await this.logSsoLoginFailed(providerSlug, 'No claims received', meta);
      throw new UnauthorizedException(
        'No claims received from identity provider',
      );
    }

    const email = claims.email as string | undefined;
    const sub = claims.sub;
    const emailVerified = claims.email_verified as boolean | undefined;

    if (!email) {
      await this.logSsoLoginFailed(providerSlug, 'No email in claims', meta);
      throw new UnauthorizedException(
        'No email received from identity provider',
      );
    }

    if (!emailVerified) {
      await this.logSsoLoginFailed(providerSlug, 'Email not verified', meta, email);
      throw new UnauthorizedException(
        'Email not verified by identity provider',
      );
    }

    // Find or link user
    let user;
    try {
      user = await this.findOrLinkUser(email, sub, provider.id, meta);
    } catch (error) {
      await this.logSsoLoginFailed(
        providerSlug,
        error instanceof Error ? error.message : 'User lookup failed',
        meta,
        email,
      );
      throw error;
    }

    // Issue JWT (same payload as regular login)
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    // Audit log
    await this.auditLogService.create({
      userId: user.id,
      action: 'SSO_LOGIN',
      entityType: 'user',
      entityId: user.id,
      newValue: {
        email: user.email,
        provider: providerSlug,
      },
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return {
      accessToken,
      redirectAfter: this.validateRedirectUrl(state.redirectAfter),
    };
  }

  private async findOrLinkUser(
    email: string,
    sub: string,
    providerId: string,
    meta?: RequestMeta,
  ) {
    // 1. Try finding by existing OIDC account link (provider + sub)
    const existingLink = await this.prisma.oidcAccount.findUnique({
      where: {
        providerId_sub: { providerId, sub },
      },
      include: { user: true },
    });

    if (existingLink) {
      if (!existingLink.user.isActive) {
        throw new UnauthorizedException('Account has been deactivated');
      }
      return existingLink.user;
    }

    // 2. Try finding by email (auto-link)
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException(
        'No account found for this email. Contact your administrator.',
      );
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account has been deactivated');
    }

    // 3. Create OIDC account link
    const oidcAccount = await this.prisma.oidcAccount.create({
      data: {
        providerId,
        sub,
        userId: user.id,
      },
    });

    // Audit: account auto-linked on first SSO login
    await this.auditLogService.create({
      userId: user.id,
      action: 'OIDC_ACCOUNT_LINKED',
      entityType: 'oidc_account',
      entityId: oidcAccount.id,
      newValue: {
        providerId,
        sub,
        email: user.email,
      },
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return user;
  }

  private async logSsoLoginFailed(
    provider: string,
    reason: string,
    meta?: RequestMeta,
    email?: string,
  ): Promise<void> {
    await this.auditLogService.create({
      action: 'SSO_LOGIN_FAILED',
      entityType: 'oidc_provider',
      newValue: {
        provider,
        reason,
        ...(email && { email }),
      },
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });
  }

  private validateRedirectUrl(url: string): string {
    const MAX_LENGTH = 200;
    const safePattern = /^\/[a-zA-Z0-9/_\-?=&]*$/;

    if (
      url &&
      url.length <= MAX_LENGTH &&
      url.startsWith('/') &&
      !url.startsWith('//') &&
      !url.includes('\\') &&
      safePattern.test(url)
    ) {
      return url;
    }
    return '/';
  }
}
