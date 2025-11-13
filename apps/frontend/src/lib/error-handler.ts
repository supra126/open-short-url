/**
 * Unified error handling mechanism
 */

import { t } from './i18n';

/**
 * API error types
 */
export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Standardized error interface
 */
export interface StandardError {
  type: ErrorType;
  message: string;
  statusCode?: number;
  details?: any;
}

/**
 * Get error message from i18n
 * Maps ErrorType to i18n key
 */
function getErrorMessage(type: ErrorType): string {
  const errorKeys = {
    [ErrorType.NETWORK]: 'errors.network',
    [ErrorType.AUTHENTICATION]: 'errors.authentication',
    [ErrorType.AUTHORIZATION]: 'errors.authorization',
    [ErrorType.VALIDATION]: 'errors.validation',
    [ErrorType.NOT_FOUND]: 'errors.notFound',
    [ErrorType.SERVER]: 'errors.server',
    [ErrorType.UNKNOWN]: 'errors.unknown',
  } as const;

  return t(errorKeys[type]);
}

/**
 * Error handler class
 */
export class ErrorHandler {
  /**
   * Handle API errors
   * @param error - Original error object
   * @returns Standardized error
   */
  static handle(error: any): StandardError {
    // Network error
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      return {
        type: ErrorType.NETWORK,
        message: getErrorMessage(ErrorType.NETWORK),
      };
    }

    // HTTP error
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      // 401 Unauthorized
      if (status === 401) {
        // Token is cleared by backend (httpOnly cookie is automatically removed)
        return {
          type: ErrorType.AUTHENTICATION,
          message: data?.message || getErrorMessage(ErrorType.AUTHENTICATION),
          statusCode: status,
        };
      }

      // 403 Forbidden
      if (status === 403) {
        return {
          type: ErrorType.AUTHORIZATION,
          message: data?.message || getErrorMessage(ErrorType.AUTHORIZATION),
          statusCode: status,
        };
      }

      // 404 Not Found
      if (status === 404) {
        return {
          type: ErrorType.NOT_FOUND,
          message: data?.message || getErrorMessage(ErrorType.NOT_FOUND),
          statusCode: status,
        };
      }

      // 422 Validation Error
      if (status === 422 || status === 400) {
        return {
          type: ErrorType.VALIDATION,
          message: data?.message || getErrorMessage(ErrorType.VALIDATION),
          statusCode: status,
          details: data?.errors,
        };
      }

      // 500+ Server Error
      if (status >= 500) {
        return {
          type: ErrorType.SERVER,
          message: getErrorMessage(ErrorType.SERVER),
          statusCode: status,
        };
      }
    }

    // Error object
    if (error instanceof Error) {
      return {
        type: ErrorType.UNKNOWN,
        message: error.message || getErrorMessage(ErrorType.UNKNOWN),
      };
    }

    // String error
    if (typeof error === 'string') {
      return {
        type: ErrorType.UNKNOWN,
        message: error,
      };
    }

    // Unknown error
    return {
      type: ErrorType.UNKNOWN,
      message: getErrorMessage(ErrorType.UNKNOWN),
    };
  }

  /**
   * Get user-friendly error message
   * @param error - Original error
   * @returns User-friendly error message
   */
  static getMessage(error: any): string {
    const standardError = this.handle(error);
    return standardError.message;
  }

  /**
   * Check if currently on login page
   * @returns Whether on login page
   */
  static isOnLoginPage(): boolean {
    if (typeof window === 'undefined') return false;
    return window.location.pathname === '/login';
  }

  /**
   * Log error (development environment)
   * @param error - Error object
   * @param context - Error context
   */
  static log(error: any, context?: string): void {
    if (process.env.NODE_ENV === 'development') {
      const standardError = this.handle(error);

      // Silently handle 401 errors in non-login pages (will redirect)
      // On login page, 401 errors will be handled by the form (display error message)
      if (standardError.statusCode === 401 && !this.isOnLoginPage()) {
        return;
      }

      console.group(`❌ Error ${context ? `[${context}]` : ''}`);
      console.error('Original Error:', error);
      console.error('Standardized:', standardError);
      console.groupEnd();
    }
  }

  /**
   * Check if it's an authentication error
   * @param error - Error object
   * @returns Whether it's an authentication error
   */
  static isAuthError(error: any): boolean {
    const standardError = this.handle(error);
    return standardError.type === ErrorType.AUTHENTICATION;
  }

  /**
   * Check if it's a network error
   * @param error - Error object
   * @returns Whether it's a network error
   */
  static isNetworkError(error: any): boolean {
    const standardError = this.handle(error);
    return standardError.type === ErrorType.NETWORK;
  }
}
