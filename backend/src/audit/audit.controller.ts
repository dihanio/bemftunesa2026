import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequiredPermissions } from '../auth/decorators/required-permission.decorator';
import { PkkmbPermission } from '../common/auth/pkkmb-permissions';

@Controller('pkkmb/admin/audit-logs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @RequiredPermissions(PkkmbPermission.AUDIT_READ)
  async getAuditLogs(
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    const pageNum = page ? parseInt(page, 10) : 1;
    const data = await this.auditService.findAll(limitNum, pageNum);
    return { success: true, data };
  }
}
