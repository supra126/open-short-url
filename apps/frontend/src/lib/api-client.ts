/**
 * API Client - Unified HTTP request handling
 * Authentication via httpOnly cookies (automatically sent by browser)
 */

import { ErrorHandler } from './error-handler';

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
      let errorData;

      try {
        const text = await response.text();
        errorData = text ? JSON.parse(text) : { message: 'An error occurred' };
      } catch {
        errorData = { message: 'An error occurred' };
      }

      // Create error object containing status code and response data
      const error: any = new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
      error.response = {
        status: response.status,
        data: errorData,
      };

      // Log error (development environment)
      ErrorHandler.log(error, 'API Client');

      // If 401, redirect to login page (unless already on login page)
      // Backend will clear the httpOnly cookie by sending Set-Cookie header
      if (response.status === 401) {
        const isOnLoginPage = typeof window !== 'undefined' && window.location.pathname === '/login';

        if (!isOnLoginPage) {
          // Not on login page - redirect to login
          // Backend has already cleared the expired cookie via Set-Cookie header
          if (typeof window !== 'undefined') {
            const redirectUrl = window.location.pathname + window.location.search;
            window.location.href = `/login?redirect=${encodeURIComponent(redirectUrl)}`;
          }
        }
        // If already on login page, let error propagate to login form
        // so it can display the error message to user
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
      return JSON.parse(text);
    } catch (error) {
      console.error('Failed to parse JSON response:', error);
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
    data?: any,
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
    data?: any,
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
    data?: any,
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
  async delete<T>(endpoint: string, config?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeadersWithoutContentType(),
      credentials: 'include',
      ...config,
    });
    return this.handleResponse<T>(response);
  }
}

export const apiClient = new ApiClient();
