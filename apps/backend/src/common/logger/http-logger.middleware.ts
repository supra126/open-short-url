import { Injectable } from '@nestjs/common';
import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';
import { LoggerService } from './logger.service';
import { User } from '@prisma/client';

/**
 * Extended request interface with custom metadata
 */
interface ExtendedRequest extends FastifyRequest {
  requestId?: string;
  _startTime?: number;
  _userId?: string | null;
  _ip?: string;
  user?: User;
}

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
  registerHooks(fastifyInstance: FastifyInstance) {
    // Track request timing and metadata
    fastifyInstance.addHook('onRequest', async (req: FastifyRequest, _reply: FastifyReply) => {
      const extReq = req as ExtendedRequest;
      // Generate unique request ID for tracking
      const requestId = randomUUID();
      const startTime = Date.now();

      // Add requestId to request object
      extReq.requestId = requestId;

      // Get client IP
      const ip = req.ip || 'unknown';

      // Get user ID (if authenticated)
      const userId = extReq.user?.id || null;

      // Store metadata on request for later use in onResponse hook
      extReq._startTime = startTime;
      extReq._userId = userId;
      extReq._ip = ip;
    });

    // Log response information
    fastifyInstance.addHook('onResponse', async (req: FastifyRequest, reply: FastifyReply) => {
      const extReq = req as ExtendedRequest;
      const startTime = extReq._startTime ?? Date.now();
      const userId = extReq._userId ?? null;
      const ip = extReq._ip ?? 'unknown';
      const duration = Date.now() - startTime;

      // Log response information
      this.loggerService.logHttpRequest(
        req.method,
        req.url,
        reply.statusCode,
        duration,
        userId ?? undefined,
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
