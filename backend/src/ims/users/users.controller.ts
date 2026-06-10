import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/auth.decorator';
import { RequirePermissions } from '../../permissions/permissions.decorator';
import { PermissionsGuard } from '../../permissions/permissions.guard';
import { UsersService } from './users.service';
import { PaginationQuerySwagger } from '../../common/dto/pagination.dto';

@ApiTags('IMS - User Management')
@Controller('ims/users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('Kadep')
  @RequirePermissions('users.read')
  @ApiOperation({ summary: 'List users' })
  @ApiQuery({ type: PaginationQuerySwagger })
  async list(@Query() query: any) {
    return this.usersService.list(query);
  }

  @Post()
  @Roles('Super Admin')
  @RequirePermissions('users.manage')
  @ApiOperation({ summary: 'Create user' })
  async create(@Body() body: any) {
    return this.usersService.create(body);
  }

  @Put(':id')
  @Roles('Super Admin')
  @RequirePermissions('users.manage')
  @ApiOperation({ summary: 'Update role/department user' })
  async update(@Param('id') id: string, @Body() body: any) {
    return this.usersService.update(id, body);
  }

  // --- Sessions ---

  @Get(':id/sessions')
  @Roles('Super Admin', 'Admin Sistem')
  @RequirePermissions('users.read')
  @ApiOperation({ summary: 'List user sessions' })
  async listSessions(@Param('id') id: string) {
    return this.usersService.listSessions(id);
  }

  @Delete(':id/sessions')
  @Roles('Super Admin', 'Admin Sistem')
  @RequirePermissions('users.manage')
  @ApiOperation({ summary: 'Revoke all user sessions' })
  async revokeAllSessions(@Param('id') id: string, @Request() req: any) {
    return this.usersService.revokeSessions(id, undefined, req.user.userId);
  }

  @Delete(':id/sessions/:sessionId')
  @Roles('Super Admin', 'Admin Sistem')
  @RequirePermissions('users.manage')
  @ApiOperation({ summary: 'Revoke specific user session' })
  async revokeSession(
    @Param('id') id: string,
    @Param('sessionId') sessionId: string,
    @Request() req: any,
  ) {
    return this.usersService.revokeSessions(id, sessionId, req.user.userId);
  }

  // --- Direct Permissions ---

  @Get(':id/permissions')
  @Roles('Super Admin', 'Admin Sistem')
  @RequirePermissions('users.read')
  @ApiOperation({ summary: 'List direct user permission overrides' })
  async listPermissions(@Param('id') id: string) {
    return this.usersService.listPermissions(id);
  }

  @Post(':id/permissions')
  @Roles('Super Admin', 'Admin Sistem')
  @RequirePermissions('users.manage')
  @ApiOperation({ summary: 'Add or update direct user permission override' })
  async addPermissionOverride(
    @Param('id') id: string,
    @Body() body: any,
    @Request() req: any,
  ) {
    return this.usersService.addPermissionOverride(id, body, req.user.userId);
  }

  @Delete(':id/permissions/:permission')
  @Roles('Super Admin', 'Admin Sistem')
  @RequirePermissions('users.manage')
  @ApiOperation({ summary: 'Remove user permission override' })
  async removePermissionOverride(
    @Param('id') id: string,
    @Param('permission') permission: string,
    @Request() req: any,
  ) {
    return this.usersService.removePermissionOverride(
      id,
      permission,
      req.user.userId,
    );
  }
}
