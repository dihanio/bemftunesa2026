import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Res,
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
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PkkmbService } from './pkkmb.service';
import type { UserDocument } from '../schemas/user.schema';
import {
  MabaCheckinDto,
  MabaSubmitTaskDto,
  CreateAttendanceSessionDto,
  CreateTaskDto,
  GradeSubmissionDto,
  AdminManualCheckinDto,
  PaginationDto,
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
  CreateScheduleDto,
  UpdateScheduleDto,
} from './dto/pkkmb.dto';

@ApiTags('pkkmb')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
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
  @Roles('MABA')
  @ApiOperation({ summary: 'Mendapatkan data agregasi untuk Dashboard Maba' })
  async getMabaDashboard(@CurrentUser() user: UserDocument) {
    const data = await this.pkkmbService.getMabaDashboard(user._id.toString());
    return { success: true, data };
  }

  @Get('attendance/sessions')
  @ApiOperation({ summary: 'Melihat sesi presensi aktif untuk kelompok maba' })
  async getActiveAttendanceSessions(@CurrentUser() user: UserDocument) {
    if (!user.pkkmbGroup)
      throw new BadRequestException('Anda belum masuk ke kelompok manapun');
    const data = await this.pkkmbService.getActiveAttendanceSessions(
      user.pkkmbGroup.toString(),
    );
    return { success: true, data };
  }

  @Post('attendance/checkin')
  @ApiOperation({ summary: 'Melakukan presensi maba (Mendukung GPS dan QR)' })
  async checkIn(
    @CurrentUser() user: UserDocument,
    @Body() dto: MabaCheckinDto,
  ) {
    if (!user.pkkmbGroup)
      throw new BadRequestException('Anda belum masuk ke kelompok manapun');
    const data = await this.pkkmbService.checkIn(
      user._id.toString(),
      user.pkkmbGroup.toString(),
      dto,
    );
    return { success: true, message: 'Presensi berhasil dicatat', data };
  }

  @Get('attendance/my-logs')
  @ApiOperation({ summary: 'Melihat riwayat presensi sendiri' })
  async getMyAttendanceLogs(
    @CurrentUser() user: UserDocument,
    @Query() query: PaginationDto,
  ) {
    const data = await this.pkkmbService.getMyAttendanceLogs(
      user._id.toString(),
      query,
    );
    return { success: true, data };
  }

  @Get('tasks')
  @ApiOperation({ summary: 'Melihat daftar seluruh penugasan' })
  async getTasks(@Query() query: PaginationDto) {
    const data = await this.pkkmbService.getTasks(query);
    return { success: true, data };
  }

  @Get('tasks/my-submissions')
  @ApiOperation({
    summary: 'Melihat status pengumpulan tugas (individu & kelompok)',
  })
  async getMySubmissions(
    @CurrentUser() user: UserDocument,
    @Query() query: PaginationDto,
  ) {
    const data = await this.pkkmbService.getMySubmissions(
      user._id.toString(),
      query,
      user.pkkmbGroup?.toString(),
    );
    return { success: true, data };
  }

  @Post('tasks/:id/submit')
  @ApiOperation({ summary: 'Mengumpulkan tugas' })
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

  // ─── KAKAK PENDAMPING ENDPOINTS ──────────────────────────────────────────────

  @Post('mentor/attendance/sessions')
  @Roles('Kakak Pendamping')
  @ApiOperation({ summary: 'Membuat sesi presensi untuk kelompok' })
  async createAttendanceSession(
    @CurrentUser() mentor: UserDocument,
    @Body() dto: CreateAttendanceSessionDto,
  ) {
    if (!mentor.pkkmbGroup)
      throw new BadRequestException('Anda belum di-assign ke kelompok manapun');
    const data = await this.pkkmbService.createAttendanceSession(
      mentor._id.toString(),
      mentor.pkkmbGroup.toString(),
      dto,
    );
    return {
      success: true,
      message: 'Sesi presensi berhasil dibuka untuk kelompok Anda',
      data,
    };
  }

  @Get('mentor/attendance/sessions')
  @Roles('Kakak Pendamping')
  @ApiOperation({ summary: 'Melihat riwayat sesi presensi kelompoknya' })
  async getMentorAttendanceSessions(
    @CurrentUser() mentor: UserDocument,
    @Query() query: PaginationDto,
  ) {
    if (!mentor.pkkmbGroup)
      throw new BadRequestException('Anda belum di-assign ke kelompok manapun');
    const data = await this.pkkmbService.getMentorAttendanceSessions(
      mentor.pkkmbGroup.toString(),
      query,
    );
    return { success: true, data };
  }

  @Post('mentor/attendance/sessions/:sessionId/manual-checkin')
  @Roles('Kakak Pendamping')
  @ApiOperation({ summary: 'Memasukkan presensi manual Maba' })
  @ApiParam({ name: 'sessionId', description: 'ID Sesi Presensi' })
  async mentorManualCheckin(
    @CurrentUser() mentor: UserDocument,
    @Param('sessionId') sessionId: string,
    @Body() dto: AdminManualCheckinDto,
  ) {
    if (!mentor.pkkmbGroup)
      throw new BadRequestException('Anda belum di-assign ke kelompok manapun');
    const data = await this.pkkmbService.mentorManualCheckin(
      sessionId,
      mentor.pkkmbGroup.toString(),
      dto,
    );
    return { success: true, message: 'Presensi manual berhasil dicatat', data };
  }

  // ─── PEMATERI / PANITIA ENDPOINTS ──────────────────────────────────────────────

  @Post('pemateri/tasks')
  @Roles('Pemateri', 'Panitia')
  @ApiOperation({ summary: 'Membuat tugas baru (Individu/Kelompok)' })
  async createTask(@Body() dto: CreateTaskDto) {
    const data = await this.pkkmbService.createTask(dto);
    return { success: true, message: 'Tugas berhasil dibuat', data };
  }

  @Patch('pemateri/submissions/:id/grade')
  @Roles('Pemateri', 'Panitia')
  @ApiOperation({ summary: 'Menilai dan memberi feedback pada tugas' })
  @ApiParam({ name: 'id', description: 'ID Pengumpulan Tugas (Submission)' })
  async gradeSubmission(
    @CurrentUser() grader: UserDocument,
    @Param('id') submissionId: string,
    @Body() dto: GradeSubmissionDto,
  ) {
    const data = await this.pkkmbService.gradeSubmission(
      submissionId,
      grader._id.toString(),
      dto,
    );
    return { success: true, message: 'Nilai tugas berhasil disimpan', data };
  }

  @Get('dashboard/panitia')
  @Roles('Panitia')
  @ApiOperation({
    summary: 'Mendapatkan data agregasi untuk Dashboard Panitia',
  })
  async getPanitiaDashboard() {
    const data = await this.pkkmbService.getPanitiaDashboard();
    return { success: true, data };
  }

  // ─── ADMIN ENDPOINTS ──────────────────────────────────────────────

  @Get('admin/attendance/export/:sessionId')
  @Roles('Admin', 'Panitia', 'Super Admin')
  @ApiOperation({ summary: 'Mengunduh rekap presensi (CSV)' })
  @ApiParam({ name: 'sessionId', description: 'ID Sesi Presensi' })
  async exportAttendanceCsv(
    @Param('sessionId') sessionId: string,
    @Res() res: Response,
  ) {
    const csv = await this.pkkmbService.exportAttendanceToCsv(sessionId);
    res.header('Content-Type', 'text/csv');
    res.attachment(`presensi-${sessionId}.csv`);
    return res.send(csv);
  }

  // ─── ANNOUNCEMENTS & SCHEDULES ──────────────────────────────────────────────

  @Get('announcements')
  @ApiOperation({ summary: 'Melihat pengumuman PKKMB' })
  async getAnnouncements(
    @CurrentUser() user: UserDocument,
    @Query() query: PaginationDto,
  ) {
    const groupId = user.pkkmbGroup?.toString();
    const data = await this.pkkmbService.getAnnouncements(query, groupId);
    return { success: true, data };
  }

  @Post('admin/announcements')
  @Roles('Panitia', 'Admin', 'Super Admin')
  @ApiOperation({ summary: 'Membuat Pengumuman PKKMB' })
  async createAnnouncement(@Body() dto: CreateAnnouncementDto) {
    const data = await this.pkkmbService.createAnnouncement(dto);
    return { success: true, message: 'Pengumuman berhasil dibuat', data };
  }

  @Patch('admin/announcements/:id')
  @Roles('Panitia', 'Admin', 'Super Admin')
  @ApiOperation({ summary: 'Mengubah Pengumuman PKKMB' })
  async updateAnnouncement(
    @Param('id') id: string,
    @Body() dto: UpdateAnnouncementDto,
  ) {
    const data = await this.pkkmbService.updateAnnouncement(id, dto);
    return { success: true, message: 'Pengumuman berhasil diubah', data };
  }

  @Delete('admin/announcements/:id')
  @Roles('Panitia', 'Admin', 'Super Admin')
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
  @Roles('Panitia', 'Admin', 'Super Admin')
  @ApiOperation({ summary: 'Membuat Jadwal PKKMB' })
  async createSchedule(@Body() dto: CreateScheduleDto) {
    const data = await this.pkkmbService.createSchedule(dto);
    return { success: true, message: 'Jadwal berhasil dibuat', data };
  }

  @Patch('admin/schedules/:id')
  @Roles('Panitia', 'Admin', 'Super Admin')
  @ApiOperation({ summary: 'Mengubah Jadwal PKKMB' })
  async updateSchedule(
    @Param('id') id: string,
    @Body() dto: UpdateScheduleDto,
  ) {
    const data = await this.pkkmbService.updateSchedule(id, dto);
    return { success: true, message: 'Jadwal berhasil diubah', data };
  }

  @Delete('admin/schedules/:id')
  @Roles('Panitia', 'Admin', 'Super Admin')
  @ApiOperation({ summary: 'Menghapus Jadwal PKKMB' })
  async deleteSchedule(@Param('id') id: string) {
    const data = await this.pkkmbService.deleteSchedule(id);
    return { success: true, message: 'Jadwal berhasil dihapus', data };
  }
}
