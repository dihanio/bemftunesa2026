import { Controller, Get, Param, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DepartmentDocument } from '../schemas/department.schema';
import { ContentDocument } from '../schemas/content.schema';
import { UserDocument } from '../schemas/user.schema';
import { RoleDocument } from '../schemas/role.schema';
import { Surat, SuratDocument } from '../schemas/surat.schema';

@Controller('public')
export class PublicController {
  constructor(
    @InjectModel('Department') private departmentModel: Model<DepartmentDocument>,
    @InjectModel('Content') private contentModel: Model<ContentDocument>,
    @InjectModel('User') private userModel: Model<UserDocument>,
    @InjectModel('Role') private roleModel: Model<RoleDocument>,
    @InjectModel(Surat.name) private suratModel: Model<SuratDocument>,
  ) {}

  @Get('stats')
  async getStats() {
    const departments = await this.departmentModel.countDocuments({ isActive: true });
    
    // Count active members (all users except those not associated with a role yet, or simply all active users for now)
    const members = await this.userModel.countDocuments({ isActive: true });

    // TODO: When Proker module is implemented, count actual proker items. 
    // For now, we return 0 or a dummy number.
    const proker = 0; 
    
    return {
      success: true,
      data: {
        departments,
        members,
        proker,
        aspirations: { total: 0, pending: 0, resolved: 0 },
      },
    };
  }

  @Get('proker')
  async getProkers() {
    return { success: true, data: [] };
  }

  @Get('structure')
  async getStructure() {
    // 1. Fetch departments
    const departments = await this.departmentModel.find({ isActive: true }).select('name description slug').lean();

    interface PopulatedUser {
      _id: Types.ObjectId;
      name: string;
      role?: { name: string; slug: string };
      avatar?: { url: string };
    }

    // 2. Fetch users and populate role & avatar
    const users = await this.userModel.find({ isActive: true })
      .populate('role', 'name slug')
      .populate('avatar', 'url')
      .lean() as unknown as PopulatedUser[];

    // Define which roles are considered BPI (Badan Pengurus Inti)
    // You can adjust these slugs based on your seeding or actual DB
    const bpiSlugs = ['kabem', 'wakabem', 'sekretaris', 'bendahara'];

    // Map users to BPI structure format
    const bpi = users
      .filter((u) => u.role && bpiSlugs.includes(u.role.slug))
      .map((u) => ({
        _id: u._id,
        name: u.name,
        role: u.role?.name,
        roleSlug: u.role?.slug,
        avatar: u.avatar?.url || null,
      }));

    const deptUsers = await this.userModel.find({ isActive: true, department: { $exists: true, $ne: null } })
      .populate('role', 'name slug')
      .populate('avatar', 'url')
      .lean() as unknown as (PopulatedUser & { department: Types.ObjectId, position: string })[];

    const members = deptUsers.map((u) => ({
      _id: u._id,
      name: u.name,
      departmentId: u.department,
      role: u.position || u.role?.name || 'Staff',
      avatar: u.avatar?.url || null,
    }));

    return { 
      success: true, 
      data: { 
        bpi, 
        departments: departments.map((d) => ({ 
          _id: d._id, 
          name: d.name,
          slug: d.slug,
          description: d.description 
        })), 
        members 
      } 
    };
  }

  @Get('surat/:id/verify')
  async verifySurat(@Param('id') id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid ID');
    }
    const surat = await this.suratModel
      .findById(id)
      .populate('submittedBy', 'name email')
      .populate('department', 'name')
      .populate('currentVersion')
      .lean();
      
    if (!surat) {
      throw new NotFoundException('Surat tidak ditemukan');
    }
    
    return {
      success: true,
      data: surat,
    };
  }
}
