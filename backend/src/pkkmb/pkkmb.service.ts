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
}
