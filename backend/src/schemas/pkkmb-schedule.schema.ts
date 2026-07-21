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

  @Prop()
  deletedAt?: Date;
}

export const PkkmbScheduleSchema = SchemaFactory.createForClass(PkkmbSchedule);
