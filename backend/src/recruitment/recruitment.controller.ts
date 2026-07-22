import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequiredPermissions } from '../auth/decorators/required-permission.decorator';
import { RecruitmentService } from './recruitment.service';
import {
  CreateRecruitmentDto,
  UpdateRecruitmentDto,
  RecruitmentQueryDto,
} from './dto/recruitment.dto';

@Controller('recruitment')
export class RecruitmentController {
  constructor(private readonly recruitmentService: RecruitmentService) {}

  // ─── Public ─────────────────────────────────────────────────────────────────

  @Get('public')
  async findPublic(@Query('status') status?: string) {
    const data = await this.recruitmentService.findPublic(status);
    return { success: true, data };
  }

  @Get('public/:slug')
  async findBySlug(@Param('slug') slug: string) {
    const data = await this.recruitmentService.findBySlug(slug);
    return { success: true, data };
  }

  // ─── CMS (authenticated) ───────────────────────────────────────────────────

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequiredPermissions('recruitments:read')
  async findAll(@Query() query: RecruitmentQueryDto) {
    return this.recruitmentService.findAll(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequiredPermissions('recruitments:read')
  async findOne(@Param('id') id: string) {
    const data = await this.recruitmentService.findOne(id);
    return { success: true, data };
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequiredPermissions('recruitments:create')
  async create(@Body() dto: CreateRecruitmentDto) {
    const data = await this.recruitmentService.create(dto);
    return { success: true, data };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequiredPermissions('recruitments:update')
  async update(@Param('id') id: string, @Body() dto: UpdateRecruitmentDto) {
    const data = await this.recruitmentService.update(id, dto);
    return { success: true, data };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequiredPermissions('recruitments:delete')
  async remove(@Param('id') id: string) {
    await this.recruitmentService.remove(id);
    return { success: true, message: 'Rekrutmen berhasil dihapus' };
  }
}
