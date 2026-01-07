import { Module } from '@nestjs/common';
import { RedirectController } from './redirect.controller';
import { RedirectService } from './redirect.service';
import { ClickRecorderService } from './click-recorder.service';
import { UrlModule } from '@/modules/url/url.module';
import { SettingsModule } from '@/modules/settings/settings.module';
import { TurnstileModule } from '@/modules/turnstile/turnstile.module';
import { RoutingModule } from '@/modules/routing/routing.module';

@Module({
  imports: [UrlModule, SettingsModule, TurnstileModule, RoutingModule],
  controllers: [RedirectController],
  providers: [RedirectService, ClickRecorderService],
})
export class RedirectModule {}
