import { Module } from '@nestjs/common';
import { HybridThrottlerStorage } from './hybrid-throttler-storage';
import { CacheModule } from '@/common/cache/cache.module';

@Module({
  imports: [CacheModule],
  providers: [HybridThrottlerStorage],
  exports: [HybridThrottlerStorage],
})
export class ThrottlerStorageModule {}
