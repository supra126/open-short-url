import { Injectable } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';
import { LoggerService } from './logger.service';

/**
 * Fastify Hook for HTTP request/response logging
 * Tracks request IDs, response times, and errors
 */
@Injectable()
export class HttpLoggerMiddleware {
  constructor(private loggerService: LoggerService) {}

  /**
   * Register logging hooks on Fastify server
   * Call this in main.ts during bootstrap
   */
  registerHooks(fastifyInstance: any) {
    // Track request timing and metadata
    fastifyInstance.addHook('onRequest', async (req: FastifyRequest, reply: FastifyReply) => {
      // 為請求生成唯一 ID（用於追蹤）
      const requestId = randomUUID();
      const startTime = Date.now();

      // 將 requestId 添加到請求對象
      (req as any).requestId = requestId;

      // 獲取客戶端 IP
      const ip = req.ip || 'unknown';

      // 獲取用戶 ID（如果認證了）
      const userId = (req as any).user?.id || null;

      // Store metadata on request for later use in onResponse hook
      (req as any)._startTime = startTime;
      (req as any)._userId = userId;
      (req as any)._ip = ip;
    });

    // Log response information
    fastifyInstance.addHook('onResponse', async (req: FastifyRequest, reply: FastifyReply) => {
      const startTime = (req as any)._startTime || Date.now();
      const userId = (req as any)._userId || null;
      const ip = (req as any)._ip || 'unknown';
      const duration = Date.now() - startTime;

      // 記錄響應信息
      this.loggerService.logHttpRequest(
        req.method,
        req.url,
        reply.statusCode,
        duration,
        userId,
        ip,
      );

      // 記錄詳細信息
      const logLevel = reply.statusCode >= 500 ? 'error' : 'log';
      this.loggerService[logLevel](
        `${req.method} ${req.url} - ${reply.statusCode} (${duration}ms)`,
        'HTTP',
      );

      // 如果是錯誤響應，記錄警告信息
      if (reply.statusCode >= 400 && reply.statusCode < 500) {
        this.loggerService.warn(
          `HTTP ${reply.statusCode}: ${req.method} ${req.url}`,
          'HTTP',
        );
      }
    });
  }
}
