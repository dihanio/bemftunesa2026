import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, Schema as MongooseSchema } from 'mongoose';
import { DepartmentDocument } from '../schemas/department.schema';
import { UserDocument } from '../schemas/user.schema';
import { RoleDocument } from '../schemas/role.schema';

@Injectable()
export class StructureService {
  constructor(
    @InjectModel('Department') private departmentModel: Model<DepartmentDocument>,
    @InjectModel('User') private userModel: Model<UserDocument>,
    @InjectModel('Role') private roleModel: Model<RoleDocument>,
  ) {}

  async assignToBPI(userId: string, targetRoleSlug: string) {
    const role = await this.roleModel.findOne({ slug: targetRoleSlug });
    if (!role) {
      throw new NotFoundException(`Role with slug ${targetRoleSlug} not found`);
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // First remove them from any department if they are assigned
    user.department = undefined as unknown as MongooseSchema.Types.ObjectId;
    user.position = '';

    // Update user role
    user.role = role._id as unknown as MongooseSchema.Types.ObjectId;
    await user.save();

    return { success: true, message: 'User successfully assigned to BPI' };
  }

  async assignToDepartment(userId: string, departmentId: string, position: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const department = await this.departmentModel.findById(departmentId);
    if (!department) {
      throw new NotFoundException('Department not found');
    }

    // Map position to role slug
    let targetSlug = 'staf';
    if (position === 'Ketua Departemen') {
      targetSlug = 'kadep';
    } else if (position === 'Wakil Ketua Departemen') {
      targetSlug = 'wakadep';
    }

    let targetRole = await this.roleModel.findOne({ slug: targetSlug });
    if (!targetRole) {
      // Create role if it doesn't exist
      targetRole = await this.roleModel.create({
        name: position,
        slug: targetSlug,
        description: `Role for ${position}`,
        isSystem: true,
        permissions: []
      });
    }

    // Update user role to match their new department position
    user.role = targetRole._id as unknown as MongooseSchema.Types.ObjectId;
    await user.save();

    // Update user department
    user.department = department._id as unknown as MongooseSchema.Types.ObjectId;
    user.position = position;
    await user.save();

    return { success: true, message: 'User successfully assigned to Department' };
  }

  async removeMember(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 1. Remove from department
    user.department = undefined as unknown as MongooseSchema.Types.ObjectId;
    user.position = '';

    // 2. Demote from BPI role to default User role
    let defaultRole = await this.roleModel.findOne({ slug: 'user' });
    if (!defaultRole) {
      defaultRole = await this.roleModel.create({
        name: 'User',
        slug: 'user',
        description: 'Default user role',
        isSystem: true,
        permissions: []
      });
    }
    
    user.role = defaultRole._id as unknown as MongooseSchema.Types.ObjectId;
    await user.save();

    return { success: true, message: 'Member successfully removed from structure' };
  }
}
