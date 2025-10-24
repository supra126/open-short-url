import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';

@Injectable()
export class LoggerService implements NestLoggerService {
  constructor(private logger: winston.Logger) {}

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, {
      context,
      stack: trace,
    });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.debug(message, { context, level: 'verbose' });
  }

  setContext(context: string) {
    // This method is used to set the context
  }

  /**
   * Log HTTP request information
   */
  logHttpRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    userId?: string,
    ip?: string,
  ) {
    const message = `${method} ${url} - ${statusCode}`;
    this.logger.info(message, {
      context: 'HTTP',
      method,
      url,
      statusCode,
      duration,
      userId,
      ip,
    });
  }

  /**
   * Log database queries
   */
  logDatabaseQuery(query: string, duration: number, isSlowQuery: boolean = false) {
    const level = isSlowQuery ? 'warn' : 'debug';
    const message = `Database Query${isSlowQuery ? ' (SLOW)' : ''}`;
    this.logger[level](message, {
      context: 'Database',
      query: query.substring(0, 200),
      duration,
      isSlowQuery,
    });
  }

  /**
   * Log cache operations
   */
  logCacheOperation(
    operation: 'GET' | 'SET' | 'DEL' | 'EXPIRE',
    key: string,
    duration?: number,
    error?: string,
  ) {
    const level = error ? 'error' : 'debug';
    const message = `Cache ${operation}: ${key}`;
    this.logger[level](message, {
      context: 'Cache',
      operation,
      key,
      duration,
      error,
    });
  }
}
