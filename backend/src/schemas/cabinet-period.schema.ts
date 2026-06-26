import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CabinetPeriodDocument = HydratedDocument<CabinetPeriod>;

@Schema({ timestamps: true })
export class CabinetPeriod {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  year: number;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({
    enum: ['draft', 'active', 'archived'],
    default: 'draft',
    required: true,
  })
  status: string;

  @Prop()
  deletedAt?: Date;
}

export const CabinetPeriodSchema = SchemaFactory.createForClass(CabinetPeriod);
