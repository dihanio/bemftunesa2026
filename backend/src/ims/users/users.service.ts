import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from '../../database/schema/users';
import {
  UserSession,
  UserPermission,
  AuditLog,
} from '../../database/schema/security';
import {
  paginate,
  parsePaginationQuery,
} from '../../common/helpers/pagination.helper';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(UserSession.name) private sessionModel: Model<UserSession>,
    @InjectModel(UserPermission.name)
    private userPermissionModel: Model<UserPermission>,
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLog>,
  ) {}

  async list(query: any) {
    return paginate(
      this.userModel,
      { deletedAt: null },
      parsePaginationQuery(query),
      ['name', 'email', 'nim'],
    );
  }

  async create(data: any) {
    const user = await this.userModel.create(data);
    return { data: user, message: 'User berhasil dibuat' };
  }

  async update(id: string, data: any) {
    const user = await this.userModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: data },
      { new: true },
    );
    if (!user) throw new NotFoundException('User tidak ditemukan');
    return { data: user, message: 'User berhasil diupdate' };
  }

  async listSessions(userId: string) {
    const sessions = await this.sessionModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 });
    return { data: sessions };
  }

  async revokeSessions(userId: string, sessionId?: string, actorId?: string) {
    const query: any = { userId: new Types.ObjectId(userId) };
    if (sessionId) {
      query._id = new Types.ObjectId(sessionId);
    }
    const updateResult = await this.sessionModel.updateMany(query, {
      $set: { status: 'revoked', revokedAt: new Date() },
    });

    await this.auditLogModel.create({
      actorId: actorId ? new Types.ObjectId(actorId) : undefined,
      category: 'security',
      action: sessionId ? 'session_revoke' : 'session_revoke_all',
      targetType: 'user',
      targetId: userId,
      metadata: { sessionId, revokedCount: updateResult.modifiedCount },
    });

    return {
      message: 'Session revoked successfully',
      modifiedCount: updateResult.modifiedCount,
    };
  }

  async listPermissions(userId: string) {
    const permissions = await this.userPermissionModel.find({
      userId: new Types.ObjectId(userId),
    });
    return { data: permissions };
  }

  async addPermissionOverride(
    userId: string,
    permissionData: any,
    actorId?: string,
  ) {
    const { permission, effect, scope, reason, expiresAt } = permissionData;
    const override = await this.userPermissionModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId), permission },
      {
        $set: {
          effect,
          scope,
          reason,
          expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        },
      },
      { upsert: true, new: true },
    );

    await this.auditLogModel.create({
      actorId: actorId ? new Types.ObjectId(actorId) : undefined,
      category: 'security',
      action: 'permission_override_set',
      targetType: 'user',
      targetId: userId,
      metadata: { permission, effect, scope, reason },
    });

    return { data: override, message: 'Permission override saved' };
  }

  async removePermissionOverride(
    userId: string,
    permission: string,
    actorId?: string,
  ) {
    await this.userPermissionModel.deleteOne({
      userId: new Types.ObjectId(userId),
      permission,
    });

    await this.auditLogModel.create({
      actorId: actorId ? new Types.ObjectId(actorId) : undefined,
      category: 'security',
      action: 'permission_override_removed',
      targetType: 'user',
      targetId: userId,
      metadata: { permission },
    });

    return { message: 'Permission override removed' };
  }
}
