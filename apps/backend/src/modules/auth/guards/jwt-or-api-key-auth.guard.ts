import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { ApiKeysService } from '@/modules/api-keys/api-keys.service';
import { ERROR_MESSAGES } from '@/common/constants/errors';

/**
 * Combined Guard: Supports both JWT Token and API Key authentication
 * Tries JWT first, falls back to API Key if JWT fails
 */
@Injectable()
export class JwtOrApiKeyAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private apiKeysService: ApiKeysService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Check if API Key is present
    const apiKey =
      request.headers['x-api-key'] ||
      this.extractBearerToken(request.headers['authorization']);

    // If API Key is present and starts with ak_, use API Key authentication
    if (apiKey && apiKey.startsWith('ak_')) {
      try {
        const user = await this.apiKeysService.validateApiKey(apiKey);
        if (user) {
          // Attach complete user information to request (including role for RolesGuard)
          request.user = user;
          return true;
        }
      } catch (error) {
        // API Key authentication failed, continue to try JWT
      }
    }

    // Try JWT authentication
    const jwtGuard = new (AuthGuard('jwt'))();
    try {
      return (await jwtGuard.canActivate(context)) as boolean;
    } catch (jwtError) {
      // If both authentication methods fail, throw unauthorized error
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH_UNAUTHORIZED);
    }
  }

  private extractBearerToken(authorization: string | undefined): string | null {
    if (!authorization) {
      return null;
    }

    const [type, token] = authorization.split(' ');
    return type === 'Bearer' ? token : null;
  }
}
