import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ForbiddenException,
  Query,
  Req,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RoleDocument } from '../schemas/role.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequiredPermissions } from '../auth/decorators/required-permission.decorator';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UserController {
  constructor(
    private readonly userService: UserService,
    @InjectModel('Role') private roleModel: Model<RoleDocument>,
  ) {}

  private getUserPermissions(req: import('express').Request): string[] {
    const role = req.user?.activeRoleId as
      | { permissions?: { name: string }[] }
      | undefined;
    if (!role || !Array.isArray(role.permissions)) return [];
    return role.permissions.map((p) => p.name);
  }

  @Post()
  @RequiredPermissions('users:create:all', 'users:create:department')
  async create(
    @Req() req: import('express').Request,
    @Body() createUserDto: CreateUserDto,
  ) {
    const userPerms = this.getUserPermissions(req);
    const hasCreateAll =
      userPerms.includes('users:create:all') ||
      userPerms.includes('manage:all');

    if (!hasCreateAll) {
      if (!req.user!.organizationId) {
        throw new ForbiddenException(
          'Anda tidak terikat pada departemen manapun',
        );
      }
      createUserDto.department = req.user!.organizationId.toString();

      const stafRole = await this.roleModel.findOne({ slug: 'staf' }).exec();
      if (!stafRole)
        throw new ForbiddenException('Role Staf tidak ditemukan di sistem');
      createUserDto.role = stafRole._id.toString();
    }

    return this.userService.create(createUserDto, req.user!.cabinetPeriod);
  }

  @Get()
  @RequiredPermissions('users:read:all', 'users:read:department')
  async findAll(
    @Req() req: import('express').Request,
    @Query('departmentId') departmentId?: string,
    @Query('search') search?: string,
  ) {
    const userPerms = this.getUserPermissions(req);
    const hasReadAll =
      userPerms.includes('users:read:all') || userPerms.includes('manage:all');

    const query: Record<string, unknown> = {};

    if (!hasReadAll) {
      if (!req.user!.organizationId) {
        throw new ForbiddenException(
          'Anda tidak terikat pada departemen manapun',
        );
      }
      query.department = req.user!.organizationId;
    } else if (departmentId) {
      query.department = departmentId;
    }

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    return this.userService.findAll(query);
  }

  @Get('roles')
  async getRoles(@Req() req: import('express').Request) {
    const role = req.user?.activeRoleId as
      | { permissions?: { name: string }[] }
      | undefined;
    const permissions = Array.isArray(role?.permissions)
      ? role.permissions.map((p) => p.name)
      : [];
    const isSuperAdmin = permissions.includes('manage:all');

    if (isSuperAdmin) {
      return this.roleModel.find().sort({ name: 1 }).exec();
    }
    return this.roleModel
      .find({ slug: { $ne: 'super-admin' } })
      .sort({ name: 1 })
      .exec();
  }

  @Get(':id')
  @RequiredPermissions('users:read:all', 'users:read:department')
  async findOne(
    @Param('id') id: string,
    @Req() req: import('express').Request,
  ) {
    const user = await this.userService.findOne(id);

    const userPerms = this.getUserPermissions(req);
    const hasReadAll =
      userPerms.includes('users:read:all') || userPerms.includes('manage:all');

    if (!hasReadAll) {
      if (
        !req.user!.organizationId ||
        user.department?.toString() !== req.user!.organizationId.toString()
      ) {
        throw new ForbiddenException(
          'Anda tidak berhak melihat fungsionaris departemen lain',
        );
      }
    }

    return user;
  }

  @Put(':id')
  @RequiredPermissions('users:update:all', 'users:update:department')
  async update(
    @Param('id') id: string,
    @Req() req: import('express').Request,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const user = await this.userService.findOne(id);

    const userPerms = this.getUserPermissions(req);
    const hasUpdateAll =
      userPerms.includes('users:update:all') ||
      userPerms.includes('manage:all');

    if (!hasUpdateAll) {
      if (
        !req.user!.organizationId ||
        user.department?.toString() !== req.user!.organizationId.toString()
      ) {
        throw new ForbiddenException(
          'Anda tidak berhak memperbarui fungsionaris departemen lain',
        );
      }
      delete updateUserDto.department;
      delete updateUserDto.role;
    }

    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @RequiredPermissions('users:delete:all', 'users:delete:department')
  async remove(@Param('id') id: string, @Req() req: import('express').Request) {
    const user = await this.userService.findOne(id);

    const userPerms = this.getUserPermissions(req);
    const hasDeleteAll =
      userPerms.includes('users:delete:all') ||
      userPerms.includes('manage:all');

    if (!hasDeleteAll) {
      if (
        !req.user!.organizationId ||
        user.department?.toString() !== req.user!.organizationId.toString()
      ) {
        throw new ForbiddenException(
          'Anda tidak berhak menghapus fungsionaris departemen lain',
        );
      }
    }

    return this.userService.remove(id);
  }
}
