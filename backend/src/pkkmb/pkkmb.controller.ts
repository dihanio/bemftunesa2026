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
  UseInterceptors,
  UploadedFile,
  StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import type { Response, Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequiredPermissions } from '../auth/decorators/required-permission.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PkkmbService } from './pkkmb.service';
import { GugusSyncService } from './gugus-sync.service';
import type { UserDocument } from '../schemas/user.schema';
import { PkkmbPermission } from '../common/auth/pkkmb-permissions';
import { XLSX_MIME } from './quiz-import-export';
import {
  MabaSubmitTaskDto,
  CreateAttendanceSessionDto,
  CreateQrPointDto,
  ClaimQrPointDto,
  CheckInDto,
  AttendanceFilterDto,
  CreateTaskDto,
  GradeSubmissionDto,
  PaginationDto,
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
  CreateScheduleDto,
  UpdateScheduleDto,
  AdminCreateUserDto,
  AdminUpdateUserDto,
  OnboardDto,
  SubmitIzinDto,
  VerifyIzinDto,
  UpdateAttendanceRecordDto,
  CreateQuizDto,
  SubmitQuizDto,
  SaveQuizAnswersDto,
  ReportViolationDto,
  ReportQuizEventsDto,
} from './dto/pkkmb.dto';

@ApiTags('pkkmb')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('pkkmb')
export class PkkmbController {
  constructor(
    private readonly pkkmbService: PkkmbService,
    private readonly gugusSyncService: GugusSyncService,
  ) {}

  // ─── MAHASISWA BARU (MABA) ENDPOINTS ────────────────────────────────────────

  @Get('me')
  @ApiOperation({ summary: 'Mendapatkan profil Maba/Pendamping saat ini' })
  @ApiResponse({ status: 200, description: 'Berhasil' })
  async getMe(@CurrentUser() user: { userId: string }) {
    const userData = await this.pkkmbService.getUserProfile(user.userId);
    return { success: true, data: userData };
  }

  @Get('dashboard/maba')
  @ApiOperation({ summary: 'Mendapatkan data agregasi untuk Dashboard Maba' })
  async getMabaDashboard(@CurrentUser() user: { userId: string }) {
    const data = await this.pkkmbService.getMabaDashboard(user.userId);
    return { success: true, data };
  }

  @Get('dashboard/maba/announcements')
  @ApiOperation({ summary: 'Pengumuman prioritas untuk Dashboard Maba' })
  async getMabaDashboardAnnouncements(@CurrentUser() user: UserDocument) {
    const data = await this.pkkmbService.getMabaDashboardAnnouncements(
      user.pkkmbGroup?.toString(),
    );
    return { success: true, data };
  }

  @Get('dashboard/maba/announcements/notifications')
  @ApiOperation({
    summary: 'Feed notifikasi pengumuman dengan status read/unread (MABA)',
  })
  async getMabaNotificationFeed(
    @CurrentUser() user: { userId: string },
    @Query('limit') limit?: string,
  ) {
    const parsed = parseInt(limit || '', 10);
    const data = await this.pkkmbService.getMabaNotificationFeed(
      user.userId,
      Number.isFinite(parsed) && parsed > 0 ? parsed : undefined,
    );
    return { success: true, data };
  }

  @Post('dashboard/maba/announcements/read')
  @ApiOperation({ summary: 'Menandai pengumuman sebagai telah dibaca (MABA)' })
  async markAnnouncementsRead(
    @CurrentUser() user: { userId: string },
    @Body() body: { announcementIds?: string[] },
  ) {
    const data = await this.pkkmbService.markAnnouncementsRead(
      user.userId,
      body?.announcementIds,
    );
    return { success: true, data };
  }

  @Get('dashboard/maba/schedules')
  @ApiOperation({ summary: 'Jadwal mendatang untuk Dashboard Maba' })
  async getMabaDashboardSchedules() {
    const data = await this.pkkmbService.getMabaDashboardSchedules();
    return { success: true, data };
  }

  @Post('onboard')
  @ApiOperation({ summary: 'Submit onboarding data untuk Maba' })
  async submitOnboard(
    @CurrentUser() user: { userId: string },
    @Body() dto: OnboardDto,
  ) {
    const result = await this.pkkmbService.submitOnboard(user.userId, dto);
    return { success: true, message: 'Onboarding berhasil', data: result };
  }

  @Get('dashboard/maba/tasks')
  @ApiOperation({ summary: 'Status tugas untuk Dashboard Maba' })
  async getMabaDashboardTasks(@CurrentUser() user: { userId: string }) {
    const data = await this.pkkmbService.getMabaDashboardTasks(user.userId);
    return { success: true, data };
  }

  @Get('dashboard/maba/attendance')
  @ApiOperation({ summary: 'Ringkasan kehadiran hari ini' })
  async getMabaDashboardAttendance(@CurrentUser() user: { userId: string }) {
    const data = await this.pkkmbService.getMabaDashboardAttendance(
      user.userId,
    );
    return { success: true, data };
  }

  @Get('dashboard/maba/progress')
  @ApiOperation({ summary: 'Progress PKKMB mahasiswa' })
  async getMabaDashboardProgress(@CurrentUser() user: { userId: unknown }) {
    const data = await this.pkkmbService.getMabaDashboardProgress(
      user.userId as string,
    );
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
  async getAllGugus(): Promise<{ success: boolean; data: unknown }> {
    const data = await this.pkkmbService.getAllGugus();
    return { success: true, data };
  }

  @Get('gugus/pendamping')
  @RequiredPermissions(PkkmbPermission.SETTINGS_MANAGE)
  @ApiOperation({ summary: 'Daftar user panitia Sie Pendamping' })
  async listPendamping() {
    const data = await this.pkkmbService.listPendamping();
    return { success: true, data };
  }

  @Post('gugus/:id/pendamping')
  @RequiredPermissions(PkkmbPermission.SETTINGS_MANAGE)
  @ApiOperation({ summary: 'Menetapkan pendamping ke gugus' })
  async assignPendamping(
    @Param('id') id: string,
    @Body('pendampingId') pendampingId: string,
  ) {
    if (!pendampingId)
      throw new BadRequestException('pendampingId wajib diisi');
    const data = await this.pkkmbService.assignPendamping(id, pendampingId);
    return { success: true, message: 'Pendamping ditetapkan', data };
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
  @Throttle({ default: { limit: 2, ttl: 60000 } })
  @ApiOperation({
    summary:
      'Menjalankan Algoritma Pembagian Gugus Otomatis Lintas Program Studi (Round-Robin)',
  })
  async autoDistributeGugus() {
    const data = await this.pkkmbService.autoDistributeGugus();
    return { success: true, ...data };
  }

  @Post('gugus/rebalance')
  @RequiredPermissions(PkkmbPermission.GROUP_CREATE)
  @Throttle({ default: { limit: 2, ttl: 60000 } })
  @ApiOperation({
    summary:
      'Rebalance seluruh maba ke gugus secara seimbang per Program Studi',
  })
  async rebalanceGugus() {
    const data = await this.pkkmbService.rebalanceGugus();
    return { success: true, ...data };
  }

  @Get('admin/maba/pending-verification')
  @RequiredPermissions(PkkmbPermission.REGISTRATION_MANAGE)
  @ApiOperation({ summary: 'Daftar MABA yang menunggu verifikasi' })
  async getPendingVerifications(@Query() query: PaginationDto) {
    const result = await this.pkkmbService.getPendingVerifications(query);
    return { success: true, ...result };
  }

  @Patch('admin/maba/:id/verify')
  @RequiredPermissions(PkkmbPermission.REGISTRATION_MANAGE)
  @ApiOperation({ summary: 'Verifikasi data MABA' })
  async verifyMaba(@Param('id') id: string) {
    const data = await this.pkkmbService.verifyMaba(id);
    return { success: true, message: 'MABA berhasil diverifikasi', data };
  }

  @Patch('admin/maba/:id/reject')
  @RequiredPermissions(PkkmbPermission.REGISTRATION_MANAGE)
  @ApiOperation({ summary: 'Tolak verifikasi MABA' })
  async rejectMaba(@Param('id') id: string, @Body('reason') reason: string) {
    const data = await this.pkkmbService.rejectMaba(id, reason);
    return { success: true, message: 'MABA ditolak', data };
  }

  @Post('admin/gugus/publish')
  @RequiredPermissions(PkkmbPermission.GROUP_PUBLISH)
  @ApiOperation({ summary: 'Publish hasil assignment gugus' })
  async publishGugus(@CurrentUser() user: { userId: string }) {
    const data = await this.pkkmbService.publishGugus(user.userId);
    return { success: true, ...data };
  }

  @Post('admin/gugus/schedule-publish')
  @RequiredPermissions(PkkmbPermission.GROUP_PUBLISH)
  @ApiOperation({ summary: 'Jadwalkan publish gugus' })
  async schedulePublishGugus(@Body('scheduledAt') scheduledAt: string) {
    const data = await this.pkkmbService.schedulePublishGugus(
      new Date(scheduledAt),
    );
    return { success: true, ...data };
  }

  @Get('admin/gugus/publish-config')
  @RequiredPermissions(PkkmbPermission.GROUP_PUBLISH)
  @ApiOperation({ summary: 'Lihat konfigurasi publish gugus' })
  async getPublishConfig() {
    const data = await this.pkkmbService.getPublishConfig();
    return { success: true, data };
  }

  // ─── UNIVERSAL ATTENDANCE MODULE ──────────────────────────────────────────

  @Get('attendance/sessions')
  @RequiredPermissions(PkkmbPermission.ATTENDANCE_CHECKIN)
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
  // Gate panitia-level (semua panitia punya MONITORING_READ). Otorisasi akhir
  // KSK (divisi Kesekretariatan)/sekretaris/admin dilakukan di service
  // (assertAttendanceManager) — role & division diambil dari database.
  @RequiredPermissions(PkkmbPermission.MONITORING_READ)
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
  @RequiredPermissions(PkkmbPermission.MONITORING_READ)
  @ApiOperation({
    summary: 'Memperbarui status sesi presensi (DRAFT, PUBLISHED, CLOSED)',
  })
  async updateAttendanceSessionStatus(
    @Param('id') id: string,
    @Body('status') status: 'DRAFT' | 'PUBLISHED' | 'CLOSED',
    @CurrentUser() user: { userId: string },
  ) {
    const data = await this.pkkmbService.updateAttendanceSessionStatus(
      id,
      status,
      user.userId,
    );
    return {
      success: true,
      message: 'Status sesi presensi berhasil diperbarui',
      data,
    };
  }

  @Patch('attendance/sessions/:id')
  @RequiredPermissions(PkkmbPermission.MONITORING_READ)
  @ApiOperation({
    summary: 'Mengubah data sesi presensi (judul, waktu, lokasi)',
  })
  async updateAttendanceSession(
    @Param('id') id: string,
    @Body() dto: CreateAttendanceSessionDto,
    @CurrentUser() user: { userId: string },
  ) {
    const data = await this.pkkmbService.updateAttendanceSession(
      id,
      user.userId,
      dto,
    );
    return {
      success: true,
      message: 'Sesi presensi berhasil diperbarui',
      data,
    };
  }

  @Delete('attendance/sessions/:id')
  @RequiredPermissions(PkkmbPermission.MONITORING_READ)
  @ApiOperation({ summary: 'Menghapus sesi presensi (soft delete)' })
  async deleteAttendanceSession(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
  ) {
    const data = await this.pkkmbService.deleteAttendanceSession(
      id,
      user.userId,
    );
    return {
      success: true,
      message: 'Sesi presensi berhasil dihapus',
      data,
    };
  }

  @Post('attendance/checkin')
  @RequiredPermissions(PkkmbPermission.ATTENDANCE_CHECKIN)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary:
      'Melakukan check-in presensi universal (QR, Manual Operator, Search NIM)',
  })
  async checkIn(
    @CurrentUser() user: { userId: string; role?: { slug: string } },
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

  @Post('attendance/izin')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Mengajukan izin/sakit (Maba)' })
  async submitIzin(
    @CurrentUser() user: { userId: string },
    @Body() dto: SubmitIzinDto,
  ) {
    const data = await this.pkkmbService.submitIzin(user.userId, dto);
    return {
      success: true,
      message: 'Izin/sakit diajukan. Menunggu verifikasi panitia.',
      data,
    };
  }

  @Get('attendance/izin/pending')
  // READ: panitia/divisi boleh melihat daftar izin (read-only).
  // MONITORING_READ dipertahankan agar role existing (pimpinan/bendahara)
  // yang sudah memiliki akses monitoring tidak rusak.
  @RequiredPermissions(
    PkkmbPermission.ATTENDANCE_READ,
    PkkmbPermission.MONITORING_READ,
  )
  @ApiOperation({
    summary: 'Daftar izin/sakit menunggu verifikasi (read-only)',
  })
  async listPendingIzin() {
    const data = await this.pkkmbService.listPendingIzin();
    return { success: true, data };
  }

  @Post('attendance/izin/verify')
  // Gate panitia-level; authority KSK/sekretaris/super-admin di service.
  @RequiredPermissions(PkkmbPermission.MONITORING_READ)
  @ApiOperation({ summary: 'Verifikasi izin/sakit (Approve/Reject)' })
  async verifyIzin(
    @CurrentUser() user: { userId: string },
    @Body() dto: VerifyIzinDto,
  ) {
    const data = await this.pkkmbService.verifyIzin(
      dto.recordId,
      dto.decision,
      user.userId,
    );
    return { success: true, data };
  }

  @Delete('attendance/records/:id')
  // Gate panitia-level; DELETE hanya ADMIN di service (deleteOp).
  @RequiredPermissions(PkkmbPermission.MONITORING_READ)
  @ApiOperation({ summary: 'Menghapus record presensi (Admin saja)' })
  async deleteAttendanceRecord(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
  ) {
    await this.pkkmbService.deleteAttendanceRecord(id, user.userId);
    return { success: true, message: 'Record presensi berhasil dihapus' };
  }

  @Patch('attendance/records/:id')
  // Gate panitia-level; yg boleh edit = manager (KSK/sekretaris/admin) di service.
  @RequiredPermissions(PkkmbPermission.MONITORING_READ)
  @ApiOperation({ summary: 'Mengubah status record presensi (koreksi)' })
  async updateAttendanceRecord(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
    @Body() dto: UpdateAttendanceRecordDto,
  ) {
    await this.pkkmbService.updateAttendanceRecord(id, user.userId, dto);
    return { success: true, message: 'Status presensi berhasil diubah' };
  }

  @Get('attendance/monitoring')
  // READ: panitia/divisi boleh monitoring (read-only); scope data per gugus
  // tetap dibatasi service untuk non-admin. MONITORING_READ dipertahankan agar
  // role existing (pimpinan/bendahara) tidak kehilangan akses monitoring.
  @RequiredPermissions(
    PkkmbPermission.ATTENDANCE_READ,
    PkkmbPermission.MONITORING_READ,
  )
  @ApiOperation({
    summary: 'Monitoring dashboard & laporan presensi real-time',
  })
  async getAttendanceMonitoring(
    @Query() query: AttendanceFilterDto,
    @CurrentUser() user: { userId: unknown },
  ) {
    const data = await this.pkkmbService.getAttendanceMonitoring(query, user);
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
  @RequiredPermissions(PkkmbPermission.TASK_READ)
  @ApiOperation({ summary: 'Melihat daftar tugas' })
  async getTasks(
    @CurrentUser() user: { userId?: string; role?: { slug?: string } },
    @Query() query: PaginationDto,
  ) {
    const roleSlug = user?.role?.slug;
    const isPanitia = roleSlug !== 'user' && roleSlug !== 'maba';
    const data = await this.pkkmbService.getTasks(query, isPanitia, user);
    return { success: true, data };
  }

  // ─── ASSIGNMENTS (Google Classroom-like: TASK & QUIZ) ─────────────────────

  @Get('assignments')
  @RequiredPermissions(PkkmbPermission.TASK_READ)
  @ApiOperation({
    summary:
      'Daftar penugasan (Google Classroom-like): TASK & QUIZ; status per student (NOT_STARTED/IN_PROGRESS/COMPLETED/OVERDUE) + activeAttemptId',
  })
  async getAssignments(
    @CurrentUser() user: { userId?: string; role?: { slug?: string } },
    @Query() query: PaginationDto,
  ) {
    const roleSlug = user?.role?.slug;
    const isPanitia = roleSlug !== 'user' && roleSlug !== 'maba';
    const data = await this.pkkmbService.listAssignments(
      user?.userId as string,
      query,
      isPanitia,
    );
    return { success: true, ...data };
  }

  @Get('assignments/:id')
  @RequiredPermissions(PkkmbPermission.TASK_READ)
  @ApiOperation({
    summary: 'Detail penugasan utk student (cek targeting assignment + quiz)',
  })
  async getAssignmentDetail(
    @CurrentUser() user: { userId: string },
    @Param('id') assignmentId: string,
  ): Promise<{ success: boolean; data: Record<string, unknown> }> {
    const data = await this.pkkmbService.getAssignmentDetail(
      assignmentId,
      user.userId,
    );
    return { success: true, data };
  }

  @Post('assignments')
  @RequiredPermissions(PkkmbPermission.TASK_CREATE)
  @ApiOperation({
    summary:
      'Buat penugasan baru. type=QUIZ → wajib quizId (quiz existing, tidak dibuat otomatis); type=TASK → tipe submisi individu/kelompok.',
  })
  async createAssignment(
    @CurrentUser() user: { userId?: string },
    @Body() dto: CreateTaskDto,
  ) {
    const data = await this.pkkmbService.createTask(dto, user?.userId);
    return { success: true, message: 'Penugasan berhasil dibuat', data };
  }

  @Patch('assignments/:id')
  @RequiredPermissions(PkkmbPermission.TASK_UPDATE)
  @ApiOperation({
    summary: 'Ubah penugasan (quizId assignment Quiz tidak dapat diganti)',
  })
  async updateAssignment(
    @Param('id') assignmentId: string,
    @Body() dto: CreateTaskDto,
  ) {
    const data = await this.pkkmbService.updateAssignment(assignmentId, dto);
    return { success: true, message: 'Penugasan berhasil diperbarui', data };
  }

  @Delete('assignments/:id')
  @RequiredPermissions(PkkmbPermission.TASK_DELETE)
  @ApiOperation({ summary: 'Hapus penugasan (soft delete)' })
  async deleteAssignment(@Param('id') assignmentId: string) {
    const data = await this.pkkmbService.deleteAssignment(assignmentId);
    return { success: true, message: 'Penugasan berhasil dihapus', data };
  }
  @Get('maba/points/summary')
  @ApiOperation({ summary: 'Melihat total skor poin (MABA)' })
  async getMyPointsSummary(
    @CurrentUser() user: { userId: string; pkkmbGroupId?: string },
  ) {
    const data = await this.pkkmbService.getMyPointsSummary(user.userId);
    return { success: true, data };
  }

  @Get('maba/points')
  @ApiOperation({ summary: 'Melihat riwayat dan total skor poin (MABA)' })
  async getMyPoints(@CurrentUser() user: { userId: string }) {
    const data = await this.pkkmbService.getMyPoints(user.userId);
    return { success: true, data };
  }

  // ─── QR POIN KEAKTIFAN (maba offline / QR cetak) ──────────────────────────

  @Post('qr-points')
  @RequiredPermissions(PkkmbPermission.MONITORING_READ)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Buat sesi QR poin keaktifan (panitia) — QR dicetak/ditempel',
  })
  async createQrPoint(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateQrPointDto,
  ) {
    const data = await this.pkkmbService.createQrPoint(user.userId, dto);
    return {
      success: true,
      message: 'Sesi QR poin berhasil dibuat. Cetak QR untuk dibagikan.',
      data,
    };
  }

  @Get('qr-points')
  @RequiredPermissions(PkkmbPermission.MONITORING_READ)
  @ApiOperation({ summary: 'Daftar sesi QR poin keaktifan (panitia)' })
  async listQrPoints() {
    const data = await this.pkkmbService.listQrPoints();
    return { success: true, data };
  }

  @Patch('qr-points/:id/close')
  @RequiredPermissions(PkkmbPermission.MONITORING_READ)
  @ApiOperation({ summary: 'Tutup sesi QR poin keaktifan (panitia)' })
  async closeQrPoint(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
  ) {
    const data = await this.pkkmbService.closeQrPoint(id, user.userId);
    return { success: true, message: 'Sesi QR poin ditutup.', data };
  }

  @Post('qr-points/claim')
  @RequiredPermissions(PkkmbPermission.ATTENDANCE_CHECKIN)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary:
      'Klaim poin dari QR cetak (maba) — maksimal 1× per maba per sesi QR',
  })
  async claimQrPoint(
    @CurrentUser() user: { userId: string },
    @Body() dto: ClaimQrPointDto,
  ) {
    const data = await this.pkkmbService.claimQrPoint(user.userId, dto);
    return { success: true, message: 'Poin berhasil diklaim!', data };
  }

  @Get('maba/submissions')
  @RequiredPermissions(PkkmbPermission.TASK_READ)
  @ApiOperation({ summary: 'Melihat status pengumpulan tugas diri sendiri' })
  async getMySubmissions(
    @CurrentUser() user: { userId: string },
    @Query() query: PaginationDto,
  ) {
    const data = await this.pkkmbService.getMySubmissions(user.userId, query);
    return { success: true, data };
  }

  @Post('maba/tasks/:id/submit')
  @RequiredPermissions(PkkmbPermission.TASK_SUBMIT)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary: 'Pengumpulan Tugas (Metode Google Drive / Cloud Link)',
  })
  @ApiParam({ name: 'id', description: 'ID Tugas' })
  async submitTask(
    @CurrentUser() user: { userId?: string },
    @Param('id') taskId: string,
    @Body() dto: MabaSubmitTaskDto,
  ) {
    const userId = user?.userId as string;
    const groupId = await this.pkkmbService.getUserGroupId(userId);
    if (!groupId)
      throw new BadRequestException('Anda belum masuk ke kelompok manapun');
    const data = await this.pkkmbService.submitTask(
      userId,
      groupId,
      taskId,
      dto,
    );
    return { success: true, message: 'Tugas berhasil dikumpulkan', data };
  }

  // ─── EVALUATOR & PANITIA ENDPOINTS ──────────────────────────────────────

  @Post('pemateri/tasks')
  @RequiredPermissions(PkkmbPermission.TASK_CREATE)
  @ApiOperation({ summary: 'Membuat tugas baru (Draft / Published)' })
  async createTask(
    @CurrentUser() user: { userId?: string },
    @Body() dto: CreateTaskDto,
  ) {
    const data = await this.pkkmbService.createTask(dto, user?.userId);
    return { success: true, message: 'Tugas berhasil dibuat', data };
  }

  @Get('pemateri/submissions')
  @RequiredPermissions(
    PkkmbPermission.GRADING_READ_ALL,
    PkkmbPermission.GRADING_READ_OWN,
  )
  @ApiOperation({ summary: 'Mendapatkan daftar semua tugas Maba' })
  async getAllSubmissions(
    @Query() query: PaginationDto,
    @CurrentUser() user: { userId: unknown },
  ) {
    const result = await this.pkkmbService.getAllSubmissions(query, user);
    return { success: true, ...result };
  }

  @Patch('pemateri/submissions/:id/grade')
  @RequiredPermissions(PkkmbPermission.GRADING_UPDATE)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Menilai dan memberi feedback pada tugas' })
  @ApiParam({ name: 'id', description: 'ID Pengumpulan Tugas (Submission)' })
  async gradeSubmission(
    @CurrentUser()
    grader: { userId: string; permissions?: string[] },
    @Param('id') submissionId: string,
    @Body() dto: GradeSubmissionDto,
  ) {
    const data = await this.pkkmbService.gradeSubmission(
      submissionId,
      { userId: grader.userId, permissions: grader.permissions || [] },
      dto,
    );
    return { success: true, message: 'Nilai tugas berhasil disimpan', data };
  }

  // ─── QUIZ ENDPOINTS ─────────────────────────────────────────────────────

  @Get('quiz')
  @RequiredPermissions(PkkmbPermission.QUIZ_READ)
  @ApiOperation({ summary: 'Melihat daftar quiz' })
  async getQuizzes(
    @CurrentUser() user: { userId?: string; role?: { slug?: string } },
    @Query() query: PaginationDto & { search?: string },
  ) {
    const roleSlug = user?.role?.slug;
    const isMaba = roleSlug === 'user' || roleSlug === 'maba';
    if (isMaba) {
      const data = await this.pkkmbService.listStudentQuizzes(
        user.userId as string,
        query,
      );
      return { success: true, ...data };
    }
    const data = await this.pkkmbService.listAllQuizzes(query, query.search);
    return { success: true, ...data };
  }

  @Post('quiz')
  @RequiredPermissions(PkkmbPermission.QUIZ_CREATE)
  @ApiOperation({ summary: 'Membuat quiz' })
  async createQuiz(
    @CurrentUser() user: { userId?: string },
    @Body() dto: CreateQuizDto,
  ) {
    const data = await this.pkkmbService.createQuiz(dto, user?.userId);
    return { success: true, message: 'Quiz berhasil dibuat', data };
  }

  @Patch('quiz/:id')
  @RequiredPermissions(PkkmbPermission.QUIZ_UPDATE)
  @ApiOperation({ summary: 'Mengubah quiz' })
  async updateQuiz(@Param('id') quizId: string, @Body() dto: CreateQuizDto) {
    const data = await this.pkkmbService.updateQuiz(quizId, dto);
    return { success: true, message: 'Quiz berhasil diperbarui', data };
  }

  // POST (bukan GET) karena memulai quiz = aksi menulis: membuat attempt baru.
  @Post('quiz/:id/start')
  @RequiredPermissions(PkkmbPermission.QUIZ_SUBMIT)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Memulai pengerjaan quiz (buat attempt)' })
  async startQuiz(
    @CurrentUser() user: { userId: string },
    @Param('id') quizId: string,
  ) {
    const data = await this.pkkmbService.startQuiz(quizId, user.userId);
    return { success: true, message: 'Quiz dimulai', data };
  }

  @Post('quiz/:id/attempt/:attemptId/submit')
  @RequiredPermissions(PkkmbPermission.QUIZ_SUBMIT)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Mengumpulkan jawaban quiz (scoring backend)' })
  async submitQuiz(
    @CurrentUser() user: { userId: string },
    @Param('id') quizId: string,
    @Param('attemptId') attemptId: string,
    @Body() dto: SubmitQuizDto,
  ) {
    const data = await this.pkkmbService.submitQuiz(
      quizId,
      attemptId,
      user.userId,
      dto,
    );
    return { success: true, message: 'Quiz berhasil dikumpulkan', data };
  }

  @Get('quiz/:id/attempt/:attemptId')
  @RequiredPermissions(PkkmbPermission.QUIZ_SUBMIT)
  @ApiOperation({
    summary:
      'Resume attempt milik user sendiri (soal + deadline dari server, tanpa correctAnswer)',
  })
  async resumeQuizAttempt(
    @CurrentUser() user: { userId: string },
    @Param('id') quizId: string,
    @Param('attemptId') attemptId: string,
  ) {
    const data = await this.pkkmbService.resumeQuizAttempt(
      quizId,
      attemptId,
      user.userId,
    );
    return { success: true, data };
  }

  @Patch('quiz/:id/attempt/:attemptId/answers')
  @RequiredPermissions(PkkmbPermission.QUIZ_SUBMIT)
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({
    summary:
      'Simpan jawaban in-progress (attempt IN_PROGRESS) agar bisa dipulihkan setelah tab ditutup',
  })
  async saveQuizAnswers(
    @CurrentUser() user: { userId: string },
    @Param('id') quizId: string,
    @Param('attemptId') attemptId: string,
    @Body() dto: SaveQuizAnswersDto,
  ) {
    const data = await this.pkkmbService.saveQuizAnswers(
      quizId,
      attemptId,
      user.userId,
      dto,
    );
    return { success: true, data };
  }

  @Get('quiz/:id/result/:attemptId')
  @RequiredPermissions(PkkmbPermission.QUIZ_RESULT)
  @ApiOperation({ summary: 'Melihat hasil attempt quiz sendiri' })
  async getQuizResult(
    @CurrentUser() user: { userId: string },
    @Param('attemptId') attemptId: string,
  ) {
    const data = await this.pkkmbService.getQuizResult(attemptId, user.userId);
    return { success: true, data };
  }

  // ─── ANTI-CHEAT / ANTI-AI DETERRENCE (violation monitoring) ────────────────
  // BUKAN deteksi AI yang mutlak & BUKAN security boundary — hanya indikator
  // untuk keputusan panitia. Backend tetap authority untuk scoring/timer/
  // ownership. Semua identity dari JWT; server time = timestamp utama.

  @Post('quiz/:id/attempt/:attemptId/violation')
  @RequiredPermissions(PkkmbPermission.QUIZ_SUBMIT)
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({
    summary:
      'Laporkan event pelanggaran anti-cheat (monitoring; server-time & risk dihitung backend)',
  })
  async reportViolation(
    @CurrentUser() user: { userId: string },
    @Param('id') quizId: string,
    @Param('attemptId') attemptId: string,
    @Body() dto: ReportViolationDto,
  ) {
    const data = await this.pkkmbService.reportViolation(
      quizId,
      attemptId,
      user.userId,
      dto,
    );
    return { success: true, data };
  }

  @Post('quiz/:id/attempt/:attemptId/events')
  @RequiredPermissions(PkkmbPermission.QUIZ_SUBMIT)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({
    summary:
      'Kirim batch event anti-cheat (maks 50 event/request — lebih = 400). Tiap event divalidasi; server-time & risk dihitung backend',
  })
  async reportQuizEvents(
    @CurrentUser() user: { userId: string },
    @Param('id') quizId: string,
    @Param('attemptId') attemptId: string,
    @Body() dto: ReportQuizEventsDto,
  ) {
    const data = await this.pkkmbService.reportQuizEvents(
      quizId,
      attemptId,
      user.userId,
      dto,
    );
    return { success: true, data };
  }

  @Post('quiz/:id/attempt/:attemptId/heartbeat')
  @RequiredPermissions(PkkmbPermission.QUIZ_SUBMIT)
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({
    summary: 'Heartbeat client selama attempt aktif (perbarui lastHeartbeatAt)',
  })
  async heartbeatAttempt(
    @CurrentUser() user: { userId: string },
    @Param('id') quizId: string,
    @Param('attemptId') attemptId: string,
  ) {
    const data = await this.pkkmbService.heartbeatAttempt(
      quizId,
      attemptId,
      user.userId,
    );
    return { success: true, data };
  }

  @Get('quiz/:id/attempts')
  @RequiredPermissions(PkkmbPermission.MONITORING_READ)
  @ApiOperation({
    summary:
      'Daftar attempt + aktivitas anti-cheat (management) — tabel + timeline',
  })
  async listQuizAttempts(@Param('id') quizId: string) {
    const data = await this.pkkmbService.listQuizAttempts(quizId);
    return { success: true, data };
  }

  @Delete('quiz/:id')
  @RequiredPermissions(PkkmbPermission.QUIZ_DELETE)
  @ApiOperation({ summary: 'Menghapus quiz (soft delete)' })
  @ApiParam({ name: 'id', description: 'ID Quiz' })
  async deleteQuiz(@Param('id') quizId: string) {
    const data = await this.pkkmbService.deleteQuiz(quizId);
    return { success: true, message: 'Quiz berhasil dihapus', data };
  }

  // ─── QUIZ IMPORT / EXPORT (EXCEL) ────────────────────────────────────────

  @Get('quiz/template')
  @RequiredPermissions(PkkmbPermission.QUIZ_CREATE)
  @ApiOperation({ summary: 'Download template Excel soal quiz' })
  async downloadQuizTemplate() {
    const buffer = await this.pkkmbService.getQuizTemplateBuffer();
    return new StreamableFile(buffer, {
      type: XLSX_MIME,
      disposition: 'attachment; filename="quiz-question-template.xlsx"',
    });
  }

  @Get('quiz/:id')
  @RequiredPermissions(PkkmbPermission.QUIZ_READ)
  @ApiOperation({
    summary:
      'Detail quiz — student: metadata aman tanpa correctAnswer; management: detail penuh',
  })
  @ApiParam({ name: 'id', description: 'ID Quiz' })
  async getQuizDetail(
    @Param('id') quizId: string,
    @CurrentUser() user: { userId?: string; role?: { slug?: string } },
  ) {
    const data = await this.pkkmbService.getQuizDetail(
      quizId,
      user.userId as string,
      user?.role?.slug,
    );
    return { success: true, data };
  }

  @Post('quiz/import')
  @RequiredPermissions(PkkmbPermission.QUIZ_CREATE)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOperation({
    summary:
      'Validasi & parse file soal Excel (tanpa simpan). 422 bila ada baris invalid.',
  })
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  async previewQuizImport(@UploadedFile() file?: Express.Multer.File) {
    const data = await this.pkkmbService.previewQuizImport(file);
    return { success: true, message: `${data.total} soal valid.`, data };
  }

  @Post('quiz/:id/import')
  @RequiredPermissions(PkkmbPermission.QUIZ_UPDATE)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOperation({
    summary:
      'Import soal ke quiz existing (APPEND + normalisasi order, tetap DRAFT)',
  })
  @ApiParam({ name: 'id', description: 'ID Quiz' })
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  async importQuizQuestions(
    @Param('id') quizId: string,
    @Query('skipDuplicates') skipDuplicates?: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const data = await this.pkkmbService.importQuizQuestions(
      quizId,
      file,
      skipDuplicates === 'true',
    );
    return {
      success: true,
      message: `${data.imported} soal berhasil ditambahkan.`,
      data,
    };
  }

  @Get('quiz/:id/export')
  @RequiredPermissions(PkkmbPermission.QUIZ_UPDATE)
  @ApiOperation({ summary: 'Export soal quiz ke Excel (.xlsx)' })
  @ApiParam({ name: 'id', description: 'ID Quiz' })
  async exportQuizQuestions(@Param('id') quizId: string) {
    const { buffer, filename } =
      await this.pkkmbService.exportQuizQuestions(quizId);
    return new StreamableFile(buffer, {
      type: XLSX_MIME,
      disposition: `attachment; filename="${filename}"`,
    });
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

  @Get('dashboard/panitia/stats')
  @RequiredPermissions(PkkmbPermission.MONITORING_READ)
  @ApiOperation({ summary: 'Statistik peserta & kehadiran' })
  async getPanitiaStats() {
    const data = await this.pkkmbService.getPanitiaStats();
    return { success: true, data };
  }

  @Get('dashboard/admin')
  @RequiredPermissions(PkkmbPermission.MONITORING_READ)
  @ApiOperation({ summary: 'Mendapatkan data agregasi untuk Dashboard Admin' })
  async getAdminDashboard(
    @CurrentUser() user: { userId: unknown; role?: { slug?: string } },
  ) {
    const data = await this.pkkmbService.getAdminDashboardStats(user);
    return { success: true, data };
  }

  @Get('dashboard/panitia/activities')
  @RequiredPermissions(PkkmbPermission.MONITORING_READ)
  @ApiOperation({ summary: 'Aktivitas terbaru' })
  async getPanitiaRecentActivities() {
    const data = await this.pkkmbService.getPanitiaRecentActivities();
    return { success: true, data };
  }

  @Get('dashboard/panitia/announcements')
  @RequiredPermissions(PkkmbPermission.MONITORING_READ)
  @ApiOperation({ summary: 'Pengumuman terbaru' })
  async getPanitiaAnnouncements() {
    const data = await this.pkkmbService.getPanitiaAnnouncements();
    return { success: true, data };
  }

  @Get('dashboard/panitia/schedules')
  @RequiredPermissions(PkkmbPermission.MONITORING_READ)
  @ApiOperation({ summary: 'Jadwal mendatang' })
  async getPanitiaSchedules() {
    const data = await this.pkkmbService.getPanitiaSchedules();
    return { success: true, data };
  }

  // ─── ANNOUNCEMENTS & SCHEDULES ──────────────────────────────────────────────

  @Get('announcements')
  @RequiredPermissions(PkkmbPermission.ANNOUNCEMENT_READ)
  @ApiOperation({ summary: 'Melihat pengumuman PKKMB' })
  async getAnnouncements(
    @CurrentUser() user: UserDocument & { role?: { slug?: string } },
    @Query() query: PaginationDto,
  ) {
    const groupId = user.pkkmbGroup?.toString();
    const roleSlug = user.role?.slug;
    const isPanitia = roleSlug !== 'user' && roleSlug !== 'maba';
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
  @RequiredPermissions(PkkmbPermission.SCHEDULE_READ)
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
  @Post('admin/groups/set-ketua')
  @RequiredPermissions(PkkmbPermission.MONITORING_READ)
  @ApiOperation({ summary: 'Menetapkan Ketua Gugus (Oleh Pendamping)' })
  async setKetuaGugus(
    @CurrentUser() user: { userId: unknown },
    @Body('mabaId') mabaId: string,
  ) {
    if (!mabaId) {
      throw new BadRequestException('mabaId is required');
    }
    const result = await this.pkkmbService.setKetuaGugus(user, mabaId);
    return { success: true, data: result };
  }

  @Post('admin/groups/unset-ketua')
  @RequiredPermissions(PkkmbPermission.MONITORING_READ)
  @ApiOperation({ summary: 'Membatalkan Ketua Gugus (Oleh Pendamping)' })
  async unsetKetuaGugus(
    @CurrentUser() user: { userId: unknown },
    @Body('mabaId') mabaId: string,
  ) {
    if (!mabaId) {
      throw new BadRequestException('mabaId is required');
    }
    const result = await this.pkkmbService.unsetKetuaGugus(user, mabaId);
    return { success: true, data: result };
  }

  @Post('admin/groups/auto-assign')
  @RequiredPermissions(PkkmbPermission.SETTINGS_MANAGE)
  @ApiOperation({ summary: 'Membagi gugus Maba secara otomatis' })
  async autoAssignGroups(@Query('dryRun') dryRun?: string) {
    const isDryRun = dryRun !== 'false';
    const result = await this.pkkmbService.autoAssignGroups(isDryRun);
    return { success: true, ...result };
  }
  @Get('admin/maba')
  @RequiredPermissions(
    PkkmbPermission.GROUP_READ_ALL,
    PkkmbPermission.GROUP_READ_OWN,
  )
  @ApiOperation({ summary: 'Melihat seluruh Mahasiswa Baru' })
  async getAllMaba(
    @CurrentUser() user: { userId: unknown; role?: { slug?: string } },
    @Query() query: PaginationDto,
  ) {
    const result = await this.pkkmbService.getAllMaba(user, query);
    return { success: true, ...result };
  }

  @Get('admin/export/maba')
  @RequiredPermissions(PkkmbPermission.GROUP_READ_ALL)
  @ApiOperation({
    summary: 'Export seluruh data maba (full, tanpa filter angkatan) ke Excel',
  })
  async exportMabaExcel() {
    const { buffer, filename } = await this.pkkmbService.exportMabaExcel();
    return new StreamableFile(buffer, {
      type: XLSX_MIME,
      disposition: `attachment; filename="${filename}"`,
    });
  }

  @Get('admin/export/gugus')
  @RequiredPermissions(PkkmbPermission.GROUP_READ_ALL)
  @ApiOperation({
    summary: 'Export seluruh data gugus beserta anggotanya ke Excel',
  })
  async exportGugusExcel() {
    const { buffer, filename } = await this.pkkmbService.exportGugusExcel();
    return new StreamableFile(buffer, {
      type: XLSX_MIME,
      disposition: `attachment; filename="${filename}"`,
    });
  }

  @Get('admin/users')
  @RequiredPermissions(PkkmbPermission.SETTINGS_MANAGE)
  @ApiOperation({ summary: 'Melihat semua user (Super Admin / Admin PKKMB)' })
  async getAllUsers(@Query() query: PaginationDto) {
    const result = await this.pkkmbService.getAllUsers(query);
    return { success: true, ...result };
  }

  @Post('admin/users')
  @RequiredPermissions(PkkmbPermission.SETTINGS_MANAGE)
  @ApiOperation({ summary: 'Membuat user baru (Super Admin / Admin PKKMB)' })
  async createUser(@Body() dto: AdminCreateUserDto) {
    const result = await this.pkkmbService.createUser(dto);
    return { success: true, message: 'User berhasil dibuat', data: result };
  }

  @Patch('admin/users/:id')
  @RequiredPermissions(PkkmbPermission.SETTINGS_MANAGE)
  @ApiOperation({ summary: 'Mengupdate user (Super Admin / Admin PKKMB)' })
  async updateUser(@Param('id') id: string, @Body() dto: AdminUpdateUserDto) {
    const result = await this.pkkmbService.updateUser(id, dto);
    return { success: true, message: 'User berhasil diupdate', data: result };
  }

  @Delete('admin/users/:id')
  @RequiredPermissions(PkkmbPermission.SETTINGS_MANAGE)
  @ApiOperation({ summary: 'Menghapus user (Super Admin / Admin PKKMB)' })
  async deleteUser(@Param('id') id: string) {
    const result = await this.pkkmbService.deleteUser(id);
    return { success: true, message: 'User berhasil dihapus', data: result };
  }

  @Post('admin/gugus/sync')
  @RequiredPermissions(PkkmbPermission.SETTINGS_MANAGE)
  @ApiOperation({
    summary:
      'Sinkronkan data maba & gugus dari Google Sheets ke database (upsert)',
  })
  async syncGugusFromSheets() {
    const result = await this.gugusSyncService.syncToDatabase();
    return {
      success: true,
      message: 'Sinkronisasi Google Sheets selesai',
      data: result,
    };
  }
}
