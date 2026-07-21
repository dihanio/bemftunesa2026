import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRED_PERMISSIONS_KEY } from '../decorators/required-permission.decorator';

interface PopulatedPermission {
  name: string;
}

interface PopulatedRole {
  permissions: PopulatedPermission[];
}

interface RequestUser {
  role: PopulatedRole | string;
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      REQUIRED_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user: RequestUser }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // JwtStrategy already populates user.role with full role document
    const role = user.role as PopulatedRole;

    if (!role) {
      throw new ForbiddenException('Invalid role configuration (no role)');
    }

    if (!Array.isArray(role.permissions)) {
      throw new ForbiddenException('Invalid role configuration (permissions not populated)');
    }

    const userPermissions = role.permissions.map((p) => p.name);

    const hasAllPermissions = userPermissions.includes('manage:all') || requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
