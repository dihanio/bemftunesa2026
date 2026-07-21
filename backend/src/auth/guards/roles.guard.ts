import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

interface RequestUser {
  role: any;
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

    // Role should be populated by JwtAuthGuard
    const role = user.role;

    if (!role) {
      throw new ForbiddenException('Invalid role configuration (no role)');
    }

    // Assume role document has a 'name' field based on role.schema.ts
    const roleName = role.name || role;

    const hasRole = requiredRoles.includes(roleName);

    // Super Admin has all access
    if (roleName === 'Super Admin' || hasRole) {
      return true;
    }

    throw new ForbiddenException('Insufficient role permissions');
  }
}
