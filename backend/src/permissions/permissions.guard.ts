import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRED_PERMISSIONS_KEY } from './permissions.decorator';
import { PermissionsService } from './permissions.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      REQUIRED_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.userId) {
      throw new ForbiddenException('Autentikasi diperlukan');
    }

    if (
      user.role === 'Admin Sistem' ||
      user.role === 'System Administrator' ||
      user.role === 'Super Admin'
    ) {
      return true;
    }

    const decision = await this.permissionsService.assertAnyPermission(
      user.userId,
      requiredPermissions,
    );

    if (!decision.allowed) {
      throw new ForbiddenException(
        `Akses ditolak. Dibutuhkan permission: ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }
}
