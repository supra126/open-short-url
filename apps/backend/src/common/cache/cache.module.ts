import { Global, Module } from '@nestjs/common';
import { CacheService } from './cache.service';
import { DistributedLockService } from './distributed-lock.service';

@Global()
@Module({
  providers: [CacheService, DistributedLockService],
  exports: [CacheService, DistributedLockService],
})
export class CacheModule {}
