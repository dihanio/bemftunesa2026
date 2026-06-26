import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { WorkflowManagementService } from './workflow-management.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../auth/guards/permissions.guard';
import { RequiredPermissions } from '../../../auth/decorators/required-permission.decorator';
import { Types } from 'mongoose';

@Controller('workflow-management')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequiredPermissions('manage:workflow') // Only users with manage:workflow permission can access
export class WorkflowManagementController {
  constructor(private readonly workflowService: WorkflowManagementService) {}

  @Get('summary')
  async getSummary() {
    return this.workflowService.getSummary();
  }

  @Get()
  async findAll(@Query() query: any) {
    return this.workflowService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.workflowService.findOne(id);
  }

  @Get(':id/active-instances')
  async getActiveInstances(@Param('id') id: string) {
    const count = await this.workflowService.getActiveInstancesCount(id);
    return { count };
  }

  @Post()
  async create(@Body() data: any) {
    return this.workflowService.create(data);
  }

  @Post(':id/clone')
  async clone(@Param('id') id: string, @Req() req: any) {
    return this.workflowService.cloneAndIncrementVersion(id, new Types.ObjectId(req.user.id));
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.workflowService.update(id, data);
  }

  @Post(':id/publish')
  async publish(@Param('id') id: string, @Req() req: any) {
    return this.workflowService.publish(id, new Types.ObjectId(req.user.id));
  }
  
  @Get(':id/validate')
  async validate(@Param('id') id: string) {
    return this.workflowService.validate(id);
  }
  
  @Post(':id/simulate')
  async simulate(@Param('id') id: string, @Body() payload: any) {
    return this.workflowService.simulate(id, payload);
  }
}
