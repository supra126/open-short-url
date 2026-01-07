import { Global, Module } from '@nestjs/common';
import { ClickDataEnricherService } from './click-data-enricher.service';
import { PasswordRateLimiterService } from './password-rate-limiter.service';

@Global()
@Module({
  providers: [ClickDataEnricherService, PasswordRateLimiterService],
  exports: [ClickDataEnricherService, PasswordRateLimiterService],
})
export class ServicesModule {}
