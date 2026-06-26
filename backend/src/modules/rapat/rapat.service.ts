import {
  BadRequestException, Injectable, NotFoundException, Inject, forwardRef
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as crypto from 'crypto';
import { Meeting, MeetingDocument } from '../../schemas/meeting.schema';
import { Attendance, AttendanceDocument } from '../../schemas/attendance.schema';
import { User, UserDocument } from '../../schemas/user.schema';
import {
  CreateRapatDto, ManualAttendDto, QrAttendDto, UpdateRapatDto,
} from './dto/rapat.dto';
import { generateQrToken, verifyQrToken, getDistanceInMeters } from './rapat.util';
import { RapatGateway } from './rapat.gateway';

@Injectable()
export class RapatService {
  constructor(
    @InjectModel(Meeting.name) private meetingModel: Model<MeetingDocument>,
    @InjectModel(Attendance.name) private attendanceModel: Model<AttendanceDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @Inject(forwardRef(() => RapatGateway)) private rapatGateway: RapatGateway,
  ) {}

  async findAll(cabinetPeriod: string): Promise<any[]> {
    const meetings = await this.meetingModel
      .find({ cabinetPeriod: new Types.ObjectId(cabinetPeriod) })
      .populate('createdBy', 'name email')
      .sort({ scheduledAt: -1 })
      .lean();

    // Map each meeting to include the dynamic count of attendees
    return Promise.all(meetings.map(async (m) => {
      const attendeeCount = await this.attendanceModel.countDocuments({
        meetingId: m._id,
      });
      return {
        ...m,
        attendeeCount,
      };
    }));
  }

  async findOne(id: string): Promise<any> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid ID');
    const meeting = await this.meetingModel
      .findById(id)
      .populate('createdBy', 'name email')
      .lean();
    if (!meeting) throw new NotFoundException('Rapat tidak ditemukan');

    const attendees = await this.attendanceModel
      .find({ meetingId: new Types.ObjectId(id) })
      .populate('userId', 'name email')
      .sort({ attendedAt: -1 })
      .lean();

    return {
      ...meeting,
      attendees,
    };
  }

  async create(dto: CreateRapatDto, userId: string) {
    const qrSecret = crypto.randomBytes(32).toString('hex');
    const scheduledDate = new Date(dto.scheduledAt);
    return this.meetingModel.create({
      ...dto,
      scheduledAt: scheduledDate,
      date: scheduledDate,
      cabinetPeriod: new Types.ObjectId(dto.cabinetPeriod),
      createdBy: new Types.ObjectId(userId),
      qrSecret,
      qrExpiresAt: new Date(Date.now() + 30000),
      status: 'scheduled',
    });
  }

  async update(id: string, dto: UpdateRapatDto) {
    const rapat = await this.meetingModel.findById(id);
    if (!rapat) throw new NotFoundException('Rapat tidak ditemukan');
    if (rapat.status === 'ended') {
      throw new BadRequestException('Rapat yang telah berakhir tidak dapat diedit');
    }
    return this.meetingModel.findByIdAndUpdate(id, dto, { new: true });
  }

  async startRapat(id: string) {
    const updated = await this.meetingModel.findByIdAndUpdate(
      id,
      { status: 'ongoing' },
      { new: true },
    );
    if (updated) {
      this.rapatGateway.emitStatusChange(id, 'ongoing');
    }
    return updated;
  }

  async endRapat(id: string) {
    const updated = await this.meetingModel.findByIdAndUpdate(
      id,
      { status: 'ended', endedAt: new Date() },
      { new: true },
    );
    if (updated) {
      this.rapatGateway.emitStatusChange(id, 'ended');
    }
    return updated;
  }

  async getQrToken(id: string) {
    const rapat = await this.meetingModel.findById(id);
    if (!rapat) throw new NotFoundException('Rapat tidak ditemukan');
    if (rapat.status !== 'ongoing') {
      throw new BadRequestException('Rapat belum dimulai atau sudah berakhir');
    }
    const token = generateQrToken(id, rapat.qrSecret);
    const expiresAt = new Date(
      Math.ceil(Date.now() / 30000) * 30000
    );
    return { token, expiresAt };
  }

  async attendByQr(id: string, dto: QrAttendDto, userId: string, userName: string) {
    const rapat = await this.meetingModel.findById(id);
    if (!rapat) throw new NotFoundException('Rapat tidak ditemukan');
    if (rapat.status !== 'ongoing') {
      throw new BadRequestException('Rapat belum dimulai atau sudah berakhir');
    }

    // Verify token
    if (!verifyQrToken(dto.token, id, rapat.qrSecret)) {
      throw new BadRequestException('QR Code tidak valid atau sudah kadaluarsa');
    }

    // Check if already checked-in using standalone Attendance collection
    const alreadyAttended = await this.attendanceModel.findOne({
      meetingId: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    });
    if (alreadyAttended) {
      throw new BadRequestException('Anda sudah melakukan absensi');
    }

    // Geofence check
    const distance = getDistanceInMeters(
      dto.latitude, dto.longitude,
      rapat.location.latitude, rapat.location.longitude,
    );
    if (distance > rapat.location.radiusInMeters) {
      throw new BadRequestException(
        `Anda berada ${Math.round(distance)}m dari lokasi rapat. Maksimal ${rapat.location.radiusInMeters}m.`,
      );
    }

    const attendee = await this.attendanceModel.create({
      meetingId: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
      name: userName,
      attendedAt: new Date(),
      method: 'qr',
      latitude: dto.latitude,
      longitude: dto.longitude,
      distanceFromTarget: Math.round(distance),
    });

    this.rapatGateway.emitNewAttendee(id, attendee);

    return attendee;
  }

  async attendManual(id: string, dto: ManualAttendDto, adminId: string) {
    const rapat = await this.meetingModel.findById(id);
    if (!rapat) throw new NotFoundException('Rapat tidak ditemukan');
    if (rapat.status === 'ended') {
      throw new BadRequestException('Rapat sudah berakhir');
    }

    const alreadyAttended = await this.attendanceModel.findOne({
      meetingId: new Types.ObjectId(id),
      userId: new Types.ObjectId(dto.userId),
    });
    if (alreadyAttended) {
      throw new BadRequestException('User sudah melakukan absensi');
    }

    // Fetch user name from User collection
    const user = await this.userModel.findById(dto.userId).lean();
    const userName = user ? user.name : 'Manual Entry';

    const attendee = await this.attendanceModel.create({
      meetingId: new Types.ObjectId(id),
      userId: new Types.ObjectId(dto.userId),
      name: userName,
      attendedAt: new Date(),
      method: 'manual',
      note: dto.note || '',
    });

    this.rapatGateway.emitNewAttendee(id, attendee);

    return attendee;
  }

  async removeAttendee(rapatId: string, userId: string) {
    const result = await this.attendanceModel.findOneAndDelete({
      meetingId: new Types.ObjectId(rapatId),
      userId: new Types.ObjectId(userId),
    });
    return this.meetingModel.findById(rapatId);
  }
}
