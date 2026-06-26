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
import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Get()
  @Roles('super-admin', 'bpi', 'kadep')
  async findAll() {
    const data = await this.rolesService.findAll();
    return { success: true, data };
  }

  @Get(':id')
  @Roles('super-admin', 'bpi', 'kadep')
  async findById(@Param('id') id: string) {
    const data = await this.rolesService.findById(id);
    return { success: true, data };
  }

  @Post()
  @Roles('super-admin')
  async create(@Body() dto: CreateRoleDto) {
    const data = await this.rolesService.create(dto);
    return { success: true, data };
  }

  @Patch(':id')
  @Roles('super-admin')
  async update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    const data = await this.rolesService.update(id, dto);
    return { success: true, data };
  }

  @Delete(':id')
  @Roles('super-admin')
  async delete(@Param('id') id: string) {
    const data = await this.rolesService.delete(id);
    return { success: true, data };
  }
}
