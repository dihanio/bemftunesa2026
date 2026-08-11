import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PkkmbScheduleDocument = HydratedDocument<PkkmbSchedule>;

@Schema({ timestamps: true })
export class PkkmbSchedule {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  startTime: Date;

  @Prop({ required: true })
  endTime: Date;

  @Prop()
  location: string;

  @Prop()
  pic: string;

  // Online (daring) atau Offline (tatap muka) — default tatap muka.
  @Prop({ default: false })
  isOnline: boolean;

  @Prop()
  deletedAt?: Date;
}

export const PkkmbScheduleSchema = SchemaFactory.createForClass(PkkmbSchedule);

PkkmbScheduleSchema.index({ startTime: 1, deletedAt: 1 });
PkkmbScheduleSchema.index({ deletedAt: 1 });
