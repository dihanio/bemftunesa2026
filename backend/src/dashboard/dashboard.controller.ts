import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('metrics')
  // We don't require specific permissions to view dashboard metrics, 
  // just being authenticated is enough for basic metrics
  async getMetrics(@Query('cabinetPeriod') cabinetPeriod?: string) {
    return {
      success: true,
      data: await this.dashboardService.getMetrics(cabinetPeriod),
    };
  }
}
