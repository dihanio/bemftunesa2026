import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DepartmentDocument } from '../schemas/department.schema';
import { User, UserDocument } from '../schemas/user.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequiredPermissions } from '../auth/decorators/required-permission.decorator';

@Controller('departments')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DepartmentController {
  constructor(
    @InjectModel('Department')
    private departmentModel: Model<DepartmentDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  @Post()
  @RequiredPermissions('departments:create')
  async create(
    @Body()
    body: {
      name: string;
      slug: string;
      description?: string;
      order?: number;
      taskBoardUrl?: string;
    },
  ) {
    const existing = await this.departmentModel.findOne({ slug: body.slug });
    if (existing) {
      throw new BadRequestException('Slug departemen sudah digunakan');
    }
    return this.departmentModel.create(body);
  }

  @Get()
  @RequiredPermissions('departments:read')
  async findAll() {
    return this.departmentModel.find().sort({ order: 1 }).exec();
  }

  @Get(':id')
  @RequiredPermissions('departments:read')
  async findOne(@Param('id') id: string) {
    const dept = await this.departmentModel.findById(id).exec();
    if (!dept) {
      throw new NotFoundException('Departemen tidak ditemukan');
    }
    return dept;
  }

  @Put(':id')
  @RequiredPermissions('departments:update')
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      slug?: string;
      description?: string;
      order?: number;
      isActive?: boolean;
      taskBoardUrl?: string;
    },
  ) {
    const dept = await this.departmentModel.findById(id).exec();
    if (!dept) {
      throw new NotFoundException('Departemen tidak ditemukan');
    }

    if (body.slug && body.slug !== dept.slug) {
      const existing = await this.departmentModel.findOne({ slug: body.slug });
      if (existing) {
        throw new BadRequestException('Slug departemen sudah digunakan');
      }
    }

    if (body.isActive === false && dept.isActive === true) {
      const activeUsersCount = await this.userModel.countDocuments({
        department: id,
        isActive: true,
      });
      if (activeUsersCount > 0) {
        throw new BadRequestException(
          `Tidak dapat menonaktifkan departemen karena masih memiliki ${activeUsersCount} fungsionaris aktif.`,
        );
      }
    }

    return this.departmentModel
      .findByIdAndUpdate(id, { $set: body }, { new: true })
      .exec();
  }

  @Delete(':id')
  @RequiredPermissions('departments:delete')
  async remove(@Param('id') id: string) {
    const dept = await this.departmentModel.findById(id).exec();
    if (!dept) {
      throw new NotFoundException('Departemen tidak ditemukan');
    }

    const activeUsersCount = await this.userModel.countDocuments({
      department: id,
      isActive: true,
    });
    if (activeUsersCount > 0) {
      throw new BadRequestException(
        `Tidak dapat menghapus/menonaktifkan departemen karena masih memiliki ${activeUsersCount} fungsionaris aktif.`,
      );
    }

    if (!dept.isActive) {
      await this.departmentModel.findByIdAndDelete(id).exec();
      return { success: true, message: 'Departemen berhasil dihapus permanen' };
    }

    return this.departmentModel
      .findByIdAndUpdate(id, { $set: { isActive: false } }, { new: true })
      .exec();
  }
}
