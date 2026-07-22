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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ContentService } from './content.service';
import {
  CreateContentDto,
  UpdateContentDto,
  UpdateContentStatusDto,
  ContentQueryDto,
} from './dto/content.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequiredPermissions } from '../auth/decorators/required-permission.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { UserDocument } from '../schemas/user.schema';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';

@Controller('contents')
export class ContentController {
  constructor(
    private contentService: ContentService,
    private storageService: StorageService,
  ) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const fileUrl = await this.storageService.uploadFile(file);
    return { success: true, fileUrl };
  }

  // --- Public endpoint: list published content ---
  @Get('public')
  async findPublic(@Query() query: ContentQueryDto) {
    return this.contentService.findAll({ ...query, status: 'published' });
  }

  // --- Public endpoint: get single by slug ---
  @Get('public/:type/:slug')
  async findPublicBySlug(
    @Param('slug') slug: string,
    @Param('type') type: string,
  ) {
    const data = await this.contentService.findBySlug(slug, type);
    return { success: true, data };
  }

  // --- CMS: Protected endpoints ---
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Get()
  @RequiredPermissions('content:read')
  async findAll(@Query() query: ContentQueryDto) {
    return this.contentService.findAll(query);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Get(':id')
  @RequiredPermissions('content:read')
  async findById(@Param('id') id: string) {
    const data = await this.contentService.findById(id);
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Post()
  @RequiredPermissions('content:create')
  async create(
    @Body() dto: CreateContentDto,
    @CurrentUser() user: UserDocument,
  ) {
    const data = await this.contentService.create(dto, user);
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Patch(':id')
  @RequiredPermissions('content:update')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateContentDto,
    @CurrentUser() user: UserDocument,
  ) {
    const data = await this.contentService.update(id, dto, user);
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Patch(':id/status')
  @RequiredPermissions('content:publish')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateContentStatusDto,
  ) {
    const data = await this.contentService.updateStatus(id, dto);
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Delete(':id')
  @RequiredPermissions('content:delete')
  async delete(@Param('id') id: string) {
    const data = await this.contentService.delete(id);
    return { success: true, data };
  }
}
