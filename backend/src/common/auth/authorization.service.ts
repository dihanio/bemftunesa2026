import { Injectable, ForbiddenException } from '@nestjs/common';
import { AppPermission } from './permissions';

import { Types } from 'mongoose';

export interface UserContext {
  userId: string | Types.ObjectId;
  activeRoleId: string | Types.ObjectId;
  permissions: AppPermission[];
}

@Injectable()
export class AuthorizationService {
  /**
   * Checks if the user has the required permission.
   * Throws ForbiddenException if they don't.
   */
  require(user: UserContext, requiredPermission: AppPermission): void {
    if (!this.can(user, requiredPermission)) {
      throw new ForbiddenException(`Missing required permission: ${requiredPermission}`);
    }
  }

  /**
   * Returns boolean indicating if user has the permission.
   */
  can(user: UserContext, requiredPermission: AppPermission): boolean {
    if (!user || !user.permissions || !Array.isArray(user.permissions)) {
      return false;
    }
    return user.permissions.includes(requiredPermission);
  }

  /**
   * Require at least one of the permissions.
   */
  requireAny(user: UserContext, requiredPermissions: AppPermission[]): void {
    if (!this.canAny(user, requiredPermissions)) {
      throw new ForbiddenException(`Missing at least one required permission: ${requiredPermissions.join(', ')}`);
    }
  }

  canAny(user: UserContext, requiredPermissions: AppPermission[]): boolean {
    if (!user || !user.permissions || !Array.isArray(user.permissions)) {
      return false;
    }
    return requiredPermissions.some(perm => user.permissions.includes(perm));
  }
}
