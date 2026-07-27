import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, Query, FilterQuery } from 'mongoose';
import Redis from 'ioredis';

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
import {
  StudyProgram,
  StudyProgramDocument,
} from '../schemas/study-program.schema';

import {
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
    sort = { createdAt: -1 };
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    @Inject('REDIS_CLIENT') private redis: Redis,
  ) {}

  // ─── CACHE HELPER ─────────────────────────────────────────────────────────

  private async cachedQuery<T>(
    key: string,
    ttl: number,
    fetcher: () => Promise<T>,
  ): Promise<T> {
    try {
      const cached = await this.redis.get(key);
      if (cached) return JSON.parse(cached) as T;
    } catch {
      /* ignore cache errors */
    }
    const data = await fetcher();
    try {
      await this.redis.setex(key, ttl, JSON.stringify(data));
    } catch {
      /* ignore cache errors */
    }
    return data;
  }

  private async invalidateCachePatterns(...patterns: string[]): Promise<void> {
    for (const pattern of patterns) {
      try {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } catch {
        /* ignore cache errors */
      }
    }
  }

  // ─── USER PROFILE ──────────────────────────────────────────────────────────

  async getUserProfile(userId: string) {
    return this.userModel
      .findById(userId)
      .select('name nim email phone studyProgram studyProgramId gender avatar pkkmbGroup role division position')
      .populate('pkkmbGroup', '_id nomor name')
      .populate('role', 'name slug')
      .lean()
      .exec();
  }

  // ─── GUGUS & MASTER DATA ARCHITECTURE ──────────────────────────────────────

  async getAllRumpun() {
    return this.cachedQuery('pkkmb:rumpun:all', 3600, () =>
      this.rumpunModel
        .find()
        .select('_id name color icon order')
        .sort({ order: 1 })
        .lean()
        .exec(),
    );
  }

  async getAllStudyPrograms() {
    return this.cachedQuery('pkkmb:study-programs:all', 3600, () =>
      this.studyProgramModel
        .find()
        .select('_id code name rumpun faculty degree isActive')
        .populate('rumpun', '_id name color icon order')
        .sort({ name: 1 })
        .lean()
        .exec(),
    );
  }

  async getAllGugus(): Promise<Record<string, unknown>[]> {
    return this.cachedQuery('pkkmb:gugus:all', 300, async () => {
      const gugusList = await this.groupModel
        .find({ deletedAt: null })
        .select('_id nomor name kapasitas pendampingId totalPoints status')
        .populate('pendampingId', 'name email division position phone avatar')
        .sort({ nomor: 1 })
        .lean()
        .exec();

      const memberCounts = await this.userModel.aggregate([
        { $match: { pkkmbGroup: { $ne: null }, deletedAt: null } },
        { $group: { _id: '$pkkmbGroup', count: { $sum: 1 } } },
      ]);

      const countMap = new Map<string, number>();
      (
        memberCounts as Array<{ _id: Types.ObjectId | string; count: number }>
      ).forEach((m) => countMap.set(String(m._id), m.count));

      return gugusList.map((g) => ({
        ...g,
        totalAnggota: countMap.get(String(g._id)) || 0,
      }));
    });
  }

  async getGugusDetail(gugusIdentifier: string) {
    let gugus: Record<string, unknown> | null = null;
    if (Types.ObjectId.isValid(gugusIdentifier)) {
      gugus = await this.groupModel
        .findById(gugusIdentifier)
        .select('_id nomor name kapasitas pendampingId totalPoints status')
        .populate('pendampingId', 'name email division position phone avatar')
        .lean()
        .exec();
    } else {
      const nomor = parseInt(gugusIdentifier, 10);
      if (!isNaN(nomor)) {
        gugus = await this.groupModel
          .findOne({ nomor, deletedAt: null })
          .select('_id nomor name kapasitas pendampingId totalPoints status')
          .populate('pendampingId', 'name email division position phone avatar')
          .lean()
          .exec();
      }
    }

    if (!gugus) {
      throw new NotFoundException('Data Gugus tidak ditemukan.');
    }

    const members = await this.userModel
      .find({
        pkkmbGroup: gugus._id as Types.ObjectId,
        deletedAt: null,
      })
      .select(
        'name nim email phone studyProgram studyProgramId gender avatar division position',
      )
      .populate({
        path: 'studyProgramId',
        select: '_id code name rumpun',
        populate: { path: 'rumpun', select: '_id name color' },
      })
      .lean()
      .exec();

    const totalAnggota = members.length;

    const prodiMap = new Map<string, number>();
    const rumpunMap = new Map<
      string,
      { name: string; color: string; count: number }
    >();

    let maleCount = 0;
    let femaleCount = 0;

    members.forEach((m) => {
      if (m.gender === 'P') {
        femaleCount++;
      } else {
        maleCount++;
      }

      const prodiName =
        m.studyProgram ||
        (m.studyProgramId && typeof m.studyProgramId === 'object'
          ? (m.studyProgramId as unknown as { name: string }).name
          : 'Belum Terdata');
      prodiMap.set(prodiName, (prodiMap.get(prodiName) || 0) + 1);

      let rumpunName = 'Umum';
      let rumpunColor = '#3B82F6';
      if (
        m.studyProgramId &&
        typeof m.studyProgramId === 'object' &&
        (
          m.studyProgramId as unknown as {
            rumpun?: { name?: string; color?: string };
          }
        ).rumpun
      ) {
        const rObj = (
          m.studyProgramId as unknown as {
            rumpun: { name?: string; color?: string };
          }
        ).rumpun;
        if (rObj.name) rumpunName = rObj.name;
        if (rObj.color) rumpunColor = rObj.color;
      }

      const existingR = rumpunMap.get(rumpunName) || {
        name: rumpunName,
        color: rumpunColor,
        count: 0,
      };
      existingR.count++;
      rumpunMap.set(rumpunName, existingR);
    });

    const distribusiProdi = Array.from(prodiMap.entries()).map(
      ([name, count]) => ({
        name,
        count,
        percentage:
          totalAnggota > 0 ? Math.round((count / totalAnggota) * 100) : 0,
      }),
    );

    const distribusiRumpun = Array.from(rumpunMap.values()).map((r) => ({
      name: r.name,
      color: r.color,
      count: r.count,
      percentage:
        totalAnggota > 0 ? Math.round((r.count / totalAnggota) * 100) : 0,
    }));

    return {
      gugus,
      totalAnggota,
      distribusiGender: {
        maleCount,
        femaleCount,
        malePercentage:
          totalAnggota > 0 ? Math.round((maleCount / totalAnggota) * 100) : 0,
        femalePercentage:
          totalAnggota > 0 ? Math.round((femaleCount / totalAnggota) * 100) : 0,
      },
      distribusiProdi,
      distribusiRumpun,
      members,
    };
  }

  async autoDistributeGugus() {
    // Distributed lock to prevent race condition
    const lockKey = 'pkkmb:auto-distribute:lock';
    const lockSet = await this.redis.set(lockKey, '1', 'EX', 120, 'NX');
    if (!lockSet) {
      throw new BadRequestException('Distribusi gugus sedang berjalan. Silakan tunggu sebentar.');
    }

    try {
      const activeGugus = await this.groupModel
        .find({ status: 'ACTIVE', deletedAt: null })
        .select('_id nomor')
        .sort({ nomor: 1 })
        .lean()
        .exec();

      if (activeGugus.length === 0) {
        throw new BadRequestException('Tidak ada Gugus aktif yang tersedia.');
      }

      const mabaRole = await this.roleModel
        .findOne({
          $or: [{ slug: 'user' }, { slug: 'maba' }, { name: 'Mahasiswa Baru' }],
        })
        .select('_id')
        .lean();

      const query: FilterQuery<UserDocument> = {
        deletedAt: null,
        $or: [{ pkkmbGroup: null }, { pkkmbGroup: { $exists: false } }],
      };

      if (mabaRole) {
        query.role = mabaRole._id;
      }

      const unassignedMaba = await this.userModel
        .find(query)
        .select('_id studyProgram')
        .lean()
        .exec();

      if (unassignedMaba.length === 0) {
        return {
          message: 'Semua mahasiswa baru sudah terdistribusi ke Gugus.',
          distributedCount: 0,
        };
      }

      const majorGroups = new Map<string, Array<{ _id: Types.ObjectId }>>();
      unassignedMaba.forEach((m) => {
        const key = m.studyProgram || 'Umum';
        if (!majorGroups.has(key)) {
          majorGroups.set(key, []);
        }
        majorGroups.get(key)!.push({ _id: m._id });
      });

      let gugusCursor = 0;
      const updates: Promise<unknown>[] = [];
      let totalDistributed = 0;

      majorGroups.forEach((students) => {
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
    } finally {
      await this.redis.del(lockKey).catch(() => {});
    }
  }

  async getAdminGugusAnalytics() {
    const [totalGugus, totalMahasiswa, totalStudyPrograms, totalRumpun] =
      await Promise.all([
        this.groupModel.countDocuments({ deletedAt: null }),
        this.userModel.countDocuments({ deletedAt: null }),
        this.studyProgramModel.countDocuments({ isActive: true }),
        this.rumpunModel.countDocuments(),
      ]);

    const [gugusStats, prodiStats] = await Promise.all([
      this.userModel.aggregate([
        { $match: { pkkmbGroup: { $ne: null }, deletedAt: null } },
        { $group: { _id: '$pkkmbGroup', count: { $sum: 1 } } },
        {
          $lookup: {
            from: 'pkkmb_gugus',
            localField: '_id',
            foreignField: '_id',
            as: 'gugus',
          },
        },
        { $unwind: '$gugus' },
        {
          $project: {
            _id: 0,
            gugusName: '$gugus.name',
            nomor: '$gugus.nomor',
            count: 1,
          },
        },
        { $sort: { nomor: 1 } },
      ]),
      this.userModel.aggregate([
        { $match: { deletedAt: null } },
        { $group: { _id: '$studyProgram', count: { $sum: 1 } } },
        { $project: { _id: 0, prodiName: '$_id', count: 1 } },
        { $sort: { count: -1 } },
      ]),
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

  // ─── ATTENDANCE SESSIONS ──────────────────────────────────────────────────

  async createAttendanceSession(
    userId: string,
    dto: CreateAttendanceSessionDto,
  ) {
    const qrCode = `PKKMB2026_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const endTime = new Date(dto.endTime);
    // QR expires 1 hour after session ends
    const qrExpiry = new Date(endTime.getTime() + 60 * 60 * 1000);

    const result = await this.sessionModel.create({
      title: dto.title,
      date: new Date(dto.date),
      startTime: new Date(dto.startTime),
      endTime,
      location: dto.location,
      targetParticipantType: dto.targetParticipantType || 'ALL',
      targetDivision: dto.targetDivision,
      qrCode,
      qrExpiry,
      status: dto.status || 'PUBLISHED',
      createdBy: new Types.ObjectId(userId),
    });

    await this.invalidateCachePatterns('pkkmb:sessions:*');
    return result;
  }

  async getAttendanceSessions(participantType?: string, status?: string) {
    const cacheKey = `pkkmb:sessions:${participantType || 'ALL'}:${status || 'ALL'}`;
    return this.cachedQuery(cacheKey, 30, async () => {
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
      return this.sessionModel
        .find(filter)
        .select(
          '_id title date startTime endTime location targetParticipantType targetDivision qrCode status',
        )
        .sort({ startTime: -1 })
        .lean()
        .exec();
    });
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
    const result = await session.save();
    await this.invalidateCachePatterns('pkkmb:sessions:*');
    return result;
  }

  // ─── CHECK-IN ─────────────────────────────────────────────────────────────

  async checkIn(
    dto: CheckInDto,
    operatorId?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const session = await this.sessionModel
      .findById(dto.sessionId)
      .select('_id status endTime qrCode qrExpiry')
      .lean();

    if (!session || session.status === 'CLOSED') {
      throw new BadRequestException(
        'Sesi presensi tidak aktif atau sudah ditutup.',
      );
    }

    // Validate QR token if method is QR_CODE
    if (dto.method === 'QR_CODE' || (!dto.method && !dto.nim && !dto.participantId)) {
      if (!dto.qrToken) {
        throw new BadRequestException('QR Token wajib diisi untuk check-in via QR Code.');
      }
      if (dto.qrToken !== session.qrCode) {
        throw new BadRequestException('QR Token tidak valid. Silakan scan ulang.');
      }
      if (session.qrExpiry && new Date() > session.qrExpiry) {
        throw new BadRequestException('QR Code telah kedaluwarsa. Silakan minta QR baru.');
      }
    }

    let participantUser: UserDocument | null = null;

    if (dto.participantId) {
      participantUser = await this.userModel
        .findById(dto.participantId)
        .populate('role')
        .exec();
    } else if (dto.nim) {
      participantUser = await this.userModel
        .findOne({
          $or: [{ nim: dto.nim }, { email: dto.nim.toLowerCase() }],
        })
        .populate('role')
        .exec();
    } else if (operatorId) {
      participantUser = await this.userModel
        .findById(operatorId)
        .populate('role')
        .exec();
    }

    if (!participantUser) {
      throw new NotFoundException(
        'Data peserta (Maba/Panitia) tidak ditemukan untuk presensi ini.',
      );
    }

    const roleSlug =
      typeof participantUser.role === 'object' && participantUser.role
        ? (participantUser.role as unknown as RoleDocument).slug
        : 'user';

    const participantType: 'MABA' | 'PANITIA' =
      roleSlug === 'user' || roleSlug === 'maba' ? 'MABA' : 'PANITIA';

    const division =
      participantUser.division || participantUser.position || undefined;
    const roleId =
      typeof participantUser.role === 'object' && participantUser.role
        ? (participantUser.role as unknown as RoleDocument)._id
        : undefined;

    const now = new Date();
    let finalStatus = dto.status || 'Hadir';
    if (!dto.status && now > session.endTime) {
      finalStatus = 'Telat';
    }

    const method = dto.method || 'QR_CODE';

    return this.logModel
      .findOneAndUpdate(
        {
          session: new Types.ObjectId(dto.sessionId),
          participant: participantUser._id,
        },
        {
          session: new Types.ObjectId(dto.sessionId),
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
      .populate(
        'participant',
        'name nim email division position studyProgram avatar',
      )
      .populate('session', 'title location startTime endTime')
      .exec();
  }

  // ─── ATTENDANCE MONITORING ────────────────────────────────────────────────

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

    const page = parseInt(filterDto.page || '1', 10);
    const limit = parseInt(filterDto.limit || '50', 10);
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalRecords = await this.logModel.countDocuments(filter).exec();

    const records = await this.logModel
      .find(filter)
      .select(
        'session participant participantType checkInTime status attendanceMethod operator division notes',
      )
      .sort({ checkInTime: -1 })
      .skip(skip)
      .limit(limit)
      .populate(
        'participant',
        'name nim email division position studyProgram avatar',
      )
      .populate(
        'session',
        'title location startTime endTime targetParticipantType',
      )
      .populate('operator', 'name email')
      .lean()
      .exec();

    // Get statistics using aggregation for the filtered set (all records, not paginated)
    const statsResult = await this.logModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const statsMap = new Map<string, number>();
    statsResult.forEach((s) => statsMap.set(s._id, s.count));

    return {
      records,
      statistics: {
        totalRecords,
        totalHadir: statsMap.get('Hadir') || 0,
        terlambat: statsMap.get('Telat') || 0,
        sakitIzin: (statsMap.get('Izin') || 0) + (statsMap.get('Sakit') || 0),
        tidakHadir: statsMap.get('Tidak Hadir') || 0,
      },
      pagination: {
        page,
        limit,
        total: totalRecords,
        totalPages: Math.ceil(totalRecords / limit),
      },
    };
  }

  async getMyAttendanceHistory(userId: string) {
    return this.logModel
      .find({ participant: new Types.ObjectId(userId), deletedAt: null })
      .select(
        'session participant participantType checkInTime status attendanceMethod notes',
      )
      .sort({ checkInTime: -1 })
      .populate('session', 'title date startTime endTime location')
      .lean()
      .exec();
  }

  // ─── TASKS & SUBMISSIONS ──────────────────────────────────────────────────

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
    const query = this.taskModel
      .find(filter)
      .select('_id title description deadline type status allowedFormats');
    return applyPagination(query, paginationDto).lean().exec();
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
      .select('taskId userId groupId fileUrl status score feedback submittedAt')
      .populate('taskId', '_id title deadline type status');

    return applyPagination(query, paginationDto).lean().exec();
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
    // Sessions are universal - mentors see all published sessions
    // They can then manually check-in their group members
    const filter: FilterQuery<unknown> = {
      status: 'PUBLISHED',
      deletedAt: null,
    };
    if (paginationDto.search) {
      filter.title = { $regex: paginationDto.search, $options: 'i' };
    }
    const query = this.sessionModel
      .find(filter)
      .select(
        '_id title date startTime endTime location targetParticipantType targetDivision qrCode status',
      );
    return applyPagination(query, paginationDto).lean().exec();
  }

  async mentorManualCheckin(
    sessionId: string,
    groupId: string,
    dto: AdminManualCheckinDto,
  ) {
    const session = await this.sessionModel.findOne({
      _id: sessionId,
      deletedAt: null,
    });
    if (!session)
      throw new NotFoundException('Sesi presensi tidak ditemukan');

    // Verify the target user belongs to the mentor's group
    const targetUser = await this.userModel
      .findById(dto.userId)
      .select('_id pkkmbGroup')
      .lean();
    if (!targetUser) throw new NotFoundException('Peserta tidak ditemukan');
    if (
      targetUser.pkkmbGroup &&
      targetUser.pkkmbGroup.toString() !== groupId
    ) {
      throw new BadRequestException('Peserta bukan anggota kelompok Anda');
    }

    return this.logModel
      .findOneAndUpdate(
        {
          session: new Types.ObjectId(sessionId),
          participant: new Types.ObjectId(dto.userId),
        },
        {
          session: new Types.ObjectId(sessionId),
          participant: new Types.ObjectId(dto.userId),
          participantType: 'MABA',
          status: dto.status,
          checkInTime: new Date(),
          attendanceMethod: 'MANUAL_OPERATOR',
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
    submission.status = 'GRADED';

    return submission.save();
  }

  // ─── ADMIN / OTHERS ──────────────────────────────────────────────

  async exportAttendanceToCsv(sessionId: string): Promise<string> {
    const logs = await this.logModel
      .find({ session: new Types.ObjectId(sessionId) })
      .select('participant checkInTime status notes')
      .populate('participant', 'nim name pkkmbGroup')
      .lean()
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
    const query = this.announcementModel
      .find(filter)
      .select(
        '_id title content attachments targetAudience targetGroups isPriority status scheduledAt createdAt',
      );

    if (!paginationDto.sortBy) {
      query.sort({ isPriority: -1, createdAt: -1 });
    }

    return applyPagination(query, paginationDto).lean().exec();
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

    const result = await this.announcementModel.create({
      ...dto,
      status,
      scheduledAt,
      targetGroups: dto.targetGroups
        ? dto.targetGroups.map((id) => new Types.ObjectId(id))
        : undefined,
    });

    await this.invalidateCachePatterns('pkkmb:announcements:*');
    return result;
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

    await this.invalidateCachePatterns('pkkmb:announcements:*');
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

    await this.invalidateCachePatterns('pkkmb:announcements:*');
    return announcement;
  }

  // ─── SCHEDULES ──────────────────────────────────────────────

  async getSchedules(paginationDto: PaginationDto) {
    const filter: FilterQuery<unknown> = { deletedAt: null };
    if (paginationDto.search) {
      filter.name = { $regex: paginationDto.search, $options: 'i' };
    }
    const query = this.scheduleModel
      .find(filter)
      .select('_id name startTime endTime location pic');

    if (!paginationDto.sortBy) {
      query.sort({ startTime: 1 });
    }

    return applyPagination(query, paginationDto).lean().exec();
  }

  async createSchedule(dto: CreateScheduleDto) {
    const result = await this.scheduleModel.create({
      ...dto,
      startTime: new Date(dto.startTime),
      endTime: new Date(dto.endTime),
    });
    await this.invalidateCachePatterns('pkkmb:schedules:*');
    return result;
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
    await this.invalidateCachePatterns('pkkmb:schedules:*');
    return schedule;
  }

  async deleteSchedule(id: string) {
    const schedule = await this.scheduleModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { new: true },
    );
    if (!schedule) throw new NotFoundException('Jadwal tidak ditemukan');
    await this.invalidateCachePatterns('pkkmb:schedules:*');
    return schedule;
  }

  // ─── MABA DASHBOARD (MODULAR) ──────────────────────────────────────────────

  async getMabaDashboardAnnouncements(groupId?: string | null) {
    const filter: FilterQuery<unknown> = { deletedAt: null };
    if (groupId) {
      filter.$or = [
        { targetAudience: 'all' },
        {
          targetAudience: 'specific_groups',
          targetGroups: new Types.ObjectId(groupId),
        },
      ];
    } else {
      filter.targetAudience = 'all';
    }
    return this.announcementModel
      .find(filter)
      .select('_id title content isPriority createdAt')
      .sort({ isPriority: -1, createdAt: -1 })
      .limit(3)
      .lean()
      .exec();
  }

  async getMabaDashboardSchedules() {
    const now = new Date();
    return this.scheduleModel
      .find({ deletedAt: null, endTime: { $gte: now } })
      .select('_id name startTime endTime location pic')
      .sort({ startTime: 1 })
      .limit(3)
      .lean()
      .exec();
  }

  async getMabaDashboardTasks(userId: string, groupId?: string | null) {
    const now = new Date();
    const allTasks = await this.taskModel
      .find({ deletedAt: null, deadline: { $gte: now } })
      .select('_id title deadline type status')
      .sort({ deadline: 1 })
      .lean()
      .exec();

    const queryConds: FilterQuery<unknown>[] = [
      { userId: new Types.ObjectId(userId) },
    ];
    if (groupId) queryConds.push({ groupId: new Types.ObjectId(groupId) });

    const submissions = await this.submissionModel
      .find({ $or: queryConds, deletedAt: null })
      .select('taskId status')
      .lean()
      .exec();

    const activeTasks = allTasks;
    const pendingTasks = activeTasks
      .filter((t) => !submissions.find((s) => s.taskId.toString() === t._id.toString()))
      .slice(0, 5); // Top 5 nearest deadline

    return {
      total: allTasks.length,
      submitted: submissions.length,
      pending: pendingTasks.length,
      graded: submissions.filter((s) => s.status === 'GRADED').length,
      pendingTasks,
    };
  }

  async getMabaDashboardAttendance(userId: string) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const attendanceLogs = await this.logModel
      .find({
        participant: new Types.ObjectId(userId),
        checkInTime: { $gte: todayStart, $lte: todayEnd },
      })
      .select('_id')
      .lean()
      .exec();

    return { todayCount: attendanceLogs.length };
  }

  async getMabaDashboardProgress(userId: string, groupId?: string | null) {
    const totalSteps = 4;
    let completedSteps = 1;

    if (groupId) completedSteps++;

    const hasAttendedAny = await this.logModel
      .findOne({ participant: new Types.ObjectId(userId) })
      .select('_id')
      .lean();

    if (hasAttendedAny) completedSteps++;

    const queryConds: FilterQuery<unknown>[] = [
      { userId: new Types.ObjectId(userId) },
    ];
    if (groupId) queryConds.push({ groupId: new Types.ObjectId(groupId) });
    const submissions = await this.submissionModel
      .find({ $or: queryConds, deletedAt: null })
      .select('_id')
      .lean()
      .exec();

    if (submissions.length > 0) completedSteps++;

    const progressPercent = Math.round((completedSteps / totalSteps) * 100);

    return {
      percent: progressPercent,
      completedSteps,
      totalSteps,
      hasGroup: !!groupId,
      hasAttendedAny: !!hasAttendedAny,
      hasSubmittedTask: submissions.length > 0,
    };
  }

  async getMabaDashboard(userId: string) {
    try {
      const user = await this.userModel
        .findById(userId)
        .select(
          'name nim email avatar studyProgram studyProgramId pkkmbGroup role',
        )
        .populate('pkkmbGroup', '_id nomor name')
        .lean();

      if (!user) throw new NotFoundException('User tidak ditemukan');

      const groupId = user.pkkmbGroup
        ? (user.pkkmbGroup as unknown as { _id: Types.ObjectId })._id.toString()
        : null;

      const [
        announcements,
        upcomingSchedules,
        taskStats,
        attendance,
        progress,
      ] = await Promise.all([
        this.getMabaDashboardAnnouncements(groupId),
        this.getMabaDashboardSchedules(),
        this.getMabaDashboardTasks(userId, groupId),
        this.getMabaDashboardAttendance(userId),
        this.getMabaDashboardProgress(userId, groupId),
      ]);

      let nextAction = 'Persiapkan diri Anda untuk kegiatan selanjutnya.';
      if (taskStats.pendingTasks.length > 0) {
        nextAction = `Ada ${taskStats.pendingTasks.length} tugas yang belum dikumpulkan. Batas terdekat: ${taskStats.pendingTasks[0].title}.`;
      } else if (upcomingSchedules.length > 0) {
        nextAction = `Kegiatan terdekat: ${upcomingSchedules[0].name} pada ${new Date(upcomingSchedules[0].startTime).toLocaleString('id-ID')}.`;
      }

      return {
        user,
        progress,
        announcements,
        upcomingSchedules,
        tasks: {
          total: taskStats.total,
          submitted: taskStats.submitted,
          pending: taskStats.pending,
          graded: taskStats.graded,
        },
        attendance: {
          todayCount: attendance.todayCount,
        },
        nextAction,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(
        'Gagal memuat dashboard: ' +
          ((error as Error)?.message || 'Unknown error'),
      );
    }
  }

  // ─── PANITIA DASHBOARD (MODULAR) ───────────────────────────────────────────

  async getPanitiaStats() {
    const userRole = await this.roleModel
      .findOne({ slug: 'user' })
      .select('_id')
      .lean();

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
      .countDocuments({
        checkInTime: { $gte: todayStart, $lte: todayEnd },
      })
      .exec();

    return {
      totalPeserta,
      attendanceTodayPercent:
        totalPeserta > 0
          ? Math.round((attendanceToday / totalPeserta) * 100)
          : 0,
      attendanceToday,
    };
  }

  async getPanitiaRecentActivities() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [recentSubmissions, recentAttendance] = await Promise.all([
      this.submissionModel
        .find({ deletedAt: null })
        .select('userId updatedAt')
        .populate('userId', 'name')
        .sort({ updatedAt: -1 })
        .limit(3)
        .lean()
        .exec(),
      this.logModel
        .find({ checkInTime: { $gte: todayStart } })
        .select('participant checkInTime')
        .populate('participant', 'name')
        .sort({ checkInTime: -1 })
        .limit(3)
        .lean()
        .exec(),
    ]);

    const activities = [
      ...recentSubmissions.map((s) => ({
        type: 'task' as const,
        message: `${(s.userId as unknown as { name?: string })?.name || 'Peserta'} mengumpulkan tugas`,
        time: (s as unknown as { updatedAt: Date }).updatedAt,
      })),
      ...recentAttendance.map((a) => ({
        type: 'attendance' as const,
        message: `${(a.participant as unknown as { name?: string })?.name || 'Peserta'} melakukan presensi`,
        time: a.checkInTime || new Date(),
      })),
    ]
      .sort((a, b) => b.time.getTime() - a.time.getTime())
      .slice(0, 5);

    return activities;
  }

  async getPanitiaAnnouncements() {
    return this.announcementModel
      .find({ deletedAt: null })
      .select('_id title content isPriority createdAt')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean()
      .exec();
  }

  async getPanitiaSchedules() {
    const now = new Date();
    return this.scheduleModel
      .find({ deletedAt: null, endTime: { $gte: now } })
      .select('_id name startTime endTime location pic')
      .sort({ startTime: 1 })
      .limit(5)
      .lean()
      .exec();
  }

  async getPanitiaTaskStats() {
    const [totalSubmissions, gradedSubmissions] = await Promise.all([
      this.submissionModel.countDocuments({ deletedAt: null }).exec(),
      this.submissionModel
        .countDocuments({ status: 'GRADED', deletedAt: null })
        .exec(),
    ]);

    return {
      totalSubmissions,
      pendingGrading: totalSubmissions - gradedSubmissions,
      graded: gradedSubmissions,
    };
  }

  async getPanitiaDashboard() {
    const [stats, activities, announcements, schedules, taskStats] =
      await Promise.all([
        this.getPanitiaStats(),
        this.getPanitiaRecentActivities(),
        this.getPanitiaAnnouncements(),
        this.getPanitiaSchedules(),
        this.getPanitiaTaskStats(),
      ]);

    return {
      statistics: {
        totalPeserta: stats.totalPeserta,
        attendanceTodayPercent: stats.attendanceTodayPercent,
      },
      activities,
      announcements,
      schedules,
      tasks: {
        totalSubmissions: taskStats.totalSubmissions,
        pendingGrading: taskStats.pendingGrading,
        graded: taskStats.graded,
      },
      attendance: {
        today: stats.attendanceToday,
      },
    };
  }
}
