import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('ims/audit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles('super-admin', 'kabem', 'wakabem')
  async findRecent(@Query('limit') limit?: string) {
    const data = await this.auditService.findRecent(
      limit ? parseInt(limit, 10) : 20
    );
    return { success: true, data };
  }
}
