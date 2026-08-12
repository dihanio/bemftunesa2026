import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type PkkmbQrPointDocument = HydratedDocument<PkkmbQrPoint>;

// Sesi "QR Poin Keaktifan": panitia membuat 1 QR umum (dicetak/ditempel).
// Semua maba yang memindai QR (atau memasukkan kode) mendapat poin —
// maksimal 1× per maba per sesi (dijaga unique index di PkkmbPointLog).
@Schema({ timestamps: true })
export class PkkmbQrPoint {
  @Prop({ required: true, trim: true })
  title: string; // e.g. "Games PKKMB — Ice Breaking"

  @Prop({ required: true })
  points: number; // Poin yang diberikan per klaim

  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  code: string; // Payload QR, e.g. "PKKMBQ_AB12CD"

  @Prop({
    required: true,
    enum: ['ACTIVE', 'CLOSED'],
    default: 'ACTIVE',
    index: true,
  })
  status: 'ACTIVE' | 'CLOSED';

  @Prop({ required: true })
  startTime: Date;

  @Prop({ required: true })
  endTime: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop()
  deletedAt?: Date;
}

export const PkkmbQrPointSchema = SchemaFactory.createForClass(PkkmbQrPoint);

PkkmbQrPointSchema.index({ status: 1, deletedAt: 1, endTime: 1 });
