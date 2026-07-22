import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || '';
    const startTime = Date.now();

    res.on('finish', () => {
      const { statusCode } = res;
      const duration = Date.now() - startTime;
      const requestId =
        (req as Request & { requestId?: string }).requestId || '-';

      const logMessage = `${method} ${originalUrl} ${statusCode} - ${duration}ms`;

      // Pass request ID and IP in the metadata block
      this.logger.log(logMessage, undefined, {
        requestId,
        ip,
        userAgent,
        durationMs: duration,
        statusCode,
      } as unknown as string);
    });

    next();
  }
}
