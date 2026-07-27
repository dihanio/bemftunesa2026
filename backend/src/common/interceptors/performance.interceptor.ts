import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Performance');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        const response = context.switchToHttp().getResponse<Response>();
        const { statusCode } = response;

        if (duration > 500) {
          this.logger.warn(
            `SLOW REQUEST: ${method} ${url} ${statusCode} ${duration}ms`,
          );
        }

        if (process.env.NODE_ENV !== 'production') {
          this.logger.debug(`${method} ${url} ${statusCode} ${duration}ms`);
        }

        response.setHeader('X-Response-Time', `${duration}ms`);
      }),
    );
  }
}
