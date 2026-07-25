import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type PkkmbGroupDocument = HydratedDocument<PkkmbGroup>;

@Schema({ timestamps: true, collection: 'pkkmb_gugus' })
export class PkkmbGroup {
  @Prop({ required: true, unique: true, index: true })
  nomor: number; // 1 to 50

  @Prop({ required: true, trim: true })
  name: string; // e.g., "Gugus 01 - Garuda Teknik"

  @Prop({ required: true, default: 60 })
  kapasitas: number;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  pendampingId?: Types.ObjectId; // Panitia from Sie Pendamping

  @Prop({ default: 0 })
  totalPoints: number;

  @Prop({ required: true, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' })
  status: 'ACTIVE' | 'INACTIVE';

  @Prop()
  deletedAt?: Date;
}

export const PkkmbGroupSchema = SchemaFactory.createForClass(PkkmbGroup);
