import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { WebhookDeliveryService } from './webhook-delivery.service';
import { ApiKeysModule } from '@/modules/api-keys/api-keys.module';
import { JwtOrApiKeyAuthGuard } from '@/modules/auth/guards/jwt-or-api-key-auth.guard';

@Module({
  imports: [ApiKeysModule],
  controllers: [WebhookController],
  providers: [WebhookService, WebhookDeliveryService, JwtOrApiKeyAuthGuard],
  exports: [WebhookService, WebhookDeliveryService],
})
export class WebhookModule {}
