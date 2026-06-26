import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type MeetingDocument = HydratedDocument<Meeting>;

@Schema({ timestamps: true })
export class Meeting {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'CabinetPeriod', required: true })
  cabinetPeriod: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Department', required: false })
  department?: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  scheduledAt: Date;

  @Prop()
  endedAt?: Date;

  @Prop({ required: true })
  date: Date; // mapped to scheduledAt for legacy compatibility

  @Prop({
    type: {
      name: { type: String, required: true },
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      radiusInMeters: { type: Number, default: 100 },
    },
    required: true,
  })
  location: {
    name: string;
    latitude: number;
    longitude: number;
    radiusInMeters: number;
  };

  @Prop({ required: true })
  qrSecret: string;

  @Prop({ required: true })
  qrExpiresAt: Date;

  @Prop({ required: true, enum: ['scheduled', 'ongoing', 'ended'], default: 'scheduled' })
  status: 'scheduled' | 'ongoing' | 'ended';

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  createdBy: MongooseSchema.Types.ObjectId;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }], default: [] })
  attendees?: MongooseSchema.Types.ObjectId[]; // kept for legacy meetings module compatibility

  @Prop()
  minutes?: string;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Document' }], default: [] })
  attachments?: MongooseSchema.Types.ObjectId[];

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Task' }], default: [] })
  actionItems?: MongooseSchema.Types.ObjectId[];

  @Prop()
  deletedAt?: Date;
}

export const MeetingSchema = SchemaFactory.createForClass(Meeting);

MeetingSchema.index({ cabinetPeriod: 1, department: 1, date: -1 });
MeetingSchema.index({ status: 1 });
MeetingSchema.index({ createdBy: 1 });
