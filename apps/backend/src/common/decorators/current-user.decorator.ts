import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Custom decorator to get current user from request
 * Usage: @CurrentUser() user: User
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  }
);
