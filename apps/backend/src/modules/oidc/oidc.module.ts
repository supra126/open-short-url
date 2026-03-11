import { Module } from '@nestjs/common';
import { AuthModule } from '@/modules/auth/auth.module';
import { OidcAuthController } from './oidc-auth.controller';
import { OidcProvidersController } from './oidc-providers.controller';
import { OidcAuthService } from './oidc-auth.service';
import { OidcProviderService } from './oidc-provider.service';
import { OidcClientFactory } from './oidc-client.factory';

@Module({
  imports: [AuthModule],
  controllers: [OidcAuthController, OidcProvidersController],
  providers: [OidcAuthService, OidcProviderService, OidcClientFactory],
  exports: [OidcAuthService],
})
export class OidcModule {}
