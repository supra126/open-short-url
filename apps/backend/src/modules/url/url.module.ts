import { Module } from '@nestjs/common';
import { UrlController } from './url.controller';
import { UrlService } from './url.service';
import { ApiKeysModule } from '@/modules/api-keys/api-keys.module';
import { TurnstileModule } from '@/modules/turnstile/turnstile.module';
import { JwtOrApiKeyAuthGuard } from '@/modules/auth/guards/jwt-or-api-key-auth.guard';

@Module({
  imports: [ApiKeysModule, TurnstileModule],
  controllers: [UrlController],
  providers: [UrlService, JwtOrApiKeyAuthGuard],
  exports: [UrlService],
})
export class UrlModule {}
