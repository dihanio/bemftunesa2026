import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

export interface ResponseEnvelope<T> {
  success: boolean;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ResponseEnvelope<T>>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<ResponseEnvelope<T>> {
    return next.handle().pipe(
      map((result) => {
        if (result && typeof result === 'object' && 'success' in result) {
          return result;
        }

        return {
          success: true,
          data: result ?? null,
        };
      }),
    );
  }
}
