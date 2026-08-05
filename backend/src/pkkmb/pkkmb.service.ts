import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, Query, FilterQuery } from 'mongoose';
import * as bcrypt from 'bcrypt';
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
  PkkmbPublishConfig,
  PkkmbPublishConfigDocument,
} from '../schemas/pkkmb-publish-config.schema';

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
  OnboardDto,
  AdminCreateUserDto,
  AdminUpdateUserDto,
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

export function buildPaginationResponse<T>(
  data: T[],
  total: number,
  paginationDto: PaginationDto,
) {
  const page = parseInt(paginationDto.page || '1', 10);
  const limit = parseInt(paginationDto.limit || '20', 10);
  const totalPages = Math.ceil(total / limit) || 1;

  return {
    data,
    pagination: {
      page,
      limit,
      totalItems: total,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    },
  };
}

function sanitizeAvatar(avatar?: string | null): string | null {
  if (!avatar) return null;
  const trimmed = avatar.trim();
  if (trimmed === '') return null;
  if (trimmed.includes('localhost')) return null;
  if (trimmed.includes('dummy')) return null;

  // If it's just a path like /uploads/..., in production we should reject it if we mandate external storage.
  // But to be safe, if it's local and we are strictly cleaning it:
  if (trimmed.startsWith('/uploads')) return null;

  return trimmed;
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
    @InjectModel(PkkmbPublishConfig.name)
    private publishConfigModel: Model<PkkmbPublishConfigDocument>,

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
      .select(
        'name nim email phone studyProgram studyProgramId gender avatar pkkmbGroup role division position',
      )
      .populate('pkkmbGroup', '_id nomor name')
      .populate('role', 'name slug')
      .lean()
      .exec();
  }

  // ─── GUGUS & MASTER DATA ARCHITECTURE ──────────────────────────────────────

  async submitOnboard(userId: string, dto: OnboardDto) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User tidak ditemukan');

    user.nim = dto.nim;
    user.name = dto.name;
    user.studyProgram = dto.department;
    if (Types.ObjectId.isValid(dto.department)) {
      user.department = new Types.ObjectId(dto.department);
    }
    user.gender = dto.gender;
    user.phone = dto.phone;
    user.emergencyContact = dto.emergencyContact;
    if (dto.avatarObjectKey) {
      user.avatar = dto.avatarObjectKey;
    }
    if (dto.ktmObjectKey) {
      user.ktmUrl = dto.ktmObjectKey;
    }
    user.isOnboarded = true;
    user.verificationStatus = 'PENDING_VERIFICATION';
    user.assignmentStatus = 'UNASSIGNED';

    await user.save();

    return user;
  }

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
        .select(
          '_id nomor name kapasitas pendampingId pendampingName pendampingWhatsApp pendampingEmail ketuaGugusId totalPoints status',
        )
        .populate('pendampingId', 'name email division position phone avatar')
        .populate('ketuaGugusId', 'name email nim phone avatar')
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
        .select(
          '_id nomor name kapasitas pendampingId pendampingName pendampingWhatsApp pendampingEmail ketuaGugusId totalPoints status',
        )
        .populate('pendampingId', 'name email division position phone avatar')
        .populate('ketuaGugusId', 'name email nim phone avatar')
        .lean()
        .exec();
    } else {
      const nomor = parseInt(gugusIdentifier, 10);
      if (!isNaN(nomor)) {
        gugus = await this.groupModel
          .findOne({ nomor, deletedAt: null })
          .select(
            '_id nomor name kapasitas pendampingId pendampingName pendampingWhatsApp pendampingEmail ketuaGugusId totalPoints status',
          )
          .populate('pendampingId', 'name email division position phone avatar')
          .populate('ketuaGugusId', 'name email nim phone avatar')
          .lean()
          .exec();
      }
    }

    if (!gugus) {
      throw new NotFoundException('Data Gugus tidak ditemukan.');
    }

    const mabaRole = await this.roleModel
      .findOne({
        $or: [{ slug: 'user' }, { slug: 'maba' }, { name: 'Mahasiswa Baru' }],
      })
      .select('_id')
      .lean();

    const memberQuery: FilterQuery<UserDocument> = {
      pkkmbGroup: gugus._id,
      deletedAt: null,
    };
    if (mabaRole) {
      memberQuery.role = mabaRole._id;
    }

    const members = await this.userModel
      .find(memberQuery)
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
      throw new BadRequestException(
        'Distribusi gugus sedang berjalan. Silakan tunggu sebentar.',
      );
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
        verificationStatus: 'VERIFIED',
        assignmentStatus: 'UNASSIGNED',
        $or: [{ pkkmbGroup: null }, { pkkmbGroup: { $exists: false } }],
      };

      if (mabaRole) {
        query.role = mabaRole._id;
      }

      const unassignedMaba = await this.userModel
        .find(query)
        .select('_id studyProgram studyProgramId gender')
        .lean()
        .exec();

      if (unassignedMaba.length === 0) {
        return {
          message: 'Semua mahasiswa baru sudah terdistribusi ke Gugus.',
          distributedCount: 0,
        };
      }

      const rumpunBuckets = new Map<
        string,
        Array<{ _id: Types.ObjectId; gender?: 'L' | 'P' }>
      >();
      unassignedMaba.forEach((m) => {
        const rumpunId =
          (
            m.studyProgramId as Types.ObjectId | string | undefined
          )?.toString?.() ||
          m.studyProgram ||
          'Umum';
        const bucketKey = `${rumpunId}_${m.gender || 'L'}`;
        const bucket = rumpunBuckets.get(bucketKey) || [];
        bucket.push({ _id: m._id, gender: m.gender });
        rumpunBuckets.set(bucketKey, bucket);
      });

      const allBucketedStudents: Array<{
        _id: Types.ObjectId;
        gender?: 'L' | 'P';
      }> = [];
      rumpunBuckets.forEach((students) => {
        const shuffled = [...students].sort(() => Math.random() - 0.5);
        allBucketedStudents.push(...shuffled);
      });

      let gugusCursor = 0;
      const updates: Promise<unknown>[] = [];
      let totalDistributed = 0;

      allBucketedStudents.forEach((student) => {
        const targetGugus = activeGugus[gugusCursor];
        updates.push(
          this.userModel.updateOne(
            { _id: student._id },
            {
              $set: {
                pkkmbGroup: targetGugus._id,
                assignmentStatus: 'ASSIGNED',
                assignmentAssignedAt: new Date(),
              },
            },
          ),
        );
        gugusCursor = (gugusCursor + 1) % activeGugus.length;
        totalDistributed++;
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

  async getPendingVerifications(paginationDto: PaginationDto) {
    const mabaRole = await this.roleModel
      .findOne({
        $or: [{ slug: 'user' }, { slug: 'maba' }, { name: 'Mahasiswa Baru' }],
      })
      .select('_id')
      .lean();

    const filter: FilterQuery<UserDocument> = {
      deletedAt: null,
      verificationStatus: 'PENDING_VERIFICATION',
    };

    if (mabaRole) {
      filter.role = mabaRole._id;
    }

    const query = this.userModel.find(filter).sort({ createdAt: -1 });

    applyPagination(query, paginationDto);

    const data = await query.exec();
    const total = await this.userModel.countDocuments(filter).exec();

    const sanitizedData = data.map((doc) => {
      const obj = doc.toObject();
      (obj as unknown as { avatar?: string | null }).avatar = sanitizeAvatar(
        (obj as unknown as { avatar?: string | null }).avatar,
      );
      return obj;
    });

    return buildPaginationResponse(sanitizedData, total, paginationDto);
  }

  async verifyMaba(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    user.verificationStatus = 'VERIFIED';
    user.verifiedAt = new Date();
    user.verificationRejectionReason = undefined;

    await user.save();

    return user;
  }

  async rejectMaba(userId: string, reason: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    user.verificationStatus = 'REJECTED';
    user.verificationRejectionReason = reason;

    await user.save();

    return user;
  }

  async publishGugus(adminId: string) {
    const now = new Date();

    const result = await this.userModel.updateMany(
      {
        assignmentStatus: 'ASSIGNED',
        pkkmbGroup: { $ne: null },
        deletedAt: null,
      },
      {
        $set: {
          assignmentStatus: 'PUBLISHED',
          assignmentPublishedAt: now,
        },
      },
    );

    await this.publishConfigModel.findOneAndUpdate(
      {},
      {
        $set: {
          isPublished: true,
          publishedAt: now,
          publishedBy: new Types.ObjectId(adminId),
          publishType: 'NOW',
        },
      },
      { upsert: true, new: true },
    );

    await this.invalidateCachePatterns('pkkmb:gugus:*');

    return {
      message: 'Pembagian gugus berhasil dipublikasikan.',
      updatedCount: result.modifiedCount,
    };
  }

  async schedulePublishGugus(scheduledAt: Date) {
    await this.publishConfigModel.findOneAndUpdate(
      {},
      {
        $set: {
          isPublished: false,
          publishType: 'SCHEDULED',
          scheduledAt,
        },
      },
      { upsert: true, new: true },
    );

    return {
      message: `Publish dijadwalkan pada ${scheduledAt.toISOString()}.`,
    };
  }

  async getPublishConfig() {
    const config = await this.publishConfigModel
      .findOne()
      .sort({ updatedAt: -1 })
      .lean()
      .exec();

    if (!config) {
      return {
        isPublished: false,
        publishType: 'NOW',
        scheduledAt: null,
        publishedAt: null,
      };
    }

    return config;
  }

  async seedDefaultVerificationStatus() {
    const result = await this.userModel.updateMany(
      {
        verificationStatus: { $exists: false },
      },
      {
        $set: {
          verificationStatus: 'PENDING_VERIFICATION',
          assignmentStatus: 'UNASSIGNED',
        },
      },
    );

    return {
      message: `Migrasi status default berhasil. ${result.modifiedCount} user diperbarui.`,
      updatedCount: result.modifiedCount,
    };
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
    operatorRoleSlug?: string,
  ) {
    const session = await this.sessionModel.findById(dto.sessionId).exec();
    if (!session) {
      throw new NotFoundException('Sesi presensi tidak ditemukan.');
    }

    if (session.status !== 'PUBLISHED') {
      throw new BadRequestException('Sesi presensi ini tidak aktif.');
    }

    // Geofence: Gedung FT E1 UNESA, radius 200m (bypass for super_admin)
    if (dto.method === 'SELF_CHECKIN') {
      let bypassGeofence = false;
      if (
        operatorRoleSlug === 'super_admin' ||
        operatorRoleSlug === 'super-admin'
      ) {
        bypassGeofence = true;
      } else if (operatorId) {
        const op = await this.userModel
          .findById(operatorId)
          .populate('role')
          .lean()
          .exec();
        const slug =
          op?.role && typeof op.role === 'object'
            ? (op.role as { slug?: string }).slug
            : '';
        if (slug === 'super_admin' || slug === 'super-admin')
          bypassGeofence = true;
      }

      if (!bypassGeofence) {
        if (dto.lat == null || dto.lng == null) {
          throw new BadRequestException(
            'Lokasi GPS wajib diaktifkan untuk presensi mandiri.',
          );
        }
        const FT_LAT = -7.3156913;
        const FT_LNG = 112.7270252;
        const MAX_RADIUS_M = 200;
        const toRad = (deg: number) => (deg * Math.PI) / 180;
        const R = 6371000;
        const dLat = toRad(dto.lat - FT_LAT);
        const dLng = toRad(dto.lng - FT_LNG);
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos(toRad(FT_LAT)) *
            Math.cos(toRad(dto.lat)) *
            Math.sin(dLng / 2) ** 2;
        const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        if (distance > MAX_RADIUS_M) {
          throw new BadRequestException(
            `Anda berada di luar jangkauan area Fakultas Teknik (${Math.round(distance)}m dari lokasi). Maksimal ${MAX_RADIUS_M}m.`,
          );
        }
      }
    }

    // Validate QR token if method is QR_CODE
    const needsQrValidation =
      dto.method === 'QR_CODE' ||
      (!dto.method && !dto.nim && !dto.participantId);
    if (needsQrValidation) {
      if (!dto.qrToken) {
        throw new BadRequestException(
          'QR Token wajib diisi untuk check-in via QR Code.',
        );
      }
      if (dto.qrToken !== session.qrCode) {
        throw new BadRequestException(
          'QR Token tidak valid. Silakan scan ulang.',
        );
      }
      if (session.qrExpiry && new Date() > session.qrExpiry) {
        throw new BadRequestException(
          'QR Code telah kedaluwarsa. Silakan minta QR baru.',
        );
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

    // Check existing to prevent double deduction
    const existingLog = await this.logModel
      .findOne({
        session: new Types.ObjectId(dto.sessionId),
        participant: participantUser._id,
      })
      .lean()
      .exec();

    if (
      finalStatus === 'Telat' &&
      (!existingLog || existingLog.status !== 'Telat')
    ) {
      await this.pointLogModel.create({
        userId: participantUser._id,
        points: -5,
        source: 'Kehadiran',
        reason: 'Terlambat check-in presensi',
      });
    }

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
          lat: dto.lat,
          lng: dto.lng,
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

  async getMyPointsSummary(userId: string) {
    const filter: FilterQuery<unknown> = { deletedAt: null };
    const user = await this.userModel.findById(userId).lean().exec();
    const groupId = user?.pkkmbGroup;
    if (groupId) {
      filter.$or = [
        { userId: new Types.ObjectId(userId) },
        { groupId: new Types.ObjectId(groupId) },
      ];
    } else {
      filter.userId = new Types.ObjectId(userId);
    }
    const result = await this.pointLogModel.aggregate([
      { $match: filter },
      { $group: { _id: null, totalPoints: { $sum: '$points' } } },
    ]);
    const aggregationResult = result as Array<{ totalPoints?: unknown }>;
    return {
      totalPoints: aggregationResult[0]?.totalPoints ?? 0,
    };
  }

  // ─── ATTENDANCE MONITORING ────────────────────────────────────────────────

  async getAttendanceMonitoring(
    filterDto: AttendanceFilterDto,
    currentUser?: {
      userId: unknown;
      permissions?: string[];
      role?: { slug?: string };
    },
  ) {
    const filter: FilterQuery<unknown> = { deletedAt: null };

    if (currentUser) {
      const hasReadAll =
        currentUser?.permissions?.includes('pkkmb.group.read_all') ||
        currentUser?.permissions?.includes('manage:all');
      if (!hasReadAll) {
        const fullUser = await this.userModel
          .findById(currentUser.userId)
          .select('pkkmbGroup')
          .lean()
          .exec();
        const ownedGroup = await this.groupModel
          .findOne({ pendampingId: currentUser.userId })
          .lean()
          .exec();

        const groupIdToUse = ownedGroup
          ? ownedGroup._id
          : fullUser?.pkkmbGroup || null;

        if (groupIdToUse) {
          const mabaList = await this.userModel
            .find({ pkkmbGroup: groupIdToUse, deletedAt: null })
            .select('_id')
            .lean()
            .exec();
          const mabaIds = mabaList.map((m) => m._id);
          filter.participant = { $in: mabaIds };
        } else {
          return {
            records: [],
            statistics: {
              totalRecords: 0,
              totalHadir: 0,
              terlambat: 0,
              sakitIzin: 0,
              tidakHadir: 0,
            },
            pagination: {
              page: 1,
              limit: parseInt(filterDto.limit || '50', 10),
              total: 0,
              totalPages: 0,
            },
          };
        }
      }
    }

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
        'session participant participantType checkInTime status attendanceMethod operator division notes lat lng',
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
    statsResult.forEach((s: { _id: string; count: number }) =>
      statsMap.set(s._id, s.count),
    );

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

  async deleteAttendanceRecord(id: string) {
    const record = await this.logModel.findByIdAndDelete(id).exec();
    if (!record)
      throw new NotFoundException('Record presensi tidak ditemukan.');
    return record;
  }

  async getMyAttendanceHistory(userId: string) {
    return this.logModel
      .find({ participant: new Types.ObjectId(userId), deletedAt: null })
      .select(
        'session participant participantType checkInTime status attendanceMethod notes lat lng',
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

    const isLate = new Date() > task.deadline;
    const status = isLate ? 'Terlambat' : 'Sudah Submit';

    const filter: FilterQuery<unknown> = { taskId: new Types.ObjectId(taskId) };
    if (task.type === 'kelompok') {
      filter.groupId = new Types.ObjectId(groupId);
    } else {
      filter.userId = new Types.ObjectId(userId);
    }

    // Check existing to prevent double deduction
    const existing = await this.submissionModel.findOne(filter).lean().exec();

    if (isLate && (!existing || existing.status !== 'Terlambat')) {
      await this.pointLogModel.create({
        groupId:
          task.type === 'kelompok' ? new Types.ObjectId(groupId) : undefined,
        userId:
          task.type !== 'kelompok' ? new Types.ObjectId(userId) : undefined,
        points: -10,
        source: 'Penugasan',
        reason: `Terlambat mengumpulkan tugas: ${task.title}`,
      });
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
    if (!session) throw new NotFoundException('Sesi presensi tidak ditemukan');

    // Verify the target user belongs to the mentor's group
    const targetUser = await this.userModel
      .findById(dto.userId)
      .select('_id pkkmbGroup')
      .lean();
    if (!targetUser) throw new NotFoundException('Peserta tidak ditemukan');
    if (targetUser.pkkmbGroup && targetUser.pkkmbGroup.toString() !== groupId) {
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

  async getAllSubmissions(
    queryDto: PaginationDto,
    user?: {
      userId: unknown;
      permissions?: string[];
      role?: { slug?: string };
    },
  ) {
    const page = parseInt(queryDto.page || '1', 10);
    const limit = parseInt(queryDto.limit || '20', 10);
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};

    if (user) {
      const hasReadAll =
        user.permissions?.includes('pkkmb.grading.read_all') ||
        user.permissions?.includes('manage:all') ||
        user.permissions?.includes('pkkmb.group.read_all');
      if (!hasReadAll) {
        const fullUser = await this.userModel
          .findById(user.userId)
          .select('pkkmbGroup')
          .lean()
          .exec();
        const ownedGroup = await this.groupModel
          .findOne({ pendampingId: user.userId })
          .lean()
          .exec();

        const groupIdToUse = ownedGroup
          ? ownedGroup._id
          : fullUser?.pkkmbGroup || null;

        if (groupIdToUse) {
          const mabaList = await this.userModel
            .find({ pkkmbGroup: groupIdToUse, deletedAt: null })
            .select('_id')
            .lean()
            .exec();
          const mabaIds = mabaList.map((m) => m._id);
          filter.userId = { $in: mabaIds };
        } else {
          return { data: [], meta: { total: 0, page, limit, totalPages: 0 } };
        }
      }
    }

    if (queryDto.search) {
      // Find maba by name first, if we want to search by name
    }

    const total = await this.submissionModel.countDocuments(filter);
    const data = await this.submissionModel
      .find(filter)
      .populate('userId', 'name nim pkkmbGroup avatar')
      .populate('taskId', 'title type')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async gradeSubmission(
    submissionId: string,
    grader: unknown,
    dto: GradeSubmissionDto,
  ) {
    const normalizedGrader = (grader ?? {}) as {
      userId: unknown;
      permissions?: string[];
    };
    const submission = await this.submissionModel
      .findById(submissionId)
      .populate('userId', 'pkkmbGroup')
      .exec();
    if (!submission)
      throw new NotFoundException('Pengumpulan tugas tidak ditemukan');

    const hasManageAll = normalizedGrader.permissions?.includes('manage:all');
    if (!hasManageAll) {
      const fullGrader = await this.userModel
        .findById(normalizedGrader.userId as string)
        .select('pkkmbGroup')
        .lean()
        .exec();
      const mabaGroup = (
        submission.userId as unknown as { pkkmbGroup?: string }
      )?.pkkmbGroup?.toString();

      if (
        !fullGrader ||
        !fullGrader.pkkmbGroup ||
        fullGrader.pkkmbGroup.toString() !== mabaGroup
      ) {
        throw new ForbiddenException(
          'Anda hanya dapat menilai tugas dari Maba di gugus Anda',
        );
      }
    }

    submission.score = dto.score;
    submission.feedback = dto.feedback;
    submission.gradedBy = new Types.ObjectId(normalizedGrader.userId as string);
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
    if (!groupId) {
      const u = await this.userModel
        .findById(userId)
        .select('pkkmbGroup')
        .lean();
      groupId = u?.pkkmbGroup?.toString();
    }
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
      .filter(
        (t) =>
          !submissions.find((s) => s.taskId.toString() === t._id.toString()),
      )
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
    if (!groupId) {
      const u = await this.userModel
        .findById(userId)
        .select('pkkmbGroup')
        .lean();
      groupId = u?.pkkmbGroup?.toString();
    }

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
        .populate({
          path: 'pkkmbGroup',
          select: '_id nomor name pendampingId',
          populate: {
            path: 'pendampingId',
            select: 'name phone',
          },
        })
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

  // --- Admin Panel Specific Methods ---
  async getAllMaba(
    currentUser: {
      userId: unknown;
      permissions?: string[];
      role?: { slug?: string };
    },
    paginationDto: PaginationDto,
  ) {
    const roleMaba = await this.roleModel.findOne({ slug: 'user' });

    if (!roleMaba) {
      return {
        data: [],
        meta: {
          total: 0,
          page: paginationDto.page || 1,
          limit: paginationDto.limit || 10,
        },
      };
    }

    const filter: Record<string, unknown> = {
      role: roleMaba._id,
      deletedAt: null,
    };

    // Check if the current user is restricted to seeing only their own group
    // The JWT payload includes permissions in currentUser.permissions
    const hasReadAll =
      currentUser?.permissions?.includes('pkkmb.group.read_all') ||
      currentUser?.permissions?.includes('manage:all');
    if (!hasReadAll) {
      // If they don't have read_all, fetch their DB document to find their pkkmbGroup (for Maba)
      const fullUser = await this.userModel
        .findById(currentUser.userId)
        .select('pkkmbGroup')
        .lean()
        .exec();

      // Also check if they are the Pendamping of a group
      const ownedGroup = await this.groupModel
        .findOne({ pendampingId: currentUser.userId })
        .lean()
        .exec();

      if (ownedGroup) {
        filter.pkkmbGroup = ownedGroup._id;
      } else if (fullUser && fullUser.pkkmbGroup) {
        filter.pkkmbGroup = fullUser.pkkmbGroup;
      } else {
        // If they have no group and no read_all permission, they shouldn't see any maba
        return {
          data: [],
          meta: {
            total: 0,
            page: paginationDto.page || 1,
            limit: paginationDto.limit || 10,
          },
        };
      }
    }

    // Search filter
    if (paginationDto.search) {
      const searchRegex = new RegExp(paginationDto.search, 'i');
      filter.$or = [
        { name: searchRegex },
        { nim: searchRegex },
        { email: searchRegex },
      ];
    }

    const query = this.userModel
      .find(filter)
      .populate('pkkmbGroup', 'name ketuaGugusId')
      .populate('department', 'name'); // department is a ref

    applyPagination(query, paginationDto);

    const data = await query.exec();
    const total = await this.userModel.countDocuments(filter);

    const sanitizedData = data.map((doc) => {
      const obj = doc.toObject();
      (obj as unknown as { avatar?: string | null }).avatar = sanitizeAvatar(
        (obj as unknown as { avatar?: string | null }).avatar,
      );
      return obj;
    });

    return buildPaginationResponse(sanitizedData, total, paginationDto);
  }

  async getIncidents(
    currentUser: {
      userId: unknown;
      permissions?: string[];
      role?: { slug?: string };
    },
    paginationDto: PaginationDto,
  ) {
    // We treat PointLogs with points < 0 as incidents (Komdis)
    const filter: Record<string, unknown> = {
      points: { $lt: 0 },
      deletedAt: null,
    };

    const hasReadAll =
      currentUser?.permissions?.includes('pkkmb.group.read_all') ||
      currentUser?.permissions?.includes('manage:all');
    if (!hasReadAll) {
      const fullUser = await this.userModel
        .findById(currentUser.userId)
        .select('pkkmbGroup')
        .lean()
        .exec();
      const ownedGroup = await this.groupModel
        .findOne({ pendampingId: currentUser.userId })
        .lean()
        .exec();

      const groupIdToUse = ownedGroup
        ? ownedGroup._id
        : fullUser?.pkkmbGroup || null;

      if (groupIdToUse) {
        // Find all maba in this group
        const mabaList = await this.userModel
          .find({ pkkmbGroup: groupIdToUse, deletedAt: null })
          .select('_id')
          .lean()
          .exec();
        const mabaIds = mabaList.map((m) => m._id);
        filter.userId = { $in: mabaIds }; // PointLog uses userId for the student
      } else {
        return {
          data: [],
          meta: {
            total: 0,
            page: paginationDto.page || 1,
            limit: paginationDto.limit || 10,
          },
        };
      }
    }

    const query = this.pointLogModel
      .find(filter)
      .populate('groupId', 'name')
      .populate('createdBy', 'name');

    applyPagination(query, paginationDto);

    const data = await query.exec();
    const total = await this.pointLogModel.countDocuments(filter);

    return {
      data,
      meta: {
        total,
        page: paginationDto.page || 1,
        limit: paginationDto.limit || 10,
      },
    };
  }

  async autoAssignGroups(isDryRun: boolean = true) {
    const roleMaba = await this.roleModel.findOne({ slug: 'maba' });
    if (!roleMaba) throw new NotFoundException('Role maba not found');

    const activeGroups = await this.groupModel
      .find({ status: 'ACTIVE', deletedAt: null })
      .sort({ nomor: 1 });
    if (activeGroups.length === 0) {
      throw new BadRequestException(
        'Tidak ada Gugus aktif. Silakan buat Gugus Adrista terlebih dahulu.',
      );
    }

    // Ambil HANYA maba yang belum memiliki gugus
    const unassignedMaba = await this.userModel
      .find({
        role: roleMaba._id,
        $or: [{ pkkmbGroup: null }, { pkkmbGroup: { $exists: false } }],
        deletedAt: null,
      })
      .sort({ nim: 1 });

    if (unassignedMaba.length === 0) {
      throw new BadRequestException('Semua Maba sudah mendapatkan gugus.');
    }

    // Kelompokkan berdasarkan Department & Gender untuk memastikan persebaran adil
    const buckets: Record<string, UserDocument[]> = {};
    for (const maba of unassignedMaba) {
      const deptId = maba.department ? maba.department.toString() : 'unknown';
      const gender = maba.gender || 'L';
      const key = `${deptId}_${gender}`;
      if (!buckets[key]) buckets[key] = [];
      buckets[key].push(maba);
    }

    // Array hasil assignment: [ { userId, groupId } ]
    const assignments: { userId: Types.ObjectId; groupId: Types.ObjectId }[] =
      [];

    // Hasil statistik untuk Simulator (Dry-Run)
    const groupStats: Record<
      string,
      { total: number; laki: number; perempuan: number }
    > = {};
    activeGroups.forEach((g) => {
      groupStats[g._id.toString()] = { total: 0, laki: 0, perempuan: 0 };
    });

    let groupIdx = 0;

    // Round-robin distribution
    for (const key in buckets) {
      const bucketUsers = buckets[key];
      for (const maba of bucketUsers) {
        const group = activeGroups[groupIdx];
        assignments.push({ userId: maba._id, groupId: group._id });

        // Update stats
        groupStats[group._id.toString()].total += 1;
        if (maba.gender === 'P') {
          groupStats[group._id.toString()].perempuan += 1;
        } else {
          groupStats[group._id.toString()].laki += 1;
        }

        // Geser ke gugus selanjutnya (Round-Robin)
        groupIdx = (groupIdx + 1) % activeGroups.length;
      }
    }

    // Jika bukan simulasi, simpan ke Database menggunakan BulkWrite
    if (!isDryRun) {
      // 1. Set pkkmbGroup baru HANYA untuk Maba yang ditargetkan
      const bulkOps = assignments.map((a) => ({
        updateOne: {
          filter: { _id: a.userId },
          update: { $set: { pkkmbGroup: a.groupId } },
        },
      }));
      if (bulkOps.length > 0) {
        await this.userModel.bulkWrite(bulkOps);
      }
      // Catatan: Penetapan Ketua Gugus kini dilakukan secara manual oleh Pendamping Gugus,
      // sehingga sistem tidak lagi mengangkat ketua gugus secara otomatis di sini.
    }

    return {
      message: isDryRun
        ? 'Simulasi pembagian berhasil (Data tidak disimpan).'
        : 'Pembagian gugus permanen berhasil.',
      totalMaba: unassignedMaba.length,
      totalGroups: activeGroups.length,
      stats: activeGroups.map((g) => ({
        groupName: g.name,
        ...groupStats[g._id.toString()],
      })),
    };
  }

  async getAdminDashboardStats(currentUser: {
    userId: unknown;
    permissions?: string[];
    role?: { slug?: string };
  }) {
    const roleMaba = await this.roleModel.findOne({ slug: 'user' });
    if (!roleMaba)
      return { totalMaba: 0, attendanceToday: 0, tasksSubmitted: 0 };

    const filter: Record<string, unknown> = {
      role: roleMaba._id,
      deletedAt: null,
    };
    const hasReadAll =
      currentUser?.permissions?.includes('pkkmb.group.read_all') ||
      currentUser?.permissions?.includes('manage:all');
    let userGroupId: string | null | import('mongoose').Types.ObjectId = null;

    if (!hasReadAll) {
      const fullUser = await this.userModel
        .findById(currentUser.userId)
        .select('pkkmbGroup')
        .lean()
        .exec();
      const ownedGroup = await this.groupModel
        .findOne({ pendampingId: currentUser.userId })
        .lean()
        .exec();

      if (ownedGroup) {
        userGroupId = ownedGroup._id;
        filter.pkkmbGroup = userGroupId;
      } else if (fullUser && fullUser.pkkmbGroup) {
        userGroupId = fullUser.pkkmbGroup;
        filter.pkkmbGroup = userGroupId;
      } else {
        // If they have no group and no read_all permission, they shouldn't see any maba
        return { totalMaba: 0, attendanceToday: 0, tasksSubmitted: 0 };
      }
    }

    const totalMaba = await this.userModel.countDocuments(filter);

    // Get today's active session
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activeSession = await this.sessionModel
      .findOne({
        date: { $gte: today },
        deletedAt: null,
      })
      .sort({ date: 1 });

    let attendanceToday = 0;
    if (activeSession) {
      // Find logs for this session where maba matches the filter
      const mabaList = await this.userModel
        .find(filter)
        .select('_id')
        .lean()
        .exec();
      const mabaIds = mabaList.map((m) => m._id);

      attendanceToday = await this.logModel.countDocuments({
        sessionId: activeSession._id,
        userId: { $in: mabaIds },
        status: { $in: ['hadir', 'izin', 'sakit'] },
      });
    }

    // Tasks submitted
    const mabaList = await this.userModel
      .find(filter)
      .select('_id')
      .lean()
      .exec();
    const mabaIds = mabaList.map((m) => m._id);
    const tasksSubmitted = await this.submissionModel.countDocuments({
      mabaId: { $in: mabaIds },
      deletedAt: null,
    });

    return {
      totalMaba,
      attendanceToday,
      tasksSubmitted,
    };
  }

  async setKetuaGugus(
    currentUser: {
      userId: unknown;
      permissions?: string[];
      role?: { slug?: string };
    },
    mabaId: string,
  ) {
    const permissions = currentUser?.permissions || [];
    const hasManageAll = permissions.includes('manage:all');
    const fullUser = await this.userModel
      .findById(currentUser.userId)
      .select('pkkmbGroup')
      .lean()
      .exec();
    const pkkmbGroup = fullUser?.pkkmbGroup;

    if (!hasManageAll && !pkkmbGroup) {
      throw new ForbiddenException(
        'Anda tidak memiliki izin untuk mengelola Ketua Gugus.',
      );
    }

    const targetMaba = await this.userModel.findById(mabaId);
    if (!targetMaba) {
      throw new NotFoundException('Data Maba tidak ditemukan.');
    }

    const targetGroup = targetMaba.pkkmbGroup?.toString();

    // RBAC: Pendamping only manages their own group
    if (!hasManageAll && targetGroup !== pkkmbGroup?.toString()) {
      throw new ForbiddenException(
        'Anda tidak dapat menetapkan Ketua Gugus untuk Maba dari gugus lain.',
      );
    }

    if (!targetGroup) {
      throw new BadRequestException('Maba belum dimasukkan ke gugus mana pun.');
    }

    const group = await this.groupModel.findById(targetGroup);
    if (!group) {
      throw new NotFoundException('Gugus tidak ditemukan.');
    }

    group.ketuaGugusId = targetMaba._id;
    await group.save();

    return {
      message: 'Berhasil menetapkan Ketua Gugus',
      groupId: group._id,
      ketuaGugusId: targetMaba._id,
      ketuaName: targetMaba.name,
    };
  }

  async unsetKetuaGugus(
    currentUser: {
      userId: unknown;
      permissions?: string[];
      role?: { slug?: string };
    },
    mabaId: string,
  ) {
    const permissions = currentUser?.permissions || [];
    const hasManageAll = permissions.includes('manage:all');
    const fullUser = await this.userModel
      .findById(currentUser.userId)
      .select('pkkmbGroup')
      .lean()
      .exec();
    const pkkmbGroup = fullUser?.pkkmbGroup;

    if (!hasManageAll && !pkkmbGroup) {
      throw new ForbiddenException(
        'Anda tidak memiliki izin untuk mengelola Ketua Gugus.',
      );
    }

    const targetMaba = await this.userModel.findById(mabaId);
    if (!targetMaba) {
      throw new NotFoundException('Data Maba tidak ditemukan.');
    }

    const targetGroup = targetMaba.pkkmbGroup?.toString();

    if (!hasManageAll && targetGroup !== pkkmbGroup?.toString()) {
      throw new ForbiddenException(
        'Anda tidak dapat membatalkan Ketua Gugus untuk Maba dari gugus lain.',
      );
    }

    if (!targetGroup) {
      throw new BadRequestException('Maba belum dimasukkan ke gugus mana pun.');
    }

    const group = await this.groupModel.findById(targetGroup);
    if (!group) {
      throw new NotFoundException('Gugus tidak ditemukan.');
    }

    if (group.ketuaGugusId?.toString() !== targetMaba._id.toString()) {
      throw new BadRequestException('Maba ini bukan Ketua Gugus.');
    }

    group.ketuaGugusId = undefined;
    await group.save();

    return {
      message: 'Berhasil membatalkan Ketua Gugus',
      groupId: group._id,
    };
  }

  async getAllUsers(paginationDto: PaginationDto) {
    const filter = { deletedAt: null };
    // Search filter
    if (paginationDto.search) {
      const searchRegex = new RegExp(paginationDto.search, 'i');
      filter['$or'] = [
        { name: searchRegex },
        { nim: searchRegex },
        { email: searchRegex },
      ];
    }

    const query = this.userModel
      .find(filter)
      .populate('role', 'name slug')
      .populate('pkkmbGroup', 'name')
      .populate('department', 'name');

    applyPagination(query, paginationDto);

    const data = await query.exec();
    const total = await this.userModel.countDocuments(filter);

    const sanitizedData = data.map((doc) => {
      const obj = doc.toObject();
      (obj as unknown as { avatar?: string | null }).avatar = sanitizeAvatar(
        (obj as unknown as { avatar?: string | null }).avatar,
      );
      return obj;
    });

    return buildPaginationResponse(sanitizedData, total, paginationDto);
  }

  async createUser(dto: AdminCreateUserDto) {
    const existing = await this.userModel.findOne({ email: dto.email });
    if (existing) {
      throw new BadRequestException('Email sudah terdaftar');
    }

    let passwordHash: string | undefined = undefined;
    if (dto.password) {
      passwordHash = await bcrypt.hash(dto.password, 10);
    }

    const newUser = new this.userModel({
      ...dto,
      password: passwordHash,
      pkkmbGroup: dto.pkkmbGroup
        ? new Types.ObjectId(dto.pkkmbGroup)
        : undefined,
      role: new Types.ObjectId(dto.role),
    });

    return await newUser.save();
  }

  async updateUser(id: string, dto: AdminUpdateUserDto) {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    if (dto.email && dto.email !== user.email) {
      const existing = await this.userModel.findOne({ email: dto.email });
      if (existing) {
        throw new BadRequestException('Email sudah terdaftar');
      }
      user.email = dto.email;
    }

    if (dto.password) {
      user.password = await bcrypt.hash(dto.password, 10);
    }

    if (dto.name) user.name = dto.name;
    if (dto.nim) user.nim = dto.nim;
    if (dto.division !== undefined) user.division = dto.division;

    if (dto.role) user.role = new Types.ObjectId(dto.role);
    if (dto.pkkmbGroup) user.pkkmbGroup = new Types.ObjectId(dto.pkkmbGroup);

    return await user.save();
  }

  async deleteUser(id: string) {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }
    user.deletedAt = new Date();
    return await user.save();
  }

  async getUserByNim(nim: string) {
    return this.userModel.findOne({ nim }).populate('pkkmbGroup').exec();
  }
}
