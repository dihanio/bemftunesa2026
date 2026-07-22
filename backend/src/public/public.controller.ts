import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DepartmentDocument } from '../schemas/department.schema';
import { UserDocument } from '../schemas/user.schema';
import { RoleDocument } from '../schemas/role.schema';
import { ProgramDocument } from '../schemas/program.schema';
import { AspirationDocument } from '../schemas/aspiration.schema';
import { Contact, ContactDocument } from '../schemas/contact.schema';

@Controller('public')
export class PublicController {
  constructor(
    @InjectModel('Department')
    private departmentModel: Model<DepartmentDocument>,
    @InjectModel('User') private userModel: Model<UserDocument>,
    @InjectModel('Role') private roleModel: Model<RoleDocument>,
    @InjectModel('Program') private programModel: Model<ProgramDocument>,
    @InjectModel('Aspiration')
    private aspirationModel: Model<AspirationDocument>,
    @InjectModel(Contact.name) private contactModel: Model<ContactDocument>,
  ) {}

  @Get('stats')
  async getStats() {
    const departments = await this.departmentModel.countDocuments({
      isActive: true,
    });

    // Count only actual fungsionaris (BPI + Department members)
    const activeUsers = await this.userModel
      .find({ isActive: true })
      .populate('role', 'slug')
      .lean();

    const bpiSlugs = ['kabem', 'wakabem', 'sekretaris', 'bendahara'];

    const members = activeUsers.filter((u: Record<string, unknown>) => {
      if (!u.role) return false;
      const role = u.role as { slug?: string };
      const roleSlug = role.slug;
      const isBpi = roleSlug ? bpiSlugs.includes(roleSlug) : false;
      const isDept = u.department != null;
      return isBpi || isDept;
    }).length;
    const proker = await this.programModel.countDocuments();

    const totalAspirations = await this.aspirationModel.countDocuments();
    // Count all non-final statuses as "pending" (new, processing, pending)
    const pendingAspirations = await this.aspirationModel.countDocuments({
      status: { $in: ['new', 'processing', 'pending'] },
    });
    const resolvedAspirations = await this.aspirationModel.countDocuments({
      status: 'resolved',
    });

    return {
      success: true,
      data: {
        departments,
        members,
        proker,
        documents: 0,
        aspirations: {
          total: totalAspirations,
          pending: pendingAspirations,
          resolved: resolvedAspirations,
        },
      },
    };
  }

  @Get('proker')
  async getProkers() {
    const prokers = await this.programModel
      .find()
      .populate('department', 'name slug')
      .populate('pic', 'name email')
      .exec();
    return { success: true, data: prokers };
  }

  @Get('documents')
  getDocuments() {
    return { success: true, data: [] };
  }

  @Get('structure')
  async getStructure() {
    const departments = await this.departmentModel
      .find({ isActive: true })
      .select('name description slug')
      .sort({ order: 1 })
      .lean();

    interface PopulatedUser {
      _id: Types.ObjectId;
      name: string;
      role?: { name: string; slug: string };
      avatar?: string;
      publicPhoto?: string;
    }

    const users = (await this.userModel
      .find({ isActive: true })
      .populate('role', 'name slug')
      .lean()) as unknown as PopulatedUser[];

    const bpiSlugs = ['kabem', 'wakabem', 'sekretaris', 'bendahara'];

    const bpi = users
      .filter((u) => u.role && bpiSlugs.includes(u.role.slug))
      .map((u) => ({
        _id: u._id,
        name: u.name,
        role: u.role?.name,
        roleSlug: u.role?.slug,
        avatar: u.publicPhoto || u.avatar || null,
        publicPhoto: u.publicPhoto || null,
      }));

    const deptUsers = (await this.userModel
      .find({ isActive: true, department: { $exists: true, $ne: null } })
      .populate('role', 'name slug')
      .lean()) as unknown as (PopulatedUser & {
      department: Types.ObjectId;
      position: string;
    })[];

    const members = deptUsers.map((u) => ({
      _id: u._id,
      name: u.name,
      departmentId: u.department,
      role: u.position || u.role?.name || 'Staff',
      avatar: u.publicPhoto || u.avatar || null,
      publicPhoto: u.publicPhoto || null,
    }));

    return {
      success: true,
      data: {
        bpi,
        departments: departments.map((d) => ({
          _id: d._id,
          name: d.name,
          slug: d.slug,
          description: d.description,
        })),
        members,
      },
    };
  }

  // ─── Public Aspiration Submission ──────────────────────────────────────────

  @Post('aspirations')
  async submitAspiration(
    @Body()
    body: {
      name?: string;
      email?: string;
      subject: string;
      message: string;
      category?: string;
    },
  ) {
    if (!body.subject || !body.message) {
      throw new BadRequestException('Subject dan message wajib diisi');
    }

    const aspiration = new this.aspirationModel({
      title: body.subject,
      description: body.message,
      category: body.category || 'Lainnya',
      isAnonymous: !body.name,
      status: 'new',
      urgency: 'low',
    });

    const saved = await aspiration.save();
    return { success: true, data: { id: saved._id } };
  }

  @Get('aspirations/status/:id')
  async getAspirationStatus(@Param('id') id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID Tiket tidak valid');
    }

    const aspiration = await this.aspirationModel.findById(id).lean();
    if (!aspiration) {
      throw new NotFoundException('Aspirasi tidak ditemukan');
    }

    return {
      success: true,
      data: {
        _id: aspiration._id,
        status: aspiration.status,
        category: aspiration.category,
        createdAt: (aspiration as unknown as { createdAt?: Date }).createdAt,
        subject: aspiration.title,
        message: aspiration.description,
        response: aspiration.officialResponse || null,
      },
    };
  }

  // ─── Public Contact Form ──────────────────────────────────────────────────

  @Post('contact')
  async submitContact(
    @Body()
    body: {
      name: string;
      email: string;
      subject: string;
      message: string;
    },
  ) {
    if (!body.name || !body.email || !body.subject || !body.message) {
      throw new BadRequestException('Semua field wajib diisi');
    }

    await this.contactModel.create(body);
    return { success: true, data: { message: 'Pesan berhasil dikirim' } };
  }
}
