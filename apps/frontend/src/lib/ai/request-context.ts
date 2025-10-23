/**
 * Request Context for AI Tools
 * Uses AsyncLocalStorage to store request-scoped data
 * This allows tools to access user authentication via cookies
 */

import { AsyncLocalStorage } from 'async_hooks';

interface RequestContext {
  cookies: string; // Store cookies for MCP API Client authentication
}

const requestContext = new AsyncLocalStorage<RequestContext>();

/**
 * Run a function with request context
 */
export function runWithContext<T>(
  context: RequestContext,
  fn: () => T
): T {
  return requestContext.run(context, fn);
}

/**
 * Get the current request context
 */
export function getContext(): RequestContext {
  const context = requestContext.getStore();
  if (!context) {
    throw new Error('No request context available. Tools must be called within a request context.');
  }
  return context;
}

/**
 * Get the cookies from current context
 * Used for creating MCP API clients with user authentication
 */
export function getCookies(): string {
  return getContext().cookies;
}
