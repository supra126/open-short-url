import { Module } from '@nestjs/common';
import { UrlController } from './url.controller';
import { UrlService } from './url.service';
import { UrlVariantService } from './url-variant.service';
import { UrlBulkService } from './url-bulk.service';
import { ApiKeysModule } from '@/modules/api-keys/api-keys.module';
import { TurnstileModule } from '@/modules/turnstile/turnstile.module';
import { JwtOrApiKeyAuthGuard } from '@/modules/auth/guards/jwt-or-api-key-auth.guard';

@Module({
  imports: [ApiKeysModule, TurnstileModule],
  controllers: [UrlController],
  providers: [
    UrlService,
    UrlVariantService,
    UrlBulkService,
    JwtOrApiKeyAuthGuard,
  ],
  exports: [UrlService, UrlVariantService, UrlBulkService],
})
export class UrlModule {}
