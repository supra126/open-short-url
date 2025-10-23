import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '@/common/cache/cache.service';

/**
 * Token Blacklist Service
 * Manages revoked JWT tokens with Redis + in-memory fallback
 *
 * Storage Strategy:
 * 1. Primary: Redis (supports distributed systems, automatic TTL)
 * 2. Fallback: In-memory Map (for single-instance or Redis unavailable)
 *
 * Graceful Degradation:
 * - If Redis is available: Use Redis for shared state across instances
 * - If Redis fails: Automatically fallback to in-memory storage
 * - Periodic health checks to detect Redis recovery
 */
@Injectable()
export class TokenBlacklistService implements OnModuleInit {
  private readonly logger = new Logger(TokenBlacklistService.name);
  private readonly blacklistedTokens: Map<string, number> = new Map();
  private readonly jwtExpirationTime: number;
  private useRedis: boolean = false;
  private healthCheckInterval: NodeJS.Timeout;

  constructor(
    private configService: ConfigService,
    private cacheService: CacheService,
  ) {
    // Read JWT expiration time from config (default 1 day)
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '1d';
    this.jwtExpirationTime = this.parseExpirationTime(expiresIn);
  }

  async onModuleInit() {
    // Check if Redis is configured
    const redisHost = this.configService.get<string>('REDIS_HOST');

    if (!redisHost) {
      this.logger.log('📝 Redis not configured - using in-memory storage for token blacklist');
      this.useRedis = false;
      this.startCleanupJob();
      return;
    }

    // Check Redis availability on startup
    await this.checkRedisAvailability();

    // Start periodic health check (every 30 seconds)
    this.startHealthCheck();

    // Only start cleanup job if using in-memory storage
    if (!this.useRedis) {
      this.startCleanupJob();
    }
  }

  /**
   * Check if Redis is available
   */
  private async checkRedisAvailability(): Promise<void> {
    try {
      const testKey = 'blacklist:health:check';
      await this.cacheService.set(testKey, true, 5);
      const result = await this.cacheService.get(testKey);
      await this.cacheService.del(testKey);

      if (result !== null) {
        if (!this.useRedis) {
          this.logger.log('✅ Redis available - using Redis for token blacklist');
        }
        this.useRedis = true;
      } else {
        throw new Error('Redis health check failed');
      }
    } catch (error) {
      if (this.useRedis) {
        this.logger.warn(
          '⚠️  Redis connection lost - falling back to in-memory storage',
        );
      } else {
        this.logger.warn(
          '⚠️  Redis unavailable - using in-memory storage for token blacklist',
        );
      }
      this.useRedis = false;

      // Start cleanup job when falling back to in-memory
      if (!this.healthCheckInterval) {
        this.startCleanupJob();
      }
    }
  }

  /**
   * Start periodic health check for Redis recovery
   */
  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.checkRedisAvailability();
    }, 30 * 1000); // Every 30 seconds

    this.logger.log('Redis health check started (runs every 30 seconds)');
  }

  /**
   * Add token to blacklist
   */
  async addToBlacklist(token: string, expiresAt?: number): Promise<void> {
    const expiry = expiresAt || Date.now() + this.jwtExpirationTime;
    const ttlSeconds = Math.floor((expiry - Date.now()) / 1000);

    if (this.useRedis) {
      try {
        // Use Redis with automatic TTL
        await this.cacheService.set(
          `blacklist:token:${token}`,
          expiry,
          ttlSeconds,
        );
        this.logger.debug(
          `Token added to Redis blacklist (TTL: ${ttlSeconds}s)`,
        );
        return;
      } catch (error) {
        this.logger.error('Failed to add token to Redis, using fallback', error);
        // Mark Redis as unavailable and trigger health check
        this.useRedis = false;
      }
    }

    // Fallback to in-memory
    this.blacklistedTokens.set(token, expiry);
    this.logger.debug(
      `Token added to in-memory blacklist. Total: ${this.blacklistedTokens.size}`,
    );
  }

  /**
   * Check if token is in blacklist
   */
  async isBlacklisted(token: string): Promise<boolean> {
    if (this.useRedis) {
      try {
        // Check Redis
        const exists = await this.cacheService.exists(
          `blacklist:token:${token}`,
        );
        return exists;
      } catch (error) {
        this.logger.error('Failed to check Redis blacklist, using fallback', error);
        // Mark Redis as unavailable and trigger health check
        this.useRedis = false;
      }
    }

    // Fallback to in-memory
    const expiry = this.blacklistedTokens.get(token);

    if (!expiry) {
      return false;
    }

    // Check if token has expired
    if (Date.now() > expiry) {
      this.blacklistedTokens.delete(token);
      return false;
    }

    return true;
  }

  /**
   * Clean up expired tokens (only for in-memory storage)
   */
  private cleanup(): void {
    if (this.useRedis) {
      // Redis handles TTL automatically, no cleanup needed
      return;
    }

    const now = Date.now();
    let removedCount = 0;

    for (const [token, expiry] of this.blacklistedTokens.entries()) {
      if (now > expiry) {
        this.blacklistedTokens.delete(token);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      this.logger.debug(
        `Cleaned up ${removedCount} expired tokens. Remaining: ${this.blacklistedTokens.size}`,
      );
    }
  }

  /**
   * Start periodic cleanup job (only for in-memory storage)
   */
  private startCleanupJob(): void {
    // Clean up every hour
    setInterval(() => {
      this.cleanup();
    }, 60 * 60 * 1000);

    this.logger.log(
      'In-memory token cleanup job started (runs every hour)',
    );
  }

  /**
   * Parse expiration time string (e.g., '1d', '7d', '1h')
   */
  private parseExpirationTime(expiresIn: string): number {
    const unit = expiresIn.slice(-1);
    const value = parseInt(expiresIn.slice(0, -1), 10);

    switch (unit) {
      case 'd': // days
        return value * 24 * 60 * 60 * 1000;
      case 'h': // hours
        return value * 60 * 60 * 1000;
      case 'm': // minutes
        return value * 60 * 1000;
      case 's': // seconds
        return value * 1000;
      default:
        // default 1 day
        return 24 * 60 * 60 * 1000;
    }
  }

  /**
   * Get blacklist statistics (for monitoring and debugging)
   */
  async getStats(): Promise<{
    storage: 'redis' | 'in-memory';
    total: number;
    expired: number;
  }> {
    if (this.useRedis) {
      return {
        storage: 'redis',
        total: -1, // Redis doesn't expose count easily
        expired: -1,
      };
    }

    // In-memory stats
    const now = Date.now();
    let expiredCount = 0;

    for (const expiry of this.blacklistedTokens.values()) {
      if (now > expiry) {
        expiredCount++;
      }
    }

    return {
      storage: 'in-memory',
      total: this.blacklistedTokens.size,
      expired: expiredCount,
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
