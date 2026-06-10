import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Meeting, Attendance, MeetingNote } from '../../database/schema/proker';
import {
  paginate,
  parsePaginationQuery,
} from '../../common/helpers/pagination.helper';
import { randomUUID } from 'crypto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { CreateMeetingDto, AddMeetingNoteDto } from './meetings.dto';

function calculateDistance(
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

  return R * c; // Distance in meters
}

@Injectable()
export class MeetingsService {
  constructor(
    @InjectModel(Meeting.name) private meetingModel: Model<Meeting>,
    @InjectModel(Attendance.name) private attendanceModel: Model<Attendance>,
    @InjectModel(MeetingNote.name) private noteModel: Model<MeetingNote>,
  ) {}

  async list(query: PaginationQueryDto) {
    return paginate(this.meetingModel, {}, parsePaginationQuery(query), [
      'title',
    ]);
  }

  async findOne(id: string) {
    const meeting = await this.meetingModel.findById(id);
    if (!meeting) throw new NotFoundException('Rapat tidak ditemukan');

    const notes = await this.noteModel.findOne({ meetingId: id });
    const attendance = await this.attendanceModel
      .find({ meetingId: id })
      .populate('userId', 'name nim email role');

    return {
      meeting,
      notes,
      attendance,
    };
  }

  async create(data: CreateMeetingDto) {
    const qrCodeUrl = `meeting-qr-${randomUUID()}`;
    const meeting = await this.meetingModel.create({ ...data, qrCodeUrl });
    return { data: meeting, message: 'Agenda rapat berhasil dibuat' };
  }

  async attend(
    meetingId: string,
    userId: string,
    latitude?: number,
    longitude?: number,
  ) {
    const meeting = await this.meetingModel.findById(meetingId);
    if (!meeting) throw new NotFoundException('Rapat tidak ditemukan');

    // Check GPS coordinates if meeting has them set
    if (
      meeting.latitude !== undefined &&
      meeting.latitude !== null &&
      meeting.longitude !== undefined &&
      meeting.longitude !== null
    ) {
      if (
        latitude === undefined ||
        latitude === null ||
        longitude === undefined ||
        longitude === null
      ) {
        throw new BadRequestException(
          'Izin lokasi GPS diperlukan untuk melakukan absensi pada rapat ini!',
        );
      }

      const radius = meeting.radius || 50; // default to 50m
      const distance = calculateDistance(
        latitude,
        longitude,
        meeting.latitude,
        meeting.longitude,
      );

      if (distance > radius) {
        throw new BadRequestException(
          `Anda berada di luar jangkauan lokasi rapat! Jarak Anda: ${Math.round(distance)}m, Batas maksimum: ${radius}m.`,
        );
      }
    }

    const exists = await this.attendanceModel.findOne({ meetingId, userId });
    if (exists) return { message: 'Sudah absen sebelumnya' };
    const attendance = await this.attendanceModel.create({ meetingId, userId });
    return { data: attendance, message: 'Absensi berhasil' };
  }

  async addNotes(meetingId: string, data: AddMeetingNoteDto) {
    const note = await this.noteModel.findOneAndUpdate(
      { meetingId },
      { $set: { content: data.content, authorId: data.authorId } },
      { new: true, upsert: true },
    );
    return { data: note, message: 'Notulensi berhasil disimpan' };
  }
}
