/**
 * API Client - Unified HTTP request handling
 * Authentication via httpOnly cookies (automatically sent by browser)
 */

import { ErrorHandler } from './error-handler';

/**
 * API Error interface for typed error handling
 */
interface ApiError extends Error {
  response?: {
    status: number;
    data: Record<string, unknown>;
  };
}

/**
 * Request body type for API calls
 */
type ApiRequestBody = Record<string, unknown> | unknown[] | FormData;

/**
 * Paths that should not trigger automatic redirect on 401 errors
 * 401 errors from these endpoints are business logic errors (e.g., incorrect password) and should be handled by the caller
 */
const NO_REDIRECT_401_PATHS = [
  '/api/auth/login',
  '/api/auth/password',
  '/api/auth/2fa/enable',
  '/api/auth/2fa/disable',
];

class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4101';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Get headers with Content-Type
   */
  private getHeaders(): Record<string, string> {
    return { ...this.defaultHeaders };
  }

  /**
   * Get headers without Content-Type (for GET/DELETE)
   */
  private getHeadersWithoutContentType(): Record<string, string> {
    return {};
  }

  /**
   * Handle response
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorData: { message?: string; errors?: Record<string, string[]>; [key: string]: unknown } = { message: 'An error occurred' };

      try {
        const text = await response.text();
        errorData = text ? JSON.parse(text) as typeof errorData : { message: 'An error occurred' };
      } catch {
        errorData = { message: 'An error occurred' };
      }

      // Create error object containing status code and response data
      const error = new Error(
        errorData.message ?? `HTTP error! status: ${response.status}`
      ) as ApiError;
      error.response = {
        status: response.status,
        data: errorData,
      };

      // Log error (development environment)
      ErrorHandler.log(error, 'API Client');

      // If 401, redirect to login page (unless it's a business logic error)
      // Backend will clear the httpOnly cookie by sending Set-Cookie header
      if (response.status === 401) {
        const url = new URL(response.url);
        const shouldRedirect = !NO_REDIRECT_401_PATHS.some(path => url.pathname.includes(path));

        if (shouldRedirect && typeof window !== 'undefined') {
          // Not a whitelisted path - redirect to login
          // Backend has already cleared the expired cookie via Set-Cookie header
          const redirectUrl = window.location.pathname + window.location.search;

          // Validate redirect URL to prevent Open Redirect attacks
          // Must start with '/' and not contain '//' (prevents //evil.com)
          const safeRedirect = redirectUrl.startsWith('/') && !redirectUrl.startsWith('//')
            ? redirectUrl
            : '/';

          window.location.href = `/login?redirect=${encodeURIComponent(safeRedirect)}`;
        }
        // If whitelisted path, let error propagate to caller
        // so it can display the error message to user (e.g., "Incorrect password")
      }

      throw error;
    }

    // 204 No Content
    if (response.status === 204) {
      return null as T;
    }

    // Try to parse JSON, return null if body is empty
    const text = await response.text();
    if (!text) {
      return null as T;
    }

    try {
      return JSON.parse(text) as T;
    } catch (parseError) {
      ErrorHandler.log(parseError, 'JSON Parse Error');
      return null as T;
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, config?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: this.getHeadersWithoutContentType(),
      credentials: 'include',
      ...config,
    });
    return this.handleResponse<T>(response);
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    data?: ApiRequestBody,
    config?: RequestInit
  ): Promise<T> {
    const hasBody = data !== undefined && data !== null;
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: hasBody ? this.getHeaders() : this.getHeadersWithoutContentType(),
      ...(hasBody && { body: JSON.stringify(data) }),
      credentials: 'include',
      ...config,
    });
    return this.handleResponse<T>(response);
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    data?: ApiRequestBody,
    config?: RequestInit
  ): Promise<T> {
    const hasBody = data !== undefined && data !== null;
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: hasBody ? this.getHeaders() : this.getHeadersWithoutContentType(),
      ...(hasBody && { body: JSON.stringify(data) }),
      credentials: 'include',
      ...config,
    });
    return this.handleResponse<T>(response);
  }

  /**
   * PATCH request
   */
  async patch<T>(
    endpoint: string,
    data?: ApiRequestBody,
    config?: RequestInit
  ): Promise<T> {
    const hasBody = data !== undefined && data !== null;
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PATCH',
      headers: hasBody ? this.getHeaders() : this.getHeadersWithoutContentType(),
      ...(hasBody && { body: JSON.stringify(data) }),
      credentials: 'include',
      ...config,
    });
    return this.handleResponse<T>(response);
  }

  /**
   * DELETE request
   */
  async delete<T>(
    endpoint: string,
    config?: RequestInit & { data?: ApiRequestBody }
  ): Promise<T> {
    const { data, ...restConfig } = config || {};
    const hasBody = data !== undefined && data !== null;
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: hasBody ? this.getHeaders() : this.getHeadersWithoutContentType(),
      ...(hasBody && { body: JSON.stringify(data) }),
      credentials: 'include',
      ...restConfig,
    });
    return this.handleResponse<T>(response);
  }
}

export const apiClient = new ApiClient();
