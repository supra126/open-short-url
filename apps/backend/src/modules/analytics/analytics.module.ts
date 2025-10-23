import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { DatabaseModule } from '@/common/database/database.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { JwtOrApiKeyAuthGuard } from '../auth/guards/jwt-or-api-key-auth.guard';

@Module({
  imports: [DatabaseModule, ApiKeysModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, JwtOrApiKeyAuthGuard],
})
export class AnalyticsModule {}
