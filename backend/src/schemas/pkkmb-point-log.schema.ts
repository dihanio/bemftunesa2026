import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type PkkmbPointLogDocument = HydratedDocument<PkkmbPointLog>;

@Schema({ timestamps: true })
export class PkkmbPointLog {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'PkkmbGroup',
    required: true,
    index: true,
  })
  groupId: Types.ObjectId;

  @Prop({ required: true })
  points: number; // Bisa positif atau negatif

  @Prop({ required: true })
  source: string; // e.g. "Games", "Kedisiplinan", "Kehadiran"

  @Prop()
  reason: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId; // Siapa yang memberikan poin

  @Prop()
  deletedAt?: Date;
}

export const PkkmbPointLogSchema = SchemaFactory.createForClass(PkkmbPointLog);
