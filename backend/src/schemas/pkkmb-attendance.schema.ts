import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

// --- Attendance Session (Universal) ---
export type PkkmbAttendanceSessionDocument =
  HydratedDocument<PkkmbAttendanceSession>;

@Schema({ timestamps: true, collection: 'pkkmb_attendance_sessions' })
export class PkkmbAttendanceSession {
  @Prop({ required: true, trim: true })
  title: string; // e.g. "Hari 1 - Registrasi & Chekin Pagi", "Opening Ceremony"

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  startTime: Date;

  @Prop({ required: true })
  endTime: Date;

  @Prop({ required: true, trim: true })
  location: string; // e.g. "Gedung Dekanat FT UNESA"

  @Prop({ default: false })
  isOnline?: boolean; // remote/online session: skip geofence on self check-in

  @Prop({
    required: true,
    enum: ['ALL', 'MABA', 'PANITIA'],
    default: 'ALL',
  })
  targetParticipantType: 'ALL' | 'MABA' | 'PANITIA';

  @Prop({ trim: true })
  targetDivision?: string; // Optional filter if session is specifically for a division e.g. "Sie Acara"

  @Prop({ trim: true })
  qrCode?: string; // Payload string for QR Code scanning

  @Prop()
  qrExpiry?: Date;

  @Prop({
    required: true,
    enum: ['DRAFT', 'PUBLISHED', 'CLOSED'],
    default: 'PUBLISHED',
  })
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop()
  deletedAt?: Date;
}

export const PkkmbAttendanceSessionSchema = SchemaFactory.createForClass(
  PkkmbAttendanceSession,
);

PkkmbAttendanceSessionSchema.index({ date: 1, status: 1 });
PkkmbAttendanceSessionSchema.index({ targetParticipantType: 1 });
PkkmbAttendanceSessionSchema.index({ status: 1 });
PkkmbAttendanceSessionSchema.index({ createdBy: 1 });

// --- Attendance Record (Universal Single Log for MABA & PANITIA) ---
export type PkkmbAttendanceRecordDocument =
  HydratedDocument<PkkmbAttendanceRecord>;

@Schema({ timestamps: true, collection: 'pkkmb_attendance_records' })
export class PkkmbAttendanceRecord {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'PkkmbAttendanceSession',
    required: true,
    index: true,
  })
  session: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  participant: Types.ObjectId;

  @Prop({
    required: true,
    enum: ['MABA', 'PANITIA'],
    index: true,
  })
  participantType: 'MABA' | 'PANITIA';

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Role' })
  role?: Types.ObjectId; // For Panitia

  @Prop({ trim: true, index: true })
  division?: string; // For Panitia (e.g. "Sie Acara", "Sie Humas", "Sie Pendamping")

  @Prop({ required: true, default: () => new Date() })
  checkInTime: Date;

  @Prop()
  checkOutTime?: Date;

  @Prop({
    required: true,
    enum: ['Hadir', 'Telat', 'Izin', 'Sakit', 'Tidak Hadir'],
    default: 'Hadir',
    index: true,
  })
  status: 'Hadir' | 'Telat' | 'Izin' | 'Sakit' | 'Tidak Hadir';

  @Prop({
    required: true,
    enum: ['QR_CODE', 'MANUAL_OPERATOR', 'SEARCH_NIM', 'SELF_CHECKIN'],
    default: 'QR_CODE',
  })
  attendanceMethod:
    | 'QR_CODE'
    | 'MANUAL_OPERATOR'
    | 'SEARCH_NIM'
    | 'SELF_CHECKIN';

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  operator?: Types.ObjectId; // Operator performing manual check-in

  @Prop({ trim: true })
  device?: string; // User agent or scanner device name

  @Prop({ trim: true })
  ipAddress?: string;

  @Prop({ trim: true })
  notes?: string;

  @Prop()
  lat?: number;

  @Prop()
  lng?: number;

  @Prop({ trim: true })
  photoUrl?: string; // URL selfie saat check-in

  @Prop({ trim: true })
  proofUrl?: string; // URL bukti (surat) saat mengajukan izin/sakit

  @Prop({ trim: true })
  reason?: string; // Alasan izin/sakit

  @Prop({
    enum: ['NONE', 'PENDING', 'APPROVED', 'REJECTED'],
    default: 'NONE',
  })
  izinStatus?: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';

  @Prop()
  deletedAt?: Date;
}

export const PkkmbAttendanceRecordSchema = SchemaFactory.createForClass(
  PkkmbAttendanceRecord,
);

PkkmbAttendanceRecordSchema.index(
  { session: 1, participant: 1 },
  { unique: true },
);
PkkmbAttendanceRecordSchema.index({
  participantType: 1,
  division: 1,
  status: 1,
});
PkkmbAttendanceRecordSchema.index({ checkInTime: 1 });
PkkmbAttendanceRecordSchema.index({ participantType: 1, status: 1 });
