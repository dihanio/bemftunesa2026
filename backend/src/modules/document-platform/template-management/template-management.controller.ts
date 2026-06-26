import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../auth/guards/permissions.guard';
import { RequiredPermissions } from '../../../auth/decorators/required-permission.decorator';
import { TemplateManagementService } from './template-management.service';

@Controller('templates')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TemplateManagementController {
  constructor(private readonly templateService: TemplateManagementService) {}

  @Get()
  async findAll(@Query() query: any) {
    return this.templateService.findAll(query);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.templateService.findById(id);
  }

  @Get('code/:code/history')
  async getVersionHistory(@Param('code') code: string) {
    return this.templateService.getVersionHistory(code);
  }

  @Get(':id/usage')
  async getUsageStats(@Param('id') id: string) {
    return this.templateService.getUsageStats(id);
  }

  @Post('sync')
  @RequiredPermissions('manage:templates')
  async syncFromDrive(@Body() body: any) {
    return this.templateService.syncFromDrive(body);
  }

  @Post(':id/validate')
  @RequiredPermissions('manage:templates')
  async validateTemplate(@Param('id') id: string) {
    return this.templateService.validateTemplate(id);
  }

  @Post(':id/publish')
  @RequiredPermissions('manage:templates')
  async publishTemplate(@Param('id') id: string) {
    return this.templateService.publishTemplate(id);
  }

  @Post(':id/preview')
  async getPreview(@Param('id') id: string, @Body() body: any) {
    const html = await this.templateService.getPreview(id, body.customData);
    return { htmlContent: html };
  }

  @Put(':id')
  @RequiredPermissions('manage:templates')
  async updateTemplateData(@Param('id') id: string, @Body() body: any) {
    return this.templateService.updateTemplateData(id, body);
  }
}
