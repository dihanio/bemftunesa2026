import { Controller, Get, Post, Put, Body, Param, Req, UseGuards } from '@nestjs/common';
import { NumberingManagementService } from './numbering-management.service';
import type { DocumentContext } from '../interfaces/document-context.interface';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../auth/guards/permissions.guard';

@Controller('document-platform/numbering')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class NumberingManagementController {
  constructor(private readonly numberingService: NumberingManagementService) {}

  @Get('formats')
  async listFormats() {
    return this.numberingService.listFormats();
  }

  @Get('tokens')
  async getTokens() {
    return this.numberingService.getTokens();
  }

  @Get('formats/:id')
  async getFormat(@Param('id') id: string) {
    return this.numberingService.getFormat(id);
  }

  @Post('formats')
  async createFormat(@Body() data: any) {
    return this.numberingService.createFormat(data);
  }

  @Put('formats/:id')
  async updateFormat(@Param('id') id: string, @Body() data: any) {
    return this.numberingService.updateFormat(id, data);
  }

  @Post('preview')
  async preview(@Body() body: { formatPattern: string, resetPeriod: string, sequenceLength: number, context: any }) {
    return this.numberingService.preview(
      body.formatPattern,
      body.resetPeriod,
      body.sequenceLength,
      body.context
    );
  }

  @Get('sequence/:documentType')
  async getSequenceDetails(@Param('documentType') documentType: string) {
    // Context is reconstructed server-side in a real implementation.
    // For now we pass a minimal context.
    const context = { documentType, documentData: {} } as any;
    return this.numberingService.getSequenceDetails(documentType, context);
  }

  @Post('formats/:id/reset')
  async resetSequence(@Param('id') id: string, @Body() body: { context: any, reason: string }, @Req() req: any) {
    return this.numberingService.resetSequence(id, body.context, body.reason, req.user.userId);
  }
}
