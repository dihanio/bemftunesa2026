import {
  Controller,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { StructureService } from './structure.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequiredPermissions } from '../auth/decorators/required-permission.decorator';

@Controller('ims/structure')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StructureController {
  constructor(private readonly structureService: StructureService) {}

  @Post('bpi')
  @RequiredPermissions('user:update')
  async assignToBPI(
    @Body('userId') userId: string,
    @Body('roleSlug') roleSlug: string,
  ) {
    return this.structureService.assignToBPI(userId, roleSlug);
  }

  @Post('department')
  @RequiredPermissions('department:update')
  async assignToDepartment(
    @Body('userId') userId: string,
    @Body('departmentId') departmentId: string,
    @Body('position') position: string,
  ) {
    return this.structureService.assignToDepartment(userId, departmentId, position);
  }

  @Delete('member/:id')
  @RequiredPermissions('user:update')
  async removeMember(@Param('id') id: string) {
    return this.structureService.removeMember(id);
  }
}
