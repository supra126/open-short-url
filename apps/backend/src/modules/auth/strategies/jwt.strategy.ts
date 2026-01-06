import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { FastifyRequest } from 'fastify';
import { AuthService } from '../auth.service';
import { TokenBlacklistService } from '../services/token-blacklist.service';

/**
 * Fastify request with cookies - using intersection type for compatibility
 */
type RequestWithCookies = FastifyRequest & {
  cookies?: { [cookieName: string]: string | undefined };
};

/**
 * JWT Payload interface
 */
interface JwtPayload {
  sub: string;
  email: string;
  iat: number;
  exp: number;
}

/**
 * Custom JWT extractor that checks both cookies and Authorization header
 */
const cookieExtractor = (req: RequestWithCookies): string | null => {
  if (req?.cookies?.access_token) {
    return req.cookies.access_token;
  }
  return null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private authService: AuthService,
    private tokenBlacklistService: TokenBlacklistService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'default-secret',
      passReqToCallback: true, // Enable this option to receive request object in validate method
    });
  }

  async validate(req: RequestWithCookies, payload: JwtPayload) {
    // Extract token from cookie first, then fallback to Authorization header
    const authHeader = req.headers.authorization;
    const token = req.cookies?.access_token || (typeof authHeader === 'string' ? authHeader.replace('Bearer ', '') : undefined);

    // Check if token is blacklisted
    if (token && await this.tokenBlacklistService.isBlacklisted(token)) {
      throw new UnauthorizedException('Token has been revoked');
    }

    const user = await this.authService.validateUser(payload.sub);

    if (!user) {
      throw new UnauthorizedException();
    }

    // Check if account is deactivated
    if (!user.isActive) {
      throw new UnauthorizedException('Account has been deactivated');
    }

    return user;
  }
}
