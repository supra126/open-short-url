import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
  private readonly logger = new Logger(CacheService.name);
  private redis: Redis | null = null;
  private redisAvailable: boolean = false;
  private redisConfigured: boolean = false;
  private healthCheckInterval: NodeJS.Timeout;

  constructor(private configService: ConfigService) {
    // Check if Redis is configured
    const redisHost = this.configService.get<string>('REDIS_HOST');

    if (!redisHost) {
      this.logger.log(
        '📝 Redis not configured (REDIS_HOST not set) - caching disabled'
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
      this.logger.log('Redis disconnected');
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
        this.logger.log('✅ Redis connected - caching enabled');
      }
      this.redisAvailable = true;
    } catch (error) {
      if (this.redisAvailable) {
        this.logger.warn('⚠️  Redis connection lost - caching disabled');
      } else {
        this.logger.warn('⚠️  Redis unavailable - caching disabled');
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

    this.logger.log('Redis health check started (runs every 60 seconds)');
  }

  /**
   * Get value by key
   * Returns null if Redis is unavailable (cache miss)
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.redisAvailable || !this.redis) {
      this.logger.debug(`Cache disabled - key: ${key}`);
      return null;
    }

    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      this.logger.error(`Cache get error for key ${key}:`, error);
      // Mark Redis as unavailable
      this.redisAvailable = false;
      return null;
    }
  }

  /**
   * Set value with optional TTL (in seconds)
   * Skips operation if Redis is unavailable
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (!this.redisAvailable || !this.redis) {
      this.logger.debug(`Cache disabled - skipping set for key: ${key}`);
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
      this.logger.error(`Cache set error for key ${key}:`, error);
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
      this.logger.debug(`Cache disabled - skipping del for key: ${key}`);
      return;
    }

    try {
      await this.redis.del(key);
    } catch (error) {
      this.logger.error(`Cache del error for key ${key}:`, error);
      this.redisAvailable = false;
    }
  }

  /**
   * Delete keys by pattern
   * Skips operation if Redis is unavailable
   */
  async delPattern(pattern: string): Promise<void> {
    if (!this.redisAvailable || !this.redis) {
      this.logger.debug(
        `Cache disabled - skipping delPattern for pattern: ${pattern}`
      );
      return;
    }

    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      this.logger.error(
        `Cache delPattern error for pattern ${pattern}:`,
        error
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
      this.logger.debug(`Cache disabled - key exists check: ${key}`);
      return false;
    }

    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Cache exists error for key ${key}:`, error);
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
      this.logger.debug(`Cache disabled - skipping incr for key: ${key}`);
      return 0;
    }

    try {
      return await this.redis.incr(key);
    } catch (error) {
      this.logger.error(`Cache incr error for key ${key}:`, error);
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
      this.logger.debug(`Cache disabled - skipping expire for key: ${key}`);
      return;
    }

    try {
      await this.redis.expire(key, seconds);
    } catch (error) {
      this.logger.error(`Cache expire error for key ${key}:`, error);
      this.redisAvailable = false;
    }
  }

  /**
   * Get Redis client (for advanced operations)
   * Returns null if Redis is unavailable
   */
  getClient(): Redis | null {
    if (!this.redisAvailable) {
      this.logger.warn('Redis client requested but Redis is unavailable');
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
