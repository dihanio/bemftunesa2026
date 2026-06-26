import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import {
  CreateDepartmentDto,
  UpdateDepartmentDto,
  DepartmentQueryDto,
} from './dto/department.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { UserDocument } from '../schemas/user.schema';

@Controller('departments')
export class DepartmentsController {
  constructor(private departmentsService: DepartmentsService) {}

  // --- Public endpoints ---
  @Get('public')
  async findPublic(@Query() query: DepartmentQueryDto) {
    return this.departmentsService.findAll({ ...query, isActive: true });
  }

  @Get('public/:slug')
  async findPublicBySlug(@Param('slug') slug: string) {
    const data = await this.departmentsService.findBySlug(slug);
    return { success: true, data };
  }

  // --- CMS: Protected endpoints ---
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  @Roles('super-admin', 'bpi', 'kadep', 'wakadep', 'staf')
  async findAll(@Query() query: DepartmentQueryDto) {
    return this.departmentsService.findAll(query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':id')
  @Roles('super-admin', 'bpi', 'kadep', 'wakadep', 'staf')
  async findById(@Param('id') id: string) {
    const data = await this.departmentsService.findById(id);
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  @Roles('super-admin')
  async create(
    @Body() dto: CreateDepartmentDto,
    @CurrentUser() user: UserDocument,
  ) {
    const data = await this.departmentsService.create(dto, user);
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id')
  @Roles('super-admin', 'bpi', 'kadep')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateDepartmentDto,
    @CurrentUser() user: UserDocument,
  ) {
    const data = await this.departmentsService.update(id, dto, user);
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id')
  @Roles('super-admin')
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
  ) {
    const data = await this.departmentsService.delete(id, user);
    return { success: true, data };
  }
}
