import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, Schema as MongooseSchema } from 'mongoose';
import { Role, RoleDocument } from '../schemas/role.schema';
import { Permission, PermissionDocument } from '../schemas/permission.schema';
import { User, UserDocument } from '../schemas/user.schema';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class RolesService {
  constructor(
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
    @InjectModel(Permission.name)
    private permissionModel: Model<PermissionDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private auditService: AuditService,
  ) {}

  async findAllRoles() {
    return this.roleModel
      .find()
      .populate('permissions')
      .sort({ name: 1 })
      .exec();
  }

  async findAllPermissions() {
    return this.permissionModel.find().sort({ resource: 1, name: 1 }).exec();
  }

  async createRole(dto: CreateRoleDto, actorId?: string, actorRole?: string) {
    const slug = dto.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const existing = await this.roleModel.findOne({
      $or: [{ name: dto.name }, { slug }],
    });

    if (existing) {
      throw new ConflictException(`Role dengan nama '${dto.name}' sudah ada.`);
    }

    const permissionIds = (dto.permissions || []).map(
      (id) => new Types.ObjectId(id),
    );

    const role = await this.roleModel.create({
      name: dto.name,
      slug,
      description: dto.description || '',
      permissions: permissionIds as unknown as MongooseSchema.Types.ObjectId[],
      isSystem: false,
      scope: 'global',
    });

    if (actorId && actorRole) {
      await this.auditService.log({
        actor: actorId,
        actorRole,
        action: 'CREATE',
        resourceType: 'Role',
        resourceId: role._id.toString(),
        resourceName: role.name,
        after: { name: role.name, permissionsCount: permissionIds.length },
      });
    }

    return role.populate('permissions');
  }

  async updateRole(
    id: string,
    dto: UpdateRoleDto,
    actorId?: string,
    actorRole?: string,
  ) {
    const role = await this.roleModel.findById(id);
    if (!role) {
      throw new NotFoundException('Role tidak ditemukan.');
    }

    const beforeState = {
      name: role.name,
      permissionsCount: role.permissions.length,
    };

    if (dto.name && dto.name !== role.name) {
      const slug = dto.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const existing = await this.roleModel.findOne({
        slug,
        _id: { $ne: role._id },
      });
      if (existing) {
        throw new ConflictException(`Nama role '${dto.name}' sudah digunakan.`);
      }
      role.name = dto.name;
      role.slug = slug;
    }

    if (dto.description !== undefined) {
      role.description = dto.description;
    }

    if (dto.permissions) {
      role.permissions = dto.permissions.map(
        (pId) => new Types.ObjectId(pId) as unknown as MongooseSchema.Types.ObjectId,
      );
    }

    await role.save();

    if (actorId && actorRole) {
      await this.auditService.log({
        actor: actorId,
        actorRole,
        action: 'UPDATE',
        resourceType: 'Role',
        resourceId: role._id.toString(),
        resourceName: role.name,
        before: beforeState,
        after: {
          name: role.name,
          permissionsCount: role.permissions.length,
        },
      });
    }

    return role.populate('permissions');
  }

  async deleteRole(id: string, actorId?: string, actorRole?: string) {
    const role = await this.roleModel.findById(id);
    if (!role) {
      throw new NotFoundException('Role tidak ditemukan.');
    }

    if (role.isSystem) {
      throw new BadRequestException(
        'Role sistem bawaan tidak dapat dihapus.',
      );
    }

    const assignedUsersCount = await this.userModel.countDocuments({
      role: role._id,
      deletedAt: null,
    });

    if (assignedUsersCount > 0) {
      throw new BadRequestException(
        `Gagal menghapus: Role '${role.name}' sedang digunakan oleh ${assignedUsersCount} akun pengguna.`,
      );
    }

    await this.roleModel.findByIdAndDelete(role._id);

    if (actorId && actorRole) {
      await this.auditService.log({
        actor: actorId,
        actorRole,
        action: 'DELETE',
        resourceType: 'Role',
        resourceId: role._id.toString(),
        resourceName: role.name,
        before: { name: role.name },
      });
    }

    return { success: true, message: `Role '${role.name}' berhasil dihapus.` };
  }
}
