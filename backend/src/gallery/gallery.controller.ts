import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequiredPermissions } from '../auth/decorators/required-permission.decorator';
import { GalleryService } from './gallery.service';
import { CreateGalleryDto, UpdateGalleryDto, GalleryQueryDto } from './dto/gallery.dto';

@Controller('gallery')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  // ─── Public ─────────────────────────────────────────────────────────────────

  @Get('public')
  async findPublic(@Query('search') search?: string) {
    const data = await this.galleryService.findPublic(search);
    return { success: true, data };
  }

  @Get('public/:slug')
  async findBySlug(@Param('slug') slug: string) {
    const data = await this.galleryService.findBySlug(slug);
    return { success: true, data };
  }

  // ─── CMS (authenticated) ───────────────────────────────────────────────────

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequiredPermissions('gallery:read')
  async findAll(@Query() query: GalleryQueryDto) {
    return this.galleryService.findAll(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequiredPermissions('gallery:read')
  async findOne(@Param('id') id: string) {
    const data = await this.galleryService.findOne(id);
    return { success: true, data };
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequiredPermissions('gallery:create')
  async create(@Body() dto: CreateGalleryDto) {
    const data = await this.galleryService.create(dto);
    return { success: true, data };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequiredPermissions('gallery:update')
  async update(@Param('id') id: string, @Body() dto: UpdateGalleryDto) {
    const data = await this.galleryService.update(id, dto);
    return { success: true, data };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequiredPermissions('gallery:delete')
  async remove(@Param('id') id: string) {
    await this.galleryService.remove(id);
    return { success: true, message: 'Album berhasil dihapus' };
  }
}
