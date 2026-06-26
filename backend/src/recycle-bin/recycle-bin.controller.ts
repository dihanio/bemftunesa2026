import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { RecycleBinService } from './recycle-bin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('recycle-bin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super-admin') // Only super admins can access recycle bin
export class RecycleBinController {
  constructor(private readonly recycleBinService: RecycleBinService) {}

  @Get()
  async getDeletedItems() {
    return {
      success: true,
      data: await this.recycleBinService.getDeletedItems(),
    };
  }

  @Patch(':collection/:id/restore')
  async restoreItem(@Param('collection') collection: string, @Param('id') id: string) {
    return {
      success: true,
      data: await this.recycleBinService.restoreItem(collection, id),
    };
  }
}
