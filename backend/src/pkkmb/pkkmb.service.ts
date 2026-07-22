import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, Query, FilterQuery } from 'mongoose';

import { User, UserDocument } from '../schemas/user.schema';
import { PkkmbGroup, PkkmbGroupDocument } from '../schemas/pkkmb-group.schema';
import {
  PkkmbAttendanceSession,
  PkkmbAttendanceSessionDocument,
  PkkmbAttendanceLog,
  PkkmbAttendanceLogDocument,
} from '../schemas/pkkmb-attendance.schema';
import {
  PkkmbTask,
  PkkmbTaskDocument,
  PkkmbSubmission,
  PkkmbSubmissionDocument,
} from '../schemas/pkkmb-task.schema';
import {
  PkkmbSchedule,
  PkkmbScheduleDocument,
} from '../schemas/pkkmb-schedule.schema';
import {
  PkkmbAnnouncement,
  PkkmbAnnouncementDocument,
} from '../schemas/pkkmb-announcement.schema';
import {
  PkkmbPointLog,
  PkkmbPointLogDocument,
} from '../schemas/pkkmb-point-log.schema';
import {
  PkkmbGallery,
  PkkmbGalleryDocument,
} from '../schemas/pkkmb-gallery.schema';

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

function getDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // distance in meters
}

function applyPagination<T>(
  queryObj: Query<T[], T>,
  paginationDto: PaginationDto,
) {
  const page = parseInt(paginationDto.page || '1', 10);
  const limit = parseInt(paginationDto.limit || '10', 10);
  const skip = (page - 1) * limit;

  let sort: Record<string, 1 | -1> = {};
  if (paginationDto.sortBy) {
    sort[paginationDto.sortBy] = paginationDto.sortOrder === 'asc' ? 1 : -1;
  } else {
    sort = { createdAt: -1 }; // Default sort
  }

  queryObj.sort(sort).skip(skip).limit(limit);
  return queryObj;
}

@Injectable()
export class PkkmbService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(PkkmbGroup.name) private groupModel: Model<PkkmbGroupDocument>,
    @InjectModel(PkkmbAttendanceSession.name)
    private sessionModel: Model<PkkmbAttendanceSessionDocument>,
    @InjectModel(PkkmbAttendanceLog.name)
    private logModel: Model<PkkmbAttendanceLogDocument>,
    @InjectModel(PkkmbTask.name) private taskModel: Model<PkkmbTaskDocument>,
    @InjectModel(PkkmbSubmission.name)
    private submissionModel: Model<PkkmbSubmissionDocument>,
    @InjectModel(PkkmbSchedule.name)
    private scheduleModel: Model<PkkmbScheduleDocument>,
    @InjectModel(PkkmbAnnouncement.name)
    private announcementModel: Model<PkkmbAnnouncementDocument>,
    @InjectModel(PkkmbPointLog.name)
    private pointLogModel: Model<PkkmbPointLogDocument>,
    @InjectModel(PkkmbGallery.name)
    private galleryModel: Model<PkkmbGalleryDocument>,
  ) {}

  // ─── MAHASISWA BARU (MABA) SERVICES ────────────────────────────────────────

  async getActiveAttendanceSessions(groupId: string) {
    return this.sessionModel
      .find({ groupId: new Types.ObjectId(groupId), deletedAt: null })
      .exec();
  }

  async checkIn(userId: string, groupId: string, dto: MabaCheckinDto) {
    const session = await this.sessionModel
      .findOne({
        _id: dto.sessionId,
        groupId: new Types.ObjectId(groupId),
        deletedAt: null,
      })
      .exec();
    if (!session) {
      throw new BadRequestException(
        'Sesi presensi tidak aktif atau tidak ditemukan untuk kelompok Anda',
      );
    }

    if (session.qrToken) {
      if (!dto.qrToken || dto.qrToken !== session.qrToken) {
        throw new BadRequestException('Token QR salah atau tidak valid');
      }
      if (session.qrExpiry && new Date() > session.qrExpiry) {
        throw new BadRequestException('Token QR Code sudah kedaluwarsa');
      }
    }

    if (
      session.coordinates &&
      session.coordinates.latitude &&
      session.coordinates.longitude
    ) {
      if (!dto.latitude || !dto.longitude) {
        throw new BadRequestException(
          'Lokasi GPS diperlukan untuk presensi ini',
        );
      }

      const dist = getDistance(
        session.coordinates.latitude,
        session.coordinates.longitude,
        dto.latitude,
        dto.longitude,
      );

      if (dist > (session.coordinates.radiusMeter || 50)) {
        throw new BadRequestException(
          `Anda berada di luar radius presensi (${Math.round(dist)}m dari titik pusat)`,
        );
      }
    }

    const now = new Date();
    const status = 'Hadir'; // TODO: proper status calculation based on session time

    const coordinatesUsed =
      dto.latitude && dto.longitude
        ? { latitude: dto.latitude, longitude: dto.longitude }
        : undefined;

    return this.logModel
      .findOneAndUpdate(
        {
          sessionId: new Types.ObjectId(dto.sessionId),
          userId: new Types.ObjectId(userId),
        },
        { status, coordinatesUsed, timestamp: now },
        { upsert: true, new: true },
      )
      .exec();
  }

  async getMyAttendanceLogs(userId: string, paginationDto: PaginationDto) {
    const query = this.logModel
      .find({ userId: new Types.ObjectId(userId), deletedAt: null })
      .populate('sessionId');
    return applyPagination(query, paginationDto).exec();
  }

  async getTasks(paginationDto: PaginationDto) {
    const filter: FilterQuery<unknown> = { deletedAt: null };
    if (paginationDto.search) {
      filter.title = { $regex: paginationDto.search, $options: 'i' };
    }
    const query = this.taskModel.find(filter);
    return applyPagination(query, paginationDto).exec();
  }

  async getMySubmissions(
    userId: string,
    paginationDto: PaginationDto,
    groupId?: string,
  ) {
    const queryConds: FilterQuery<unknown>[] = [
      { userId: new Types.ObjectId(userId) },
    ];
    if (groupId) {
      queryConds.push({ groupId: new Types.ObjectId(groupId) });
    }
    const query = this.submissionModel
      .find({ $or: queryConds, deletedAt: null })
      .populate('taskId');

    return applyPagination(query, paginationDto).exec();
  }

  async submitTask(
    userId: string,
    groupId: string,
    taskId: string,
    dto: MabaSubmitTaskDto,
  ) {
    const task = await this.taskModel.findById(taskId).exec();
    if (!task || task.deletedAt) {
      throw new BadRequestException('Tugas tidak aktif atau tidak ditemukan');
    }

    const status = new Date() > task.deadline ? 'Terlambat' : 'Sudah Submit';

    const filter: FilterQuery<unknown> = { taskId: new Types.ObjectId(taskId) };
    if (task.type === 'kelompok') {
      filter.groupId = new Types.ObjectId(groupId);
    } else {
      filter.userId = new Types.ObjectId(userId);
    }

    return this.submissionModel
      .findOneAndUpdate(
        filter,
        {
          $set: {
            fileUrl: dto.fileUrl,
            status: status,
          },
          $unset: {
            score: '',
            feedback: '',
            gradedBy: '',
          },
        },
        { upsert: true, new: true },
      )
      .exec();
  }

  // ─── KAKAK PENDAMPING SERVICES ──────────────────────────────────────────────

  async createAttendanceSession(
    userId: string,
    groupId: string,
    dto: CreateAttendanceSessionDto,
  ) {
    const coordinates =
      dto.latitude && dto.longitude
        ? {
            latitude: dto.latitude,
            longitude: dto.longitude,
            radiusMeter: dto.radiusMeter || 50,
          }
        : undefined;

    return this.sessionModel.create({
      groupId: new Types.ObjectId(groupId),
      createdBy: new Types.ObjectId(userId),
      title: dto.title,
      date: new Date(dto.date),
      qrToken: dto.qrCodeToken,
      qrExpiry: dto.qrExpiry ? new Date(dto.qrExpiry) : undefined,
      coordinates,
    });
  }

  async getMentorAttendanceSessions(
    groupId: string,
    paginationDto: PaginationDto,
  ) {
    const filter: FilterQuery<unknown> = {
      groupId: new Types.ObjectId(groupId),
      deletedAt: null,
    };
    if (paginationDto.search) {
      filter.title = { $regex: paginationDto.search, $options: 'i' };
    }
    const query = this.sessionModel.find(filter);
    return applyPagination(query, paginationDto).exec();
  }

  async mentorManualCheckin(
    sessionId: string,
    groupId: string,
    dto: AdminManualCheckinDto,
  ) {
    const session = await this.sessionModel.findOne({
      _id: sessionId,
      groupId: new Types.ObjectId(groupId),
    });
    if (!session)
      throw new NotFoundException('Sesi tidak ditemukan untuk kelompok ini');

    return this.logModel
      .findOneAndUpdate(
        {
          sessionId: new Types.ObjectId(sessionId),
          userId: new Types.ObjectId(dto.userId),
        },
        {
          status: dto.status,
          notes: 'Manual check-in by mentor',
        },
        { upsert: true, new: true },
      )
      .exec();
  }

  // ─── PEMATERI SERVICES ──────────────────────────────────────────────
  async createTask(dto: CreateTaskDto) {
    return this.taskModel.create({
      title: dto.title,
      description: dto.description,
      deadline: new Date(dto.deadline),
      type: dto.type,
      allowedFormats: dto.allowedFormats,
    });
  }

  async gradeSubmission(
    submissionId: string,
    graderId: string,
    dto: GradeSubmissionDto,
  ) {
    const submission = await this.submissionModel.findById(submissionId).exec();
    if (!submission)
      throw new NotFoundException('Pengumpulan tugas tidak ditemukan');

    submission.score = dto.score;
    submission.feedback = dto.feedback;
    submission.gradedBy = new Types.ObjectId(graderId);

    return submission.save();
  }

  // ─── ADMIN / OTHERS ──────────────────────────────────────────────

  async exportAttendanceToCsv(sessionId: string): Promise<string> {
    const logs = await this.logModel
      .find({ sessionId: new Types.ObjectId(sessionId) })
      .populate({ path: 'userId', select: 'nim name pkkmbGroup' })
      .exec();

    let csv = 'NIM,Nama,Status,Waktu,Catatan\n';
    for (const log of logs) {
      const user = log.userId as unknown as User;
      const logWithTimestamp = log as unknown as { timestamp?: string | Date };
      const time = logWithTimestamp.timestamp
        ? new Date(logWithTimestamp.timestamp).toISOString()
        : '';
      csv += `"${user?.nim || ''}","${user?.name || ''}","${log.status}","${time}","${log.notes || ''}"\n`;
    }
    return csv;
  }

  // ─── ANNOUNCEMENTS ──────────────────────────────────────────────

  async getAnnouncements(paginationDto: PaginationDto, groupId?: string) {
    const filter: FilterQuery<unknown> = { deletedAt: null };

    // If groupId is provided, we can filter announcements targeted to this group or 'all'
    if (groupId) {
      filter.$or = [
        { targetAudience: 'all' },
        {
          targetAudience: 'specific_groups',
          targetGroups: new Types.ObjectId(groupId),
        },
      ];
    }

    if (paginationDto.search) {
      filter.title = { $regex: paginationDto.search, $options: 'i' };
    }
    const query = this.announcementModel.find(filter);

    // Default sort by priority first, then createdAt
    if (!paginationDto.sortBy) {
      query.sort({ isPriority: -1, createdAt: -1 });
    }

    return applyPagination(query, paginationDto).exec();
  }

  async createAnnouncement(dto: CreateAnnouncementDto) {
    return this.announcementModel.create({
      ...dto,
      targetGroups: dto.targetGroups
        ? dto.targetGroups.map((id) => new Types.ObjectId(id))
        : undefined,
    });
  }

  async updateAnnouncement(id: string, dto: UpdateAnnouncementDto) {
    const updateData: Record<string, unknown> = { ...dto };
    if (dto.targetGroups) {
      updateData.targetGroups = dto.targetGroups.map(
        (gid) => new Types.ObjectId(gid),
      );
    }

    const announcement = await this.announcementModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: updateData },
      { new: true },
    );
    if (!announcement)
      throw new NotFoundException('Pengumuman tidak ditemukan');
    return announcement;
  }

  async deleteAnnouncement(id: string) {
    const announcement = await this.announcementModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { new: true },
    );
    if (!announcement)
      throw new NotFoundException('Pengumuman tidak ditemukan');
    return announcement;
  }

  // ─── SCHEDULES ──────────────────────────────────────────────

  async getSchedules(paginationDto: PaginationDto) {
    const filter: FilterQuery<unknown> = { deletedAt: null };
    if (paginationDto.search) {
      filter.name = { $regex: paginationDto.search, $options: 'i' };
    }
    const query = this.scheduleModel.find(filter);

    if (!paginationDto.sortBy) {
      query.sort({ startTime: 1 }); // Sort chronologically by default
    }

    return applyPagination(query, paginationDto).exec();
  }

  async createSchedule(dto: CreateScheduleDto) {
    return this.scheduleModel.create({
      ...dto,
      startTime: new Date(dto.startTime),
      endTime: new Date(dto.endTime),
    });
  }

  async updateSchedule(id: string, dto: UpdateScheduleDto) {
    const updateData: Record<string, unknown> = { ...dto };
    if (dto.startTime) updateData.startTime = new Date(dto.startTime);
    if (dto.endTime) updateData.endTime = new Date(dto.endTime);

    const schedule = await this.scheduleModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: updateData },
      { new: true },
    );
    if (!schedule) throw new NotFoundException('Jadwal tidak ditemukan');
    return schedule;
  }

  async deleteSchedule(id: string) {
    const schedule = await this.scheduleModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { new: true },
    );
    if (!schedule) throw new NotFoundException('Jadwal tidak ditemukan');
    return schedule;
  }

  // ─── DASHBOARD AGGREGATION ──────────────────────────────────────────────

  async getMabaDashboard(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .populate('pkkmbGroup')
      .exec();
    if (!user) throw new NotFoundException('User tidak ditemukan');

    const groupId = user.pkkmbGroup
      ? (user.pkkmbGroup as unknown as { _id: Types.ObjectId })._id.toString()
      : null;

    // 1. Announcements (Priority / Latest)
    const filterAnn: FilterQuery<unknown> = { deletedAt: null };
    if (groupId) {
      filterAnn.$or = [
        { targetAudience: 'all' },
        {
          targetAudience: 'specific_groups',
          targetGroups: new Types.ObjectId(groupId),
        },
      ];
    } else {
      filterAnn.targetAudience = 'all';
    }
    const announcements = await this.announcementModel
      .find(filterAnn)
      .sort({ isPriority: -1, createdAt: -1 })
      .limit(3)
      .exec();

    // 2. Upcoming Schedules
    const now = new Date();
    const upcomingSchedules = await this.scheduleModel
      .find({ deletedAt: null, endTime: { $gte: now } })
      .sort({ startTime: 1 })
      .limit(3)
      .exec();

    // 3. Tasks & Submissions
    const allTasks = await this.taskModel.find({ deletedAt: null }).exec();

    const queryConds: FilterQuery<unknown>[] = [
      { userId: new Types.ObjectId(userId) },
    ];
    if (groupId) queryConds.push({ groupId: new Types.ObjectId(groupId) });

    const submissions = await this.submissionModel
      .find({ $or: queryConds, deletedAt: null })
      .exec();

    // 4. Attendance Today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const attendanceLogs = await this.logModel
      .find({
        userId: new Types.ObjectId(userId),
        timestamp: { $gte: todayStart, $lte: todayEnd },
      })
      .exec();

    // 5. Determine Next Action (Simple rule)
    let nextAction = 'Persiapkan diri Anda untuk kegiatan selanjutnya.';
    const activeTasks = allTasks.filter((t) => new Date() <= t.deadline);
    const pendingTasks = activeTasks.filter(
      (t) => !submissions.find((s) => s.taskId.toString() === t._id.toString()),
    );

    if (pendingTasks.length > 0) {
      nextAction = `Ada ${pendingTasks.length} tugas yang belum dikumpulkan. Batas terdekat: ${pendingTasks[0].title}.`;
    } else if (upcomingSchedules.length > 0) {
      nextAction = `Kegiatan terdekat: ${upcomingSchedules[0].name} pada ${upcomingSchedules[0].startTime.toLocaleString('id-ID')}.`;
    }

    // 6. Calculate Progress
    const totalSteps = 4; // 1. Profil, 2. Grup, 3. Absensi Pertama, 4. Tugas Pertama
    let completedSteps = 1; // Assume profil is completed if they can login
    if (groupId) completedSteps++;
    const hasAttendedAny = await this.logModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();
    if (hasAttendedAny) completedSteps++;
    if (submissions.length > 0) completedSteps++;

    const progressPercent = Math.round((completedSteps / totalSteps) * 100);

    return {
      user,
      progress: {
        percent: progressPercent,
        completedSteps,
        totalSteps,
        hasGroup: !!groupId,
        hasAttendedAny: !!hasAttendedAny,
        hasSubmittedTask: submissions.length > 0,
      },
      announcements,
      upcomingSchedules,
      tasks: {
        total: allTasks.length,
        submitted: submissions.length,
        pending: pendingTasks.length,
        graded: submissions.filter((s) => s.status === 'graded').length,
      },
      attendance: {
        todayCount: attendanceLogs.length,
      },
      nextAction,
    };
  }

  async getPanitiaDashboard() {
    // 1. Statistics
    const totalPeserta = await this.userModel
      .countDocuments({ role: 'MABA', deletedAt: null })
      .exec();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const attendanceToday = await this.logModel
      .countDocuments({ timestamp: { $gte: todayStart, $lte: todayEnd } })
      .exec();

    // 2. Active Announcements
    const announcements = await this.announcementModel
      .find({ deletedAt: null })
      .sort({ createdAt: -1 })
      .limit(5)
      .exec();

    // 3. Upcoming Activities (Schedules)
    const now = new Date();
    const schedules = await this.scheduleModel
      .find({ deletedAt: null, endTime: { $gte: now } })
      .sort({ startTime: 1 })
      .limit(5)
      .exec();

    // 4. Tasks Overview
    const totalSubmissions = await this.submissionModel
      .countDocuments({ deletedAt: null })
      .exec();
    const gradedSubmissions = await this.submissionModel
      .countDocuments({ status: 'graded', deletedAt: null })
      .exec();

    // 5. Recent Activities (Mocked or queried from audit logs if exist, simple fallback for now)
    // We can pull the latest 3 submissions and latest 3 attendance logs as "activities"
    const recentSubmissions = await this.submissionModel
      .find({ deletedAt: null })
      .sort({ updatedAt: -1 })
      .limit(3)
      .populate('userId', 'name')
      .exec();

    const recentAttendance = await this.logModel
      .find({ timestamp: { $gte: todayStart } })
      .sort({ timestamp: -1 })
      .limit(3)
      .populate('userId', 'name')
      .exec();

    const activities = [
      ...recentSubmissions.map((s) => ({
        type: 'task',
        message: `${(s.userId as unknown as { name?: string })?.name || 'Peserta'} mengumpulkan tugas`,
        time: (s as unknown as { updatedAt: Date }).updatedAt,
      })),
      ...recentAttendance.map((a) => ({
        type: 'attendance',
        message: `${(a.userId as unknown as { name?: string })?.name || 'Peserta'} melakukan presensi`,
        time: (a as unknown as { timestamp: Date }).timestamp || new Date(),
      })),
    ]
      .sort((a, b) => b.time.getTime() - a.time.getTime())
      .slice(0, 5);

    return {
      statistics: {
        totalPeserta,
        attendanceTodayPercent:
          totalPeserta > 0
            ? Math.round((attendanceToday / totalPeserta) * 100)
            : 0,
      },
      activities,
      announcements,
      schedules,
      tasks: {
        totalSubmissions,
        pendingGrading: totalSubmissions - gradedSubmissions,
        graded: gradedSubmissions,
      },
      attendance: {
        today: attendanceToday,
      },
    };
  }
}
