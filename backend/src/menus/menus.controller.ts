import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { MenusService } from './menus.service';
import { CreateMenuDto, UpdateMenuDto } from './dto/menu.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequiredPermissions } from '../auth/decorators/required-permission.decorator';

@Controller('menus')
export class MenusController {
  constructor(private menusService: MenusService) {}

  // --- Public: read menu by slug (used by frontend) ---
  @Get('public/:slug')
  async findPublicBySlug(@Param('slug') slug: string) {
    const data = await this.menusService.findBySlug(slug);
    return { success: true, data };
  }

  // --- CMS: Protected ---
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Get()
  @RequiredPermissions('menu:read')
  async findAll() {
    const data = await this.menusService.findAll();
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Get(':id')
  @RequiredPermissions('menu:read')
  async findById(@Param('id') id: string) {
    const data = await this.menusService.findById(id);
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Post()
  @RequiredPermissions('menu:create')
  async create(@Body() dto: CreateMenuDto) {
    const data = await this.menusService.create(dto);
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Patch(':id')
  @RequiredPermissions('menu:update')
  async update(@Param('id') id: string, @Body() dto: UpdateMenuDto) {
    const data = await this.menusService.update(id, dto);
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Delete(':id')
  @RequiredPermissions('menu:delete')
  async delete(@Param('id') id: string) {
    const data = await this.menusService.delete(id);
    return { success: true, data };
  }
}
