import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  DEFAULT_ROLE_GRANTS,
  PERMISSION_CATALOG,
  evaluatePermission,
  listPermissionsForRoles,
  getInheritedRoles,
} from '@bemft/permissions';
import type {
  AccessScope,
  PermissionGrant,
  PermissionResource,
  PermissionSubject,
} from '@bemft/types';
import {
  Permission,
  Role,
  RolePermission,
  UserPermission,
  UserRole,
} from '../database/schema/security';
import { User } from '../database/schema/users';

type MongoScope = { type?: string; id?: string };

@Injectable()
export class PermissionsService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Role.name) private readonly roleModel: Model<Role>,
    @InjectModel(Permission.name)
    private readonly permissionModel: Model<Permission>,
    @InjectModel(UserRole.name) private readonly userRoleModel: Model<UserRole>,
    @InjectModel(UserPermission.name)
    private readonly userPermissionModel: Model<UserPermission>,
    @InjectModel(RolePermission.name)
    private readonly rolePermissionModel: Model<RolePermission>,
  ) {}

  getCatalog() {
    return PERMISSION_CATALOG;
  }

  async ensureCatalogSeeded() {
    await Promise.all(
      PERMISSION_CATALOG.map((permission) =>
        this.permissionModel.updateOne(
          { key: permission.key },
          {
            $setOnInsert: {
              key: permission.key,
              description: permission.description,
              app: permission.app,
              requiresMfa: permission.requiresMfa ?? false,
            },
          },
          { upsert: true },
        ),
      ),
    );

    await Promise.all(
      Object.entries(DEFAULT_ROLE_GRANTS).map(([name]) =>
        this.roleModel.updateOne(
          { name },
          {
            $setOnInsert: {
              name,
              description: `Default ${name} role`,
              isStatic: true,
              isActive: true,
            },
          },
          { upsert: true },
        ),
      ),
    );

    // Seed default role permissions into database
    for (const [roleId, grants] of Object.entries(DEFAULT_ROLE_GRANTS)) {
      for (const grant of grants) {
        await this.rolePermissionModel.updateOne(
          {
            roleId,
            permission: grant.permission,
          },
          {
            $setOnInsert: {
              roleId,
              permission: grant.permission,
              effect: grant.effect,
              scope: grant.scope
                ? { type: grant.scope.type, id: grant.scope.id }
                : undefined,
            },
          },
          { upsert: true },
        );
      }
    }
  }

  async canUser(
    userId: string,
    permission: string,
    resource?: PermissionResource,
  ) {
    const subject = await this.buildSubject(userId);
    return evaluatePermission(subject, permission, resource);
  }

  async assertAnyPermission(userId: string, permissions: readonly string[]) {
    for (const permission of permissions) {
      const decision = await this.canUser(userId, permission);
      if (decision.allowed) {
        return decision;
      }
    }

    return {
      allowed: false,
      mode: 'hidden' as const,
      permission: permissions.join(','),
      reason: 'No required permissions granted',
    };
  }

  async getEffectivePermissions(userId: string) {
    const subject = await this.buildSubject(userId);
    const dbGranted = (subject.directGrants || [])
      .filter((grant) => grant.effect === 'allow')
      .map((grant) => grant.permission);
    const denied = new Set(
      (subject.directGrants || [])
        .filter((grant) => grant.effect === 'deny')
        .map((grant) => grant.permission),
    );

    return Array.from(new Set(dbGranted)).filter(
      (permission) => !denied.has(permission),
    );
  }

  async getPermissionsMapForUser(
    userId: string,
    roles: string[],
  ): Promise<Record<string, string[]>> {
    const now = new Date();
    const directPermissions = await this.userPermissionModel
      .find({
        userId: new Types.ObjectId(userId),
        $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gte: now } }],
      })
      .lean();

    const allowedOverrides = directPermissions
      .filter((p) => p.effect === 'allow')
      .map((p) => p.permission);

    const deniedOverrides = new Set(
      directPermissions
        .filter((p) => p.effect === 'deny')
        .map((p) => p.permission),
    );

    const map: Record<string, string[]> = {};
    for (const role of roles) {
      const inherited = getInheritedRoles([role]);
      const grants = await this.rolePermissionModel
        .find({ roleId: { $in: inherited }, effect: 'allow' })
        .lean();

      const rolePermissions = grants.map((g) => g.permission);
      const combined = Array.from(
        new Set([...rolePermissions, ...allowedOverrides]),
      ).filter((p) => !deniedOverrides.has(p));

      map[role] = combined;
    }
    return map;
  }

  async buildSubject(userId: string): Promise<PermissionSubject> {
    const user = await this.userModel
      .findById(userId)
      .select('email role departmentId')
      .lean();

    const now = new Date();
    const [assignedRoles, directPermissions] = await Promise.all([
      this.userRoleModel
        .find({
          userId: new Types.ObjectId(userId),
          isActive: true,
          $and: [
            {
              $or: [
                { startsAt: { $exists: false } },
                { startsAt: { $lte: now } },
              ],
            },
            {
              $or: [{ endsAt: { $exists: false } }, { endsAt: { $gte: now } }],
            },
          ],
        })
        .lean(),
      this.userPermissionModel
        .find({
          userId: new Types.ObjectId(userId),
          $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: { $gte: now } },
          ],
        })
        .lean(),
    ]);

    const explicitRoleIds = [
      ...(user?.role ? [user.role] : []),
      ...assignedRoles.map((role) => role.roleId),
    ];
    const roleIds = getInheritedRoles(explicitRoleIds);
    const databaseRoleGrants = await this.rolePermissionModel
      .find({ roleId: { $in: roleIds } })
      .lean();

    const directGrants: PermissionGrant[] = [
      ...databaseRoleGrants.map((grant) => ({
        permission: grant.permission,
        effect: grant.effect as 'allow' | 'deny',
        scope: this.normalizeScope(grant.scope),
      })),
      ...directPermissions.map((grant) => ({
        permission: grant.permission,
        effect: grant.effect as 'allow' | 'deny',
        scope: this.normalizeScope(grant.scope),
        reason: grant.reason,
      })),
    ];

    return {
      userId,
      email: user?.email,
      departmentId: user?.departmentId?.toString(),
      roles: Array.from(new Set(roleIds)).map((roleId) => ({ roleId })),
      directGrants,
    };
  }

  private normalizeScope(scope?: MongoScope): AccessScope | undefined {
    if (!scope?.type) {
      return undefined;
    }

    return {
      type: scope.type as AccessScope['type'],
      id: scope.id,
    };
  }
}
