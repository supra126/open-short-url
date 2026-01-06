import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@prisma/client';
import { FastifyRequest } from 'fastify';

/**
 * Extended request interface with user property
 */
interface RequestWithUser extends FastifyRequest {
  user?: User;
}

/**
 * Custom decorator to get current user from request
 * Usage: @CurrentUser() user: User
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User | undefined => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  }
);
