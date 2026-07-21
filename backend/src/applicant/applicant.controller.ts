import { 
  Controller, Get, Post, Patch, 
  Body, Param, Query, UseGuards, 
  Request, Response, BadRequestException 
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApplicantService } from './applicant.service';
import { 
  RegisterApplicantDto, 
  UpdateApplicantStatusDto, 
  ScheduleInterviewDto, 
  SubmitInterviewResultDto, 
  SetFinalResultDto,
  ApplicantQueryDto
} from './dto/applicant.dto';
import type { Response as Res } from 'express';

@Controller('applicant')
export class ApplicantController {
  constructor(private readonly applicantService: ApplicantService) {}

  // ── Public Endpoints ──

  @Post('public/register/:recruitmentId')
  async register(
    @Param('recruitmentId') recruitmentId: string, 
    @Body() dto: RegisterApplicantDto
  ) {
    const data = await this.applicantService.register(recruitmentId, dto);
    return { success: true, data };
  }

  @Get('public/check/:recruitmentId')
  async checkResult(
    @Param('recruitmentId') recruitmentId: string,
    @Query('nim') nim?: string,
    @Query('email') email?: string
  ) {
    const identifier = nim || email;
    if (!identifier) {
      throw new BadRequestException('Harap berikan nim atau email untuk mengecek status');
    }
    const data = await this.applicantService.checkResult(recruitmentId, identifier);
    return { success: true, data };
  }

  // ── CMS Endpoints (Auth Required) ──

  @Get(':recruitmentId')
  @UseGuards(JwtAuthGuard)
  async findByRecruitment(
    @Param('recruitmentId') recruitmentId: string,
    @Query() query: ApplicantQueryDto
  ) {
    return this.applicantService.findByRecruitment(recruitmentId, query);
  }

  @Get(':recruitmentId/stats')
  @UseGuards(JwtAuthGuard)
  async getStats(@Param('recruitmentId') recruitmentId: string) {
    const data = await this.applicantService.getStats(recruitmentId);
    return { success: true, data };
  }

  @Get(':recruitmentId/export')
  @UseGuards(JwtAuthGuard)
  async exportData(
    @Param('recruitmentId') recruitmentId: string,
    @Query() query: ApplicantQueryDto,
    @Query('format') format: string = 'csv',
    @Response() res: Res
  ) {
    const data = await this.applicantService.exportData(recruitmentId, query);
    
    if (format === 'csv') {
      const fields = [
        'name', 'nim', 'email', 'phone', 'department', 'batch', 
        'positionChoice', 'status', 'finalScore', 'adminNotes'
      ];
      
      const csvContent = [
        fields.join(','),
        ...data.map(item => [
          `"${item.name}"`, 
          `"${item.nim}"`, 
          `"${item.email}"`, 
          `"${item.phone || ''}"`, 
          `"${item.department}"`, 
          `"${item.batch}"`, 
          `"${item.positionChoice}"`, 
          `"${item.status}"`, 
          item.interview?.scoring?.finalScore || '',
          `"${(item.adminNotes || '').replace(/"/g, '""')}"`
        ].join(','))
      ].join('\\n');

      res.header('Content-Type', 'text/csv');
      res.attachment(`applicants-${recruitmentId}.csv`);
      return res.send(csvContent);
    }
    
    // For now, only CSV is manually implemented. XLSX can be added using a library later.
    throw new BadRequestException('Format belum didukung penuh');
  }

  @Get('detail/:id')
  @UseGuards(JwtAuthGuard)
  async getDetail(@Param('id') id: string) {
    const data = await this.applicantService.findOne(id);
    return { success: true, data };
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  async updateStatus(
    @Param('id') id: string, 
    @Body() dto: UpdateApplicantStatusDto,
    @Request() req: import('express').Request
  ) {
    const u = req.user as unknown as { _id?: string; id?: string; userId?: string };
    const userId = u.userId || u._id || u.id || '';
    const data = await this.applicantService.updateStatus(id, dto, userId);
    return { success: true, data };
  }

  @Patch(':id/interview')
  @UseGuards(JwtAuthGuard)
  async scheduleInterview(
    @Param('id') id: string, 
    @Body() dto: ScheduleInterviewDto,
    @Request() req: import('express').Request
  ) {
    const u = req.user as unknown as { _id?: string; id?: string; userId?: string };
    const userId = u.userId || u._id || u.id || '';
    const data = await this.applicantService.scheduleInterview(id, dto, userId);
    return { success: true, data };
  }

  @Patch(':id/interview-result')
  @UseGuards(JwtAuthGuard)
  async submitInterviewResult(
    @Param('id') id: string, 
    @Body() dto: SubmitInterviewResultDto,
    @Request() req: import('express').Request
  ) {
    const u = req.user as unknown as { _id?: string; id?: string; userId?: string };
    const userId = u.userId || u._id || u.id || '';
    const data = await this.applicantService.submitInterviewResult(id, dto, userId);
    return { success: true, data };
  }

  @Patch(':id/final')
  @UseGuards(JwtAuthGuard)
  async setFinalResult(
    @Param('id') id: string, 
    @Body() dto: SetFinalResultDto,
    @Request() req: import('express').Request
  ) {
    const u = req.user as unknown as { _id?: string; id?: string; userId?: string };
    const userId = u.userId || u._id || u.id || '';
    const data = await this.applicantService.setFinalResult(id, dto, userId);
    return { success: true, data };
  }
}
