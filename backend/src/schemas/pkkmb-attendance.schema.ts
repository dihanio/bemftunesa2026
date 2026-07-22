import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

// --- Attendance Session ---
export type PkkmbAttendanceSessionDocument =
  HydratedDocument<PkkmbAttendanceSession>;

@Schema({ timestamps: true })
export class PkkmbAttendanceSession {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'PkkmbGroup',
    required: true,
    index: true,
  })
  groupId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ required: true })
  title: string; // e.g., "Hari 1 - Sesi Pagi"

  @Prop({ required: true })
  date: Date;

  @Prop()
  qrToken?: string;

  @Prop()
  qrExpiry?: Date;

  @Prop({
    type: {
      latitude: Number,
      longitude: Number,
      radiusMeter: Number,
    },
  })
  coordinates?: {
    latitude: number;
    longitude: number;
    radiusMeter: number;
  };

  @Prop()
  deletedAt?: Date;
}

export const PkkmbAttendanceSessionSchema = SchemaFactory.createForClass(
  PkkmbAttendanceSession,
);

// --- Attendance Log ---
export type PkkmbAttendanceLogDocument = HydratedDocument<PkkmbAttendanceLog>;

@Schema({ timestamps: true })
export class PkkmbAttendanceLog {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'PkkmbAttendanceSession',
    required: true,
    index: true,
  })
  sessionId: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId: Types.ObjectId;

  @Prop({
    required: true,
    enum: ['Hadir', 'Telat', 'Tidak Hadir'],
    default: 'Hadir',
  })
  status: string;

  @Prop({ default: () => new Date() })
  timestamp: Date;

  @Prop()
  notes?: string;

  @Prop({
    type: {
      latitude: Number,
      longitude: Number,
    },
  })
  coordinatesUsed?: {
    latitude: number;
    longitude: number;
  };

  @Prop()
  deletedAt?: Date;
}

export const PkkmbAttendanceLogSchema =
  SchemaFactory.createForClass(PkkmbAttendanceLog);

PkkmbAttendanceLogSchema.index({ sessionId: 1, userId: 1 }, { unique: true });
