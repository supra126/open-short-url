import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/common/database/prisma.service';

@Injectable()
export class EnforceSsoGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(_context: ExecutionContext): Promise<boolean> {
    // Check if SSO enforcement is enabled in system settings
    const setting = await this.prisma.systemSettings.findUnique({
      where: { key: 'sso_enforce' },
    });

    if (!setting) return true;

    const value = setting.value as { enabled?: boolean };
    if (!value?.enabled) return true;

    // Verify there are active OIDC providers available
    const activeProvider = await this.prisma.oidcProvider.findFirst({
      where: { isActive: true },
      select: { id: true },
    });

    // Only enforce SSO if there are active providers
    // (don't lock users out if all providers are removed)
    if (!activeProvider) {
      return true;
    }

    throw new ForbiddenException(
      'Password login is disabled. Please use SSO to sign in.',
    );
  }
}
