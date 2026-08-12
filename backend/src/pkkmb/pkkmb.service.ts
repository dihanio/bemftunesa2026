import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  HttpException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, Query, FilterQuery } from 'mongoose';
import * as bcrypt from 'bcrypt';
import Redis from 'ioredis';

import { EventEmitter2 } from '@nestjs/event-emitter';
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
  PkkmbQuiz,
  PkkmbQuizDocument,
  PkkmbQuizAttempt,
  PkkmbQuizAttemptDocument,
  QuizQuestion,
} from '../schemas/pkkmb-quiz.schema';
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
  PkkmbQrPoint,
  PkkmbQrPointDocument,
} from '../schemas/pkkmb-qr-point.schema';
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
  HealthProfile,
  HealthProfileDocument,
} from '../schemas/health-profile.schema';

import {
  PkkmbPublishConfig,
  PkkmbPublishConfigDocument,
} from '../schemas/pkkmb-publish-config.schema';

import {
  MabaSubmitTaskDto,
  CreateAttendanceSessionDto,
  CreateQrPointDto,
  ClaimQrPointDto,
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
  SubmitIzinDto,
  UpdateAttendanceRecordDto,
  AdminCreateUserDto,
  AdminUpdateUserDto,
  CreateQuizDto,
  SubmitQuizDto,
  SaveQuizAnswersDto,
  ReportViolationDto,
  ReportQuizEventsDto,
} from './dto/pkkmb.dto';
import { parseWibDate } from './wib-time';
import { resolveSubmissionStatus } from './task-status';
import { gradeQuizAnswers } from './quiz-scoring';
import {
  isQuizViolationType,
  isInformationalType,
  riskLevelFromCount,
  shouldDedupeViolation,
  countViolationsInWindow,
  QUIZ_VIOLATION_RATE_LIMIT,
  QUIZ_VIOLATIONS_MAX_STORED,
  QUIZ_EVENTS_MAX_PER_REQUEST,
  QuizAntiCheatViolation,
  QuizViolationType,
} from './quiz-anticheat';
import {
  parseQuizExcel,
  buildTemplateBuffer,
  buildExportBuffer,
  toQuizQuestions,
  appendQuestions,
  buildExportFilename,
  QUIZ_IMPORT_MAX_FILE_SIZE,
  XLSX_MIME,
  QuizQuestionShape,
} from './quiz-import-export';
import {
  pickBestGugus,
  buildCountsByGugus,
  simulateGugusAssignment,
  CountAggRow,
  GenderCountAggRow,
} from './gugus-assignment';

// Item daftar quiz utk management (tanpa soal; + hitungan utk UI hapus).
// di-export agar tipe bisa dinamai (TS4053 saat dipakai controller).
export interface QuizListItem {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  type: string;
  status: string;
  targetType: string;
  targetIds: (Types.ObjectId | string)[];
  startTime?: Date;
  endTime?: Date;
  durationMinutes: number;
  maxAttempts: number;
  passingScore: number;
  createdAt?: Date;
  questionCount: number;
  attemptCount: number;
}

// Status assignment per user (diturunkan dari attempt/submission, §18.4).
// `bestAttempt.attemptId` dipakai frontend utk membangun route result
// (/dashboard/quiz/:quizId/result/:attemptId) dari tombol "Lihat Hasil".
export interface AssignmentStudentStatus {
  status: string;
  activeAttemptId: string | null;
  bestAttempt: {
    status: string;
    score?: number;
    percentage?: number;
    submittedAt?: Date;
    attemptNumber?: number;
    attemptId?: string;
  } | null;
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
    @InjectModel(PkkmbQuiz.name)
    private quizModel: Model<PkkmbQuizDocument>,
    @InjectModel(PkkmbQuizAttempt.name)
    private quizAttemptModel: Model<PkkmbQuizAttemptDocument>,
    @InjectModel(PkkmbSchedule.name)
    private scheduleModel: Model<PkkmbScheduleDocument>,
    @InjectModel(PkkmbAnnouncement.name)
    private announcementModel: Model<PkkmbAnnouncementDocument>,
    @InjectModel(PkkmbPointLog.name)
    private pointLogModel: Model<PkkmbPointLogDocument>,
    @InjectModel(PkkmbQrPoint.name)
    private qrPointModel: Model<PkkmbQrPointDocument>,
    @InjectModel(PkkmbGallery.name)
    private galleryModel: Model<PkkmbGalleryDocument>,
    @InjectModel(Rumpun.name)
    private rumpunModel: Model<RumpunDocument>,
    @InjectModel(StudyProgram.name)
    private studyProgramModel: Model<StudyProgramDocument>,
    @InjectModel(HealthProfile.name)
    private healthProfileModel: Model<HealthProfileDocument>,
    @InjectModel(PkkmbPublishConfig.name)
    private publishConfigModel: Model<PkkmbPublishConfigDocument>,

    @Inject('REDIS_CLIENT') private redis: Redis,
  ) {}

  // Audit log via event emitter (property injection — constructor tidak berubah,
  // jadi spec yang meng-instantiate PkkmbService tidak perlu diupdate).
  @Inject(EventEmitter2)
  private readonly eventEmitter: EventEmitter2;

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
    // Onboarding tidak final di sini — persetujuan & tanda tangan (consent)
    // yang menetapkan isOnboarded & pembagian gugus (lihat HealthService.completeConsent).
    user.verificationStatus = 'PENDING_VERIFICATION';

    await user.save();

    return user.populate('pkkmbGroup', '_id nomor name');
  }

  // Assign 1 maba ke gugus dengan skor keseimbangan (gugus-assignment.ts):
  // 1) persebaran prodi, 2) genderGapN global per gugus (rata cowo/cewe
  // SETIAP gugus), 3) fine-tuning prodi+gender, 4) total anggota.
  async assignMabaToGroup(user: UserDocument) {
    const activeGugus = await this.groupModel
      .find({ status: 'ACTIVE', deletedAt: null })
      .select('_id nomor')
      .sort({ nomor: 1 })
      .lean()
      .exec();
    if (activeGugus.length === 0) return false;

    const groupIds = activeGugus.map((g) => g._id);
    const prodi = user.studyProgram || null;
    const gender = user.gender === 'P' ? 'P' : 'L';

    // Hitung per gugus: total anggota, anggota sesama prodi, anggota sesama
    // prodi + sesama gender, dan jumlah cowo/cewe (untuk genderGapN global).
    const [totalAgg, prodiAgg, genderProdiAgg, genderAgg] = await Promise.all([
      this.userModel.aggregate([
        { $match: { pkkmbGroup: { $in: groupIds }, deletedAt: null } },
        { $group: { _id: '$pkkmbGroup', n: { $sum: 1 } } },
      ]),
      prodi
        ? this.userModel.aggregate([
            {
              $match: {
                pkkmbGroup: { $in: groupIds },
                deletedAt: null,
                studyProgram: prodi,
              },
            },
            { $group: { _id: '$pkkmbGroup', n: { $sum: 1 } } },
          ])
        : Promise.resolve([]),
      prodi
        ? this.userModel.aggregate([
            {
              $match: {
                pkkmbGroup: { $in: groupIds },
                deletedAt: null,
                studyProgram: prodi,
                gender,
              },
            },
            { $group: { _id: '$pkkmbGroup', n: { $sum: 1 } } },
          ])
        : Promise.resolve([]),
      this.userModel.aggregate([
        { $match: { pkkmbGroup: { $in: groupIds }, deletedAt: null } },
        {
          $group: {
            _id: { g: '$pkkmbGroup', gender: { $ifNull: ['$gender', 'L'] } },
            n: { $sum: 1 },
          },
        },
      ]),
    ]);

    // Skor: prodiN > genderGapN (rata cowo/cewe SETIAP gugus) >
    // sameGenderProdiN > totalN. Lihat gugus-assignment.ts.
    const countsByGugus = buildCountsByGugus({
      totalAgg: totalAgg as CountAggRow[],
      prodiAgg: prodiAgg as CountAggRow[],
      genderProdiAgg: genderProdiAgg as CountAggRow[],
      genderAgg: genderAgg as GenderCountAggRow[],
      gender,
    });
    const candidates = activeGugus.map((g) => ({
      id: g._id.toString(),
      nomor: g.nomor,
      _id: g._id,
    }));

    const best = pickBestGugus(candidates, countsByGugus);
    if (!best) return false;

    user.pkkmbGroup = best._id;
    user.assignmentStatus = 'ASSIGNED';
    user.assignmentAssignedAt = new Date();
    await user.save();
    return true;
  }

  // Rebalance seluruh maba yang sudah ter-assign ke gugus dengan algoritma
  // yang SAMA dengan onboarding (pickBestGugus: prodi → genderGap → total),
  // disimulasikan di memori — hasilnya konsisten: setiap gugus berisi semua
  // prodi dengan komposisi cowo/cewe yang rata (selisih <= 1).
  // Tidak membuat/menghapus gugus.
  async rebalanceGugus() {
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
      pkkmbGroup: { $exists: true, $ne: null },
    };
    if (mabaRole) query.role = mabaRole._id;

    const maba = await this.userModel
      .find(query)
      .select('_id nim studyProgram gender')
      .sort({ nim: 1 })
      .lean()
      .exec();

    const assignments = simulateGugusAssignment(
      activeGugus.map((g) => ({ id: g._id.toString(), value: g._id })),
      maba.map((m) => ({
        id: m._id.toString(),
        prodi: m.studyProgram || 'Umum',
        gender: m.gender === 'P' ? 'P' : 'L',
      })),
    );

    await Promise.all(
      Array.from(assignments.entries()).map(([uid, gid]) =>
        this.userModel.updateOne(
          { _id: uid },
          { $set: { pkkmbGroup: gid, assignmentStatus: 'ASSIGNED' } },
        ),
      ),
    );

    return {
      rebalancedCount: assignments.size,
      totalGugus: activeGugus.length,
    };
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

  async listPendamping() {
    return this.userModel
      .find({
        deletedAt: null,
        division: { $regex: /pendamping/i },
      })
      .select('name email division position phone avatar')
      .lean()
      .exec();
  }

  async assignPendamping(gugusId: string, pendampingId: string) {
    const group = await this.groupModel
      .findById(gugusId)
      .where({ deletedAt: null })
      .exec();
    if (!group) throw new NotFoundException('Gugus tidak ditemukan.');

    const pendamping = await this.userModel
      .findById(pendampingId)
      .lean()
      .exec();
    if (!pendamping) throw new NotFoundException('Pendamping tidak ditemukan.');

    // Satu pendamping hanya untuk satu gugus.
    const existing = await this.groupModel
      .findOne({
        pendampingId: new Types.ObjectId(pendampingId),
        deletedAt: null,
        _id: { $ne: group._id },
      })
      .select('_id nomor name')
      .lean()
      .exec();
    if (existing) {
      throw new BadRequestException(
        `${pendamping.name} sudah menjadi pendamping Gugus ${existing.nomor}.`,
      );
    }

    group.pendampingId = new Types.ObjectId(pendampingId);
    group.pendampingName = pendamping.name;
    group.pendampingEmail = pendamping.email;
    // Salin nomor WhatsApp (field pendampingWhatsApp user, fallback dari phone)
    // agar kartu kontak di dashboard MABA selalu punya link WA.
    const wa =
      pendamping.pendampingWhatsApp ||
      (pendamping.phone
        ? `https://wa.me/${String(pendamping.phone).replace(/[^0-9]/g, '')}`
        : undefined);
    group.pendampingWhatsApp = wa;
    await group.save();
    await this.invalidateCachePatterns('pkkmb:gugus:*');
    return group;
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
        .select('_id nim studyProgram gender')
        .sort({ nim: 1 })
        .lean()
        .exec();

      if (unassignedMaba.length === 0) {
        return {
          message: 'Semua mahasiswa baru sudah terdistribusi ke Gugus.',
          distributedCount: 0,
        };
      }

      // Algoritma SAMA dengan onboarding & rebalance (gugus-assignment.ts):
      // prodi → genderGap → fine-tuning → total, deterministik (urut NIM).
      const assignments = simulateGugusAssignment(
        activeGugus.map((g) => ({ id: g._id.toString(), value: g._id })),
        unassignedMaba.map((m) => ({
          id: m._id.toString(),
          prodi: m.studyProgram || 'Umum',
          gender: m.gender === 'P' ? 'P' : 'L',
        })),
      );

      await Promise.all(
        Array.from(assignments.entries()).map(([uid, gid]) =>
          this.userModel.updateOne(
            { _id: uid },
            {
              $set: {
                pkkmbGroup: gid,
                assignmentStatus: 'ASSIGNED',
                assignmentAssignedAt: new Date(),
              },
            },
          ),
        ),
      );

      return {
        message: `Berhasil mendistribusikan ${assignments.size} Mahasiswa Baru secara seimbang ke ${activeGugus.length} Gugus PKKMB FT UNESA!`,
        distributedCount: assignments.size,
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

  // ─── ABSENSI RBAC (KSK = divisi Kesekretariatan dalam role panitia) ───────

  // Authority untuk aksi WRITE modul absensi. Identitas (userId) berasal dari
  // JWT; role & division diambil dari DATABASE — bukan dari JWT/body — sehingga
  // manipulasi role/division pada request tidak berpengaruh.
  //
  // KSK adalah DIVISI dalam role `panitia` (Kesekretariatan), bukan role
  // terpisah. Karena semua divisi berbagi role panitia, permission role-level
  // tidak bisa membedakan antar-divisi → otorisasi management menggunakan
  // division check di service (role panitia + division KSK, case-insensitive).
  //
  // Yang boleh MENGELOLA absensi (create/update/verify):
  //   - Super Admin (manage:all)
  //   - Sekretaris Pelaksana (permission existing attendance.session_create)
  //   - Panitia divisi KSK (Kesekretariatan)
  // Panitia divisi lain: READ ONLY.
  //
  // DELETE record: privilege ADMIN saja (manage:all) — bukan KSK/panitia.
  private async assertAttendanceManager(
    userId: string,
    opts?: { deleteOp?: boolean },
  ): Promise<{ roleSlug?: string; division?: string; isAdmin: boolean }> {
    const user = await this.userModel
      .findById(userId)
      .populate<{
        role: RoleDocument & { permissions?: { name: string }[] };
      }>({ path: 'role', populate: { path: 'permissions' } })
      .lean()
      .exec();
    if (!user) {
      throw new ForbiddenException('User tidak ditemukan.');
    }

    const role = user.role as
      | (RoleDocument & { permissions?: { name: string }[] })
      | undefined;
    const roleSlug = role?.slug;
    const permissions =
      (
        role as unknown as { permissions?: { name: string }[] }
      )?.permissions?.map((p) => p.name) || [];
    const isAdmin = permissions.includes('manage:all');

    // DELETE = privilege admin. KSK/panitia/sekretaris tidak boleh hapus.
    if (opts?.deleteOp) {
      if (isAdmin) return { roleSlug, division: user.division, isAdmin: true };
      throw new ForbiddenException(
        'Hanya Admin yang dapat menghapus record presensi.',
      );
    }

    const isSekretaris = roleSlug === 'sekretaris';
    const isKsk =
      roleSlug === 'panitia' &&
      (user.division || '').toLowerCase().includes('ksk');

    if (!isAdmin && !isSekretaris && !isKsk) {
      throw new ForbiddenException(
        'Hanya Sie KSK (Kesekretariatan) yang dapat mengelola data absensi.',
      );
    }

    return { roleSlug, division: user.division, isAdmin };
  }

  // Catat aksi management absensi ke audit log (event 'audit.log' yang sudah
  // didengarkan AuditService). Non-fatal bila event emitter tidak tersedia.
  private auditAttendance(
    actor: { userId: string; roleSlug?: string },
    action: string,
    resourceType: string,
    resourceId: Types.ObjectId | string,
    resourceName?: string,
    details?: Record<string, unknown>,
  ) {
    try {
      this.eventEmitter?.emit('audit.log', {
        actor: actor.userId,
        actorRole: actor.roleSlug || 'unknown',
        action,
        resourceType,
        resourceId,
        resourceName,
        details,
      });
    } catch {
      /* non-fatal */
    }
  }

  // ─── ATTENDANCE SESSIONS ──────────────────────────────────────────────────

  async createAttendanceSession(
    userId: string,
    dto: CreateAttendanceSessionDto,
  ) {
    const actor = await this.assertAttendanceManager(userId);

    const qrCode = `PKKMB2026_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const endTime = parseWibDate(dto.endTime);
    // QR expires 1 hour after session ends
    const qrExpiry = new Date(endTime.getTime() + 60 * 60 * 1000);

    const result = await this.sessionModel.create({
      title: dto.title,
      date: new Date(dto.date),
      startTime: parseWibDate(dto.startTime),
      endTime,
      location: dto.location,
      isOnline: dto.isOnline ?? false,
      targetParticipantType: dto.targetParticipantType || 'ALL',
      targetDivision: dto.targetDivision,
      qrCode,
      qrExpiry,
      status: dto.status || 'PUBLISHED',
      createdBy: new Types.ObjectId(userId),
    });

    await this.invalidateCachePatterns('pkkmb:sessions:*');
    this.auditAttendance(
      { userId, roleSlug: actor.roleSlug },
      'CREATE',
      'attendance_session',
      result._id,
      result.title,
      { status: result.status },
    );
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
    actorId: string,
  ) {
    // actorId wajib (dari JWT). Tanpa identitas -> tolak semua aksi write.
    const actor = await this.assertAttendanceManager(actorId);

    const session = await this.sessionModel.findById(sessionId);
    if (!session) {
      throw new NotFoundException('Sesi presensi tidak ditemukan.');
    }
    session.status = status;
    const result = await session.save();
    await this.invalidateCachePatterns('pkkmb:sessions:*');
    this.auditAttendance(
      { userId: actorId, roleSlug: actor.roleSlug },
      'UPDATE',
      'attendance_session',
      result._id,
      result.title,
      { status },
    );
    return result;
  }

  // ─── CHECK-IN ─────────────────────────────────────────────────────────────

  async checkIn(
    dto: CheckInDto,
    operatorId?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Per-user rate limit (5/min) — maba normal check-in sekali per sesi.
    // Tambahan di atas throttle per-IP 10/min dari @Throttle.
    if (operatorId) {
      const key = `pkkmb:checkin:limit:${operatorId}`;
      try {
        const count = await this.redis.incr(key);
        if (count === 1) await this.redis.expire(key, 60);
        if (count > 5) {
          throw new HttpException(
            'Terlalu banyak percobaan presensi. Coba lagi beberapa saat.',
            429,
          );
        }
      } catch (err) {
        if (err instanceof HttpException) throw err;
        /* Redis error -> biarkan, jangan blokir presensi */
      }
    }

    const session = await this.sessionModel.findById(dto.sessionId).exec();
    if (!session) {
      throw new NotFoundException('Sesi presensi tidak ditemukan.');
    }

    if (session.status !== 'PUBLISHED') {
      throw new BadRequestException('Sesi presensi ini tidak aktif.');
    }

    // Validasi periode presensi (server time, bukan dari client).
    const now = new Date();
    if (now < session.startTime) {
      throw new BadRequestException('Presensi belum dibuka.');
    }
    if (now > session.endTime) {
      throw new BadRequestException('Presensi telah ditutup.');
    }

    // Presensi mandiri kini berbasis kamera (selfie) — GPS dihapus.
    if (dto.method === 'SELF_CHECKIN' && !dto.photoUrl) {
      throw new BadRequestException(
        'Selfie wajib diambil untuk presensi mandiri.',
      );
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

    const isSelfCheckin = dto.method === 'SELF_CHECKIN';
    // Self-check-in: dalam periode valid, status selalu Hadir (after-end ditolak
    // lebih awal oleh validasi periode). Status tidak pernah Telat di sini.
    let finalStatus: 'Hadir' | 'Telat' | 'Izin' | 'Sakit' | 'Tidak Hadir' =
      'Hadir';
    if (!isSelfCheckin && dto.status) {
      finalStatus = dto.status;
    }

    const method = dto.method || 'QR_CODE';

    // Check existing → tolak duplicate. Jangan overwrite record lama.
    const existingLog = await this.logModel
      .findOne({
        session: new Types.ObjectId(dto.sessionId),
        participant: participantUser._id,
      })
      .select('status')
      .lean()
      .exec();
    if (existingLog) {
      throw new BadRequestException('Anda sudah melakukan presensi.');
    }

    const baseRecord = {
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
      photoUrl: dto.photoUrl,
    };

    let record: PkkmbAttendanceRecordDocument | null = null;
    try {
      record = await this.logModel.create(baseRecord);
    } catch (err: unknown) {
      // E11000 duplicate key: race condition dua request paralel utk
      // (session, participant) sama. Unique index adalah final protection.
      const code = (err as { code?: number })?.code;
      if (code !== 11000) throw err;
      throw new BadRequestException('Anda sudah melakukan presensi.');
    }

    // Point -5 hanya untuk record BARU yang telat (manual operator),
    // agar tidak double-deduct.
    if (finalStatus === 'Telat') {
      try {
        await this.pointLogModel.create({
          userId: participantUser._id,
          points: -5,
          source: 'Kehadiran',
          reason: 'Terlambat check-in presensi',
        });
      } catch {
        /* non-fatal */
      }
    }

    return record;
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

  async getMyPoints(userId: string) {
    const user = await this.userModel.findById(userId).lean().exec();
    const filter: FilterQuery<unknown> = { deletedAt: null };
    if (user?.pkkmbGroup) {
      filter.$or = [
        { userId: new Types.ObjectId(userId) },
        { groupId: new Types.ObjectId(user.pkkmbGroup) },
      ];
    } else {
      filter.userId = new Types.ObjectId(userId);
    }
    const logs = await this.pointLogModel
      .find(filter)
      .sort({ createdAt: -1 })
      .select('points source reason createdAt')
      .lean()
      .exec();
    return {
      totalPoints: await this.getMyPointsSummary(userId).then(
        (s) => s.totalPoints,
      ),
      logs,
    };
  }

  // ─── QR POIN KEAKTIFAN (maba offline / QR cetak) ─────────────────────────

  // Buat sesi QR poin (panitia/KSK/admin). QR umum: semua maba yang scan
  // dapat poin, maksimal 1× per maba per sesi.
  async createQrPoint(userId: string, dto: CreateQrPointDto) {
    // Otorisasi sama dengan pengelola presensi (KSK/sekretaris/admin).
    await this.assertAttendanceManager(userId);

    const startTime = dto.startTime ? parseWibDate(dto.startTime) : new Date();
    const endTime = dto.endTime
      ? parseWibDate(dto.endTime)
      : new Date(startTime.getTime() + 24 * 60 * 60 * 1000);
    if (endTime <= startTime) {
      throw new BadRequestException(
        'Waktu selesai harus setelah waktu mulai.',
      );
    }

    const code = `PKKMBQ_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const result = await this.qrPointModel.create({
      title: dto.title,
      points: dto.points,
      code,
      status: 'ACTIVE',
      startTime,
      endTime,
      createdBy: new Types.ObjectId(userId),
    });
    return result;
  }

  async listQrPoints() {
    return this.qrPointModel
      .find({ deletedAt: null })
      .select('title points code status startTime endTime createdAt')
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  async closeQrPoint(qrPointId: string, actorId: string) {
    await this.assertAttendanceManager(actorId);
    const qp = await this.qrPointModel.findById(qrPointId).exec();
    if (!qp || qp.deletedAt) {
      throw new NotFoundException('Sesi QR poin tidak ditemukan.');
    }
    qp.status = 'CLOSED';
    const result = await qp.save();
    await this.invalidateCachePatterns('pkkmb:points:*');
    return result;
  }

  // Klaim QR oleh maba. Validasi: status ACTIVE, periode berjalan, belum
  // pernah klaim (unique index (userId, qrPointId) di PointLog).
  async claimQrPoint(userId: string, dto: ClaimQrPointDto) {
    const code = dto.code.trim().toUpperCase();
    const qp = await this.qrPointModel
      .findOne({ code, deletedAt: null })
      .exec();
    if (!qp) {
      throw new BadRequestException(
        'Kode QR tidak valid. Periksa kembali kode pada kartu QR.',
      );
    }
    if (qp.status !== 'ACTIVE') {
      throw new BadRequestException('Sesi QR poin ini sudah ditutup.');
    }
    const now = new Date();
    if (now < qp.startTime) {
      throw new BadRequestException('Sesi QR poin belum dibuka.');
    }
    if (now > qp.endTime) {
      throw new BadRequestException(
        'Sesi QR poin telah kedaluwarsa. Minta QR baru ke panitia.',
      );
    }

    // Cek manual (query cepat) + unique index sbg final protection.
    const already = await this.pointLogModel
      .findOne({
        userId: new Types.ObjectId(userId),
        qrPointId: qp._id,
        deletedAt: null,
      })
      .select('_id')
      .lean()
      .exec();
    if (already) {
      throw new BadRequestException(
        'Kamu sudah mengklaim poin dari QR ini.',
      );
    }

    const user = await this.userModel.findById(userId).lean().exec();
    const groupId = user?.pkkmbGroup
      ? new Types.ObjectId(user.pkkmbGroup)
      : undefined;

    try {
      await this.pointLogModel.create({
        userId: new Types.ObjectId(userId),
        groupId,
        points: qp.points,
        source: 'Partisipasi',
        reason: `${qp.title} (QR: ${qp.code})`,
        createdBy: new Types.ObjectId(userId),
        qrPointId: qp._id,
      });
    } catch (err: unknown) {
      // E11000 duplicate key: race condition dua klaim paralel.
      const codeErr = (err as { code?: number })?.code;
      if (codeErr !== 11000) throw err;
      throw new BadRequestException(
        'Kamu sudah mengklaim poin dari QR ini.',
      );
    }

    await this.invalidateCachePatterns('pkkmb:points:*');

    return {
      success: true,
      points: qp.points,
      title: qp.title,
      totalPoints: await this.getMyPointsSummary(userId).then(
        (s) => s.totalPoints,
      ),
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

    // Single aggregate: records + status stats + total count in one DB round-trip
    const [facetResult] = (await this.logModel.aggregate<{
      records: Record<string, unknown>[];
      statusCounts: { _id: string; count: number }[];
      totalCount: { total: number }[];
    }>([
      { $match: filter },
      {
        $facet: {
          records: [
            { $sort: { checkInTime: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
              $lookup: {
                from: 'users',
                localField: 'participant',
                foreignField: '_id',
                as: 'participant',
              },
            },
            {
              $unwind: {
                path: '$participant',
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: 'pkkmb_attendance_sessions',
                localField: 'session',
                foreignField: '_id',
                as: 'session',
              },
            },
            { $unwind: { path: '$session', preserveNullAndEmptyArrays: true } },
            {
              $lookup: {
                from: 'users',
                localField: 'operator',
                foreignField: '_id',
                as: 'operator',
              },
            },
            {
              $unwind: { path: '$operator', preserveNullAndEmptyArrays: true },
            },
            {
              $project: {
                session: 1,
                participant: 1,
                participantType: 1,
                checkInTime: 1,
                status: 1,
                attendanceMethod: 1,
                operator: 1,
                division: 1,
                notes: 1,
                lat: 1,
                lng: 1,
              },
            },
          ],
          statusCounts: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
          totalCount: [{ $count: 'total' }],
        },
      },
    ])) as unknown as {
      records: Record<string, unknown>[];
      statusCounts: { _id: string; count: number }[];
      totalCount: { total: number }[];
    }[];

    const records = (facetResult.records as unknown[]) || [];
    const statsMap = new Map<string, number>();
    (facetResult.statusCounts || []).forEach(
      (s: { _id: string; count: number }) => statsMap.set(s._id, s.count),
    );
    const totalRecords =
      (facetResult.totalCount && facetResult.totalCount[0]?.total) || 0;

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

  async deleteAttendanceRecord(id: string, actorId: string) {
    // actorId wajib (dari JWT). Tanpa identitas -> tolak semua aksi write.
    // DELETE = privilege admin (bukan KSK/panitia).
    const actor = await this.assertAttendanceManager(actorId, {
      deleteOp: true,
    });

    const record = await this.logModel.findByIdAndDelete(id).exec();
    if (!record)
      throw new NotFoundException('Record presensi tidak ditemukan.');
    this.auditAttendance(
      { userId: actorId, roleSlug: actor.roleSlug },
      'DELETE',
      'attendance_record',
      record._id,
      undefined,
      { status: record.status },
    );
    return record;
  }

  // Ubah status record presensi (koreksi salah input). Privilege sama dgn
  // delete: manager (KSK/sekretaris/admin), bukan panitia read-only.
  async updateAttendanceRecord(
    id: string,
    actorId: string,
    dto: UpdateAttendanceRecordDto,
  ) {
    const actor = await this.assertAttendanceManager(actorId, {
      deleteOp: false,
    });

    const record = await this.logModel.findByIdAndUpdate(
      id,
      { $set: { status: dto.status } },
      { new: true },
    );
    if (!record)
      throw new NotFoundException('Record presensi tidak ditemukan.');
    this.auditAttendance(
      { userId: actorId, roleSlug: actor.roleSlug },
      'UPDATE',
      'attendance_record',
      record._id,
      undefined,
      { status: record.status },
    );
    return record;
  }

  async getMyAttendanceHistory(userId: string) {
    return this.logModel
      .find({ participant: new Types.ObjectId(userId), deletedAt: null })
      .select(
        'session participant participantType checkInTime status attendanceMethod notes lat lng photoUrl proofUrl reason izinStatus',
      )
      .sort({ checkInTime: -1 })
      .populate('session', 'title date startTime endTime location')
      .lean()
      .exec();
  }

  // ─── IZIN / SAKIT ──────────────────────────────────────────────────────────

  async submitIzin(userId: string, dto: SubmitIzinDto) {
    const session = await this.sessionModel.findById(dto.sessionId).exec();
    if (!session || session.deletedAt)
      throw new BadRequestException('Sesi presensi tidak ditemukan.');

    await this.logModel.updateOne(
      { session: session._id, participant: new Types.ObjectId(userId) },
      {
        $set: {
          session: session._id,
          participant: new Types.ObjectId(userId),
          participantType: 'MABA',
          checkInTime: new Date(),
          status: dto.izinType,
          attendanceMethod: 'MANUAL_OPERATOR',
          reason: dto.reason,
          proofUrl: dto.proofUrl,
          izinStatus: 'PENDING',
        },
      },
      { upsert: true },
    );
    return { success: true };
  }

  async verifyIzin(
    recordId: string,
    decision: 'APPROVED' | 'REJECTED',
    actorId: string,
  ) {
    // actorId wajib (dari JWT). Tanpa identitas -> tolak semua aksi write.
    const actor = await this.assertAttendanceManager(actorId);

    const record = await this.logModel
      .findById(recordId)
      .where({ izinStatus: 'PENDING' })
      .exec();
    if (!record)
      throw new NotFoundException(
        'Record izin tidak ditemukan atau sudah diverifikasi.',
      );
    record.izinStatus = decision;
    if (decision === 'REJECTED') record.status = 'Tidak Hadir';
    await record.save();
    this.auditAttendance(
      { userId: actorId, roleSlug: actor.roleSlug },
      decision === 'APPROVED' ? 'APPROVE' : 'REJECT',
      'attendance_record',
      record._id,
      undefined,
      { izinStatus: decision },
    );
    return record;
  }

  async listPendingIzin() {
    return this.logModel
      .find({ izinStatus: 'PENDING', deletedAt: null })
      .populate('participant', 'name nim')
      .populate('session', 'title date startTime endTime location')
      .lean()
      .exec();
  }

  // ─── TASKS & SUBMISSIONS ──────────────────────────────────────────────────

  async getTasks(
    paginationDto: PaginationDto,
    isPanitia?: boolean,
    user?: { userId?: string; role?: { slug?: string } },
  ) {
    const filter: FilterQuery<unknown> = { deletedAt: null };
    if (!isPanitia) {
      filter.$or = [
        { status: 'PUBLISHED' },
        { status: { $exists: false } },
        { status: null },
      ];
      if (user?.userId) {
        const targetFilter = await this.mabaTaskTargetFilter(user.userId);
        filter.$and = [{ $or: filter.$or }, targetFilter];
        delete filter.$or;
      }
    }
    if (paginationDto.search) {
      filter.title = { $regex: paginationDto.search, $options: 'i' };
    }
    const query = this.taskModel
      .find(filter)
      .select(
        '_id title description startTime deadline type status targetType targetIds allowedFormats',
      );
    return applyPagination(query, paginationDto).lean().exec();
  }

  // ─── ASSIGNMENTS (Google Classroom-like: TASK & QUIZ) ────────────────────

  // Mapping status quiz utk assignment: dicek per user dari QuizAttempt.
  // NOT_STARTED (belum ada attempt) / IN_PROGRESS (attempt aktif) /
  // COMPLETED (SUBMITTED|GRADED) / OVERDUE (deadline lewat, belum selesai).
  // Status SELALU diturunkan dari QuizAttempt — tidak ada status kedua yang
  // tidak sinkron (lihat prompt §6).
  //
  // IN_PROGRESS yang melewati timer attempt (startedAt + durationMinutes)
  // dianggap STALE → TIDAK dihitung sebagai attempt aktif (Quiz Core akan
  // menandainya EXPIRED saat resume/start berikutnya, dan tidak memakan slot
  // maxAttempts). Jangan membuat attempt kedua yang tidak sinkron.

  // Konteks targeting quiz utk user (diambil SEKALI, dipakai utk list/detail —
  // menghindari N+1 query per quiz).
  private async quizUserContext(userId: string) {
    const u = await this.userModel
      .findById(userId)
      .select('pkkmbGroup studyProgramId _id')
      .lean()
      .exec();
    let faculty: string | undefined;
    if (u?.studyProgramId) {
      const sp = await this.studyProgramModel
        .findById(u.studyProgramId)
        .select('faculty')
        .lean()
        .exec();
      // Normalisasi ke string: faculty bisa tersimpan sebagai string nama
      // ATAU ObjectId — komparasi targeting selalu memakai string.
      faculty = sp?.faculty ? sp.faculty.toString() : undefined;
    }
    return {
      userId,
      pkkmbGroup: u?.pkkmbGroup ? u.pkkmbGroup.toString() : undefined,
      studyProgramId: u?.studyProgramId
        ? u.studyProgramId.toString()
        : undefined,
      faculty,
    };
  }

  // Cek targeting quiz secara SINKRON memakai konteks user yang sudah diambil
  // (versi batch dari isQuizTargetedTo — bebas query DB). Logika identik.
  private quizTargetedSync(
    quiz: {
      targetType?: string;
      targetIds?: (Types.ObjectId | string)[];
    },
    ctx: {
      userId: string;
      pkkmbGroup?: string;
      studyProgramId?: string;
      faculty?: string;
    },
  ): boolean {
    const tt = (quiz.targetType || 'ALL').toUpperCase();
    const targets = Array.isArray(quiz.targetIds) ? quiz.targetIds : [];
    if (tt === 'ALL' || !quiz.targetType) return true;
    if (tt === 'INDIVIDUAL') {
      return targets.some((id) => id?.toString() === ctx.userId);
    }
    if (tt === 'GROUP') {
      return (
        !!ctx.pkkmbGroup &&
        targets.some((id) => id?.toString() === ctx.pkkmbGroup)
      );
    }
    if (tt === 'STUDY_PROGRAM') {
      return (
        !!ctx.studyProgramId &&
        targets.some((id) => id?.toString() === ctx.studyProgramId)
      );
    }
    if (tt === 'FACULTY') {
      // Normalisasi kedua sisi ke string (target bisa ObjectId/string,
      // ctx.faculty dijamin string dari quizUserContext).
      const faculty = ctx.faculty?.toString();
      return !!faculty && targets.some((f) => f?.toString() === faculty);
    }
    return false;
  }

  // Derivasi status utk BANYAK assignment sekaligus (batch: 1 query attempt,
  // 1 query durasi quiz, 1 query submission, 1 query user — bukan N+1).
  private async deriveAssignmentStatuses(
    assignments: Array<Record<string, unknown>>,
    userId: string,
  ): Promise<Map<string, AssignmentStudentStatus>> {
    const now = new Date();
    const result = new Map<string, AssignmentStudentStatus>();

    const quizAssignments = assignments.filter(
      (a) => a.assignmentType === 'QUIZ' && a.quizId,
    );
    const taskAssignments = assignments.filter(
      (a) => !(a.assignmentType === 'QUIZ' && a.quizId),
    );

    // User maba (utk submission gugus TASK) — sekali utk semua.
    const userDoc = taskAssignments.length
      ? await this.userModel.findById(userId).select('pkkmbGroup').lean().exec()
      : null;

    // Batch attempt quiz milik user utk SEMUA quiz assignment.
    const attemptsByQuiz = new Map<string, Array<Record<string, unknown>>>();
    if (quizAssignments.length) {
      const quizIds = quizAssignments.map((a) => a.quizId as Types.ObjectId);
      const attempts = await this.quizAttemptModel
        .find({
          quizId: { $in: quizIds },
          userId: new Types.ObjectId(userId),
          deletedAt: null,
        })
        .select(
          'quizId status score percentage submittedAt startedAt attemptNumber',
        )
        .sort({ attemptNumber: -1 })
        .lean()
        .exec();
      for (const at of attempts) {
        const key = at.quizId.toString();
        const list = attemptsByQuiz.get(key);
        if (list) list.push(at);
        else attemptsByQuiz.set(key, [at]);
      }
    }

    // Durasi quiz utk deteksi stale IN_PROGRESS (startedAt + durationMinutes).
    const durationMap = new Map<string, number>();
    if (quizAssignments.length) {
      const quizIds = quizAssignments.map((a) => a.quizId as Types.ObjectId);
      const quizzes = await this.quizModel
        .find({ _id: { $in: quizIds }, deletedAt: null })
        .select('_id durationMinutes')
        .lean()
        .exec();
      for (const q of quizzes) {
        durationMap.set(q._id.toString(), q.durationMinutes || 0);
      }
    }

    // Batch submission utk SEMUA task assignment (individu atau gugus user).
    const submissionsByTask = new Map<string, Record<string, unknown>>();
    if (taskAssignments.length) {
      const taskIds = taskAssignments.map((a) => a._id as Types.ObjectId);
      const cond: FilterQuery<unknown>[] = [
        { userId: new Types.ObjectId(userId) },
      ];
      if (userDoc?.pkkmbGroup) cond.push({ groupId: userDoc.pkkmbGroup });
      const subs = await this.submissionModel
        .find({ taskId: { $in: taskIds }, $or: cond, deletedAt: null })
        .select('taskId status score feedback submittedAt')
        .lean()
        .exec();
      for (const s of subs) {
        submissionsByTask.set(s.taskId.toString(), s);
      }
    }

    for (const a of assignments) {
      const key = (a._id as Types.ObjectId).toString();
      const deadline = a.deadline as Date | undefined;
      const overdue = !!deadline && now > deadline;

      if (a.assignmentType === 'QUIZ' && a.quizId) {
        const qkey = (a.quizId as Types.ObjectId).toString();
        const attempts = (attemptsByQuiz.get(qkey) || []) as Array<{
          _id: { toString(): string };
          status: string;
          score?: number;
          percentage?: number;
          submittedAt?: Date;
          startedAt?: Date;
          attemptNumber?: number;
        }>;
        const durationMin = durationMap.get(qkey) || 0;

        let activeAttemptId: string | null = null;
        let best: {
          status: string;
          score?: number;
          percentage?: number;
          submittedAt?: Date;
          attemptNumber?: number;
          // attemptId dipakai frontend utk membangun route result
          // (/dashboard/quiz/:quizId/result/:attemptId) dari tombol
          // "Lihat Hasil" pada card assignment.
          attemptId?: string;
        } | null = null;

        for (const at of attempts) {
          if (at.status === 'IN_PROGRESS') {
            // Stale: timer attempt sudah lewat (startedAt + durationMinutes) →
            // bukan attempt aktif (Quiz Core akan expire saat resume/start).
            const startedAt = at.startedAt
              ? new Date(at.startedAt).getTime()
              : now.getTime();
            const attemptDeadline = startedAt + durationMin * 60_000;
            if (durationMin > 0 && now.getTime() > attemptDeadline) continue;
            activeAttemptId = at._id.toString();
            break; // attempt terbaru dulu (sorted desc)
          }
          if (at.status === 'SUBMITTED' || at.status === 'GRADED') {
            if (!best || (at.percentage ?? 0) > (best.percentage ?? 0)) {
              best = {
                status: at.status,
                score: at.score,
                percentage: at.percentage,
                submittedAt: at.submittedAt,
                attemptNumber: at.attemptNumber,
                attemptId: at._id.toString(),
              };
            }
          }
        }

        if (best) {
          result.set(key, {
            status: 'COMPLETED',
            activeAttemptId,
            bestAttempt: best,
          });
        } else if (activeAttemptId) {
          result.set(key, {
            status: 'IN_PROGRESS',
            activeAttemptId,
            bestAttempt: null,
          });
        } else {
          result.set(key, {
            status: overdue ? 'OVERDUE' : 'NOT_STARTED',
            activeAttemptId: null,
            bestAttempt: null,
          });
        }
        continue;
      }

      // TASK: status dari submission milik user (individu) atau gugusnya
      // (kelompok) + deadline.
      const submission = submissionsByTask.get(key);
      if (submission) {
        const map: Record<string, string> = {
          SUBMITTED: 'SUBMITTED',
          LATE: 'SUBMITTED',
          GRADED: 'COMPLETED',
        };
        result.set(key, {
          status:
            map[submission.status as string] || (submission.status as string),
          activeAttemptId: null,
          bestAttempt: {
            status: submission.status as string,
            score: submission.score as number | undefined,
            submittedAt: submission.submittedAt as Date | undefined,
          },
        });
      } else {
        result.set(key, {
          status: overdue ? 'OVERDUE' : 'NOT_STARTED',
          activeAttemptId: null,
          bestAttempt: null,
        });
      }
    }
    return result;
  }

  // Status utk SATU assignment (wrapper batch — dipakai getAssignmentDetail).
  async studentAssignmentStatus(
    assignment: Record<string, unknown>,
    userId: string,
  ): Promise<AssignmentStudentStatus> {
    const map = await this.deriveAssignmentStatuses([assignment], userId);
    return (
      map.get((assignment._id as Types.ObjectId).toString()) ?? {
        status: 'NOT_STARTED',
        activeAttemptId: null,
        bestAttempt: null,
      }
    );
  }

  // Daftar assignment utk student (Google Classroom-like). Assignment = TASK
  // (submission) atau QUIZ (container → quiz existing). Targeting assignment
  // adalah source of truth utk visibility; targeting quiz tetap dicek (AND):
  // assignment quiz yang quiz-nya DRAFT/CLOSED/dihapus ATAU user bukan target
  // quiz → DISEMBUNYIKAN dari student (start/resume tetap 403 di Quiz Core).
  async listAssignments(
    userId: string,
    paginationDto: PaginationDto,
    isPanitia?: boolean,
  ) {
    const page = parseInt(paginationDto.page || '1', 10);
    const limit = parseInt(paginationDto.limit || '50', 10);
    const skip = (page - 1) * limit;
    const selectFields =
      '_id title description assignmentType quizId startTime deadline type status targetType targetIds allowedFormats attachment link';
    const baseFilter: FilterQuery<unknown> = {
      deletedAt: null,
    };

    let assignments: Array<Record<string, unknown>>;
    let total: number;

    if (isPanitia) {
      // Panitia (manage list) melihat SEMUA status: PUBLISHED, DRAFT, CLOSED.
      total = await this.taskModel.countDocuments(baseFilter);
      assignments = await this.taskModel
        .find(baseFilter)
        .select(selectFields)
        .sort({ deadline: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec();
    } else {
      // Student: hanya assignment PUBLISHED yang ditargetkan; lalu filter
      // visibility quiz di memori (quiz deleted/draft/closed/non-target →
      // hidden) baru paginate — total akurat.
      const targetFilter = await this.mabaTaskTargetFilter(userId);
      assignments = await this.taskModel
        .find({ ...baseFilter, status: 'PUBLISHED', ...targetFilter })
        .select(selectFields)
        .sort({ deadline: 1, createdAt: -1 })
        .lean()
        .exec();
      total = assignments.length;
    }

    // Enrich quiz assignment dgn metadata quiz (durasi, soal, passing score)
    // + status/targeting quiz utk filter visibility.
    const quizIds = assignments
      .filter((a) => a.assignmentType === 'QUIZ' && a.quizId)
      .map((a) => a.quizId as Types.ObjectId);
    const quizzes =
      quizIds.length > 0
        ? await this.quizModel
            .find({ _id: { $in: quizIds }, deletedAt: null })
            .select(
              '_id title description durationMinutes maxAttempts passingScore type questions status targetType targetIds',
            )
            .lean()
            .exec()
        : [];
    const quizMap = new Map(quizzes.map((q) => [q._id.toString(), q] as const));

    // Student: sembunyikan assignment quiz yang tidak boleh dikerjakan
    // (quiz tidak ada / bukan PUBLISHED / user bukan target quiz).
    if (!isPanitia) {
      const ctx = await this.quizUserContext(userId);
      assignments = assignments.filter((a) => {
        if (a.assignmentType !== 'QUIZ' || !a.quizId) return true;
        const quiz = quizMap.get((a.quizId as Types.ObjectId).toString());
        if (!quiz || quiz.status !== 'PUBLISHED') return false;
        return this.quizTargetedSync(quiz, ctx);
      });
      total = assignments.length;
      assignments = assignments.slice(skip, skip + limit);
    }

    // Status per-user (dari attempt/submission) hanya relevan utk STUDENT.
    // Panitia (manage list) melihat status assignment itu sendiri
    // (PUBLISHED/DRAFT/CLOSED) — tidak diturunkan dari attempt.
    const statusMap = isPanitia
      ? null
      : await this.deriveAssignmentStatuses(assignments, userId);

    const data: Array<Record<string, unknown>> = [];
    for (const a of assignments) {
      const statusInfo = isPanitia
        ? { status: 'NOT_STARTED', activeAttemptId: null, bestAttempt: null }
        : (statusMap?.get((a._id as Types.ObjectId).toString()) ?? {
            status: 'NOT_STARTED',
            activeAttemptId: null,
            bestAttempt: null,
          });
      const quiz = a.quizId
        ? quizMap.get((a.quizId as Types.ObjectId).toString())
        : undefined;
      data.push({
        _id: a._id,
        title: a.title,
        description: a.description,
        assignmentType: a.assignmentType || 'TASK',
        quizId: a.quizId,
        startTime: a.startTime,
        deadline: a.deadline,
        status: isPanitia ? a.status : statusInfo.status,
        activeAttemptId: statusInfo.activeAttemptId,
        bestAttempt: statusInfo.bestAttempt,
        // Metadata TASK (dipakai UI Aktivitas utk badge jenis & logika
        // submit kelompok oleh ketua gugus).
        type: a.type,
        allowedFormats: a.allowedFormats,
        // Metadata quiz (read-only summary di card & detail).
        quiz: quiz
          ? {
              _id: quiz._id,
              title: quiz.title,
              description: quiz.description,
              type: quiz.type,
              durationMinutes: quiz.durationMinutes,
              maxAttempts: quiz.maxAttempts,
              passingScore: quiz.passingScore,
              totalQuestions: (quiz.questions || []).length,
            }
          : undefined,
      });
    }

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  // Detail assignment utk student: mengecek targeting assignment (visibility)
  // DAN targeting quiz (authorization start/resume tetap di Quiz Core).
  async getAssignmentDetail(
    assignmentId: string,
    userId: string,
  ): Promise<Record<string, unknown>> {
    const assignment = await this.taskModel
      .findOne({ _id: assignmentId, deletedAt: null, status: 'PUBLISHED' })
      .select(
        '_id title description assignmentType quizId startTime deadline type status targetType targetIds allowedFormats attachment link createdBy createdAt',
      )
      .lean()
      .exec();
    if (!assignment) throw new NotFoundException('Penugasan tidak ditemukan');

    const u = await this.userModel
      .findById(userId)
      .select('pkkmbGroup')
      .lean()
      .exec();
    const groupId = u?.pkkmbGroup ? u.pkkmbGroup.toString() : '';
    const targeted = await this.isTaskTargetedTo(
      assignment as unknown as PkkmbTaskDocument,
      userId,
      groupId,
    );
    if (!targeted) {
      throw new ForbiddenException(
        'Anda tidak berhak mengakses penugasan ini.',
      );
    }

    const statusInfo = await this.studentAssignmentStatus(assignment, userId);

    let quiz: Record<string, unknown> | undefined;
    if (assignment.assignmentType === 'QUIZ' && assignment.quizId) {
      const q = await this.quizModel
        .findOne({ _id: assignment.quizId, deletedAt: null })
        .select(
          '_id title description type durationMinutes maxAttempts passingScore questions',
        )
        .lean()
        .exec();
      if (q) {
        // Pastikan student juga memenuhi targeting quiz (AND) — backend authority.
        const quizTargeted = await this.isQuizTargetedTo(q, userId);
        if (!quizTargeted) {
          throw new ForbiddenException(
            'Anda tidak berhak mengerjakan quiz ini.',
          );
        }
        quiz = {
          _id: q._id,
          title: q.title,
          description: q.description,
          type: q.type,
          durationMinutes: q.durationMinutes,
          maxAttempts: q.maxAttempts,
          passingScore: q.passingScore,
          totalQuestions: (q.questions || []).length,
        };
      }
    }

    return {
      ...assignment,
      status: statusInfo.status,
      activeAttemptId: statusInfo.activeAttemptId,
      bestAttempt: statusInfo.bestAttempt,
      quiz,
    };
  }

  // Build a $or filter on PkkmbTask so a maba only sees tasks targeting them.
  private async mabaTaskTargetFilter(userId: string) {
    const u = await this.userModel
      .findById(userId)
      .select('studyProgramId pkkmbGroup _id')
      .lean()
      .exec();
    if (!u) return { _id: { $in: [] } };

    const or: FilterQuery<unknown>[] = [
      { targetType: 'ALL' },
      { targetType: { $exists: false } },
    ];
    if (u.pkkmbGroup) {
      or.push({
        targetType: 'GROUP',
        targetIds: new Types.ObjectId(u.pkkmbGroup.toString()),
      });
    }
    if (u.studyProgramId) {
      or.push({
        targetType: 'STUDY_PROGRAM',
        targetIds: new Types.ObjectId(u.studyProgramId.toString()),
      });
    }
    or.push({
      targetType: 'INDIVIDUAL',
      targetIds: new Types.ObjectId(u._id.toString()),
    });

    // FACULTY: resolve maba's faculty from its study program.
    if (u.studyProgramId) {
      const sp = await this.studyProgramModel
        .findById(u.studyProgramId)
        .select('faculty')
        .lean()
        .exec();
      if (sp?.faculty) {
        or.push({ targetType: 'FACULTY', targetIds: sp.faculty });
      }
    }

    return { $or: or };
  }

  async getUserGroupId(userId: string): Promise<string | null> {
    const u = await this.userModel
      .findById(userId)
      .select('pkkmbGroup')
      .lean()
      .exec();
    return u?.pkkmbGroup ? u.pkkmbGroup.toString() : null;
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
    if (task.status === 'CLOSED') {
      throw new BadRequestException('Tugas ini sudah ditutup.');
    }
    if (task.status === 'DRAFT') {
      throw new BadRequestException('Tugas belum dipublikasikan.');
    }
    if (task.startTime && new Date() < task.startTime) {
      throw new BadRequestException('Tugas belum dibuka.');
    }

    // P0: verifikasi maba adalah target dari tugas.
    const targeted = await this.isTaskTargetedTo(task, userId, groupId);
    if (!targeted) {
      throw new ForbiddenException('Anda tidak berhak mengumpulkan tugas ini.');
    }

    // P1: ketua gugus diverifikasi di backend untuk tugas kelompok.
    if (task.type === 'kelompok' || task.type === 'KELOMPOK') {
      const isKetua = await this.userModel
        .findOne({ _id: userId, isKetuaGugus: true })
        .lean()
        .exec();
      if (!isKetua) {
        throw new ForbiddenException(
          'Hanya Ketua Gugus yang dapat mengumpulkan tugas kelompok.',
        );
      }
    }

    const now = new Date();
    const isLate = now > task.deadline;

    const filter: FilterQuery<unknown> = { taskId: new Types.ObjectId(taskId) };
    if (task.type === 'kelompok' || task.type === 'KELOMPOK') {
      filter.groupId = new Types.ObjectId(groupId);
    } else {
      filter.userId = new Types.ObjectId(userId);
    }

    const existing = await this.submissionModel.findOne(filter).lean().exec();

    // Resubmission: diizinkan selama deadline belum lewat; setelah itu ditolak.
    if (existing && isLate) {
      throw new BadRequestException(
        'Deadline pengumpulan telah lewat; tidak dapat mengubah pengumpulan.',
      );
    }
    // Tugas yang sudah dinilai (GRADED) tidak dapat diubah lagi.
    if (existing && existing.status === 'GRADED') {
      throw new BadRequestException(
        'Tugas sudah dinilai; tidak dapat mengubah pengumpulan.',
      );
    }

    const status = resolveSubmissionStatus(existing, isLate);

    // Point -10 hanya untuk submit telat pertama (record baru).
    if (isLate && !existing) {
      try {
        await this.pointLogModel.create({
          groupId:
            task.type === 'kelompok' ? new Types.ObjectId(groupId) : undefined,
          userId:
            task.type !== 'kelompok' ? new Types.ObjectId(userId) : undefined,
          points: -10,
          source: 'Penugasan',
          reason: `Terlambat mengumpulkan tugas: ${task.title}`,
        });
      } catch {
        /* non-fatal */
      }
    }

    return this.submissionModel
      .findOneAndUpdate(
        filter,
        {
          $set: { fileUrl: dto.fileUrl, status },
          $unset: { score: '', feedback: '', gradedBy: '' },
        },
        { upsert: true, new: true },
      )
      .exec();
  }

  // Apakah maba (individu/grup) merupakan target dari tugas?
  private async isTaskTargetedTo(
    task: PkkmbTaskDocument,
    userId: string,
    groupId: string,
  ): Promise<boolean> {
    const tt = (task.targetType || 'ALL').toUpperCase();
    if (tt === 'ALL' || !task.targetType) return true;
    if (tt === 'GROUP') {
      return task.targetIds?.some(
        (id) => id && id.toString() === groupId?.toString(),
      );
    }
    if (tt === 'INDIVIDUAL') {
      return task.targetIds?.some((id) => id?.toString() === userId);
    }
    if (tt === 'STUDY_PROGRAM' || tt === 'FACULTY') {
      const u = await this.userModel
        .findById(userId)
        .select('studyProgramId')
        .lean()
        .exec();
      if (!u?.studyProgramId) return false;
      const sp = await this.studyProgramModel
        .findById(u.studyProgramId)
        .select('faculty')
        .lean()
        .exec();
      if (!sp) return false;
      if (tt === 'STUDY_PROGRAM') {
        return task.targetIds?.some(
          (id) => id?.toString() === u.studyProgramId?.toString(),
        );
      }
      // Normalisasi kedua sisi ke string (faculty bisa ObjectId/string).
      return task.targetIds?.some(
        (f) => f?.toString() === sp.faculty?.toString(),
      );
    }
    return false;
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

  // Normalisasi targeting assignment (sama seperti createTask lama).
  private normalizeTargetIds(dto: CreateTaskDto): Types.ObjectId[] | string[] {
    return dto.targetType === 'FACULTY'
      ? (dto.targetIds ?? [])
      : (dto.targetIds ?? [])
          .map((id) => {
            try {
              return new Types.ObjectId(id);
            } catch {
              return null;
            }
          })
          .filter((id): id is Types.ObjectId => id !== null);
  }

  // Validasi assignmentType=QUIZ → quizId wajib & quiz harus ada.
  private async assertQuizAssignment(
    dto: CreateTaskDto,
  ): Promise<Types.ObjectId | undefined> {
    const assignmentType = dto.assignmentType || 'TASK';
    if (assignmentType === 'QUIZ') {
      if (!dto.quizId) {
        throw new BadRequestException(
          'Untuk assignment Quiz, quizId wajib diisi (gunakan quiz existing).',
        );
      }
      const quiz = await this.quizModel
        .findOne({ _id: dto.quizId, deletedAt: null })
        .select('_id title')
        .lean()
        .exec();
      if (!quiz) {
        throw new BadRequestException(
          'Quiz yang dipilih tidak ditemukan. Pilih quiz existing.',
        );
      }
      return new Types.ObjectId(dto.quizId);
    }
    return undefined;
  }

  async createTask(dto: CreateTaskDto, createdBy?: string) {
    const assignmentType = dto.assignmentType || 'TASK';
    const quizObjectId = await this.assertQuizAssignment(dto);
    if (assignmentType === 'TASK' && !dto.type) {
      throw new BadRequestException(
        'Untuk assignment Tugas, tipe submisi (individu/kelompok) wajib diisi.',
      );
    }
    const targetIds = this.normalizeTargetIds(dto);
    return this.taskModel.create({
      title: dto.title,
      description: dto.description,
      assignmentType,
      quizId: quizObjectId,
      startTime: dto.startTime ? new Date(dto.startTime) : undefined,
      deadline: new Date(dto.deadline),
      type: dto.type, // submission type, undefined utk QUIZ
      status: dto.status || 'PUBLISHED',
      targetType: dto.targetType || 'ALL',
      targetIds: dto.targetType && dto.targetType !== 'ALL' ? targetIds : [],
      allowedFormats: dto.allowedFormats,
      attachment: dto.attachment,
      link: dto.link,
      createdBy: createdBy ? new Types.ObjectId(createdBy) : undefined,
    });
  }

  // Update assignment (TASK / QUIZ). Untuk QUIZ, quizId tidak boleh diubah
  // jika assignment sudah punya referensi (gunakan assignment baru).
  async updateAssignment(assignmentId: string, dto: CreateTaskDto) {
    const assignment = await this.taskModel
      .findOne({ _id: assignmentId, deletedAt: null })
      .exec();
    if (!assignment) throw new NotFoundException('Penugasan tidak ditemukan');

    const requestedType = dto.assignmentType;
    const assignmentType = requestedType || assignment.assignmentType || 'TASK';
    const quizObjectId = await this.assertQuizAssignment(dto);
    if (assignmentType === 'TASK' && !dto.type && !assignment.type) {
      throw new BadRequestException(
        'Untuk assignment Tugas, tipe submisi (individu/kelompok) wajib diisi.',
      );
    }

    // Quiz yang sudah direferensikan tidak boleh diganti via PATCH (jangan
    // merusak riwayat attempt). Buat assignment baru utk quiz lain.
    if (
      assignment.assignmentType === 'QUIZ' &&
      assignment.quizId &&
      dto.quizId &&
      assignment.quizId.toString() !== dto.quizId
    ) {
      throw new BadRequestException(
        'quizId assignment Quiz tidak dapat diubah. Buat penugasan baru untuk quiz lain.',
      );
    }

    // PATCH parsial: field yang TIDAK dikirim TIDAK diubah (targeting tidak
    // di-reset ke []). Hanya field yang eksplisit di body yang di-set.
    const targetIds = this.normalizeTargetIds(dto);

    assignment.title = dto.title ?? assignment.title;
    assignment.description = dto.description ?? assignment.description;
    assignment.assignmentType = assignmentType;
    if (requestedType === 'TASK') {
      // QUIZ→TASK: lepas referensi quiz (prompt §3: TASK → quizId kosong).
      assignment.quizId = null;
    } else if (requestedType === 'QUIZ' && quizObjectId) {
      // TASK→QUIZ: set referensi quiz (TASK tanpa quizId tidak diubah).
      assignment.quizId = quizObjectId;
    }
    if (dto.startTime !== undefined)
      assignment.startTime = new Date(dto.startTime);
    assignment.deadline = dto.deadline
      ? new Date(dto.deadline)
      : assignment.deadline;
    if (dto.type !== undefined) assignment.type = dto.type;
    if (dto.status !== undefined) assignment.status = dto.status;
    if (dto.targetType !== undefined) {
      assignment.targetType = dto.targetType;
      assignment.targetIds = dto.targetType !== 'ALL' ? targetIds : [];
    }
    if (dto.allowedFormats !== undefined)
      assignment.allowedFormats = dto.allowedFormats;
    if (dto.attachment !== undefined) assignment.attachment = dto.attachment;
    if (dto.link !== undefined) assignment.link = dto.link;

    await assignment.save();
    return assignment;
  }

  // Hapus assignment (soft delete) — status QUIZ juga melepas referensi di quiz.
  async deleteAssignment(assignmentId: string) {
    const assignment = await this.taskModel
      .findOne({ _id: assignmentId, deletedAt: null })
      .exec();
    if (!assignment) throw new NotFoundException('Penugasan tidak ditemukan');

    assignment.deletedAt = new Date();
    await assignment.save();
    return { id: assignment._id, deletedAt: assignment.deletedAt };
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

    // Pendamping gugus bersifat READ-ONLY untuk penugasan — menilai dilakukan
    // Sie Acara/Pemateri. Hanya pemegang grading.update / manage:all yang boleh.
    const perms = normalizedGrader.permissions || [];
    const graderUser = await this.userModel
      .findById(normalizedGrader.userId as string)
      .select('division')
      .lean()
      .exec();
    if (
      graderUser &&
      (graderUser.division || '').toLowerCase().includes('pendamping')
    ) {
      throw new ForbiddenException(
        'Pendamping gugus hanya dapat melihat penugasan (read-only).',
      );
    }

    // Pemegang manage:all atau pkkmb.grading.update (panitia/pimpinan) boleh menilai.
    const canGradeAll =
      perms.includes('manage:all') || perms.includes('pkkmb.grading.update');
    if (!canGradeAll) {
      // Fallback pendamping per-gugus (tanpa grading.update): hanya gugus sendiri.
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
      .select('_id name startTime endTime location pic isOnline');

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

  async getMabaNotificationFeed(userId: string, limit = 3) {
    const user = await this.userModel
      .findById(userId)
      .select('pkkmbGroup announcementsRead')
      .lean()
      .exec();
    const readIds = new Set(
      (user?.announcementsRead || []).map((id) => id.toString()),
    );
    const filter: FilterQuery<unknown> = { deletedAt: null };
    if (user?.pkkmbGroup) {
      filter.$or = [
        { targetAudience: 'all' },
        {
          targetAudience: 'specific_groups',
          targetGroups: new Types.ObjectId(user.pkkmbGroup),
        },
      ];
    } else {
      filter.targetAudience = 'all';
    }
    const items = await this.announcementModel
      .find(filter)
      .select('_id title content isPriority createdAt actionType actionId')
      .sort({ isPriority: -1, createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();
    const enriched = items.map((a) => ({
      _id: a._id.toString(),
      title: a.title,
      content: a.content,
      isPriority: a.isPriority,
      createdAt: (a as unknown as { createdAt?: Date }).createdAt,
      actionType: a.actionType || 'general',
      actionId: a.actionId || undefined,
      isRead: readIds.has(a._id.toString()),
    }));
    return {
      unreadCount: enriched.filter((a) => !a.isRead).length,
      items: enriched,
    };
  }

  async markAnnouncementsRead(userId: string, ids?: string[]) {
    let announcementIds: import('mongoose').Types.ObjectId[];
    if (ids && ids.length > 0) {
      announcementIds = ids.map((id) => new Types.ObjectId(id));
    } else {
      const feed = await this.getMabaNotificationFeed(userId);
      announcementIds = feed.items.map((a) => new Types.ObjectId(a._id));
    }
    await this.userModel
      .findByIdAndUpdate(
        userId,
        { $addToSet: { announcementsRead: { $each: announcementIds } } },
        { new: true },
      )
      .exec();
    const feed = await this.getMabaNotificationFeed(userId);
    return { unreadCount: feed.unreadCount };
  }

  async getMabaDashboardSchedules() {
    const now = new Date();
    return this.scheduleModel
      .find({ deletedAt: null, endTime: { $gte: now } })
      .select('_id name startTime endTime location pic isOnline')
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
    const targetFilter = await this.mabaTaskTargetFilter(userId);
    const allTasks = await this.taskModel
      .find({ deletedAt: null, deadline: { $gte: now }, ...targetFilter })
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
          select:
            '_id nomor name pendampingId pendampingName pendampingWhatsApp pendampingEmail grupLink',
          populate: {
            path: 'pendampingId',
            select: 'name phone pendampingWhatsApp',
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
      .select('_id name startTime endTime location pic isOnline')
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

    // Lampirkan info disabilitas dari profil kesehatan (batch query 1x,
    // bukan N+1) agar panitia/tim kesehatan bisa menyiapkan akomodasi.
    // HANYA untuk pemegang izin health.read_all/manage:all — data disabilitas
    // bersifat sensitif & tidak boleh bocor ke pendamping/panitia read-only.
    const canSeeHealth =
      currentUser?.permissions?.includes('pkkmb.health.read_all') ||
      currentUser?.permissions?.includes('manage:all');
    if (canSeeHealth) {
      const studentIds = sanitizedData.map((u) => (u as { _id?: unknown })._id);
      const healthProfiles = studentIds.length
        ? await this.healthProfileModel
            .find({ studentId: { $in: studentIds } })
            .select('studentId isDisabled disabilityDescription')
            .lean()
            .exec()
        : [];
      const profileByStudent = new Map(
        healthProfiles.map((p) => [
          (p.studentId as { toString(): string }).toString(),
          p,
        ]),
      );
      for (const item of sanitizedData) {
        const profile = profileByStudent.get(
          String((item as { _id?: unknown })._id),
        );
        (item as unknown as Record<string, unknown>).disability = {
          isDisabled: profile?.isDisabled ?? false,
          description: profile?.disabilityDescription ?? undefined,
        };
      }
    }

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
    // Role maba sebenarnya ber-slug 'user' (lihat seed-rbac). Cari dengan $or
    // agar kompatibel dengan penamaan lama (slug 'maba') bila ada di DB.
    const roleMaba = await this.roleModel.findOne({
      $or: [{ slug: 'maba' }, { slug: 'user' }, { name: 'Mahasiswa Baru' }],
    });
    if (!roleMaba)
      throw new NotFoundException('Role mahasiswa baru tidak ditemukan');

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
    const filter: Record<string, unknown> = { deletedAt: null };
    // Search filter
    if (paginationDto.search) {
      const searchRegex = new RegExp(paginationDto.search, 'i');
      filter['$or'] = [
        { name: searchRegex },
        { nim: searchRegex },
        { email: searchRegex },
      ];
    }

    // Filter by role slug (e.g. panitia, maba, super_admin)
    if (paginationDto.role) {
      const role = await this.roleModel
        .findOne({ slug: paginationDto.role })
        .select('_id')
        .lean()
        .exec();
      if (role) filter.role = role._id;
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

  // ─── QUIZ SERVICES ─────────────────────────────────────────────────────

  async createQuiz(dto: CreateQuizDto, createdBy?: string) {
    const targetIds =
      dto.targetType === 'FACULTY'
        ? (dto.targetIds ?? [])
        : (dto.targetIds ?? [])
            .map((id) => {
              try {
                return new Types.ObjectId(id);
              } catch {
                return null;
              }
            })
            .filter((id): id is Types.ObjectId => id !== null);

    const questions = (dto.questions ?? []).map((q, i) => ({
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      points: q.points ?? 1,
      order: q.order ?? i,
    }));

    return this.quizModel.create({
      title: dto.title,
      description: dto.description,
      type: dto.type,
      status: dto.status || 'DRAFT',
      targetType: dto.targetType || 'ALL',
      targetIds: dto.targetType && dto.targetType !== 'ALL' ? targetIds : [],
      startTime: dto.startTime ? new Date(dto.startTime) : undefined,
      endTime: dto.endTime ? new Date(dto.endTime) : undefined,
      durationMinutes: dto.durationMinutes ?? 30,
      maxAttempts: dto.maxAttempts ?? 1,
      passingScore: dto.passingScore ?? 0,
      questions,
      createdBy: createdBy ? new Types.ObjectId(createdBy) : undefined,
    });
  }

  async updateQuiz(quizId: string, dto: CreateQuizDto) {
    const quiz = await this.quizModel
      .findOne({ _id: quizId, deletedAt: null })
      .exec();
    if (!quiz) throw new NotFoundException('Quiz tidak ditemukan');

    const targetIds =
      dto.targetType === 'FACULTY'
        ? (dto.targetIds ?? [])
        : (dto.targetIds ?? [])
            .map((id) => {
              try {
                return new Types.ObjectId(id);
              } catch {
                return null;
              }
            })
            .filter((id): id is Types.ObjectId => id !== null);

    const patch: Record<string, unknown> = {
      title: dto.title,
      description: dto.description,
      type: dto.type,
      targetType: dto.targetType || 'ALL',
      targetIds: dto.targetType && dto.targetType !== 'ALL' ? targetIds : [],
      startTime: dto.startTime ? new Date(dto.startTime) : undefined,
      endTime: dto.endTime ? new Date(dto.endTime) : undefined,
      durationMinutes: dto.durationMinutes ?? quiz.durationMinutes,
      maxAttempts: dto.maxAttempts ?? quiz.maxAttempts,
      passingScore: dto.passingScore ?? quiz.passingScore,
    };
    if (dto.status) patch.status = dto.status;
    if (dto.questions) {
      patch.questions = dto.questions.map((q, i) => ({
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        points: q.points ?? 1,
        order: q.order ?? i,
      }));
    }

    Object.assign(quiz, patch);
    return quiz.save();
  }

  // Query filter agar maba hanya melihat quiz yang menarget dirinya.
  private async quizTargetFilter(userId: string) {
    const u = await this.userModel
      .findById(userId)
      .select('studyProgramId pkkmbGroup _id')
      .lean()
      .exec();
    if (!u) return { _id: { $in: [] } };

    const or: FilterQuery<unknown>[] = [
      { targetType: 'ALL' },
      { targetType: { $exists: false } },
    ];
    if (u.pkkmbGroup) {
      or.push({
        targetType: 'GROUP',
        targetIds: new Types.ObjectId(u.pkkmbGroup.toString()),
      });
    }
    if (u.studyProgramId) {
      or.push({
        targetType: 'STUDY_PROGRAM',
        targetIds: new Types.ObjectId(u.studyProgramId.toString()),
      });
      const sp = await this.studyProgramModel
        .findById(u.studyProgramId)
        .select('faculty')
        .lean()
        .exec();
      if (sp?.faculty)
        or.push({ targetType: 'FACULTY', targetIds: sp.faculty });
    }
    or.push({
      targetType: 'INDIVIDUAL',
      targetIds: new Types.ObjectId(u._id.toString()),
    });
    return { $or: or };
  }

  private async isQuizTargetedTo(
    quiz: {
      targetType?: string;
      targetIds?: (Types.ObjectId | string)[];
    },
    userId: string,
  ): Promise<boolean> {
    // Ambil konteks user SEKALI lalu cek sinkron (logika identik dengan
    // versi batch — lihat quizUserContext / quizTargetedSync).
    const ctx = await this.quizUserContext(userId);
    return this.quizTargetedSync(quiz, ctx);
  }

  // Management: list semua quiz (bukan untuk maba).
  // Response menyertakan questionCount & attemptCount (untuk UI, mis. modal
  // konfirmasi hapus yang menampilkan jumlah soal & attempt). Soal lengkap
  // TIDAK dikirim di list — management detail (GET /quiz/:id) yang menyediakannya.
  async listAllQuizzes(paginationDto: PaginationDto, search?: string) {
    const page = parseInt(paginationDto.page || '1', 10);
    const limit = parseInt(paginationDto.limit || '50', 10);
    const skip = (page - 1) * limit;
    const filter: FilterQuery<unknown> = { deletedAt: null };
    if (search) filter.title = { $regex: search, $options: 'i' };
    const total = await this.quizModel.countDocuments(filter);
    const data = await this.quizModel
      .find(filter)
      .select(
        '_id title description type status targetType targetIds startTime endTime durationMinutes maxAttempts passingScore createdAt',
      )
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    const qids = data.map((q) => q._id);
    const [questionCounts, attemptCounts] =
      qids.length > 0
        ? await Promise.all([
            this.quizModel.aggregate([
              { $match: { _id: { $in: qids } } },
              {
                $project: {
                  _id: 1,
                  questionCount: { $size: { $ifNull: ['$questions', []] } },
                },
              },
            ]),
            this.quizAttemptModel.aggregate([
              {
                $match: {
                  quizId: { $in: qids },
                  deletedAt: null,
                },
              },
              { $group: { _id: '$quizId', count: { $sum: 1 } } },
            ]),
          ])
        : [Promise.resolve([]), Promise.resolve([])];

    const qcMap = new Map<string, number>(
      (
        questionCounts as Array<{
          _id: Types.ObjectId;
          questionCount: number;
        }>
      ).map((r) => [r._id.toString(), r.questionCount]),
    );
    const acMap = new Map<string, number>(
      (attemptCounts as Array<{ _id: Types.ObjectId; count: number }>).map(
        (r) => [r._id.toString(), r.count],
      ),
    );

    const items: QuizListItem[] = data.map((q) => ({
      ...q,
      questionCount: qcMap.get(q._id.toString()) ?? 0,
      attemptCount: acMap.get(q._id.toString()) ?? 0,
    }));

    return {
      data: items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  // Maba: hanya quiz PUBLISHED, dalam periode, menjadi targetnya.
  async listStudentQuizzes(userId: string, paginationDto: PaginationDto) {
    const page = parseInt(paginationDto.page || '1', 10);
    const limit = parseInt(paginationDto.limit || '50', 10);
    const skip = (page - 1) * limit;
    const now = new Date();
    const targetFilter = await this.quizTargetFilter(userId);
    const filter: FilterQuery<unknown> = {
      deletedAt: null,
      status: 'PUBLISHED',
      $or: [
        { startTime: { $exists: false } },
        { startTime: null },
        { startTime: { $lte: now } },
      ],
      ...targetFilter,
    };
    const total = await this.quizModel.countDocuments(filter);
    const data = await this.quizModel
      .find(filter)
      .select(
        '_id title description type status targetType targetIds startTime endTime durationMinutes maxAttempts passingScore',
      )
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    // Tambah info attempt per quiz utk mahasiswa (hasil/status).
    // EXPIRED (attempt ditinggal sampai lewat deadline) TIDAK dianggap aktif
    // dan tidak dihitung sebagai percobaan terpakai.
    const attempts = await this.quizAttemptModel
      .find({ userId: new Types.ObjectId(userId), deletedAt: null })
      .select(
        'quizId status score percentage submittedAt attemptNumber startedAt',
      )
      .lean()
      .exec();

    const out = data.map((q) => {
      const mine = attempts
        .filter((a) => a.quizId.toString() === q._id.toString())
        .sort((a, b) => (a.attemptNumber ?? 0) - (b.attemptNumber ?? 0));

      let isInProgress = false;
      // Attempt IN_PROGRESS milik user (belum expired) — dipakai card list
      // utk tombol "Lanjutkan pengerjaan" langsung ke player tanpa /start.
      let activeAttemptId: Types.ObjectId | null = null;
      let best: {
        status: string;
        score?: number;
        percentage?: number;
        submittedAt?: Date;
        attemptNumber?: number;
      } | null = null;

      for (const a of mine) {
        const expired =
          a.status === 'IN_PROGRESS' &&
          now >
            new Date(a.startedAt.getTime() + (q.durationMinutes || 0) * 60000);
        const status = expired ? 'EXPIRED' : a.status;
        if (status === 'IN_PROGRESS') {
          isInProgress = true;
          activeAttemptId = a._id;
        }
        if (status === 'SUBMITTED' || status === 'GRADED') {
          if (!best || (a.percentage ?? 0) > (best.percentage ?? 0)) {
            best = {
              status,
              score: a.score,
              percentage: a.percentage,
              submittedAt: a.submittedAt,
              attemptNumber: a.attemptNumber,
            };
          }
        }
      }

      return {
        _id: q._id,
        title: q.title,
        description: q.description,
        type: q.type,
        startTime: q.startTime,
        endTime: q.endTime,
        durationMinutes: q.durationMinutes,
        maxAttempts: q.maxAttempts,
        passingScore: q.passingScore,
        isInProgress,
        activeAttemptId: activeAttemptId ? activeAttemptId.toString() : null,
        bestAttempt: best,
      };
    });
    return {
      data: out,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  // Detail quiz utk mahasiswa: metadata aman + status attempt sendiri.
  // TIDAK menyertakan soal/correctAnswer — soal hanya muncul saat start/resume.
  async getStudentQuizDetail(quizId: string, userId: string) {
    const quiz = await this.quizModel
      .findOne({ _id: quizId, deletedAt: null })
      .lean()
      .exec();
    if (!quiz) throw new NotFoundException('Quiz tidak ditemukan');

    const now = new Date();
    const targeted = await this.isQuizTargetedTo(quiz, userId);
    if (!targeted) {
      throw new ForbiddenException('Anda tidak berhak mengakses quiz ini.');
    }
    if (quiz.status !== 'PUBLISHED') {
      throw new BadRequestException('Quiz belum dibuka atau sudah ditutup.');
    }
    if (quiz.startTime && now < quiz.startTime) {
      throw new BadRequestException('Quiz belum dibuka.');
    }
    if (quiz.endTime && now > quiz.endTime) {
      throw new BadRequestException('Quiz telah ditutup.');
    }

    // Histori attempt sendiri; IN_PROGRESS yang sudah lewat deadline
    // ditandai EXPIRED (server authority) supaya tidak memakan slot.
    const attempts = await this.quizAttemptModel
      .find({
        quizId: quiz._id,
        userId: new Types.ObjectId(userId),
        deletedAt: null,
      })
      .exec();
    await this.expireStaleAttempts(attempts, quiz.durationMinutes);

    const submitted = attempts.filter(
      (a) => a.status === 'SUBMITTED' || a.status === 'GRADED',
    );
    const active = attempts.find((a) => a.status === 'IN_PROGRESS') || null;
    const bestAttempt =
      submitted.length > 0
        ? submitted.reduce((prev, cur) =>
            (cur.percentage ?? 0) > (prev.percentage ?? 0) ? cur : prev,
          )
        : null;

    const available =
      (!quiz.startTime || now >= quiz.startTime) &&
      (!quiz.endTime || now <= quiz.endTime);
    const usedSlots = submitted.length + (active ? 1 : 0);
    const canStart = available && usedSlots < quiz.maxAttempts;

    return {
      _id: quiz._id,
      title: quiz.title,
      description: quiz.description,
      type: quiz.type,
      status: 'PUBLISHED',
      startTime: quiz.startTime,
      endTime: quiz.endTime,
      durationMinutes: quiz.durationMinutes,
      maxAttempts: quiz.maxAttempts,
      passingScore: quiz.passingScore,
      totalQuestions: (quiz.questions || []).length,
      attemptCount: attempts.length,
      usedAttempts: usedSlots,
      available,
      canStart,
      isInProgress: !!active,
      activeAttemptId: active ? active._id : null,
      bestAttempt: bestAttempt
        ? {
            attemptNumber: bestAttempt.attemptNumber,
            status: bestAttempt.status,
            score: bestAttempt.score,
            percentage: bestAttempt.percentage,
            submittedAt: bestAttempt.submittedAt,
            passed: (bestAttempt.percentage ?? 0) >= (quiz.passingScore ?? 0),
          }
        : null,
    };
  }

  // Mulai / lanjutkan quiz. Validasi periode, target, maxAttempts.
  // Attempt IN_PROGRESS aktif dikembalikan apa adanya (resume) — refresh
  // atau double-start TIDAK membuat attempt baru & tidak menghabiskan kuota.
  // IN_PROGRESS yang sudah lewat deadline ditandai EXPIRED (server authority)
  // dan tidak dihitung sebagai percobaan terpakai.
  async startQuiz(quizId: string, userId: string) {
    const quiz = await this.quizModel
      .findOne({ _id: quizId, deletedAt: null })
      .exec();
    if (!quiz) throw new NotFoundException('Quiz tidak ditemukan');

    const now = new Date();
    const targeted = await this.isQuizTargetedTo(quiz, userId);
    if (!targeted) {
      throw new ForbiddenException('Anda tidak berhak mengakses quiz ini.');
    }
    if (quiz.status !== 'PUBLISHED') {
      throw new BadRequestException('Quiz belum dibuka atau sudah ditutup.');
    }
    if (quiz.startTime && now < quiz.startTime) {
      throw new BadRequestException('Quiz belum dibuka.');
    }
    if (quiz.endTime && now > quiz.endTime) {
      throw new BadRequestException('Quiz telah ditutup.');
    }
    if ((quiz.questions || []).length === 0) {
      throw new BadRequestException('Quiz belum memiliki soal.');
    }

    const userIdObj = new Types.ObjectId(userId);

    // 1) Resume attempt IN_PROGRESS milik user (yang terbaru) jika ada.
    const activeAttempt = await this.quizAttemptModel
      .findOne({
        quizId: quiz._id,
        userId: userIdObj,
        status: 'IN_PROGRESS',
        deletedAt: null,
      })
      .sort({ startedAt: -1 })
      .exec();

    if (activeAttempt) {
      const deadline = this.attemptDeadline(
        activeAttempt,
        quiz.durationMinutes,
      );
      if (now <= deadline) {
        // Masih dalam deadline → lanjutkan attempt yang sama.
        return this.buildAttemptPayload(activeAttempt, quiz, true);
      }
      // Sudah lewat deadline → EXPIRED (tidak memakai slot attempt).
      activeAttempt.status = 'EXPIRED';
      await activeAttempt.save();
    }

    // 2) maxAttempts: hanya attempt yang benar-benar terpakai
    //    (IN_PROGRESS aktif / SUBMITTED / GRADED). EXPIRED tidak dihitung.
    const usedCount = await this.quizAttemptModel.countDocuments({
      quizId: quiz._id,
      userId: userIdObj,
      status: { $in: ['IN_PROGRESS', 'SUBMITTED', 'GRADED'] },
    });
    if (usedCount >= quiz.maxAttempts) {
      throw new BadRequestException(
        'Anda sudah mencapai batas maksimal pengerjaan quiz.',
      );
    }

    // 3) attemptNumber berikutnya (EXPIRED tidak memakan nomor baru).
    const lastAttempt = await this.quizAttemptModel
      .findOne({ quizId: quiz._id, userId: userIdObj })
      .sort({ attemptNumber: -1 })
      .select('attemptNumber')
      .lean()
      .exec();
    const attemptNumber = (lastAttempt?.attemptNumber ?? 0) + 1;

    let attempt;
    try {
      attempt = await this.quizAttemptModel.create({
        quizId: quiz._id,
        userId: userIdObj,
        attemptNumber,
        status: 'IN_PROGRESS',
        startedAt: now,
        totalQuestions: (quiz.questions || []).length,
      });
    } catch (err) {
      // E11000: race condition dua start paralel dgn attemptNumber sama.
      // Jangan 500 — suruh user muat ulang (attempt miliknya sudah ada).
      const code = (err as { code?: number })?.code;
      if (code === 11000) {
        throw new BadRequestException(
          'Quiz sedang kamu kerjakan. Muat ulang halaman untuk melanjutkan.',
        );
      }
      throw err;
    }

    return this.buildAttemptPayload(attempt, quiz, false);
  }

  // Submit: backend menghitung score sendiri (authority).
  async submitQuiz(
    quizId: string,
    attemptId: string,
    userId: string,
    dto: SubmitQuizDto,
  ) {
    const attempt = await this.quizAttemptModel
      .findOne({ _id: attemptId, deletedAt: null })
      .exec();
    if (!attempt) throw new NotFoundException('Attempt tidak ditemukan');
    // Identity security: attempt harus milik quiz di path & milik user ini.
    if (attempt.quizId.toString() !== quizId) {
      throw new NotFoundException('Attempt tidak ditemukan');
    }
    if (attempt.userId.toString() !== userId) {
      throw new ForbiddenException(
        'Anda tidak dapat mengumpulkan attempt milik user lain.',
      );
    }
    if (attempt.status === 'SUBMITTED' || attempt.status === 'GRADED') {
      throw new BadRequestException('Attempt sudah dikumpulkan.');
    }

    const quiz = await this.quizModel
      .findOne({ _id: attempt.quizId, deletedAt: null })
      .exec();
    if (!quiz) throw new NotFoundException('Quiz tidak ditemukan');

    const now = new Date();
    // Validasi periode quiz & timer attempt (backend authority).
    if (quiz.startTime && now < quiz.startTime) {
      throw new BadRequestException('Quiz belum dibuka.');
    }
    if (quiz.endTime && now > quiz.endTime) {
      throw new BadRequestException('Quiz telah ditutup.');
    }
    const deadline = this.attemptDeadline(attempt, quiz.durationMinutes);
    if (now > deadline) {
      // Waktu habis → attempt resmi EXPIRED (histori tetap tersimpan).
      attempt.status = 'EXPIRED';
      await attempt.save();
      throw new BadRequestException('Waktu pengerjaan quiz telah habis.');
    }

    // Scoring: backend ambil correct answers dari quiz.
    const orderedQuestions = (quiz.questions || [])
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const graded = gradeQuizAnswers(orderedQuestions, dto.answers);
    const score = graded.score;
    const correctCount = graded.correctCount;
    const answers = graded.answers;

    const maxScore = orderedQuestions.reduce(
      (sum, q) => sum + (q.points ?? 1),
      0,
    );
    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    const passingScore = quiz.passingScore ?? 0;

    attempt.answers = answers;
    attempt.score = score;
    attempt.correctCount = correctCount;
    attempt.totalQuestions = orderedQuestions.length;
    attempt.percentage = percentage;
    attempt.status = 'SUBMITTED';
    attempt.submittedAt = now;
    await attempt.save();

    return {
      attemptId: attempt._id,
      score,
      correctCount: attempt.correctCount,
      totalQuestions: attempt.totalQuestions,
      percentage,
      passingScore,
      status: attempt.status,
      passed: percentage >= passingScore,
      submittedAt: attempt.submittedAt,
    };
  }

  // Hasil attempt milik user sendiri.
  async getQuizResult(attemptId: string, userId: string) {
    const attempt = await this.quizAttemptModel
      .findOne({ _id: attemptId, deletedAt: null })
      .populate('quizId', 'title description type passingScore')
      .lean()
      .exec();
    if (!attempt) throw new NotFoundException('Attempt tidak ditemukan');
    if (attempt.userId.toString() !== userId) {
      throw new ForbiddenException(
        'Anda tidak dapat melihat attempt milik user lain.',
      );
    }
    const quiz = attempt.quizId as unknown as {
      title?: string;
      type?: string;
      passingScore?: number;
    };
    const passingScore = quiz?.passingScore ?? 0;
    return {
      quizTitle: quiz?.title,
      quizType: quiz?.type,
      score: attempt.score,
      correctCount: attempt.correctCount,
      totalQuestions: attempt.totalQuestions,
      percentage: attempt.percentage,
      passingScore,
      passed: (attempt.percentage ?? 0) >= passingScore,
      status: attempt.status,
      attemptNumber: attempt.attemptNumber,
      submittedAt: attempt.submittedAt,
    };
  }

  // ─── QUIZ ATTEMPT LIFECYCLE (RESUME / EXPIRED / DELETE) ────────────────────

  // Deadline attempt = startedAt + durationMinutes (server authority).
  private attemptDeadline(
    attempt: { startedAt?: Date },
    durationMinutes: number,
  ): Date {
    return new Date(
      (attempt.startedAt || new Date()).getTime() + durationMinutes * 60000,
    );
  }

  // Tandai IN_PROGRESS yang sudah lewat deadline menjadi EXPIRED.
  // Histori tidak dihapus; EXPIRED tidak memakai slot maxAttempts.
  private async expireStaleAttempts(
    attempts: {
      status: string;
      startedAt?: Date;
      save?: () => Promise<unknown>;
    }[],
    durationMinutes: number,
  ): Promise<void> {
    const now = new Date();
    for (const a of attempts) {
      if (
        a.status === 'IN_PROGRESS' &&
        now > this.attemptDeadline(a, durationMinutes)
      ) {
        a.status = 'EXPIRED';
        if (typeof a.save === 'function') await a.save();
      }
    }
  }

  // Payload bersama untuk start/resume: soal (tanpa correctAnswer) + deadline.
  private buildAttemptPayload(
    attempt: {
      _id: Types.ObjectId;
      attemptNumber: number;
      status: string;
      startedAt: Date;
      answers?: { questionId: string; selectedAnswer: string }[];
    },
    quiz: {
      durationMinutes: number;
      questions?: QuizQuestion[];
    },
    isResume: boolean,
  ) {
    const deadline = this.attemptDeadline(attempt, quiz.durationMinutes);
    const questions = (quiz.questions || [])
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((q, i) => ({
        questionId: i.toString(),
        question: q.question,
        options: q.options,
        points: q.points,
        order: q.order,
      }));

    return {
      attemptId: attempt._id,
      attemptNumber: attempt.attemptNumber,
      status: attempt.status,
      startedAt: attempt.startedAt,
      durationMinutes: quiz.durationMinutes,
      deadlineAt: deadline,
      remainingSeconds: Math.max(
        0,
        Math.ceil((deadline.getTime() - Date.now()) / 1000),
      ),
      isResume,
      answers: attempt.answers ?? [],
      questions,
    };
  }

  // Resume attempt milik user sendiri (untuk pemulihan setelah refresh /
  // sessionStorage hilang). Hanya IN_PROGRESS dalam deadline yang bisa
  // dilanjutkan; EXPIRED/SUBMITTED/GRADED tidak dikembalikan sebagai player.
  async resumeQuizAttempt(quizId: string, attemptId: string, userId: string) {
    const attempt = await this.quizAttemptModel
      .findOne({ _id: attemptId, deletedAt: null })
      .exec();
    if (!attempt) throw new NotFoundException('Attempt tidak ditemukan');
    // Identity security: attempt milik quiz di path; milik user lain → ditolak.
    if (attempt.quizId.toString() !== quizId) {
      throw new NotFoundException('Attempt tidak ditemukan');
    }
    if (attempt.userId.toString() !== userId) {
      throw new ForbiddenException(
        'Anda tidak dapat mengakses attempt milik user lain.',
      );
    }

    const quiz = await this.quizModel
      .findOne({ _id: attempt.quizId, deletedAt: null })
      .exec();
    if (!quiz) throw new NotFoundException('Quiz tidak ditemukan');

    const deadline = this.attemptDeadline(attempt, quiz.durationMinutes);
    const base = {
      attemptId: attempt._id,
      quizId: attempt.quizId,
      status: attempt.status,
      startedAt: attempt.startedAt,
      deadlineAt: deadline,
      submittedAt: attempt.submittedAt,
      title: quiz.title,
      type: quiz.type,
      answers: attempt.answers ?? [],
    };

    if (attempt.status === 'IN_PROGRESS') {
      // Konsisten dgn startQuiz: resume hanya saat quiz masih aktif &
      // dalam periode. (SUBMITTED/GRADED/EXPIRED tidak dicek — frontend
      // mengarahkannya ke result/detail.)
      const now = new Date();
      if (quiz.status !== 'PUBLISHED') {
        throw new BadRequestException('Quiz belum dibuka atau sudah ditutup.');
      }
      if (quiz.startTime && now < quiz.startTime) {
        throw new BadRequestException('Quiz belum dibuka.');
      }
      if (quiz.endTime && now > quiz.endTime) {
        throw new BadRequestException('Quiz telah ditutup.');
      }
      if (now > deadline) {
        attempt.status = 'EXPIRED';
        await attempt.save();
        return { ...base, status: 'EXPIRED', questions: [] };
      }
      const questions = (quiz.questions || [])
        .slice()
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((q, i) => ({
          questionId: i.toString(),
          question: q.question,
          options: q.options,
          points: q.points,
          order: q.order,
        }));
      return {
        ...base,
        durationMinutes: quiz.durationMinutes,
        remainingSeconds: Math.max(
          0,
          Math.ceil((deadline.getTime() - Date.now()) / 1000),
        ),
        questions,
      };
    }

    // SUBMITTED / GRADED / EXPIRED → bukan active attempt. Frontend akan
    // mengarahkan ke result (jika sudah dikumpulkan) atau detail (jika EXPIRED).
    return { ...base, questions: [] };
  }

  // Simpan jawaban in-progress agar bisa dipulihkan setelah tab ditutup.
  // Hanya attempt IN_PROGRESS milik user sendiri dalam deadline.
  async saveQuizAnswers(
    quizId: string,
    attemptId: string,
    userId: string,
    dto: SaveQuizAnswersDto,
  ) {
    const attempt = await this.quizAttemptModel
      .findOne({ _id: attemptId, deletedAt: null })
      .exec();
    if (!attempt) throw new NotFoundException('Attempt tidak ditemukan');
    // Identity security: attempt milik quiz di path & milik user ini.
    if (attempt.quizId.toString() !== quizId) {
      throw new NotFoundException('Attempt tidak ditemukan');
    }
    if (attempt.userId.toString() !== userId) {
      throw new ForbiddenException(
        'Anda tidak dapat mengubah attempt milik user lain.',
      );
    }
    if (attempt.status === 'SUBMITTED' || attempt.status === 'GRADED') {
      throw new BadRequestException('Attempt sudah dikumpulkan.');
    }
    if (attempt.status === 'EXPIRED') {
      throw new BadRequestException('Waktu pengerjaan quiz telah habis.');
    }

    // Server authority: jangan terima jawaban setelah deadline.
    const quiz = await this.quizModel
      .findOne({ _id: attempt.quizId, deletedAt: null })
      .exec();
    if (!quiz) throw new NotFoundException('Quiz tidak ditemukan');
    const deadline = this.attemptDeadline(attempt, quiz.durationMinutes);
    if (new Date() > deadline) {
      attempt.status = 'EXPIRED';
      await attempt.save();
      throw new BadRequestException('Waktu pengerjaan quiz telah habis.');
    }

    // Simpan hanya questionId + selectedAnswer; isCorrect/points dihitung
    // backend saat submit (jangan percaya nilai dari client).
    attempt.answers = (dto.answers || []).map((a) => ({
      questionId: a.questionId,
      selectedAnswer: a.selectedAnswer,
    }));
    await attempt.save();
    return { attemptId: attempt._id, saved: attempt.answers.length };
  }

  // Load attempt milik user untuk quiz di path + tolak status selesai.
  // Identity dari JWT; quizId dari path (IDOR dicegah di sini).
  private async getOwnActiveAttempt(
    quizId: string,
    attemptId: string,
    userId: string,
  ) {
    const attempt = await this.quizAttemptModel
      .findOne({ _id: attemptId, deletedAt: null })
      .exec();
    if (!attempt) throw new NotFoundException('Attempt tidak ditemukan');
    if (attempt.quizId.toString() !== quizId) {
      throw new NotFoundException('Attempt tidak ditemukan');
    }
    if (attempt.userId.toString() !== userId) {
      throw new ForbiddenException(
        'Anda tidak dapat mengakses attempt milik user lain.',
      );
    }
    if (attempt.status === 'SUBMITTED' || attempt.status === 'GRADED') {
      throw new BadRequestException('Attempt sudah dikumpulkan.');
    }
    if (attempt.status === 'EXPIRED') {
      throw new BadRequestException('Waktu pengerjaan quiz telah habis.');
    }
    return attempt;
  }

  // Inti pencatatan satu event anti-cheat: SERVER timestamp (occurredAt),
  // dedupe + rate limit per attempt, risk dihitung backend. Event informasional
  // (kembali ke tab/fokus/refresh/resume) dicatat tapi TIDAK menaikkan
  // violationCount/risk. Hasil belum di-save (diserahkan pemanggil).
  private applyQuizEvent(
    attempt: PkkmbQuizAttemptDocument,
    type: QuizViolationType,
    questionId?: string,
    clientTimestamp?: string,
  ) {
    const now = new Date();
    const ac = attempt.antiCheat ?? {
      violationCount: 0,
      violations: [],
      riskLevel: 'LOW' as const,
    };
    const violations: QuizAntiCheatViolation[] = Array.isArray(ac.violations)
      ? ac.violations
      : [];

    // Rate limit per attempt (30 event/60 detik) — jangan biarkan spam.
    if (countViolationsInWindow(violations, now) >= QUIZ_VIOLATION_RATE_LIMIT) {
      return {
        recorded: false,
        rateLimited: true,
        violationCount: ac.violationCount ?? 0,
        riskLevel: ac.riskLevel ?? 'LOW',
      };
    }

    // Dedupe: tipe sama beruntun dalam 5 detik (event duplication browser).
    const last = violations[violations.length - 1];
    if (shouldDedupeViolation(last, type, now)) {
      return {
        recorded: false,
        deduplicated: true,
        violationCount: ac.violationCount ?? 0,
        riskLevel: ac.riskLevel ?? 'LOW',
      };
    }

    const informational = isInformationalType(type);
    const violationCount = (ac.violationCount ?? 0) + (informational ? 0 : 1);
    const riskLevel = riskLevelFromCount(violationCount);

    // Timestamp client (jika dikirim) hanya metadata — server time tetap
    // occurredAt. Berguna membandingkan clock skew / deteksi spoofing.
    const metadata: { questionId?: string; clientTimestamp?: string } = {};
    if (questionId) metadata.questionId = questionId;
    if (clientTimestamp) metadata.clientTimestamp = clientTimestamp;

    const next: QuizAntiCheatViolation = {
      type,
      occurredAt: now,
      ...(Object.keys(metadata).length > 0 ? { metadata } : {}),
    };
    const nextViolations = [...violations, next].slice(
      -QUIZ_VIOLATIONS_MAX_STORED,
    );

    attempt.antiCheat = {
      violationCount,
      violations:
        nextViolations as unknown as typeof attempt.antiCheat.violations,
      riskLevel,
      lastHeartbeatAt: ac.lastHeartbeatAt,
    };
    return { recorded: true, violationCount, riskLevel };
  }

  // Catat pelanggaran anti-cheat (single event). SERVER timestamp,
  // risk level dihitung backend, dedupe + rate limit per attempt.
  async reportViolation(
    quizId: string,
    attemptId: string,
    userId: string,
    dto: ReportViolationDto,
  ) {
    const attempt = await this.getOwnActiveAttempt(quizId, attemptId, userId);
    // Defense in depth (DTO juga memvalidasi via IsEnum).
    if (!isQuizViolationType(dto.type)) {
      throw new BadRequestException('Tipe pelanggaran tidak valid.');
    }

    const result = this.applyQuizEvent(attempt, dto.type, dto.questionId);
    if (result.recorded) await attempt.save();
    return { attemptId, ...result };
  }

  // Batch event anti-cheat (maks 50/request → lebih = 400). Tiap event
  // divalidasi & dicatat dengan aturan yang sama (dedupe/rate-limit/server time).
  async reportQuizEvents(
    quizId: string,
    attemptId: string,
    userId: string,
    dto: ReportQuizEventsDto,
  ) {
    if (!dto.events || dto.events.length === 0) {
      throw new BadRequestException('events wajib diisi.');
    }
    if (dto.events.length > QUIZ_EVENTS_MAX_PER_REQUEST) {
      throw new BadRequestException(
        `Maksimal ${QUIZ_EVENTS_MAX_PER_REQUEST} event per request.`,
      );
    }

    const attempt = await this.getOwnActiveAttempt(quizId, attemptId, userId);

    // Validasi SEMUA tipe dulu (all-or-nothing): jika ada satu invalid,
    // batch ditolak tanpa merekam event apapun (tidak ada partial record).
    for (const ev of dto.events) {
      if (!isQuizViolationType(ev.type)) {
        throw new BadRequestException(
          `Tipe pelanggaran tidak valid: ${String(ev.type)}`,
        );
      }
    }

    const results: {
      type: string;
      recorded: boolean;
      deduplicated?: boolean;
      rateLimited?: boolean;
      violationCount: number;
      riskLevel: string;
    }[] = [];
    let recordedCount = 0;

    for (const ev of dto.events) {
      const result = this.applyQuizEvent(
        attempt,
        ev.type,
        ev.questionId,
        ev.timestamp,
      );
      if (result.recorded) {
        recordedCount += 1;
        await attempt.save();
      }
      results.push({ type: ev.type, ...result });
    }

    return {
      attemptId,
      recordedCount,
      results,
      violationCount: attempt.antiCheat?.violationCount ?? 0,
      riskLevel: attempt.antiCheat?.riskLevel ?? 'LOW',
    };
  }

  // Heartbeat: client masih aktif. Tidak pernah menghukum otomatis — hanya
  // mencatat lastHeartbeatAt (basis untuk HEARTBEAT_TIMEOUT oleh panitia).
  async heartbeatAttempt(quizId: string, attemptId: string, userId: string) {
    const attempt = await this.quizAttemptModel
      .findOne({ _id: attemptId, deletedAt: null })
      .exec();
    if (!attempt) throw new NotFoundException('Attempt tidak ditemukan');
    if (attempt.quizId.toString() !== quizId) {
      throw new NotFoundException('Attempt tidak ditemukan');
    }
    if (attempt.userId.toString() !== userId) {
      throw new ForbiddenException(
        'Anda tidak dapat mengirim heartbeat untuk attempt milik user lain.',
      );
    }

    if (attempt.status !== 'IN_PROGRESS') {
      // Sudah dikumpulkan/expired — kembalikan status agar client berhenti.
      return {
        attemptId,
        status: attempt.status,
        lastHeartbeatAt: attempt.antiCheat?.lastHeartbeatAt ?? null,
      };
    }

    const ac = attempt.antiCheat ?? {
      violationCount: 0,
      violations: [],
      riskLevel: 'LOW' as const,
    };
    // Assign objek BARU (bukan mutasi referensi) agar perubahan tersimpan
    // oleh Mongoose untuk field bertipe embedded/mixed.
    attempt.antiCheat = {
      violationCount: ac.violationCount ?? 0,
      violations: Array.isArray(ac.violations) ? ac.violations : [],
      riskLevel: ac.riskLevel ?? 'LOW',
      lastHeartbeatAt: new Date(),
    };
    await attempt.save();
    return {
      attemptId,
      status: attempt.status,
      lastHeartbeatAt: ac.lastHeartbeatAt,
    };
  }

  // Daftar attempt + aktivitas anti-cheat utk management (tabel + timeline).
  async listQuizAttempts(quizId: string) {
    const quiz = await this.quizModel
      .findOne({ _id: quizId, deletedAt: null })
      .lean()
      .exec();
    if (!quiz) throw new NotFoundException('Quiz tidak ditemukan');

    const attempts = await this.quizAttemptModel
      .find({ quizId: quiz._id, deletedAt: null })
      .populate('userId', 'name nim')
      .sort({ startedAt: -1 })
      .lean()
      .exec();

    return attempts.map((a) => {
      const rawUser = a.userId as unknown;
      const user =
        rawUser && typeof rawUser === 'object' && '_id' in rawUser
          ? (rawUser as { _id: Types.ObjectId; name?: string; nim?: string })
          : null;
      const ac = (
        a as unknown as {
          antiCheat?: {
            violationCount?: number;
            riskLevel?: string;
            lastHeartbeatAt?: Date;
            violations?: {
              type: string;
              occurredAt: Date;
              metadata?: { questionId?: string };
            }[];
          };
        }
      ).antiCheat;
      return {
        attemptId: a._id,
        attemptNumber: a.attemptNumber,
        user: user
          ? { id: user._id, name: user.name ?? null, nim: user.nim ?? null }
          : null,
        score: a.score,
        correctCount: a.correctCount,
        totalQuestions: a.totalQuestions,
        percentage: a.percentage,
        status: a.status,
        startedAt: a.startedAt,
        submittedAt: a.submittedAt ?? null,
        antiCheat: {
          violationCount: ac?.violationCount ?? 0,
          riskLevel: ac?.riskLevel ?? 'LOW',
          lastHeartbeatAt: ac?.lastHeartbeatAt ?? null,
          violations: (ac?.violations ?? []).map((v) => ({
            type: v.type,
            occurredAt: v.occurredAt,
            questionId: v.metadata?.questionId ?? null,
          })),
        },
      };
    });
  }

  // Detail quiz utk management (termasuk soal + correctAnswer — aman utk panitia).
  async getManagementQuizDetail(quizId: string) {
    const quiz = await this.quizModel
      .findOne({ _id: quizId, deletedAt: null })
      .exec();
    if (!quiz) throw new NotFoundException('Quiz tidak ditemukan');
    return quiz;
  }

  // Dispatcher berdasar role: maba → detail aman; management → detail penuh.
  async getQuizDetail(quizId: string, userId: string, roleSlug?: string) {
    const isMaba = roleSlug === 'user' || roleSlug === 'maba';
    if (isMaba) return this.getStudentQuizDetail(quizId, userId);
    return this.getManagementQuizDetail(quizId);
  }

  // Hapus quiz (SOFT DELETE): quiz disembunyikan dari semua daftar & start,
  // tetapi histori attempt tetap utuh. Konsisten dgn pola deletedAt project.
  // Quiz yang SUDAH dipakai assignment TIDAK boleh dihapus (assignment rusak).
  async deleteQuiz(quizId: string) {
    const quiz = await this.quizModel
      .findOne({ _id: quizId, deletedAt: null })
      .exec();
    if (!quiz) throw new NotFoundException('Quiz tidak ditemukan');

    const usedByAssignment = await this.taskModel
      .findOne({
        quizId: quiz._id,
        assignmentType: 'QUIZ',
        deletedAt: null,
      })
      .select('_id title')
      .lean()
      .exec();
    if (usedByAssignment) {
      throw new BadRequestException(
        `Quiz ini sedang digunakan oleh penugasan "${usedByAssignment.title}". Hapus penugasan tersebut terlebih dahulu.`,
      );
    }

    quiz.deletedAt = new Date();
    await quiz.save();
    return { id: quiz._id, deletedAt: quiz.deletedAt };
  }

  // ─── QUIZ IMPORT / EXPORT (EXCEL) ─────────────────────────────────────────

  /** Validasi file upload: wajib ada, .xlsx, MIME wajar, ukuran <= 5 MB. */
  private assertValidImportFile(file?: Express.Multer.File): void {
    if (!file || !file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('File Excel wajib diunggah.');
    }
    const name = file.originalname || '';
    if (!name.toLowerCase().endsWith('.xlsx')) {
      throw new BadRequestException('File harus berupa Excel (.xlsx).');
    }
    // MIME hanya divalidasi jika tersedia (browser tidak selalu mengirimnya).
    const mime = file.mimetype || '';
    if (mime && mime !== 'application/octet-stream' && mime !== XLSX_MIME) {
      throw new BadRequestException('File harus berupa Excel (.xlsx).');
    }
    if (file.size > QUIZ_IMPORT_MAX_FILE_SIZE) {
      throw new BadRequestException('Ukuran file maksimal 5 MB.');
    }
  }

  private throwInvalidImport(
    message: string,
    errors: { rowNum: number; question?: string; errors: string[] }[],
  ): never {
    throw new UnprocessableEntityException({
      success: false,
      message,
      errors,
    });
  }

  // async tetap dipertahankan: controller & test memanggil dengan await /
  // .rejects (Promise API), meski implementasinya sinkron saat ini.
  // eslint-disable-next-line @typescript-eslint/require-await
  async getQuizTemplateBuffer(): Promise<Buffer> {
    return buildTemplateBuffer();
  }

  /**
   * Validasi file + parse + throw 422 bila ada error. ATOMIC: jika ada 1
   * error, seluruh file ditolak — tidak pernah ada hasil parsial.
   * `existingQuestions` opsional untuk deteksi duplikat (WARNING).
   */
  private parseImportOrThrow(
    file?: Express.Multer.File,
    existingQuestions?: QuizQuestionShape[],
  ) {
    this.assertValidImportFile(file);
    const parsed = parseQuizExcel(file!.buffer, existingQuestions);
    if (!parsed.success) {
      this.throwInvalidImport(parsed.message || 'Data soal tidak valid.', []);
    }
    if (parsed.invalidCount > 0) {
      this.throwInvalidImport(
        `Masih ada ${parsed.invalidCount} soal yang tidak valid. Perbaiki file terlebih dahulu.`,
        parsed.errors,
      );
    }
    return parsed;
  }

  /**
   * Validasi + parse file import TANPA mengubah database (untuk preview &
   * alur create — soal dipegang di Question Builder, disimpan saat Save Quiz).
   */
  // async wajib: controller `await` hasilnya & test memakai .rejects (throw
  // sinkron akan merusak kontrak Promise). Implementasi kebetulan sinkron.
  // eslint-disable-next-line @typescript-eslint/require-await
  async previewQuizImport(file?: Express.Multer.File) {
    const parsed = this.parseImportOrThrow(file);
    return { total: parsed.validCount, rows: parsed.rows };
  }

  /**
   * Import soal ke quiz EXISTING (edit flow). Selalu APPEND — soal lama tidak
   * dihapus; order dinormalisasi 1..n. Quiz tidak dipublish otomatis dan
   * konsisten dengan updateQuiz: quiz PUBLISHED tetap boleh diimport.
   *
   * Duplikat dengan soal existing = WARNING: default ditolak (422 + `duplicates`),
   * user memutuskan; `skipDuplicates=true` → lanjut import semua (tidak menimpa).
   */
  async importQuizQuestions(
    quizId: string,
    file?: Express.Multer.File,
    skipDuplicates = false,
  ) {
    const quiz = await this.quizModel
      .findOne({ _id: quizId, deletedAt: null })
      .exec();
    if (!quiz) throw new NotFoundException('Quiz tidak ditemukan');

    const existing = (quiz.questions ?? []) as QuizQuestionShape[];
    const parsed = this.parseImportOrThrow(file, existing);

    if (parsed.duplicateWithExistingCount > 0 && !skipDuplicates) {
      throw new UnprocessableEntityException({
        success: false,
        message: `${parsed.duplicateWithExistingCount} soal memiliki pertanyaan yang sudah ada di quiz.`,
        errors: [],
        duplicates: parsed.duplicatesWithExisting,
      });
    }

    const incoming = toQuizQuestions(parsed.rows);
    const merged = appendQuestions(existing, incoming);
    quiz.questions = merged;
    await quiz.save();

    return {
      quizId,
      imported: incoming.length,
      duplicateWithExisting: parsed.duplicateWithExistingCount,
      questions: merged,
    };
  }

  /** Export seluruh soal quiz → buffer Excel + nama file (management only). */
  async exportQuizQuestions(quizId: string) {
    const quiz = await this.quizModel
      .findOne({ _id: quizId, deletedAt: null })
      .lean()
      .exec();
    if (!quiz) throw new NotFoundException('Quiz tidak ditemukan');

    const questions = (quiz.questions ?? []) as QuizQuestionShape[];
    const buffer = buildExportBuffer(questions);
    return {
      buffer,
      filename: buildExportFilename(quiz.title, quiz._id.toString()),
    };
  }
}
