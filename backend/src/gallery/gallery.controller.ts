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
import { GalleryService } from './gallery.service';
import {
  CreateGalleryDto, UpdateGalleryDto,
  UpdateGalleryStatusDto, AddPhotosDto, GalleryQueryDto,
} from './dto/gallery.dto';

@ApiTags('gallery')
@Controller('gallery')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  // ─── Public ────────────────────────────────────────────────────────────────

  @Get('public')
  @ApiOperation({ summary: 'List published gallery albums (public)' })
  async findPublic(@Query() query: GalleryQueryDto) {
    return this.galleryService.findPublic(query);
  }

  @Get('public/tags')
  @ApiOperation({ summary: 'List all gallery tags (public)' })
  async getTags() {
    const data = await this.galleryService.getAllTags();
    return { success: true, data };
  }

  @Get('public/:slug')
  @ApiOperation({ summary: 'Get gallery album by slug with all photos (public)' })
  async findOnePublic(@Param('slug') slug: string) {
    const data = await this.galleryService.findOneBySlug(slug);
    return { success: true, data };
  }

  // ─── CMS (authenticated) ───────────────────────────────────────────────────

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequiredPermissions('gallery:read')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'List all gallery albums (CMS)' })
  async findAll(@Query() query: GalleryQueryDto) {
    return this.galleryService.findAll(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequiredPermissions('gallery:read')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get gallery album by ID with all photos (CMS)' })
  async findOne(@Param('id') id: string) {
    const data = await this.galleryService.findOne(id);
    return { success: true, data };
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequiredPermissions('gallery:create')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Create new gallery album' })
  async create(@Body() dto: CreateGalleryDto, @CurrentUser() user: UserDocument) {
    const data = await this.galleryService.create(dto, user);
    return { success: true, data };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequiredPermissions('gallery:update')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Update gallery album metadata' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateGalleryDto,
    @CurrentUser() user: UserDocument,
  ) {
    const data = await this.galleryService.update(id, dto, user);
    return { success: true, data };
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequiredPermissions('gallery:publish')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Publish / archive gallery album' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateGalleryStatusDto,
    @CurrentUser() user: UserDocument,
  ) {
    const data = await this.galleryService.updateStatus(id, dto, user);
    return { success: true, data };
  }

  @Post(':id/photos')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequiredPermissions('gallery:update')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Add photos to gallery album' })
  async addPhotos(
    @Param('id') id: string,
    @Body() dto: AddPhotosDto,
    @CurrentUser() user: UserDocument,
  ) {
    const data = await this.galleryService.addPhotos(id, dto, user);
    return { success: true, data };
  }

  @Delete(':id/photos/:photoId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequiredPermissions('gallery:update')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Remove a photo from gallery album' })
  async removePhoto(
    @Param('id') id: string,
    @Param('photoId') photoId: string,
    @CurrentUser() user: UserDocument,
  ) {
    const data = await this.galleryService.removePhoto(id, photoId, user);
    return { success: true, data };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequiredPermissions('gallery:delete')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Delete gallery album' })
  async remove(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    await this.galleryService.remove(id, user);
    return { success: true, message: 'Gallery album deleted' };
  }
}
