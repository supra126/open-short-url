import { Injectable, ForbiddenException, Logger, OnModuleDestroy } from '@nestjs/common';

/**
 * Password attempt record
 */
interface AttemptRecord {
  /** Number of failed attempts */
  failedAttempts: number;
  /** First attempt timestamp */
  firstAttemptAt: number;
  /** Last attempt timestamp */
  lastAttemptAt: number;
  /** Lockout until timestamp (if locked) */
  lockedUntil?: number;
}

/**
 * Service to track and limit password verification attempts
 * Provides protection against brute force attacks on password-protected URLs
 *
 * Features:
 * - Per-slug attempt tracking with max size limit
 * - Per-IP attempt tracking with max size limit
 * - Exponential backoff after failed attempts
 * - Temporary lockout after max failures
 * - Automatic cleanup of stale records
 * - Proper lifecycle management (OnModuleDestroy)
 */
@Injectable()
export class PasswordRateLimiterService implements OnModuleDestroy {
  private readonly logger = new Logger(PasswordRateLimiterService.name);

  /**
   * Map of slug -> AttemptRecord (with max size limit)
   */
  private slugAttempts = new Map<string, AttemptRecord>();

  /**
   * Map of IP -> AttemptRecord (with max size limit)
   */
  private ipAttempts = new Map<string, AttemptRecord>();

  /**
   * Interval handle for cleanup task
   */
  private cleanupIntervalHandle: ReturnType<typeof setInterval> | null = null;

  /**
   * Configuration
   */
  private readonly config = {
    /** Maximum failed attempts before lockout */
    maxAttempts: 5,
    /** Initial lockout duration in ms (30 seconds) */
    initialLockoutMs: 30 * 1000,
    /** Maximum lockout duration in ms (15 minutes) */
    maxLockoutMs: 15 * 60 * 1000,
    /** Time window for counting attempts (10 minutes) */
    attemptWindowMs: 10 * 60 * 1000,
    /** Cleanup interval (5 minutes) */
    cleanupIntervalMs: 5 * 60 * 1000,
    /** Record expiry time (30 minutes of inactivity) */
    recordExpiryMs: 30 * 60 * 1000,
    /** Maximum number of slug records to prevent memory exhaustion */
    maxSlugRecords: 10000,
    /** Maximum number of IP records to prevent memory exhaustion */
    maxIpRecords: 50000,
  };

  constructor() {
    // Start cleanup interval and store the handle
    this.cleanupIntervalHandle = setInterval(
      () => this.cleanup(),
      this.config.cleanupIntervalMs,
    );
    this.logger.log('Password rate limiter initialized');
  }

  /**
   * Clean up resources when module is destroyed
   * Prevents memory leaks in test environments and during hot-reload
   */
  onModuleDestroy() {
    if (this.cleanupIntervalHandle) {
      clearInterval(this.cleanupIntervalHandle);
      this.cleanupIntervalHandle = null;
      this.logger.log('Password rate limiter cleanup timer stopped');
    }
    // Clear the maps
    this.slugAttempts.clear();
    this.ipAttempts.clear();
  }

  /**
   * Check if an attempt is allowed for the given slug and IP
   * @throws ForbiddenException if the slug or IP is locked out
   */
  checkAttempt(slug: string, ip?: string): void {
    const now = Date.now();

    // Check slug lockout
    const slugRecord = this.slugAttempts.get(slug);
    if (slugRecord?.lockedUntil && now < slugRecord.lockedUntil) {
      const remainingSeconds = Math.ceil(
        (slugRecord.lockedUntil - now) / 1000,
      );
      this.logger.warn(
        `Password attempt blocked for slug "${slug}" - locked for ${remainingSeconds}s`,
      );
      throw new ForbiddenException(
        `Too many failed attempts. Please try again in ${remainingSeconds} seconds.`,
      );
    }

    // Check IP lockout
    if (ip) {
      const ipRecord = this.ipAttempts.get(ip);
      if (ipRecord?.lockedUntil && now < ipRecord.lockedUntil) {
        const remainingSeconds = Math.ceil(
          (ipRecord.lockedUntil - now) / 1000,
        );
        this.logger.warn(
          `Password attempt blocked for IP "${ip}" - locked for ${remainingSeconds}s`,
        );
        throw new ForbiddenException(
          `Too many failed attempts. Please try again in ${remainingSeconds} seconds.`,
        );
      }
    }
  }

  /**
   * Record a failed password attempt
   * @returns true if lockout was triggered
   */
  recordFailedAttempt(slug: string, ip?: string): boolean {
    const now = Date.now();
    let lockoutTriggered = false;

    // Enforce max size limits before adding new records
    this.enforceMaxSize(this.slugAttempts, this.config.maxSlugRecords);
    if (ip) {
      this.enforceMaxSize(this.ipAttempts, this.config.maxIpRecords);
    }

    // Update slug record
    lockoutTriggered =
      this.updateAttemptRecord(this.slugAttempts, slug, now) ||
      lockoutTriggered;

    // Update IP record
    if (ip) {
      lockoutTriggered =
        this.updateAttemptRecord(this.ipAttempts, ip, now) || lockoutTriggered;
    }

    if (lockoutTriggered) {
      this.logger.warn(
        `Lockout triggered for slug "${slug}" and/or IP "${ip}"`,
      );
    }

    return lockoutTriggered;
  }

  /**
   * Record a successful password verification
   * Resets the attempt count for the slug and IP
   */
  recordSuccess(slug: string, ip?: string): void {
    // Reset slug record
    this.slugAttempts.delete(slug);

    // Reset IP record
    if (ip) {
      this.ipAttempts.delete(ip);
    }
  }

  /**
   * Enforce maximum size limit on a Map
   * Removes oldest entries (by lastAttemptAt) when limit is exceeded
   */
  private enforceMaxSize(
    map: Map<string, AttemptRecord>,
    maxSize: number,
  ): void {
    if (map.size < maxSize) {
      return;
    }

    // Find and remove oldest entries (those without active lockouts first)
    const now = Date.now();
    const entriesToRemove: string[] = [];

    // First pass: collect entries without active lockouts
    for (const [key, record] of map.entries()) {
      const hasActiveLockout = record.lockedUntil && now < record.lockedUntil;
      if (!hasActiveLockout) {
        entriesToRemove.push(key);
      }
      // Remove enough entries to get below 90% of max size
      if (map.size - entriesToRemove.length < maxSize * 0.9) {
        break;
      }
    }

    // If still need to remove more, remove oldest by lastAttemptAt
    if (map.size - entriesToRemove.length >= maxSize) {
      const sortedEntries = Array.from(map.entries())
        .filter(([key]) => !entriesToRemove.includes(key))
        .sort((a, b) => a[1].lastAttemptAt - b[1].lastAttemptAt);

      const additionalToRemove = Math.ceil(maxSize * 0.1);
      for (let i = 0; i < additionalToRemove && i < sortedEntries.length; i++) {
        entriesToRemove.push(sortedEntries[i][0]);
      }
    }

    // Remove the collected entries
    for (const key of entriesToRemove) {
      map.delete(key);
    }

    if (entriesToRemove.length > 0) {
      this.logger.warn(
        `Rate limiter evicted ${entriesToRemove.length} entries to enforce max size limit`,
      );
    }
  }

  /**
   * Update attempt record for a key
   * @returns true if lockout was triggered
   */
  private updateAttemptRecord(
    map: Map<string, AttemptRecord>,
    key: string,
    now: number,
  ): boolean {
    let record = map.get(key);

    // Reset record if outside attempt window
    if (
      record &&
      now - record.firstAttemptAt > this.config.attemptWindowMs
    ) {
      record = undefined;
    }

    if (!record) {
      record = {
        failedAttempts: 0,
        firstAttemptAt: now,
        lastAttemptAt: now,
      };
    }

    record.failedAttempts++;
    record.lastAttemptAt = now;

    // Check if lockout should be triggered
    if (record.failedAttempts >= this.config.maxAttempts) {
      // Calculate lockout duration with exponential backoff
      const lockoutMultiplier = Math.min(
        Math.pow(2, record.failedAttempts - this.config.maxAttempts),
        this.config.maxLockoutMs / this.config.initialLockoutMs,
      );
      const lockoutDuration = Math.min(
        this.config.initialLockoutMs * lockoutMultiplier,
        this.config.maxLockoutMs,
      );

      record.lockedUntil = now + lockoutDuration;
      map.set(key, record);
      return true;
    }

    map.set(key, record);
    return false;
  }

  /**
   * Clean up stale records
   */
  private cleanup(): void {
    const now = Date.now();
    let cleanedSlug = 0;
    let cleanedIp = 0;

    // Clean up slug records
    for (const [key, record] of this.slugAttempts.entries()) {
      // Remove if lockout expired and record is stale
      const lockoutExpired = !record.lockedUntil || now >= record.lockedUntil;
      const recordStale =
        now - record.lastAttemptAt > this.config.recordExpiryMs;

      if (lockoutExpired && recordStale) {
        this.slugAttempts.delete(key);
        cleanedSlug++;
      }
    }

    // Clean up IP records
    for (const [key, record] of this.ipAttempts.entries()) {
      const lockoutExpired = !record.lockedUntil || now >= record.lockedUntil;
      const recordStale =
        now - record.lastAttemptAt > this.config.recordExpiryMs;

      if (lockoutExpired && recordStale) {
        this.ipAttempts.delete(key);
        cleanedIp++;
      }
    }

    if (cleanedSlug > 0 || cleanedIp > 0) {
      this.logger.debug(
        `Cleaned up ${cleanedSlug} slug records and ${cleanedIp} IP records`,
      );
    }
  }

  /**
   * Get current stats (for debugging/monitoring)
   */
  getStats(): {
    slugRecords: number;
    ipRecords: number;
    lockedSlugs: number;
    lockedIps: number;
    maxSlugRecords: number;
    maxIpRecords: number;
  } {
    const now = Date.now();
    let lockedSlugs = 0;
    let lockedIps = 0;

    for (const record of this.slugAttempts.values()) {
      if (record.lockedUntil && now < record.lockedUntil) {
        lockedSlugs++;
      }
    }

    for (const record of this.ipAttempts.values()) {
      if (record.lockedUntil && now < record.lockedUntil) {
        lockedIps++;
      }
    }

    return {
      slugRecords: this.slugAttempts.size,
      ipRecords: this.ipAttempts.size,
      lockedSlugs,
      lockedIps,
      maxSlugRecords: this.config.maxSlugRecords,
      maxIpRecords: this.config.maxIpRecords,
    };
  }
}
