import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../logger/logger.service';
import Redis from 'ioredis';

/**
 * Cache Service
 * Redis-based caching with graceful degradation
 *
 * Strategy:
 * - If Redis is available: Use Redis for caching
 * - If Redis fails: Disable caching (return null for get, skip set)
 * - Periodic health checks to detect Redis recovery
 *
 * Benefits:
 * - Simple implementation
 * - Perfect data consistency (no stale cache)
 * - System continues to work without Redis (slower, but functional)
 */
@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private redis: Redis | null = null;
  private redisAvailable: boolean = false;
  private redisConfigured: boolean = false;
  private healthCheckInterval: NodeJS.Timeout;

  constructor(
    private configService: ConfigService,
    private loggerService: LoggerService,
  ) {
    // Check if Redis is configured
    const redisHost = this.configService.get<string>('REDIS_HOST');

    if (!redisHost) {
      this.loggerService.log(
        '📝 Redis not configured (REDIS_HOST not set) - caching disabled',
        'CacheService',
      );
      this.redisConfigured = false;
      this.redisAvailable = false;
      return;
    }

    this.redisConfigured = true;
    this.redis = new Redis({
      host: redisHost,
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD'),
      db: this.configService.get<number>('REDIS_DB', 0),
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      lazyConnect: true,
      keepAlive: 60000, // Increased from 30s to 60s to avoid collision with health checks
      connectTimeout: 5000, // Add connection timeout
      commandTimeout: 5000, // Add command timeout
    });
  }

  async onModuleInit() {
    // Skip if Redis is not configured
    if (!this.redisConfigured) {
      return;
    }

    // Initial connection attempt
    await this.checkRedisAvailability();

    // Start periodic health check (every 30 seconds)
    this.startHealthCheck();
  }

  async onModuleDestroy() {
    // Clean up health check interval
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Disconnect from Redis
    if (this.redisAvailable && this.redis) {
      await this.redis.quit();
      this.loggerService.log('Redis disconnected', 'CacheService');
    }
  }

  /**
   * Check if Redis is available
   */
  private async checkRedisAvailability(): Promise<void> {
    if (!this.redis) {
      return;
    }

    try {
      // Try to connect if not connected
      if (this.redis.status !== 'ready') {
        await this.redis.connect();
      }

      // Ping to verify connection
      await this.redis.ping();

      if (!this.redisAvailable) {
        this.loggerService.log(
          '✅ Redis connected - caching enabled',
          'CacheService',
        );
      }
      this.redisAvailable = true;
    } catch {
      if (this.redisAvailable) {
        this.loggerService.warn(
          '⚠️  Redis connection lost - caching disabled',
          'CacheService',
        );
      } else {
        this.loggerService.warn(
          '⚠️  Redis unavailable - caching disabled',
          'CacheService',
        );
      }
      this.redisAvailable = false;
    }
  }

  /**
   * Start periodic health check for Redis recovery
   * Optimized: Reduced frequency to 60 seconds to minimize overhead
   */
  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.checkRedisAvailability();
    }, 60 * 1000);

    this.loggerService.log(
      'Redis health check started (runs every 60 seconds)',
      'CacheService',
    );
  }

  /**
   * Get value by key
   * Returns null if Redis is unavailable (cache miss)
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.redisAvailable || !this.redis) {
      this.loggerService.debug(`Cache disabled - key: ${key}`, 'CacheService');
      return null;
    }

    try {
      const value = await this.redis.get(key);
      return value ? (JSON.parse(value) as T) : null;
    } catch (error) {
      this.loggerService.error(
        `Cache get error for key ${key}`,
        error instanceof Error ? error.stack : String(error),
        'CacheService',
      );
      // Mark Redis as unavailable
      this.redisAvailable = false;
      return null;
    }
  }

  /**
   * Set value with optional TTL (in seconds)
   * Skips operation if Redis is unavailable
   */
  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    if (!this.redisAvailable || !this.redis) {
      this.loggerService.debug(
        `Cache disabled - skipping set for key: ${key}`,
        'CacheService',
      );
      return;
    }

    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.redis.setex(key, ttl, serialized);
      } else {
        await this.redis.set(key, serialized);
      }
    } catch (error) {
      this.loggerService.error(
        `Cache set error for key ${key}`,
        error instanceof Error ? error.stack : String(error),
        'CacheService',
      );
      // Mark Redis as unavailable
      this.redisAvailable = false;
    }
  }

  /**
   * Delete key
   * Skips operation if Redis is unavailable
   */
  async del(key: string): Promise<void> {
    if (!this.redisAvailable || !this.redis) {
      this.loggerService.debug(
        `Cache disabled - skipping del for key: ${key}`,
        'CacheService',
      );
      return;
    }

    try {
      await this.redis.del(key);
    } catch (error) {
      this.loggerService.error(
        `Cache del error for key ${key}`,
        error instanceof Error ? error.stack : String(error),
        'CacheService',
      );
      this.redisAvailable = false;
    }
  }

  /**
   * Delete keys by pattern
   * Skips operation if Redis is unavailable
   */
  async delPattern(pattern: string): Promise<void> {
    if (!this.redisAvailable || !this.redis) {
      this.loggerService.debug(
        `Cache disabled - skipping delPattern for pattern: ${pattern}`,
        'CacheService',
      );
      return;
    }

    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      this.loggerService.error(
        `Cache delPattern error for pattern ${pattern}`,
        error instanceof Error ? error.stack : String(error),
        'CacheService',
      );
      this.redisAvailable = false;
    }
  }

  /**
   * Check if key exists
   * Returns false if Redis is unavailable
   */
  async exists(key: string): Promise<boolean> {
    if (!this.redisAvailable || !this.redis) {
      this.loggerService.debug(
        `Cache disabled - key exists check: ${key}`,
        'CacheService',
      );
      return false;
    }

    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      this.loggerService.error(
        `Cache exists error for key ${key}`,
        error instanceof Error ? error.stack : String(error),
        'CacheService',
      );
      this.redisAvailable = false;
      return false;
    }
  }

  /**
   * Increment value
   * Returns 0 if Redis is unavailable
   */
  async incr(key: string): Promise<number> {
    if (!this.redisAvailable || !this.redis) {
      this.loggerService.debug(
        `Cache disabled - skipping incr for key: ${key}`,
        'CacheService',
      );
      return 0;
    }

    try {
      return await this.redis.incr(key);
    } catch (error) {
      this.loggerService.error(
        `Cache incr error for key ${key}`,
        error instanceof Error ? error.stack : String(error),
        'CacheService',
      );
      this.redisAvailable = false;
      return 0;
    }
  }

  /**
   * Set expiration time
   * Skips operation if Redis is unavailable
   */
  async expire(key: string, seconds: number): Promise<void> {
    if (!this.redisAvailable || !this.redis) {
      this.loggerService.debug(
        `Cache disabled - skipping expire for key: ${key}`,
        'CacheService',
      );
      return;
    }

    try {
      await this.redis.expire(key, seconds);
    } catch (error) {
      this.loggerService.error(
        `Cache expire error for key ${key}`,
        error instanceof Error ? error.stack : String(error),
        'CacheService',
      );
      this.redisAvailable = false;
    }
  }

  /**
   * Get Redis client (for advanced operations)
   * Returns null if Redis is unavailable
   */
  getClient(): Redis | null {
    if (!this.redisAvailable) {
      this.loggerService.warn(
        'Redis client requested but Redis is unavailable',
        'CacheService',
      );
      return null;
    }
    return this.redis;
  }

  /**
   * Get cache statistics (for monitoring)
   */
  getStats(): {
    available: boolean;
    status: string;
  } {
    return {
      available: this.redisAvailable,
      status: this.redisAvailable ? 'connected' : 'disconnected',
    };
  }

  /**
   * Check if Redis is available (for external use)
   */
  isAvailable(): boolean {
    return this.redisAvailable;
  }
}
