import { Injectable, BadRequestException, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { Role, RoleDocument } from '../schemas/role.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService implements OnModuleInit {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel('Role') private roleModel: Model<RoleDocument>,
  ) {}

  async onModuleInit() {
    try {
      const globalRoles = await this.roleModel.find({ scope: 'global' }).select('_id').exec();
      const globalRoleIds = globalRoles.map((r) => r._id);

      await this.userModel.updateMany(
        { role: { $in: globalRoleIds }, department: { $ne: null } },
        { $set: { department: null } },
      ).exec();
    } catch {
      // Non-critical startup migration — silently ignore failures
    }
  }

  private async getRoleAndValidateScope(roleId: string, departmentId?: string | null): Promise<void> {
    const role = await this.roleModel.findById(roleId).exec();
    if (!role) {
      throw new BadRequestException('Role hak akses tidak ditemukan');
    }

    if (role.scope === 'global') {
      // Global scope roles shouldn't have departments
      return;
    }

    if (role.scope === 'department' && !departmentId) {
      throw new BadRequestException('Departemen wajib dipilih untuk role fungsionaris ini');
    }
  }

  async create(createUserDto: CreateUserDto, creatorCabinetPeriod?: string) {
    const emailLower = createUserDto.email.toLowerCase();
    
    // Check if email already registered
    const existingEmail = await this.userModel.findOne({ email: emailLower }).exec();
    if (existingEmail) {
      throw new BadRequestException('Email sudah digunakan');
    }

    const role = await this.roleModel.findById(createUserDto.role).exec();
    if (!role) {
      throw new BadRequestException('Role hak akses tidak ditemukan');
    }

    let departmentVal = createUserDto.department;
    if (role.scope === 'global') {
      departmentVal = null;
    } else if (role.scope === 'department' && !departmentVal) {
      throw new BadRequestException('Departemen wajib dipilih untuk role fungsionaris ini');
    }

    return this.userModel.create({
      ...createUserDto,
      email: emailLower,
      department: departmentVal,
      cabinetPeriod: createUserDto.cabinetPeriod || creatorCabinetPeriod || '2026',
    });
  }

  async findAll(query: Record<string, unknown>) {
    return this.userModel
      .find(query)
      .populate('department', 'name slug')
      .populate('role', 'name slug scope')
      .sort({ name: 1 })
      .exec();
  }

  async findOne(id: string) {
    const user = await this.userModel
      .findById(id)
      .populate('department', 'name slug')
      .populate('role', 'name slug scope')
      .exec();

    if (!user) {
      throw new NotFoundException('Fungsionaris tidak ditemukan');
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('Fungsionaris tidak ditemukan');
    }

    const updateData: Record<string, unknown> = { ...updateUserDto };

    if (updateUserDto.email) {
      const emailLower = updateUserDto.email.toLowerCase();
      if (emailLower !== user.email) {
        const existingEmail = await this.userModel.findOne({ email: emailLower }).exec();
        if (existingEmail) {
          throw new BadRequestException('Email sudah digunakan');
        }
        updateData.email = emailLower;
      }
    }

    // Role scope department logic
    const roleId = updateUserDto.role || (user.role as { toString: () => string }).toString();
    const role = await this.roleModel.findById(roleId).exec();
    if (!role) {
      throw new BadRequestException('Role hak akses tidak ditemukan');
    }

    if (role.scope === 'global') {
      updateData.department = null;
    } else {
      const deptId = updateUserDto.hasOwnProperty('department') ? updateUserDto.department : user.department;
      if (!deptId) {
        throw new BadRequestException('Departemen wajib dipilih untuk role fungsionaris ini');
      }
    }

    return this.userModel.findByIdAndUpdate(id, { $set: updateData }, { new: true }).exec();
  }

  async remove(id: string) {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('Fungsionaris tidak ditemukan');
    }
    return this.userModel.findByIdAndUpdate(id, { $set: { isActive: false } }, { new: true }).exec();
  }
}
