import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/common/database/database.module';
import { CacheModule } from '@/common/cache/cache.module';
import { StorageModule } from '@/modules/storage/storage.module';
import { ApiKeysModule } from '@/modules/api-keys/api-keys.module';
import { JwtOrApiKeyAuthGuard } from '@/modules/auth/guards/jwt-or-api-key-auth.guard';
import { OgImageService } from './og-image.service';
import { OgImageController } from './og-image.controller';
import { ImageOptimizerService } from './image-optimizer.service';

@Module({
  imports: [StorageModule, DatabaseModule, CacheModule, ApiKeysModule],
  controllers: [OgImageController],
  providers: [OgImageService, ImageOptimizerService, JwtOrApiKeyAuthGuard],
  exports: [OgImageService],
})
export class OgImageModule {}
