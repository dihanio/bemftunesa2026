import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ProkerDocument = HydratedDocument<Proker>;

@Schema({ _id: false })
export class ProkerTask {
  @Prop({ required: true })
  id!: string;

  @Prop({ required: true })
  title!: string;

  @Prop({
    required: true,
    enum: ['To Do', 'In Progress', 'Done'],
    default: 'To Do',
  })
  status!: string;

  @Prop()
  division?: string;

  @Prop()
  assigneeId?: string;

  @Prop({ default: 0 })
  points?: number;

  @Prop()
  deadline?: string;
}
export const ProkerTaskSchema = SchemaFactory.createForClass(ProkerTask);

@Schema({ _id: false })
export class ProkerLedger {
  @Prop({ required: true })
  id!: string;

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  amount!: number;

  @Prop({ required: true, enum: ['Masuk', 'Keluar'] })
  type!: string;

  @Prop({ required: true })
  date!: string;

  @Prop()
  notes?: string;
}
export const ProkerLedgerSchema = SchemaFactory.createForClass(ProkerLedger);

@Schema({ _id: false })
export class ProkerAsset {
  @Prop({ required: true })
  id!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, default: 1 })
  quantity!: number;

  @Prop({
    required: true,
    enum: ['Pending', 'Disetujui', 'Ditolak'],
    default: 'Pending',
  })
  status!: string;

  @Prop()
  deadline?: string;
}
export const ProkerAssetSchema = SchemaFactory.createForClass(ProkerAsset);

@Schema({ _id: false })
export class ProkerComment {
  @Prop({ required: true })
  id!: string;

  @Prop({ required: true })
  authorName!: string;

  @Prop({ required: true })
  content!: string;

  @Prop({ required: true })
  date!: string;
}
export const ProkerCommentSchema = SchemaFactory.createForClass(ProkerComment);

@Schema({ _id: false })
export class ProkerMilestone {
  @Prop({ required: true })
  id!: string;

  @Prop({ required: true })
  title!: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  targetDate!: string;

  @Prop()
  completedDate?: string;

  @Prop({
    required: true,
    enum: ['Belum Mulai', 'Berjalan', 'Selesai', 'Terlambat'],
    default: 'Belum Mulai',
  })
  status!: string;
}
export const ProkerMilestoneSchema =
  SchemaFactory.createForClass(ProkerMilestone);

@Schema({ _id: false })
export class ProkerKpiTarget {
  @Prop({ required: true })
  id!: string;

  @Prop({ required: true })
  indicator!: string;

  @Prop({ required: true })
  target!: number;

  @Prop({ required: true, default: 0 })
  actual!: number;

  @Prop({ required: true })
  unit!: string;

  @Prop()
  notes?: string;
}
export const ProkerKpiTargetSchema =
  SchemaFactory.createForClass(ProkerKpiTarget);

@Schema({ timestamps: true })
export class Proker {
  @Prop({ required: true })
  title!: string;

  @Prop({ required: true, unique: true })
  slug!: string;

  @Prop()
  description?: string;

  @Prop({ type: Types.ObjectId, ref: 'Department', required: true })
  departmentId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  pjId?: Types.ObjectId; // Penanggung Jawab

  @Prop({
    type: String,
    enum: [
      'Planning',
      'Active',
      'Event Finished',
      'LPJ Revision',
      'LPJ Approved',
      'Archived',
      'In Progress',
      'Completed',
      'Cancelled',
    ],
    default: 'Planning',
  })
  status!: string;

  @Prop({ default: 0, min: 0, max: 100 })
  progress!: number;

  @Prop()
  startDate?: Date;

  @Prop()
  endDate?: Date;

  @Prop()
  budget?: number;

  @Prop()
  location?: string;

  @Prop({ default: null })
  deletedAt?: Date;

  @Prop({ type: [ProkerTaskSchema], default: [] })
  tasks?: ProkerTask[];

  @Prop({ type: [ProkerLedgerSchema], default: [] })
  ledger?: ProkerLedger[];

  @Prop({ type: [ProkerAssetSchema], default: [] })
  assets?: ProkerAsset[];

  @Prop({ type: [ProkerCommentSchema], default: [] })
  comments?: ProkerComment[];

  @Prop({ type: [ProkerMilestoneSchema], default: [] })
  milestones?: ProkerMilestone[];

  @Prop({ type: [ProkerKpiTargetSchema], default: [] })
  kpiTargets?: ProkerKpiTarget[];

  @Prop({ type: [String], default: [] })
  logs?: string[];

  @Prop({
    type: {
      rundown: { type: Boolean, default: false },
      rab: { type: Boolean, default: false },
      spj: { type: Boolean, default: false },
      presensi: { type: Boolean, default: false },
      kwitansi: { type: Boolean, default: false },
      dokumentasi: { type: Boolean, default: false },
    },
    default: {
      rundown: false,
      rab: false,
      spj: false,
      presensi: false,
      kwitansi: false,
      dokumentasi: false,
    },
  })
  lpjChecklist?: {
    rundown: boolean;
    rab: boolean;
    spj: boolean;
    presensi: boolean;
    kwitansi: boolean;
    dokumentasi: boolean;
  };
}

export const ProkerSchema = SchemaFactory.createForClass(Proker);

@Schema({ timestamps: true })
export class ProkerMember {
  @Prop({ type: Types.ObjectId, ref: 'Proker', required: true })
  prokerId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ required: true })
  roleInProker!: string; // e.g., 'Ketua Pelaksana', 'Sekretaris'

  @Prop({ default: null })
  deletedAt?: Date;
}

export const ProkerMemberSchema = SchemaFactory.createForClass(ProkerMember);

@Schema({ timestamps: true })
export class Committee {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Proker', required: true })
  prokerId!: Types.ObjectId;

  @Prop()
  position?: string;

  @Prop()
  division?: string; // e.g., 'Acara', 'Konsumsi', 'PDD', 'Humas'

  @Prop()
  period?: string; // e.g., '2026'

  @Prop({
    type: String,
    enum: ['Active', 'Archived'],
    default: 'Active',
  })
  status!: string;

  @Prop()
  archivedAt?: Date;

  @Prop({ default: null })
  deletedAt?: Date;
}

export const CommitteeSchema = SchemaFactory.createForClass(Committee);

@Schema({ timestamps: true })
export class Event {
  @Prop({ required: true })
  title!: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  startTime!: Date;

  @Prop({ required: true })
  endTime!: Date;

  @Prop()
  location?: string;

  @Prop({ type: Types.ObjectId, ref: 'Department' })
  organizerDeptId?: Types.ObjectId;

  @Prop({ default: true })
  isPublic!: boolean;

  @Prop({ default: null })
  deletedAt?: Date;
}

export const EventSchema = SchemaFactory.createForClass(Event);

@Schema({ timestamps: true })
export class Meeting {
  @Prop({ required: true })
  title!: string;

  @Prop({ type: Types.ObjectId, ref: 'Proker' })
  prokerId?: Types.ObjectId;

  @Prop({ required: true })
  date!: Date;

  @Prop()
  location?: string;

  @Prop()
  qrCodeUrl?: string; // For attendance

  @Prop({ type: Number })
  latitude?: number;

  @Prop({ type: Number })
  longitude?: number;

  @Prop({ type: Number })
  radius?: number; // in meters

  @Prop({ default: null })
  deletedAt?: Date;
}

export const MeetingSchema = SchemaFactory.createForClass(Meeting);

@Schema({ timestamps: true })
export class Attendance {
  @Prop({ type: Types.ObjectId, ref: 'Meeting', required: true })
  meetingId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ default: Date.now })
  attendedAt!: Date;
}

export const AttendanceSchema = SchemaFactory.createForClass(Attendance);

@Schema({ timestamps: true })
export class MeetingNote {
  @Prop({ type: Types.ObjectId, ref: 'Meeting', required: true })
  meetingId!: Types.ObjectId;

  @Prop({ required: true })
  content!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  authorId!: Types.ObjectId;
}

export const MeetingNoteSchema = SchemaFactory.createForClass(MeetingNote);
