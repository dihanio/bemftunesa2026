import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PkkmbGroupDocument = HydratedDocument<PkkmbGroup>;

@Schema({ timestamps: true })
export class PkkmbGroup {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ default: 0 })
  totalPoints: number;

  @Prop()
  deletedAt?: Date;
}

export const PkkmbGroupSchema = SchemaFactory.createForClass(PkkmbGroup);
