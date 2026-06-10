import { Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';

const logger = new Logger('HTTP');

export function requestLoggingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const requestId = (req.headers['x-request-id'] as string) || randomUUID();
  const startedAt = Date.now();

  res.setHeader('x-request-id', requestId);

  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;

    if (process.env.NODE_ENV !== 'production') {
      const statusColor =
        res.statusCode >= 500
          ? '\x1b[31m'
          : res.statusCode >= 400
            ? '\x1b[33m'
            : '\x1b[32m';
      const reset = '\x1b[0m';
      logger.log(
        `${req.method} ${req.originalUrl} ${statusColor}${res.statusCode}${reset} - ${durationMs}ms`,
      );
    } else {
      const logEntry = {
        level: res.statusCode >= 500 ? 'error' : 'info',
        requestId,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs,
        userAgent: req.headers['user-agent'] || 'unknown',
      };
      console.log(JSON.stringify(logEntry));
    }
  });

  next();
}
