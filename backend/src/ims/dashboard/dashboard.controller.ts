import { Controller, Get, Query, UseGuards, Patch, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { GetUser, Roles } from '../../auth/decorators/auth.decorator';

@ApiTags('IMS - Dashboard')
@Controller('ims/dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  async getStats(@GetUser() user: any) {
    return this.dashboardService.getStats(user);
  }

  @Get('activities')
  @ApiOperation({ summary: 'Get recent activities' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getActivities(@Query('limit') limit: string) {
    return this.dashboardService.getActivities(parseInt(limit) || 10);
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get leaderboard' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getLeaderboard(@Query('limit') limit: string) {
    return this.dashboardService.getLeaderboard(parseInt(limit) || 10);
  }

  @Get('agenda')
  @ApiOperation({ summary: 'Get upcoming agenda' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getAgenda(@Query('limit') limit: string) {
    return this.dashboardService.getAgenda(parseInt(limit) || 10);
  }

  @Get('monthly-budget')
  @ApiOperation({ summary: 'Get monthly budget usage for chart' })
  async getMonthlyBudget() {
    return this.dashboardService.getMonthlyBudget();
  }

  @Get('lifecycle')
  @ApiOperation({ summary: 'Get proker lifecycle distribution' })
  async getLifecycle() {
    return this.dashboardService.getLifecycle();
  }

  @Get('department-allocation')
  @ApiOperation({ summary: 'Get department budget allocation usage' })
  async getDepartmentAllocation() {
    return this.dashboardService.getDepartmentAllocation();
  }

  @Get('workload')
  @ApiOperation({ summary: 'Get department workload analytics' })
  async getWorkload() {
    return this.dashboardService.getWorkload();
  }

  @Get('risks')
  @ApiOperation({ summary: 'Get dashboard risk signals' })
  async getRisks() {
    return this.dashboardService.getRisks();
  }

  @Get('workload/members')
  @ApiOperation({ summary: 'Get individual member workload analytics' })
  async getMemberWorkload() {
    return this.dashboardService.getMemberWorkload();
  }

  @Get('sysadmin')
  @ApiOperation({ summary: 'Get sysadmin telemetry' })
  async getSysadminTelemetry() {
    return this.dashboardService.getSysadminTelemetry();
  }

  @Patch('sysadmin/flags')
  @Roles('Super Admin', 'System Administrator')
  @ApiOperation({ summary: 'Toggle sysadmin feature flags' })
  async toggleFlag(@Body('key') key: string) {
    return this.dashboardService.toggleFlag(key);
  }
}
