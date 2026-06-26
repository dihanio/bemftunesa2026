import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Role, RoleDocument } from '../schemas/role.schema';
import { Permission, PermissionDocument } from '../schemas/permission.schema';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectModel(Role.name)
    private roleModel: Model<RoleDocument>,
    @InjectModel(Permission.name)
    private permissionModel: Model<PermissionDocument>,
  ) {}

  async findAll() {
    return this.roleModel.find().populate('permissions').exec();
  }

  async findById(id: string) {
    const role = await this.roleModel
      .findById(id)
      .populate('permissions')
      .exec();
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  async findBySlug(slug: string) {
    const role = await this.roleModel
      .findOne({ slug })
      .populate('permissions')
      .exec();
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  async create(dto: CreateRoleDto) {
    const existing = await this.roleModel.findOne({ slug: dto.slug }).exec();
    if (existing) throw new BadRequestException('Role slug already exists');

    let permissionIds: Types.ObjectId[] = [];
    if (dto.permissions?.length) {
      const perms = await this.permissionModel
        .find({ name: { $in: dto.permissions } })
        .exec();
      permissionIds = perms.map((p) => p._id as Types.ObjectId);
    }

    return this.roleModel
      .create({ ...dto, permissions: permissionIds });
  }

  async update(id: string, dto: UpdateRoleDto) {
    const role = await this.roleModel.findById(id).exec();
    if (!role) throw new NotFoundException('Role not found');

    if (dto.permissions) {
      const perms = await this.permissionModel
        .find({ name: { $in: dto.permissions } })
        .exec();
      dto.permissions = perms.map((p) => (p._id as Types.ObjectId).toString());
    }

    Object.assign(role, dto);
    return role.save();
  }

  async delete(id: string) {
    const role = await this.roleModel.findById(id).exec();
    if (!role) throw new NotFoundException('Role not found');
    if (role.isSystem)
      throw new BadRequestException('Cannot delete system role');
    await role.deleteOne();
    return { deleted: true };
  }
}
