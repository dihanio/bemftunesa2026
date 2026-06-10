import { Controller, Get, OnModuleInit, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/auth.decorator';
import { RequirePermissions } from './permissions.decorator';
import { PermissionsGuard } from './permissions.guard';
import { PermissionsService } from './permissions.service';

@ApiTags('IMS - Permissions')
@Controller('ims/permissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PermissionsController implements OnModuleInit {
  constructor(private readonly permissionsService: PermissionsService) {}

  async onModuleInit() {
    await this.permissionsService.ensureCatalogSeeded();
  }

  @Get('me')
  @ApiOperation({ summary: 'Current user effective permissions' })
  async me(@GetUser() user: any) {
    const roles = user.roles || [user.role].filter(Boolean);
    const [permissions, rolePermissions] = await Promise.all([
      this.permissionsService.getEffectivePermissions(user.userId),
      this.permissionsService.getPermissionsMapForUser(user.userId, roles),
    ]);

    return {
      data: {
        userId: user.userId,
        role: user.role,
        roles,
        permissions,
        rolePermissions,
      },
    };
  }

  @Get('catalog')
  @RequirePermissions('permissions.manage')
  @ApiOperation({ summary: 'Permission catalog for admin policy UI' })
  async catalog() {
    return {
      data: this.permissionsService.getCatalog(),
    };
  }
}
