import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { FastifyRequest } from 'fastify';

/**
 * Request metadata for audit logging
 */
export interface RequestMeta {
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Decorator to extract request metadata (IP address and User Agent)
 * Used for audit logging
 *
 * @example
 * @Post()
 * async create(
 *   @CurrentUser() user: User,
 *   @RequestMeta() meta: RequestMeta,
 *   @Body() dto: CreateDto,
 * ) {
 *   // meta.ipAddress and meta.userAgent available
 * }
 */
export const RequestMeta = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestMeta => {
    const request = ctx.switchToHttp().getRequest<FastifyRequest>();

    // Extract IP address
    let ipAddress: string | undefined;

    // Check trusted proxy headers first
    const forwarded = request.headers['x-forwarded-for'] as string;
    if (forwarded) {
      ipAddress = forwarded.split(',')[0].trim();
    } else {
      const realIp = request.headers['x-real-ip'] as string;
      if (realIp) {
        ipAddress = realIp;
      } else {
        ipAddress = request.ip;
      }
    }

    // Extract User Agent
    const userAgent = request.headers['user-agent'] as string | undefined;

    return {
      ipAddress,
      userAgent,
    };
  },
);
