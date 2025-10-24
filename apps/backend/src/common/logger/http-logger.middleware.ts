import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggerService } from './logger.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  constructor(private loggerService: LoggerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // 為請求生成唯一 ID（用於追蹤）
    const requestId = uuidv4();
    const startTime = Date.now();

    // 將 requestId 添加到請求對象
    (req as any).requestId = requestId;

    // 獲取客戶端 IP
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      req.socket.remoteAddress ||
      'unknown';

    // 獲取用戶 ID（如果認證了）
    const userId = (req as any).user?.id || null;

    // 記錄請求
    const logData = {
      requestId,
      method: req.method,
      url: req.originalUrl,
      path: req.path,
      ip,
      userId,
      userAgent: req.headers['user-agent'],
    };

    // 攔截響應
    const originalSend = res.send;
    res.send = function (data: any) {
      // 計算耗時
      const duration = Date.now() - startTime;

      // 記錄響應
      this.loggerService.logHttpRequest(
        req.method,
        req.originalUrl,
        res.statusCode,
        duration,
        userId,
        ip,
      );

      // 記錄詳細信息
      const logLevel = res.statusCode >= 500 ? 'error' : 'info';
      this.loggerService[logLevel](
        `${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`,
        'HTTP',
      );

      // 如果是錯誤響應，記錄更詳細的信息
      if (res.statusCode >= 400) {
        try {
          const responseData = typeof data === 'string' ? JSON.parse(data) : data;
          this.loggerService.error(
            `HTTP Error: ${res.statusCode}`,
            JSON.stringify(responseData),
            'HTTP',
          );
        } catch {
          // 忽略 JSON 解析錯誤
        }
      }

      // 調用原始的 send 方法
      return originalSend.call(this, data);
    };

    next();
  }
}
