import { Module } from '@nestjs/common';
import { BundleService } from './bundle.service';
import { BundleController } from './bundle.controller';
import { DatabaseModule } from '@/common/database/database.module';
import { ApiKeysModule } from '@/modules/api-keys/api-keys.module';
import { JwtOrApiKeyAuthGuard } from '@/modules/auth/guards/jwt-or-api-key-auth.guard';

@Module({
  imports: [DatabaseModule, ApiKeysModule],
  controllers: [BundleController],
  providers: [BundleService, JwtOrApiKeyAuthGuard],
  exports: [BundleService],
})
export class BundleModule {}
