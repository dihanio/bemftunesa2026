import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // No specific roles required
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.role || !user.role.slug) {
      throw new ForbiddenException('Access denied. No role found.');
    }

    const hasRole = requiredRoles.includes(user.role.slug);
    
    if (!hasRole) {
      throw new ForbiddenException(`Access denied. Requires one of the following roles: ${requiredRoles.join(', ')}`);
    }

    return true;
  }
}
