import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type HealthConditionDocument = HydratedDocument<HealthCondition>;

export const HEALTH_CATEGORIES = [
  'Pernapasan',
  'Jantung',
  'Pencernaan',
  'Saraf',
  'Alergi',
  'Kronis',
  'Lainnya',
] as const;

export type HealthCategory = (typeof HEALTH_CATEGORIES)[number];

export const RISK_LEVELS = ['RENDAH', 'SEDANG', 'TINGGI'] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

// Master data penyakit yang dikelola admin/tim kesehatan.
@Schema({ timestamps: true, collection: 'health_conditions' })
export class HealthCondition {
  @Prop({ required: true, trim: true })
  name: string;

  // type: String eksplisit — HealthCategory/RiskLevel adalah union type yang
  // tidak bisa di-infer mongoose (Cannot determine a type for the field).
  @Prop({ type: String, required: true, enum: HEALTH_CATEGORIES })
  category: HealthCategory;

  @Prop({ type: String, required: true, enum: RISK_LEVELS, default: 'RENDAH' })
  riskLevel: RiskLevel;

  @Prop({ default: true })
  isActive: boolean;
}

export const HealthConditionSchema =
  SchemaFactory.createForClass(HealthCondition);
HealthConditionSchema.index({ name: 1 }, { unique: true });
