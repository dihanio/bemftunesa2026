import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type HealthRecordDocument = HydratedDocument<HealthRecord>;

export const CONDITION_STATUSES = [
  'Sudah sembuh',
  'Terkontrol',
  'Masih aktif',
  'Sering kambuh',
] as const;

// Satu riwayat penyakit yang dimiliki mahasiswa (relasi ke master condition).
@Schema({ timestamps: true, collection: 'health_records' })
export class HealthRecord {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  studentId: MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'HealthCondition',
    required: true,
  })
  conditionId: MongooseSchema.Types.ObjectId;

  @Prop()
  yearStart?: number;

  @Prop({ enum: CONDITION_STATUSES, default: 'Masih aktif' })
  conditionStatus: string;

  @Prop({ default: false })
  needsMedication: boolean;

  @Prop()
  notes?: string;
}

export const HealthRecordSchema = SchemaFactory.createForClass(HealthRecord);
HealthRecordSchema.index({ studentId: 1, conditionId: 1 });
