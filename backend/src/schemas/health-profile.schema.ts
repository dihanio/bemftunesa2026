import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import type { RiskLevel } from './health-condition.schema';

export type HealthProfileDocument = HydratedDocument<HealthProfile>;

export const EMERGENCY_RELATIONS = [
  'Ayah',
  'Ibu',
  'Wali',
  'Saudara',
  'Keluarga lainnya',
] as const;

// Profil kesehatan per mahasiswa (satu-ke-satu dengan user).
@Schema({ timestamps: true, collection: 'health_profiles' })
export class HealthProfile {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  })
  studentId: MongooseSchema.Types.ObjectId;

  @Prop({ default: false })
  hasMedicalHistory: boolean;

  @Prop({ default: false })
  isDisabled: boolean;

  @Prop()
  disabilityDescription?: string;

  @Prop()
  bpjsNumber?: string;

  @Prop()
  bpjsStatus?: string;

  @Prop()
  emergencyContactName?: string;

  @Prop({ enum: EMERGENCY_RELATIONS })
  emergencyContactRelation?: string;

  @Prop()
  emergencyContactPhone?: string;

  // type: String eksplisit — RiskLevel adalah union type yang tidak bisa
  // di-infer mongoose (error: Cannot determine a type for the field).
  @Prop({
    type: String,
    enum: ['RENDAH', 'SEDANG', 'TINGGI'],
    default: 'RENDAH',
  })
  overallRiskLevel: RiskLevel;
}

export const HealthProfileSchema = SchemaFactory.createForClass(HealthProfile);
