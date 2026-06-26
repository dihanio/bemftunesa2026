import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequiredPermissions } from '../auth/decorators/required-permission.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { UserDocument } from '../schemas/user.schema';
import { RecruitmentService } from './recruitment.service';
import {
  CreateRecruitmentDto, UpdateRecruitmentDto,
  UpdateRecruitmentStatusDto, RecruitmentQueryDto,
} from './dto/recruitment.dto';

@ApiTags('recruitment')
@Controller('recruitment')
export class RecruitmentController {
  constructor(private readonly recruitmentService: RecruitmentService) {}

  // ─── Public ────────────────────────────────────────────────────────────────

  @Get('public')
  @ApiOperation({ summary: 'List open/announced recruitments (public)' })
  async findPublic(@Query('status') status?: string) {
    const data = await this.recruitmentService.findPublic(status);
    return { success: true, data };
  }

  @Get('public/:slug')
  @ApiOperation({ summary: 'Get recruitment detail by slug (public)' })
  async findOnePublic(@Param('slug') slug: string) {
    const data = await this.recruitmentService.findOneBySlug(slug);
    return { success: true, data };
  }

  // ─── CMS (authenticated) ───────────────────────────────────────────────────

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequiredPermissions('recruitment:read')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'List all recruitments (CMS)' })
  async findAll(@Query() query: RecruitmentQueryDto) {
    return this.recruitmentService.findAll(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequiredPermissions('recruitment:read')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get recruitment by ID (CMS)' })
  async findOne(@Param('id') id: string) {
    const data = await this.recruitmentService.findOne(id);
    return { success: true, data };
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequiredPermissions('recruitment:create')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Create new recruitment' })
  async create(
    @Body() dto: CreateRecruitmentDto,
    @CurrentUser() user: UserDocument,
  ) {
    const data = await this.recruitmentService.create(dto, user);
    return { success: true, data };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequiredPermissions('recruitment:update')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Update recruitment' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateRecruitmentDto,
    @CurrentUser() user: UserDocument,
  ) {
    const data = await this.recruitmentService.update(id, dto, user);
    return { success: true, data };
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequiredPermissions('recruitment:publish')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Update recruitment status (draft→open→closed→announced)' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateRecruitmentStatusDto,
    @CurrentUser() user: UserDocument,
  ) {
    const data = await this.recruitmentService.updateStatus(id, dto, user);
    return { success: true, data };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequiredPermissions('recruitment:delete')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Delete recruitment' })
  async remove(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    await this.recruitmentService.remove(id, user);
    return { success: true, message: 'Recruitment deleted' };
  }
}
