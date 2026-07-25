import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

interface RequestUser {
  role: { name?: string; slug?: string } | string;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user: RequestUser }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    const role = user.role;

    if (!role) {
      throw new ForbiddenException('Invalid role configuration (no role)');
    }

    const roleName = typeof role === 'object' ? role.name || '' : String(role);
    const roleSlug = typeof role === 'object' ? role.slug || '' : String(role);

    const normRequired = requiredRoles.map((r) => r.toLowerCase());

    const userAliases = [
      roleName.toLowerCase(),
      roleSlug.toLowerCase(),
    ];

    // If user's role slug/name is 'user', treat as 'maba'
    if (roleSlug.toLowerCase() === 'user' || roleName.toLowerCase() === 'user') {
      userAliases.push('maba');
    }

    const hasRole = userAliases.some((alias) => normRequired.includes(alias));

    // Super Admin has full access
    if (
      roleName.toLowerCase() === 'super admin' ||
      roleSlug.toLowerCase() === 'super-admin' ||
      hasRole
    ) {
      return true;
    }

    throw new ForbiddenException('Insufficient role permissions');
  }
}
