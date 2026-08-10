import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRED_PERMISSIONS_KEY } from '../decorators/required-permission.decorator';

interface PermissionItem {
  name: string;
}

interface RoleItem {
  slug?: string;
  name?: string;
  permissions?: (PermissionItem | string)[];
}

interface AuthenticatedUserRequest {
  permissions?: string[];
  role?: RoleItem | string;
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      REQUIRED_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      user?: AuthenticatedUserRequest;
    }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Akses ditolak: Autentikasi diperlukan.');
    }

    // Extract user permissions from JwtStrategy user payload
    const userPermissions: string[] = [];

    if (Array.isArray(user.permissions)) {
      userPermissions.push(...user.permissions);
    }

    if (
      user.role &&
      typeof user.role === 'object' &&
      Array.isArray(user.role.permissions)
    ) {
      user.role.permissions.forEach((p) => {
        if (typeof p === 'string') {
          userPermissions.push(p);
        } else if (p && typeof p === 'object' && 'name' in p) {
          userPermissions.push(p.name);
        }
      });
    }

    const uniquePermissions = Array.from(new Set(userPermissions));

    // Super Admin wildcard permission
    if (uniquePermissions.includes('manage:all')) {
      return true;
    }

    const hasPermission = requiredPermissions.some((permission) =>
      uniquePermissions.includes(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `Akses ditolak: Anda tidak memiliki izin [${requiredPermissions.join(', ')}].`,
      );
    }

    return true;
  }
}
