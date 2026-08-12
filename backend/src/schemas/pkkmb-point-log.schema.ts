import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type PkkmbPointLogDocument = HydratedDocument<PkkmbPointLog>;

@Schema({ timestamps: true })
export class PkkmbPointLog {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'PkkmbGroup',
    required: false,
    index: true,
  })
  groupId: Types.ObjectId;
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', index: true })
  userId?: Types.ObjectId;

  @Prop({ required: true })
  points: number; // Bisa positif atau negatif

  @Prop({ required: true })
  source: string; // e.g. "Games", "Kedisiplinan", "Kehadiran"

  @Prop()
  reason: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId; // Siapa yang memberikan poin

  // Referensi sesi QR poin (klaim QR keaktifan). Dipakai utk unique index
  // (userId + qrPointId) agar 1 maba hanya bisa klaim 1× per QR.
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'PkkmbQrPoint' })
  qrPointId?: Types.ObjectId;

  @Prop()
  deletedAt?: Date;
}

export const PkkmbPointLogSchema = SchemaFactory.createForClass(PkkmbPointLog);

PkkmbPointLogSchema.index({ groupId: 1, deletedAt: 1 });
PkkmbPointLogSchema.index(
  { userId: 1, qrPointId: 1 },
  { unique: true, partialFilterExpression: { qrPointId: { $type: 'objectId' } } },
);
