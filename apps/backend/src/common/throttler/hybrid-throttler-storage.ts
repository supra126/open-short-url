import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '@/common/cache/cache.service';

// Define ThrottlerStorageRecord interface
// Based on @nestjs/throttler internal interface
interface ThrottlerStorageRecord {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
}

/**
 * Hybrid Throttler Storage
 * Rate limiting storage with Redis + in-memory fallback
 *
 * Storage Strategy:
 * 1. Primary: Redis (supports distributed rate limiting across instances)
 * 2. Fallback: In-memory Map (for single-instance or Redis unavailable)
 *
 * Graceful Degradation:
 * - If Redis is available: Use Redis for shared rate limiting
 * - If Redis fails: Automatically fallback to in-memory storage
 * - Periodic health checks to detect Redis recovery
 */
@Injectable()
export class HybridThrottlerStorage
  implements ThrottlerStorage, OnModuleInit
{
  private readonly logger = new Logger(HybridThrottlerStorage.name);
  private readonly storage: Map<string, ThrottlerStorageRecord> = new Map();
  private useRedis: boolean = false;
  private healthCheckInterval: NodeJS.Timeout;

  constructor(
    private readonly cacheService: CacheService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    // Check if Redis is configured
    const redisHost = this.configService.get<string>('REDIS_HOST');

    if (!redisHost) {
      this.logger.log('📝 Redis not configured - using in-memory storage for rate limiting');
      this.useRedis = false;
      this.startCleanupJob();
      return;
    }

    // Check Redis availability on startup
    await this.checkRedisAvailability();

    // Start periodic health check (every 30 seconds)
    this.startHealthCheck();

    // Start cleanup job for in-memory storage
    this.startCleanupJob();
  }

  /**
   * Check if Redis is available
   * Simplified health check using ping instead of set/get/del
   * to reduce overhead and avoid collision with ioredis keepAlive
   */
  private async checkRedisAvailability(): Promise<void> {
    try {
      // Use a simple ping with timeout to check Redis availability
      const redisClient = this.cacheService.getClient();

      if (!redisClient) {
        throw new Error('Redis client not available');
      }

      // Set a timeout for the ping operation
      const pingPromise = redisClient.ping();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Ping timeout')), 5000)
      );

      await Promise.race([pingPromise, timeoutPromise]);

      if (!this.useRedis) {
        this.logger.log('✅ Redis available - using Redis for rate limiting');
      }
      this.useRedis = true;
    } catch (error) {
      if (this.useRedis) {
        this.logger.warn(
          '⚠️  Redis connection lost - falling back to in-memory rate limiting',
        );
      } else {
        this.logger.debug(
          '⚠️  Redis unavailable - using in-memory storage for rate limiting',
        );
      }
      this.useRedis = false;
    }
  }

  /**
   * Start periodic health check for Redis recovery
   * Increased interval from 30 to 60 seconds to avoid collision with ioredis keepAlive (30s)
   */
  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.checkRedisAvailability();
    }, 60 * 1000); // Every 60 seconds

    this.logger.log('Throttler Redis health check started (runs every 60 seconds)');
  }

  /**
   * Increment the request count for a key
   */
  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    if (this.useRedis) {
      try {
        return await this.redisIncrement(key, ttl);
      } catch (error) {
        this.logger.error('Failed to increment in Redis, using fallback', error);
        this.useRedis = false;
      }
    }

    // Fallback to in-memory
    return this.memoryIncrement(key, ttl);
  }

  /**
   * Redis increment implementation
   */
  private async redisIncrement(
    key: string,
    ttl: number,
  ): Promise<ThrottlerStorageRecord> {
    const redisKey = `throttler:${key}`;

    // Increment counter
    const count = await this.cacheService.incr(redisKey);

    // Set TTL on first request
    if (count === 1) {
      await this.cacheService.expire(redisKey, Math.ceil(ttl / 1000));
    }

    return {
      totalHits: count,
      timeToExpire: ttl,
      isBlocked: false,
      timeToBlockExpire: 0,
    };
  }

  /**
   * In-memory increment implementation
   */
  private memoryIncrement(
    key: string,
    ttl: number,
  ): ThrottlerStorageRecord {
    const now = Date.now();
    const record = this.storage.get(key);

    if (!record || now > record.timeToExpire) {
      // Create new record
      const newRecord: ThrottlerStorageRecord = {
        totalHits: 1,
        timeToExpire: now + ttl,
        isBlocked: false,
        timeToBlockExpire: 0,
      };
      this.storage.set(key, newRecord);
      return newRecord;
    }

    // Increment existing record
    record.totalHits++;
    this.storage.set(key, record);
    return record;
  }

  /**
   * Clean up expired records (only for in-memory storage)
   */
  private cleanup(): void {
    if (this.useRedis) {
      // Redis handles TTL automatically
      return;
    }

    const now = Date.now();
    let removedCount = 0;

    for (const [key, record] of this.storage.entries()) {
      if (now > record.timeToExpire) {
        this.storage.delete(key);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      this.logger.debug(
        `Cleaned up ${removedCount} expired throttle records. Remaining: ${this.storage.size}`,
      );
    }
  }

  /**
   * Start periodic cleanup job
   */
  private startCleanupJob(): void {
    // Clean up every minute
    setInterval(() => {
      this.cleanup();
    }, 60 * 1000);

    this.logger.log('In-memory throttle cleanup job started (runs every minute)');
  }

  /**
   * Get statistics for monitoring
   */
  getStats(): {
    storage: 'redis' | 'in-memory';
    totalRecords: number;
  } {
    return {
      storage: this.useRedis ? 'redis' : 'in-memory',
      totalRecords: this.useRedis ? -1 : this.storage.size,
    };
  }

  /**
   * Clean up on module destroy
   */
  onModuleDestroy() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }
}
