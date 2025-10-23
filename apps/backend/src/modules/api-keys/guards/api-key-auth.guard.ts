import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiKeysService } from '../api-keys.service';
import { ERROR_MESSAGES } from '@/common/constants/errors';

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  constructor(private apiKeysService: ApiKeysService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Extract API Key from header
    // Supports two formats:
    // 1. X-API-Key: ak_xxxxx
    // 2. Authorization: Bearer ak_xxxxx
    const apiKey =
      request.headers['x-api-key'] ||
      this.extractBearerToken(request.headers['authorization']);

    if (!apiKey) {
      throw new UnauthorizedException(ERROR_MESSAGES.API_KEY_REQUIRED);
    }

    // Validate API Key and get user information with role
    const user = await this.apiKeysService.validateApiKey(apiKey);

    if (!user) {
      throw new UnauthorizedException(ERROR_MESSAGES.API_KEY_INVALID);
    }

    // Attach complete user information to request (including role for RolesGuard)
    request.user = user;

    return true;
  }

  private extractBearerToken(authorization: string | undefined): string | null {
    if (!authorization) {
      return null;
    }

    const [type, token] = authorization.split(' ');
    return type === 'Bearer' ? token : null;
  }
}
