import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PkkmbPermission } from '../../common/auth/pkkmb-permissions';

interface RequestUserPayload {
  userId: string;
  pkkmbGroup?: string;
  permissions?: string[];
  role?: { slug?: string };
}

@Injectable()
export class OwnershipGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      user?: RequestUserPayload;
      params?: Record<string, string>;
      body?: Record<string, string>;
    }>();

    const user = request.user;
    if (!user) {
      throw new ForbiddenException('Akses ditolak: Autentikasi diperlukan.');
    }

    const userPermissions = user.permissions || [];
    const isSuperOrAdmin =
      userPermissions.includes(PkkmbPermission.MANAGE_ALL) ||
      userPermissions.includes(PkkmbPermission.GROUP_READ_ALL) ||
      userPermissions.includes(PkkmbPermission.PROFILE_READ_ALL);

    if (isSuperOrAdmin) {
      return true; // Bypass ownership check for super admins/admins
    }

    const targetUserId = request.params?.userId || request.params?.id || request.body?.userId;
    const targetGroupId = request.params?.groupId || request.body?.groupId;

    // Self profile check
    if (targetUserId && targetUserId !== user.userId) {
      throw new ForbiddenException(
        'Akses ditolak: Anda hanya dapat mengakses data milik Anda sendiri.',
      );
    }

    // Mentor group check
    if (targetGroupId && user.pkkmbGroup && targetGroupId !== user.pkkmbGroup) {
      throw new ForbiddenException(
        'Akses ditolak: Anda hanya dapat mengelola kelompok binaan Anda sendiri.',
      );
    }

    return true;
  }
}
