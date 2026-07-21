import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ROLES_BPI_PIMPINAN } from '../common/constants/roles';

@Controller('organizations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrganizationsController {
  constructor(private readonly orgService: OrganizationsService) {}

  @Get()
  async findAll() {
    const data = await this.orgService.findAll();
    return { success: true, data };
  }

  @Get('active')
  async findActive() {
    const data = await this.orgService.findActive();
    return { success: true, data };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.orgService.findById(id);
    return { success: true, data };
  }

  @Post()
  @Roles(...ROLES_BPI_PIMPINAN)
  async create(@Body() body: { name: string; period: string; vision?: string; missions?: string[] }) {
    const data = await this.orgService.create(body);
    return { success: true, data };
  }

  @Patch(':id')
  @Roles(...ROLES_BPI_PIMPINAN)
  async update(@Param('id') id: string, @Body() body: any) {
    const data = await this.orgService.update(id, body);
    return { success: true, data };
  }
}
