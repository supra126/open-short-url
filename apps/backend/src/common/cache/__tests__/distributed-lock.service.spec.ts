import { Test, TestingModule } from '@nestjs/testing';
import { DistributedLockService } from '../distributed-lock.service';
import { CacheService } from '../cache.service';
import { LoggerService } from '../../logger/logger.service';
import Redis from 'ioredis';

describe('DistributedLockService', () => {
  let service: DistributedLockService;
  let cacheService: jest.Mocked<CacheService>;
  let loggerService: jest.Mocked<LoggerService>;
  let mockRedisClient: Pick<Redis, 'set' | 'eval'> & {
    set: jest.Mock;
    eval: jest.Mock;
  };

  beforeEach(async () => {
    mockRedisClient = {
      set: jest.fn(),
      eval: jest.fn(),
    };

    const mockCacheService = {
      getClient: jest.fn(),
      isAvailable: jest.fn(),
    };

    const mockLoggerService = {
      log: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DistributedLockService,
        { provide: CacheService, useValue: mockCacheService },
        { provide: LoggerService, useValue: mockLoggerService },
      ],
    }).compile();

    service = module.get<DistributedLockService>(DistributedLockService);
    cacheService = module.get(CacheService);
    loggerService = module.get(LoggerService);
  });

  describe('acquire', () => {
    it('should return acquired=false when Redis is not available', async () => {
      cacheService.getClient.mockReturnValue(null);

      const result = await service.acquire('test-resource');

      expect(result.acquired).toBe(false);
      expect(result.lockId).toBeNull();
      expect(loggerService.debug).toHaveBeenCalled();
    });

    it('should acquire lock successfully when Redis returns OK', async () => {
      cacheService.getClient.mockReturnValue(mockRedisClient as unknown as Redis);
      mockRedisClient.set.mockResolvedValue('OK');

      const result = await service.acquire('test-resource', 5000);

      expect(result.acquired).toBe(true);
      expect(result.lockId).toBeTruthy();
      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'lock:test-resource',
        expect.any(String),
        'PX',
        5000,
        'NX',
      );
    });

    it('should return acquired=false when lock is already held', async () => {
      cacheService.getClient.mockReturnValue(mockRedisClient as unknown as Redis);
      mockRedisClient.set.mockResolvedValue(null);

      const result = await service.acquire('test-resource');

      expect(result.acquired).toBe(false);
      expect(result.lockId).toBeNull();
    });

    it('should handle Redis errors gracefully', async () => {
      cacheService.getClient.mockReturnValue(mockRedisClient as unknown as Redis);
      mockRedisClient.set.mockRejectedValue(new Error('Redis connection error'));

      const result = await service.acquire('test-resource');

      expect(result.acquired).toBe(false);
      expect(result.lockId).toBeNull();
      expect(loggerService.error).toHaveBeenCalled();
    });
  });

  describe('release', () => {
    it('should return false when lockId is null', async () => {
      const result = await service.release('test-resource', null);

      expect(result).toBe(false);
    });

    it('should return false when Redis is not available', async () => {
      cacheService.getClient.mockReturnValue(null);

      const result = await service.release('test-resource', 'lock-id-123');

      expect(result).toBe(false);
    });

    it('should release lock successfully when lockId matches', async () => {
      cacheService.getClient.mockReturnValue(mockRedisClient as unknown as Redis);
      mockRedisClient.eval.mockResolvedValue(1);

      const result = await service.release('test-resource', 'lock-id-123');

      expect(result).toBe(true);
      expect(mockRedisClient.eval).toHaveBeenCalledWith(
        expect.any(String),
        1,
        'lock:test-resource',
        'lock-id-123',
      );
    });

    it('should return false when lockId does not match', async () => {
      cacheService.getClient.mockReturnValue(mockRedisClient as unknown as Redis);
      mockRedisClient.eval.mockResolvedValue(0);

      const result = await service.release('test-resource', 'wrong-lock-id');

      expect(result).toBe(false);
    });

    it('should handle Redis errors gracefully', async () => {
      cacheService.getClient.mockReturnValue(mockRedisClient as unknown as Redis);
      mockRedisClient.eval.mockRejectedValue(new Error('Redis error'));

      const result = await service.release('test-resource', 'lock-id-123');

      expect(result).toBe(false);
      expect(loggerService.error).toHaveBeenCalled();
    });
  });

  describe('acquireWithRetry', () => {
    it('should acquire lock on first attempt', async () => {
      cacheService.getClient.mockReturnValue(mockRedisClient as unknown as Redis);
      mockRedisClient.set.mockResolvedValue('OK');

      const result = await service.acquireWithRetry('test-resource', 5000, 3, 100);

      expect(result.acquired).toBe(true);
      expect(mockRedisClient.set).toHaveBeenCalledTimes(1);
    });

    it('should retry and eventually acquire lock', async () => {
      cacheService.getClient.mockReturnValue(mockRedisClient as unknown as Redis);
      mockRedisClient.set
        .mockResolvedValueOnce(null) // First attempt fails
        .mockResolvedValueOnce(null) // Second attempt fails
        .mockResolvedValueOnce('OK'); // Third attempt succeeds

      const result = await service.acquireWithRetry('test-resource', 5000, 3, 10);

      expect(result.acquired).toBe(true);
      expect(mockRedisClient.set).toHaveBeenCalledTimes(3);
    });

    it('should return acquired=false after all retries fail', async () => {
      cacheService.getClient.mockReturnValue(mockRedisClient as unknown as Redis);
      mockRedisClient.set.mockResolvedValue(null);

      const result = await service.acquireWithRetry('test-resource', 5000, 2, 10);

      expect(result.acquired).toBe(false);
      expect(mockRedisClient.set).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe('withLock', () => {
    it('should execute function and release lock on success', async () => {
      cacheService.getClient.mockReturnValue(mockRedisClient as unknown as Redis);
      mockRedisClient.set.mockResolvedValue('OK');
      mockRedisClient.eval.mockResolvedValue(1);

      const fn = jest.fn().mockResolvedValue('result');

      const result = await service.withLock('test-resource', 5000, fn);

      expect(result.success).toBe(true);
      expect(result.result).toBe('result');
      expect(result.lockAcquired).toBe(true);
      expect(fn).toHaveBeenCalled();
      expect(mockRedisClient.eval).toHaveBeenCalled(); // Lock released
    });

    it('should release lock even when function throws', async () => {
      cacheService.getClient.mockReturnValue(mockRedisClient as unknown as Redis);
      mockRedisClient.set.mockResolvedValue('OK');
      mockRedisClient.eval.mockResolvedValue(1);

      const fn = jest.fn().mockRejectedValue(new Error('Function error'));

      await expect(service.withLock('test-resource', 5000, fn)).rejects.toThrow(
        'Function error',
      );

      expect(mockRedisClient.eval).toHaveBeenCalled(); // Lock released
    });

    it('should return success=false when lock acquisition fails', async () => {
      cacheService.getClient.mockReturnValue(mockRedisClient as unknown as Redis);
      mockRedisClient.set.mockResolvedValue(null);

      const fn = jest.fn();

      const result = await service.withLock('test-resource', 5000, fn);

      expect(result.success).toBe(false);
      expect(result.lockAcquired).toBe(false);
      expect(fn).not.toHaveBeenCalled();
    });

    it('should throw when throwOnLockFailure is true and lock fails', async () => {
      cacheService.getClient.mockReturnValue(mockRedisClient as unknown as Redis);
      mockRedisClient.set.mockResolvedValue(null);

      const fn = jest.fn();

      await expect(
        service.withLock('test-resource', 5000, fn, { throwOnLockFailure: true }),
      ).rejects.toThrow('Failed to acquire lock for resource: test-resource');

      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe('isAvailable', () => {
    it('should return true when cache service is available', () => {
      cacheService.isAvailable.mockReturnValue(true);

      expect(service.isAvailable()).toBe(true);
    });

    it('should return false when cache service is not available', () => {
      cacheService.isAvailable.mockReturnValue(false);

      expect(service.isAvailable()).toBe(false);
    });
  });
});
