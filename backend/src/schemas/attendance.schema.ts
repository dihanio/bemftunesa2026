import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type AttendanceDocument = HydratedDocument<Attendance>;

@Schema({ timestamps: true })
export class Attendance {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Meeting', required: true })
  meetingId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  name: string; // denormalized for speed

  @Prop({ required: true, default: () => new Date() })
  attendedAt: Date;

  @Prop({ required: true, enum: ['qr', 'manual'] })
  method: 'qr' | 'manual';

  @Prop()
  latitude?: number;

  @Prop()
  longitude?: number;

  @Prop()
  distanceFromTarget?: number;

  @Prop()
  note?: string; // for manual check-in note: "Sakit", "Izin", etc.
}

export const AttendanceSchema = SchemaFactory.createForClass(Attendance);

// Ensure a user can check in only once per meeting
AttendanceSchema.index({ meetingId: 1, userId: 1 }, { unique: true });
AttendanceSchema.index({ meetingId: 1, attendedAt: -1 });
