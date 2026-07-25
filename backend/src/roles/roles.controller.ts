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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequiredPermissions } from '../auth/decorators/required-permission.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PkkmbPermission } from '../common/auth/pkkmb-permissions';

@ApiTags('pkkmb-roles')
@ApiBearerAuth()
@Controller('pkkmb')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get('roles')
  @RequiredPermissions(PkkmbPermission.ROLES_READ)
  @ApiOperation({ summary: 'Melihat seluruh daftar role dan permission' })
  async getRoles() {
    const data = await this.rolesService.findAllRoles();
    return { success: true, data };
  }

  @Get('permissions')
  @RequiredPermissions(PkkmbPermission.PERMISSIONS_READ)
  @ApiOperation({ summary: 'Melihat seluruh daftar master permission' })
  async getPermissions() {
    const data = await this.rolesService.findAllPermissions();
    return { success: true, data };
  }

  @Post('roles')
  @RequiredPermissions(PkkmbPermission.ROLES_MANAGE)
  @ApiOperation({ summary: 'Membuat role custom baru' })
  async createRole(
    @Body() dto: CreateRoleDto,
    @CurrentUser() user: { userId: string; role?: { slug?: string } },
  ) {
    const data = await this.rolesService.createRole(
      dto,
      user.userId,
      user.role?.slug || 'unknown',
    );
    return { success: true, data };
  }

  @Patch('roles/:id')
  @RequiredPermissions(PkkmbPermission.ROLES_MANAGE)
  @ApiOperation({ summary: 'Memperbarui nama & permission role' })
  async updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() user: { userId: string; role?: { slug?: string } },
  ) {
    const data = await this.rolesService.updateRole(
      id,
      dto,
      user.userId,
      user.role?.slug || 'unknown',
    );
    return { success: true, data };
  }

  @Delete('roles/:id')
  @RequiredPermissions(PkkmbPermission.ROLES_MANAGE)
  @ApiOperation({ summary: 'Menghapus role custom' })
  async deleteRole(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string; role?: { slug?: string } },
  ) {
    return this.rolesService.deleteRole(
      id,
      user.userId,
      user.role?.slug || 'unknown',
    );
  }
}
