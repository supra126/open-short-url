import { Injectable } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';
import { CacheService } from './cache.service';

/**
 * Lock acquisition result
 */
export interface LockResult {
  acquired: boolean;
  lockId: string | null;
}

/**
 * Distributed Lock Service
 * Redis-based distributed locking with graceful degradation
 *
 * Implementation:
 * - Uses Redis SET with NX (only set if not exists) and PX (expiration in ms)
 * - Supports automatic expiration to prevent deadlocks
 * - Graceful degradation when Redis is unavailable
 *
 * Usage:
 * ```typescript
 * const lockResult = await lockService.acquire('my-resource', 5000);
 * if (lockResult.acquired) {
 *   try {
 *     // Do work
 *   } finally {
 *     await lockService.release('my-resource', lockResult.lockId);
 *   }
 * }
 * ```
 *
 * Or use the convenience method:
 * ```typescript
 * const result = await lockService.withLock('my-resource', 5000, async () => {
 *   // Do work
 *   return result;
 * });
 * ```
 */
@Injectable()
export class DistributedLockService {
  private readonly LOCK_PREFIX = 'lock:';

  // Lua script for atomic check-and-delete
  // Only delete if the value matches our lockId (prevents releasing someone else's lock)
  private readonly RELEASE_LOCK_SCRIPT = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;

  constructor(
    private cacheService: CacheService,
    private loggerService: LoggerService,
  ) {}

  /**
   * Acquire a distributed lock
   * @param resource - The resource identifier to lock
   * @param ttlMs - Lock expiration time in milliseconds (default: 5000ms)
   * @returns LockResult with acquired status and lockId
   */
  async acquire(resource: string, ttlMs: number = 5000): Promise<LockResult> {
    const redis = this.cacheService.getClient();

    // If Redis is not available, return not acquired
    // The caller should handle this case (e.g., fallback to optimistic concurrency)
    if (!redis) {
      this.loggerService.debug(
        `Redis unavailable - lock not acquired for: ${resource}`,
        'DistributedLockService',
      );
      return { acquired: false, lockId: null };
    }

    const lockKey = `${this.LOCK_PREFIX}${resource}`;
    const lockId = this.generateLockId();

    try {
      // SET key value NX PX milliseconds
      // NX - Only set if key doesn't exist
      // PX - Set expiration in milliseconds
      const result = await redis.set(lockKey, lockId, 'PX', ttlMs, 'NX');

      if (result === 'OK') {
        this.loggerService.debug(
          `Lock acquired: ${resource} (lockId: ${lockId}, ttl: ${ttlMs}ms)`,
          'DistributedLockService',
        );
        return { acquired: true, lockId };
      }

      this.loggerService.debug(
        `Lock not acquired (already held): ${resource}`,
        'DistributedLockService',
      );
      return { acquired: false, lockId: null };
    } catch (error) {
      this.loggerService.error(
        `Failed to acquire lock for ${resource}`,
        error instanceof Error ? error.stack : String(error),
        'DistributedLockService',
      );
      return { acquired: false, lockId: null };
    }
  }

  /**
   * Release a distributed lock
   * Uses Lua script to ensure atomic check-and-delete (only delete if lockId matches)
   * @param resource - The resource identifier
   * @param lockId - The lock ID returned from acquire()
   * @returns true if lock was released, false otherwise
   */
  async release(resource: string, lockId: string | null): Promise<boolean> {
    if (!lockId) {
      return false;
    }

    const redis = this.cacheService.getClient();

    if (!redis) {
      this.loggerService.debug(
        `Redis unavailable - cannot release lock for: ${resource}`,
        'DistributedLockService',
      );
      return false;
    }

    const lockKey = `${this.LOCK_PREFIX}${resource}`;

    try {
      // Use Redis EVAL command to run Lua script atomically
      // This ensures we only delete the lock if we own it
      const result = await redis.eval(
        this.RELEASE_LOCK_SCRIPT,
        1,
        lockKey,
        lockId,
      );

      if (result === 1) {
        this.loggerService.debug(
          `Lock released: ${resource} (lockId: ${lockId})`,
          'DistributedLockService',
        );
        return true;
      }

      this.loggerService.debug(
        `Lock not released (not held or expired): ${resource}`,
        'DistributedLockService',
      );
      return false;
    } catch (error) {
      this.loggerService.error(
        `Failed to release lock for ${resource}`,
        error instanceof Error ? error.stack : String(error),
        'DistributedLockService',
      );
      return false;
    }
  }

  /**
   * Acquire lock with retry
   * @param resource - The resource identifier to lock
   * @param ttlMs - Lock expiration time in milliseconds
   * @param maxRetries - Maximum number of retry attempts
   * @param retryDelayMs - Delay between retries in milliseconds
   * @returns LockResult with acquired status and lockId
   */
  async acquireWithRetry(
    resource: string,
    ttlMs: number = 5000,
    maxRetries: number = 3,
    retryDelayMs: number = 100,
  ): Promise<LockResult> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const result = await this.acquire(resource, ttlMs);

      if (result.acquired) {
        return result;
      }

      // Don't delay after the last attempt
      if (attempt < maxRetries) {
        // Add jitter to prevent thundering herd
        const jitter = Math.random() * 50;
        await this.delay(retryDelayMs + jitter);
      }
    }

    this.loggerService.debug(
      `Lock acquisition failed after ${maxRetries + 1} attempts: ${resource}`,
      'DistributedLockService',
    );
    return { acquired: false, lockId: null };
  }

  /**
   * Execute a function with a distributed lock
   * Automatically acquires and releases the lock
   * @param resource - The resource identifier to lock
   * @param ttlMs - Lock expiration time in milliseconds
   * @param fn - The function to execute while holding the lock
   * @param options - Additional options
   * @returns The result of the function, or throws if lock cannot be acquired
   */
  async withLock<T>(
    resource: string,
    ttlMs: number,
    fn: () => Promise<T>,
    options?: {
      maxRetries?: number;
      retryDelayMs?: number;
      throwOnLockFailure?: boolean;
    },
  ): Promise<{ success: boolean; result?: T; lockAcquired: boolean }> {
    const {
      maxRetries = 3,
      retryDelayMs = 100,
      throwOnLockFailure = false,
    } = options || {};

    const lockResult = await this.acquireWithRetry(
      resource,
      ttlMs,
      maxRetries,
      retryDelayMs,
    );

    if (!lockResult.acquired) {
      if (throwOnLockFailure) {
        throw new Error(`Failed to acquire lock for resource: ${resource}`);
      }
      return { success: false, lockAcquired: false };
    }

    try {
      const result = await fn();
      return { success: true, result, lockAcquired: true };
    } finally {
      await this.release(resource, lockResult.lockId);
    }
  }

  /**
   * Check if Redis is available for locking
   */
  isAvailable(): boolean {
    return this.cacheService.isAvailable();
  }

  /**
   * Generate a unique lock ID
   * Combines timestamp, random string, and process ID for uniqueness
   */
  private generateLockId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    const processId = process.pid.toString(36);
    return `${timestamp}-${random}-${processId}`;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
