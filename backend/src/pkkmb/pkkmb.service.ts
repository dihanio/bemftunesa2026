import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, Query, FilterQuery } from 'mongoose';

import { User, UserDocument } from '../schemas/user.schema';
import { Role, RoleDocument } from '../schemas/role.schema';
import { PkkmbGroup, PkkmbGroupDocument } from '../schemas/pkkmb-group.schema';
import {
  PkkmbAttendanceSession,
  PkkmbAttendanceSessionDocument,
  PkkmbAttendanceRecord,
  PkkmbAttendanceRecordDocument,
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
import { Rumpun, RumpunDocument } from '../schemas/rumpun.schema';
import { StudyProgram, StudyProgramDocument } from '../schemas/study-program.schema';

import {
  MabaCheckinDto,
  MabaSubmitTaskDto,
  CreateAttendanceSessionDto,
  CheckInDto,
  AttendanceFilterDto,
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
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
    @InjectModel(PkkmbGroup.name) private groupModel: Model<PkkmbGroupDocument>,
    @InjectModel(PkkmbAttendanceSession.name)
    private sessionModel: Model<PkkmbAttendanceSessionDocument>,
    @InjectModel(PkkmbAttendanceRecord.name)
    private logModel: Model<PkkmbAttendanceRecordDocument>,
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
    @InjectModel(Rumpun.name)
    private rumpunModel: Model<RumpunDocument>,
    @InjectModel(StudyProgram.name)
    private studyProgramModel: Model<StudyProgramDocument>,
  ) {}

  // ─── GUGUS & MASTER DATA ARCHITECTURE ──────────────────────────────────────

  async getAllRumpun() {
    return this.rumpunModel.find().sort({ order: 1 }).exec();
  }

  async getAllStudyPrograms() {
    return this.studyProgramModel.find().populate('rumpun').sort({ name: 1 }).exec();
  }

  async getAllGugus() {
    const gugusList = await this.groupModel
      .find({ deletedAt: null })
      .populate('pendampingId', 'name email division position phone avatar')
      .sort({ nomor: 1 })
      .exec();

    // Aggregate member counts
    const memberCounts = await this.userModel.aggregate([
      { $match: { pkkmbGroup: { $ne: null }, deletedAt: null } },
      { $group: { _id: '$pkkmbGroup', count: { $sum: 1 } } },
    ]);

    const countMap = new Map<string, number>();
    memberCounts.forEach((m) => countMap.set(m._id.toString(), m.count));

    return gugusList.map((g) => {
      const obj = g.toObject();
      return {
        ...obj,
        totalAnggota: countMap.get(g._id.toString()) || 0,
      };
    });
  }

  async getGugusDetail(gugusIdentifier: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let gugus: any = null;
    if (Types.ObjectId.isValid(gugusIdentifier)) {
      gugus = await this.groupModel
        .findById(gugusIdentifier)
        .populate('pendampingId', 'name email division position phone avatar')
        .exec();
    } else {
      const nomor = parseInt(gugusIdentifier, 10);
      if (!isNaN(nomor)) {
        gugus = await this.groupModel
          .findOne({ nomor, deletedAt: null })
          .populate('pendampingId', 'name email division position phone avatar')
          .exec();
      }
    }

    if (!gugus) {
      throw new NotFoundException('Data Gugus tidak ditemukan.');
    }

    // Fetch members of this Gugus
    const members = await this.userModel
      .find({ pkkmbGroup: gugus._id, deletedAt: null })
      .populate({
        path: 'studyProgramId',
        populate: { path: 'rumpun' },
      })
      .select('name nim email phone studyProgram studyProgramId gender avatar division position')
      .exec();

    const totalAnggota = members.length;

    // Breakdown by Study Program
    const prodiMap = new Map<string, number>();
    // Breakdown by Rumpun
    const rumpunMap = new Map<string, { name: string; color: string; count: number }>();

    let maleCount = 0;
    let femaleCount = 0;

    members.forEach((m) => {
      // Gender stats
      if (m.gender === 'P') {
        femaleCount++;
      } else {
        maleCount++;
      }

      // Study program stats
      const prodiName =
        m.studyProgram ||
        (m.studyProgramId && typeof m.studyProgramId === 'object'
          ? (m.studyProgramId as unknown as { name: string }).name
          : 'Belum Terdata');
      prodiMap.set(prodiName, (prodiMap.get(prodiName) || 0) + 1);

      // Rumpun stats
      let rumpunName = 'Umum';
      let rumpunColor = '#3B82F6';
      if (
        m.studyProgramId &&
        typeof m.studyProgramId === 'object' &&
        (m.studyProgramId as unknown as { rumpun?: { name?: string; color?: string } }).rumpun
      ) {
        const rObj = (m.studyProgramId as unknown as { rumpun: { name?: string; color?: string } }).rumpun;
        if (rObj.name) rumpunName = rObj.name;
        if (rObj.color) rumpunColor = rObj.color;
      }

      const existingR = rumpunMap.get(rumpunName) || { name: rumpunName, color: rumpunColor, count: 0 };
      existingR.count++;
      rumpunMap.set(rumpunName, existingR);
    });

    const distribusiProdi = Array.from(prodiMap.entries()).map(([name, count]) => ({
      name,
      count,
      percentage: totalAnggota > 0 ? Math.round((count / totalAnggota) * 100) : 0,
    }));

    const distribusiRumpun = Array.from(rumpunMap.values()).map((r) => ({
      name: r.name,
      color: r.color,
      count: r.count,
      percentage: totalAnggota > 0 ? Math.round((r.count / totalAnggota) * 100) : 0,
    }));

    return {
      gugus,
      totalAnggota,
      distribusiGender: {
        maleCount,
        femaleCount,
        malePercentage: totalAnggota > 0 ? Math.round((maleCount / totalAnggota) * 100) : 0,
        femalePercentage: totalAnggota > 0 ? Math.round((femaleCount / totalAnggota) * 100) : 0,
      },
      distribusiProdi,
      distribusiRumpun,
      members,
    };
  }

  async autoDistributeGugus() {
    // 1. Fetch 50 Active Gugus
    const activeGugus = await this.groupModel
      .find({ status: 'ACTIVE', deletedAt: null })
      .sort({ nomor: 1 })
      .exec();

    if (activeGugus.length === 0) {
      throw new BadRequestException('Tidak ada Gugus aktif yang tersedia.');
    }

    // 2. Fetch unassigned Mahasiswa Baru (role maba/user)
    const mabaRole = await this.roleModel.findOne({
      $or: [{ slug: 'user' }, { slug: 'maba' }, { name: 'Mahasiswa Baru' }],
    });

    const query: FilterQuery<UserDocument> = {
      deletedAt: null,
      $or: [{ pkkmbGroup: null }, { pkkmbGroup: { $exists: false } }],
    };

    if (mabaRole) {
      query.role = mabaRole._id;
    }

    const unassignedMaba = await this.userModel.find(query).exec();
    if (unassignedMaba.length === 0) {
      return {
        message: 'Semua mahasiswa baru sudah terdistribusi ke Gugus.',
        distributedCount: 0,
      };
    }

    // 3. Group by Study Program
    const majorGroups = new Map<string, UserDocument[]>();
    unassignedMaba.forEach((m) => {
      const key = m.studyProgram || 'Umum';
      if (!majorGroups.has(key)) {
        majorGroups.set(key, []);
      }
      majorGroups.get(key)!.push(m);
    });

    // 4. Round-Robin Distribution across 50 Gugus
    let gugusCursor = 0;
    const updates: Promise<unknown>[] = [];
    let totalDistributed = 0;

    majorGroups.forEach((students) => {
      // Shuffle students within major for randomness
      const shuffled = [...students].sort(() => Math.random() - 0.5);

      shuffled.forEach((student) => {
        const targetGugus = activeGugus[gugusCursor];
        updates.push(
          this.userModel.updateOne(
            { _id: student._id },
            { $set: { pkkmbGroup: targetGugus._id } },
          ),
        );
        gugusCursor = (gugusCursor + 1) % activeGugus.length;
        totalDistributed++;
      });
    });

    await Promise.all(updates);

    return {
      message: `Berhasil mendistribusikan ${totalDistributed} Mahasiswa Baru secara seimbang ke ${activeGugus.length} Gugus PKKMB FT UNESA!`,
      distributedCount: totalDistributed,
      totalGugusUsed: activeGugus.length,
    };
  }

  async getAdminGugusAnalytics() {
    const totalGugus = await this.groupModel.countDocuments({ deletedAt: null });
    const totalMahasiswa = await this.userModel.countDocuments({ deletedAt: null });
    const totalStudyPrograms = await this.studyProgramModel.countDocuments({ isActive: true });
    const totalRumpun = await this.rumpunModel.countDocuments();

    // Distribution by Gugus
    const gugusStats = await this.userModel.aggregate([
      { $match: { pkkmbGroup: { $ne: null }, deletedAt: null } },
      { $group: { _id: '$pkkmbGroup', count: { $sum: 1 } } },
      { $lookup: { from: 'pkkmb_gugus', localField: '_id', foreignField: '_id', as: 'gugus' } },
      { $unwind: '$gugus' },
      { $project: { _id: 0, gugusName: '$gugus.name', nomor: '$gugus.nomor', count: 1 } },
      { $sort: { nomor: 1 } },
    ]);

    // Distribution by Study Program
    const prodiStats = await this.userModel.aggregate([
      { $match: { deletedAt: null } },
      { $group: { _id: '$studyProgram', count: { $sum: 1 } } },
      { $project: { _id: 0, prodiName: '$_id', count: 1 } },
      { $sort: { count: -1 } },
    ]);

    return {
      totalGugus,
      totalMahasiswa,
      totalStudyPrograms,
      totalRumpun,
      gugusStats,
      prodiStats,
    };
  }

  async createAttendanceSession(
    userId: string,
    dto: CreateAttendanceSessionDto,
  ) {
    const qrCode = `PKKMB2026_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    return this.sessionModel.create({
      title: dto.title,
      date: new Date(dto.date),
      startTime: new Date(dto.startTime),
      endTime: new Date(dto.endTime),
      location: dto.location,
      targetParticipantType: dto.targetParticipantType || 'ALL',
      targetDivision: dto.targetDivision,
      qrCode,
      status: dto.status || 'PUBLISHED',
      createdBy: new Types.ObjectId(userId),
    });
  }

  async getAttendanceSessions(
    participantType?: string,
    status?: string,
  ) {
    const filter: FilterQuery<unknown> = { deletedAt: null };
    if (participantType && participantType !== 'ALL') {
      filter.$or = [
        { targetParticipantType: 'ALL' },
        { targetParticipantType: participantType },
      ];
    }
    if (status) {
      filter.status = status;
    }
    return this.sessionModel.find(filter).sort({ startTime: -1 }).exec();
  }

  async updateAttendanceSessionStatus(
    sessionId: string,
    status: 'DRAFT' | 'PUBLISHED' | 'CLOSED',
  ) {
    const session = await this.sessionModel.findById(sessionId);
    if (!session) {
      throw new NotFoundException('Sesi presensi tidak ditemukan.');
    }
    session.status = status;
    return session.save();
  }

  async checkIn(
    dto: CheckInDto,
    operatorId?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const session = await this.sessionModel.findById(dto.sessionId);
    if (!session || session.status === 'CLOSED') {
      throw new BadRequestException('Sesi presensi tidak aktif atau sudah ditutup.');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let participantUser: any = null;

    if (dto.participantId) {
      participantUser = await this.userModel.findById(dto.participantId).populate('role').exec();
    } else if (dto.nim) {
      participantUser = await this.userModel
        .findOne({
          $or: [
            { nim: dto.nim },
            { email: dto.nim.toLowerCase() },
          ],
        })
        .populate('role')
        .exec();
    } else if (operatorId) {
      participantUser = await this.userModel.findById(operatorId).populate('role').exec();
    }

    if (!participantUser) {
      throw new NotFoundException(
        'Data peserta (Maba/Panitia) tidak ditemukan untuk presensi ini.',
      );
    }

    // Determine Participant Type & Division
    const roleSlug =
      typeof participantUser.role === 'object' && participantUser.role
        ? (participantUser.role as RoleDocument).slug
        : 'user';

    const participantType: 'MABA' | 'PANITIA' =
      roleSlug === 'user' || roleSlug === 'maba' ? 'MABA' : 'PANITIA';

    const division = participantUser.division || participantUser.position || undefined;
    const roleId =
      typeof participantUser.role === 'object' && participantUser.role
        ? (participantUser.role as RoleDocument)._id
        : undefined;

    // Determine status (Hadir vs Telat)
    const now = new Date();
    let finalStatus = dto.status || 'Hadir';
    if (!dto.status && now > session.endTime) {
      finalStatus = 'Telat';
    }

    const method = dto.method || 'QR_CODE';

    return this.logModel
      .findOneAndUpdate(
        {
          session: session._id,
          participant: participantUser._id,
        },
        {
          session: session._id,
          participant: participantUser._id,
          participantType,
          role: roleId,
          division,
          checkInTime: now,
          status: finalStatus,
          attendanceMethod: method,
          operator: operatorId ? new Types.ObjectId(operatorId) : undefined,
          device: userAgent,
          ipAddress,
          notes: dto.notes,
        },
        { upsert: true, new: true },
      )
      .populate('participant', 'name nim email division position studyProgram avatar')
      .populate('session', 'title location startTime endTime')
      .exec();
  }

  async getAttendanceMonitoring(filterDto: AttendanceFilterDto) {
    const filter: FilterQuery<unknown> = { deletedAt: null };

    if (filterDto.sessionId) {
      filter.session = new Types.ObjectId(filterDto.sessionId);
    }
    if (filterDto.participantType) {
      filter.participantType = filterDto.participantType;
    }
    if (filterDto.division) {
      filter.division = filterDto.division;
    }
    if (filterDto.status) {
      filter.status = filterDto.status;
    }

    // Execute queries
    const records = await this.logModel
      .find(filter)
      .sort({ checkInTime: -1 })
      .populate('participant', 'name nim email division position studyProgram avatar')
      .populate('session', 'title location startTime endTime targetParticipantType')
      .populate('operator', 'name email')
      .exec();

    // Compute Summary Stats
    const totalHadir = records.filter((r) => r.status === 'Hadir').length;
    const terlambat = records.filter((r) => r.status === 'Telat').length;
    const sakitIzin = records.filter((r) => r.status === 'Izin' || r.status === 'Sakit').length;
    const tidakHadir = records.filter((r) => r.status === 'Tidak Hadir').length;

    return {
      records,
      statistics: {
        totalRecords: records.length,
        totalHadir,
        terlambat,
        sakitIzin,
        tidakHadir,
      },
    };
  }

  async getMyAttendanceHistory(userId: string) {
    return this.logModel
      .find({ participant: new Types.ObjectId(userId), deletedAt: null })
      .sort({ checkInTime: -1 })
      .populate('session')
      .exec();
  }

  async getTasks(paginationDto: PaginationDto, isPanitia?: boolean) {
    const filter: FilterQuery<unknown> = { deletedAt: null };
    if (!isPanitia) {
      filter.$or = [
        { status: 'PUBLISHED' },
        { status: { $exists: false } },
        { status: null },
      ];
    }
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
      status: dto.status || 'PUBLISHED',
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
      const user = log.participant as unknown as User;
      const time = log.checkInTime
        ? new Date(log.checkInTime).toISOString()
        : '';
      csv += `"${user?.nim || ''}","${user?.name || ''}","${log.status}","${time}","${log.notes || ''}"\n`;
    }
    return csv;
  }

  // ─── ANNOUNCEMENTS ──────────────────────────────────────────────

  async getAnnouncements(
    paginationDto: PaginationDto,
    groupId?: string,
    isPanitia?: boolean,
  ) {
    const filter: FilterQuery<unknown> = { deletedAt: null };

    // Maba/Public audience can only see Published or due Scheduled announcements
    if (!isPanitia) {
      const now = new Date();
      filter.$or = [
        { status: 'PUBLISHED' },
        { status: { $exists: false } },
        { status: null },
        { status: 'SCHEDULED', scheduledAt: { $lte: now } },
      ];
    }

    if (groupId && !isPanitia) {
      filter.targetAudience = { $in: ['all', undefined] };
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
    let status = dto.status || 'PUBLISHED';
    let scheduledAt: Date | undefined;

    if (dto.scheduledAt) {
      scheduledAt = new Date(dto.scheduledAt);
      if (scheduledAt > new Date() && status !== 'DRAFT') {
        status = 'SCHEDULED';
      }
    }

    return this.announcementModel.create({
      ...dto,
      status,
      scheduledAt,
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
    if (dto.scheduledAt) {
      updateData.scheduledAt = new Date(dto.scheduledAt);
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
    try {
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
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(
        'Gagal memuat dashboard: ' + ((error as Error)?.message || 'Unknown error'),
      );
    }
  }

  async getPanitiaDashboard() {
    // 1. Statistics (Count registered MABA participants with role 'user')
    const userRole = await this.roleModel.findOne({ slug: 'user' }).exec();
    const totalPeserta = userRole
      ? await this.userModel
          .countDocuments({ role: userRole._id, deletedAt: null })
          .exec()
      : 0;

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
        message: `${(a.participant as unknown as { name?: string })?.name || 'Peserta'} melakukan presensi`,
        time: a.checkInTime || new Date(),
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
