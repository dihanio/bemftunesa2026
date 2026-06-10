import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/auth.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.role) {
      throw new ForbiddenException('Akses ditolak');
    }

    // Super Admin and KaBEM have organization-wide access.
    if (
      user.role === 'Super Admin' ||
      user.role === 'KaBEM' ||
      user.role === 'Admin Sistem'
    ) {
      return true;
    }

    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      this.logger.warn(
        `Access denied: user ${user.userId} with role "${user.role}" attempted to access route requiring [${requiredRoles.join(', ')}]`,
      );
      throw new ForbiddenException(
        'Anda tidak memiliki akses untuk resource ini',
      );
    }

    return true;
  }
}
