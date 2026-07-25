import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
  BadRequestException,
  Query,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import type { Response, Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequiredPermissions } from '../auth/decorators/required-permission.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PkkmbService } from './pkkmb.service';
import type { UserDocument } from '../schemas/user.schema';
import { PkkmbPermission } from '../common/auth/pkkmb-permissions';
import {
  MabaSubmitTaskDto,
  CreateAttendanceSessionDto,
  CheckInDto,
  AttendanceFilterDto,
  CreateTaskDto,
  GradeSubmissionDto,
  PaginationDto,
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
  CreateScheduleDto,
  UpdateScheduleDto,
} from './dto/pkkmb.dto';

@ApiTags('pkkmb')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('pkkmb')
export class PkkmbController {
  constructor(private readonly pkkmbService: PkkmbService) {}

  // ─── MAHASISWA BARU (MABA) ENDPOINTS ────────────────────────────────────────

  @Get('me')
  @ApiOperation({ summary: 'Mendapatkan profil Maba/Pendamping saat ini' })
  @ApiResponse({ status: 200, description: 'Berhasil' })
  getMe(@CurrentUser() user: UserDocument) {
    return { success: true, data: user };
  }

  @Get('dashboard/maba')
  @ApiOperation({ summary: 'Mendapatkan data agregasi untuk Dashboard Maba' })
  async getMabaDashboard(@CurrentUser() user: { userId: string }) {
    const data = await this.pkkmbService.getMabaDashboard(user.userId);
    return { success: true, data };
  }

  // ─── GUGUS & MASTER DATA ENDPOINTS ───────────────────────────────────────

  @Get('master/rumpun')
  @ApiOperation({
    summary: 'Mendapatkan daftar Master Rumpun Akademik FT UNESA',
  })
  async getAllRumpun() {
    const data = await this.pkkmbService.getAllRumpun();
    return { success: true, data };
  }

  @Get('master/study-programs')
  @ApiOperation({ summary: 'Mendapatkan daftar Master Program Studi FT UNESA' })
  async getAllStudyPrograms() {
    const data = await this.pkkmbService.getAllStudyPrograms();
    return { success: true, data };
  }

  @Get('gugus')
  @ApiOperation({ summary: 'Mendapatkan daftar 50 Gugus PKKMB FT UNESA 2026' })
  async getAllGugus() {
    const data = await this.pkkmbService.getAllGugus();
    return { success: true, data };
  }

  @Get('gugus/analytics')
  @RequiredPermissions(PkkmbPermission.MONITORING_READ)
  @ApiOperation({
    summary: 'Mendapatkan analitik distribusi Gugus, Prodi, dan Rumpun',
  })
  async getAdminGugusAnalytics() {
    const data = await this.pkkmbService.getAdminGugusAnalytics();
    return { success: true, data };
  }

  @Get('gugus/:id')
  @ApiOperation({
    summary: 'Mendapatkan detail Gugus & statistik distribusi lintas prodi',
  })
  async getGugusDetail(@Param('id') id: string) {
    const data = await this.pkkmbService.getGugusDetail(id);
    return { success: true, data };
  }

  @Post('gugus/auto-distribute')
  @RequiredPermissions(PkkmbPermission.GROUP_CREATE)
  @ApiOperation({
    summary:
      'Menjalankan Algoritma Pembagian Gugus Otomatis Lintas Program Studi (Round-Robin)',
  })
  async autoDistributeGugus() {
    const data = await this.pkkmbService.autoDistributeGugus();
    return { success: true, ...data };
  }

  // ─── UNIVERSAL ATTENDANCE MODULE ──────────────────────────────────────────

  @Get('attendance/sessions')
  @ApiOperation({ summary: 'Melihat sesi presensi universal (MABA & Panitia)' })
  async getAttendanceSessions(
    @Query('participantType') participantType?: string,
    @Query('status') status?: string,
  ) {
    const data = await this.pkkmbService.getAttendanceSessions(
      participantType,
      status,
    );
    return { success: true, data };
  }

  @Post('attendance/sessions')
  @RequiredPermissions(PkkmbPermission.ATTENDANCE_SESSION_CREATE)
  @ApiOperation({ summary: 'Membuat sesi presensi universal baru' })
  async createAttendanceSession(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateAttendanceSessionDto,
  ) {
    const data = await this.pkkmbService.createAttendanceSession(
      user.userId,
      dto,
    );
    return {
      success: true,
      message: 'Sesi presensi baru berhasil dibuat',
      data,
    };
  }

  @Patch('attendance/sessions/:id/status')
  @RequiredPermissions(PkkmbPermission.ATTENDANCE_SESSION_CREATE)
  @ApiOperation({
    summary: 'Memperbarui status sesi presensi (DRAFT, PUBLISHED, CLOSED)',
  })
  async updateAttendanceSessionStatus(
    @Param('id') id: string,
    @Body('status') status: 'DRAFT' | 'PUBLISHED' | 'CLOSED',
  ) {
    const data = await this.pkkmbService.updateAttendanceSessionStatus(
      id,
      status,
    );
    return {
      success: true,
      message: 'Status sesi presensi berhasil diperbarui',
      data,
    };
  }

  @Post('attendance/checkin')
  @RequiredPermissions(PkkmbPermission.ATTENDANCE_CHECKIN)
  @ApiOperation({
    summary:
      'Melakukan check-in presensi universal (QR, Manual Operator, Search NIM)',
  })
  async checkIn(
    @CurrentUser() user: { userId: string },
    @Body() dto: CheckInDto,
    @Req() req: Request,
  ) {
    const ipAddress =
      req.ip || (req.headers['x-forwarded-for'] as string) || undefined;
    const userAgent = req.headers['user-agent'];

    const data = await this.pkkmbService.checkIn(
      dto,
      user.userId,
      ipAddress,
      userAgent,
    );
    return { success: true, message: 'Presensi berhasil dicatat!', data };
  }

  @Get('attendance/monitoring')
  @RequiredPermissions(PkkmbPermission.MONITORING_READ)
  @ApiOperation({
    summary: 'Monitoring dashboard & laporan presensi real-time',
  })
  async getAttendanceMonitoring(@Query() query: AttendanceFilterDto) {
    const data = await this.pkkmbService.getAttendanceMonitoring(query);
    return { success: true, data };
  }

  @Get('attendance/my-history')
  @RequiredPermissions(PkkmbPermission.PROFILE_READ_OWN)
  @ApiOperation({ summary: 'Melihat riwayat presensi sendiri (MABA/Panitia)' })
  async getMyAttendanceHistory(@CurrentUser() user: { userId: string }) {
    const data = await this.pkkmbService.getMyAttendanceHistory(user.userId);
    return { success: true, data };
  }

  // ─── TASKS & SUBMISSIONS ──────────────────────────────────────────────────

  @Get('tasks')
  @ApiOperation({ summary: 'Melihat daftar tugas' })
  async getTasks(
    @CurrentUser() user: { role?: string },
    @Query() query: PaginationDto,
  ) {
    const isPanitia = user?.role !== 'user' && user?.role !== 'maba';
    const data = await this.pkkmbService.getTasks(query, isPanitia);
    return { success: true, data };
  }

  @Post('maba/tasks/:id/submit')
  @RequiredPermissions(PkkmbPermission.TASK_SUBMIT)
  @ApiOperation({
    summary: 'Pengumpulan Tugas (Metode Google Drive / Cloud Link)',
  })
  @ApiParam({ name: 'id', description: 'ID Tugas' })
  async submitTask(
    @CurrentUser() user: UserDocument,
    @Param('id') taskId: string,
    @Body() dto: MabaSubmitTaskDto,
  ) {
    if (!user.pkkmbGroup)
      throw new BadRequestException('Anda belum masuk ke kelompok manapun');
    const data = await this.pkkmbService.submitTask(
      user._id.toString(),
      user.pkkmbGroup.toString(),
      taskId,
      dto,
    );
    return { success: true, message: 'Tugas berhasil dikumpulkan', data };
  }

  // ─── EVALUATOR & PANITIA ENDPOINTS ──────────────────────────────────────

  @Post('pemateri/tasks')
  @RequiredPermissions(PkkmbPermission.TASK_CREATE)
  @ApiOperation({ summary: 'Membuat tugas baru (Draft / Published)' })
  async createTask(@Body() dto: CreateTaskDto) {
    const data = await this.pkkmbService.createTask(dto);
    return { success: true, message: 'Tugas berhasil dibuat', data };
  }

  @Patch('pemateri/submissions/:id/grade')
  @RequiredPermissions(PkkmbPermission.GRADING_UPDATE)
  @ApiOperation({ summary: 'Menilai dan memberi feedback pada tugas' })
  @ApiParam({ name: 'id', description: 'ID Pengumpulan Tugas (Submission)' })
  async gradeSubmission(
    @CurrentUser() grader: { userId: string },
    @Param('id') submissionId: string,
    @Body() dto: GradeSubmissionDto,
  ) {
    const data = await this.pkkmbService.gradeSubmission(
      submissionId,
      grader.userId,
      dto,
    );
    return { success: true, message: 'Nilai tugas berhasil disimpan', data };
  }

  @Get('dashboard/panitia')
  @RequiredPermissions(PkkmbPermission.MONITORING_READ)
  @ApiOperation({
    summary: 'Mendapatkan data agregasi untuk Dashboard Panitia',
  })
  async getPanitiaDashboard() {
    const data = await this.pkkmbService.getPanitiaDashboard();
    return { success: true, data };
  }

  // ─── ANNOUNCEMENTS & SCHEDULES ──────────────────────────────────────────────

  @Get('announcements')
  @ApiOperation({ summary: 'Melihat pengumuman PKKMB' })
  async getAnnouncements(
    @CurrentUser() user: UserDocument & { role?: string },
    @Query() query: PaginationDto,
  ) {
    const groupId = user.pkkmbGroup?.toString();
    const isPanitia = user.role !== 'user' && user.role !== 'maba';
    const data = await this.pkkmbService.getAnnouncements(
      query,
      groupId,
      isPanitia,
    );
    return { success: true, data };
  }

  @Post('admin/announcements')
  @RequiredPermissions(PkkmbPermission.ANNOUNCEMENT_CREATE)
  @ApiOperation({ summary: 'Membuat Pengumuman PKKMB' })
  async createAnnouncement(@Body() dto: CreateAnnouncementDto) {
    const data = await this.pkkmbService.createAnnouncement(dto);
    return { success: true, message: 'Pengumuman berhasil dibuat', data };
  }

  @Patch('admin/announcements/:id')
  @RequiredPermissions(PkkmbPermission.ANNOUNCEMENT_CREATE)
  @ApiOperation({ summary: 'Mengubah Pengumuman PKKMB' })
  async updateAnnouncement(
    @Param('id') id: string,
    @Body() dto: UpdateAnnouncementDto,
  ) {
    const data = await this.pkkmbService.updateAnnouncement(id, dto);
    return { success: true, message: 'Pengumuman berhasil diubah', data };
  }

  @Delete('admin/announcements/:id')
  @RequiredPermissions(PkkmbPermission.ANNOUNCEMENT_CREATE)
  @ApiOperation({ summary: 'Menghapus Pengumuman PKKMB' })
  async deleteAnnouncement(@Param('id') id: string) {
    const data = await this.pkkmbService.deleteAnnouncement(id);
    return { success: true, message: 'Pengumuman berhasil dihapus', data };
  }

  @Get('schedules')
  @ApiOperation({ summary: 'Melihat Jadwal PKKMB' })
  async getSchedules(@Query() query: PaginationDto) {
    const data = await this.pkkmbService.getSchedules(query);
    return { success: true, data };
  }

  @Post('admin/schedules')
  @RequiredPermissions(PkkmbPermission.SCHEDULE_CREATE)
  @ApiOperation({ summary: 'Membuat Jadwal PKKMB' })
  async createSchedule(@Body() dto: CreateScheduleDto) {
    const data = await this.pkkmbService.createSchedule(dto);
    return { success: true, message: 'Jadwal berhasil dibuat', data };
  }

  @Patch('admin/schedules/:id')
  @RequiredPermissions(PkkmbPermission.SCHEDULE_CREATE)
  @ApiOperation({ summary: 'Mengubah Jadwal PKKMB' })
  async updateSchedule(
    @Param('id') id: string,
    @Body() dto: UpdateScheduleDto,
  ) {
    const data = await this.pkkmbService.updateSchedule(id, dto);
    return { success: true, message: 'Jadwal berhasil diubah', data };
  }

  @Delete('admin/schedules/:id')
  @RequiredPermissions(PkkmbPermission.SCHEDULE_CREATE)
  @ApiOperation({ summary: 'Menghapus Jadwal PKKMB' })
  async deleteSchedule(@Param('id') id: string) {
    const data = await this.pkkmbService.deleteSchedule(id);
    return { success: true, message: 'Jadwal berhasil dihapus', data };
  }
}
