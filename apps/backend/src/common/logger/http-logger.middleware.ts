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
      // Generate unique request ID for tracking
      const requestId = randomUUID();
      const startTime = Date.now();

      // Add requestId to request object
      (req as any).requestId = requestId;

      // Get client IP
      const ip = req.ip || 'unknown';

      // Get user ID (if authenticated)
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

      // Log response information
      this.loggerService.logHttpRequest(
        req.method,
        req.url,
        reply.statusCode,
        duration,
        userId,
        ip,
      );

      // Log detailed information
      const logLevel = reply.statusCode >= 500 ? 'error' : 'log';
      this.loggerService[logLevel](
        `${req.method} ${req.url} - ${reply.statusCode} (${duration}ms)`,
        'HTTP',
      );

      // If error response, log warning information
      if (reply.statusCode >= 400 && reply.statusCode < 500) {
        this.loggerService.warn(
          `HTTP ${reply.statusCode}: ${req.method} ${req.url}`,
          'HTTP',
        );
      }
    });
  }
}
