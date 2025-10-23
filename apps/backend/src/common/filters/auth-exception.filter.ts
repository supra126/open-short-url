import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  UnauthorizedException,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';

/**
 * Authentication Exception Filter
 *
 * Catches UnauthorizedException and clears httpOnly cookie
 * This prevents infinite redirect loop when token validation fails:
 * 1. Client sends request with expired cookie
 * 2. Backend returns 401 with Set-Cookie to clear token
 * 3. Client removes cookie on next navigation
 * 4. Middleware allows access to login page (no cookie present)
 */
@Catch(UnauthorizedException)
export class AuthExceptionFilter implements ExceptionFilter {
  catch(exception: UnauthorizedException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const status = exception.getStatus();

    // Clear the access_token cookie by setting Set-Cookie header
    // Manually construct the Set-Cookie header since Fastify doesn't have .cookie() method
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    const setCookieValue = `access_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;

    response.header('Set-Cookie', setCookieValue);

    // Also try to clear with domain explicitly set
    const domain = process.env.COOKIE_DOMAIN;
    if (domain) {
      const domainValue = domain.startsWith('.') ? domain : '.' + domain;
      const setCookieWithDomain = `access_token=; Path=/; Domain=${domainValue}; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
      response.header('Set-Cookie', setCookieWithDomain);
    }

    response.code(status).send({
      statusCode: status,
      message: exception.message || 'Unauthorized',
      error: 'Unauthorized',
    });
  }
}
