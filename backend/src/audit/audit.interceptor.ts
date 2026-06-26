import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditService } from './audit.service';

interface AuditMeta {
  action: string;
  entity: string;
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();
    const meta: AuditMeta | undefined = Reflect.getMetadata('audit', handler);

    if (!meta || !request.user) {
      return next.handle();
    }

    const before = request.body ? { ...request.body } : undefined;

    return next.handle().pipe(
      tap((response) => {
        const entityId =
          request.params?.id ||
          response?.data?._id?.toString() ||
          'unknown';

        this.auditService.log({
          user: request.user._id.toString(),
          userName: request.user.name,
          action: meta.action,
          entity: meta.entity,
          entityId,
          summary: `${meta.action} ${meta.entity} ${entityId}`,
          changes: before
            ? { before, after: response?.data }
            : undefined,
        }).catch(() => {
          // Silently fail audit logging
        });
      }),
    );
  }
}

export function Auditable(action: string, entity: string) {
  return (target: unknown, _key?: string, descriptor?: PropertyDescriptor) => {
    if (descriptor) {
      Reflect.defineMetadata('audit', { action, entity }, descriptor.value);
      return descriptor;
    }
    Reflect.defineMetadata('audit', { action, entity }, target as object);
    return target;
  };
}
