import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Applicant {
  @Prop({ required: true })
  fullName!: string;

  @Prop({ required: true, unique: true })
  nim!: string;

  @Prop({ required: true })
  email!: string;

  @Prop()
  phone?: string;

  @Prop()
  whatsapp?: string;

  @Prop({ type: Types.ObjectId, ref: 'Department' })
  firstChoiceDeptId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Department' })
  secondChoiceDeptId?: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['Fungsionaris', 'Panitia', 'Magang'],
    default: 'Panitia',
  })
  applyType!: string;

  @Prop({ type: Types.ObjectId, ref: 'Proker' })
  firstChoiceProkerId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Proker' })
  secondChoiceProkerId?: Types.ObjectId;

  @Prop()
  motivation?: string;

  @Prop()
  cvUrl?: string;

  @Prop()
  photoUrl?: string;

  @Prop()
  portfolioUrl?: string;

  @Prop({
    type: String,
    enum: ['Pending', 'Screening', 'Interview', 'Accepted', 'Rejected'],
    default: 'Pending',
  })
  status!: string;

  @Prop({ default: null })
  deletedAt?: Date;
}

export const ApplicantSchema = SchemaFactory.createForClass(Applicant);

@Schema({ timestamps: true })
export class RecruitmentScore {
  @Prop({ type: Types.ObjectId, ref: 'Applicant', required: true })
  applicantId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  interviewerId!: Types.ObjectId;

  @Prop()
  score?: number;

  @Prop({ type: Object })
  criteria?: Record<string, number>; // e.g., { komunikasi: 8, motivasi: 9 }

  @Prop()
  notes?: string;
}

export const RecruitmentScoreSchema =
  SchemaFactory.createForClass(RecruitmentScore);

@Schema({ timestamps: true })
export class RecruitmentSchedule {
  @Prop({ type: Types.ObjectId, ref: 'Applicant', required: true })
  applicantId!: Types.ObjectId;

  @Prop()
  interviewDate?: Date;

  @Prop()
  location?: string;

  @Prop()
  zoomLink?: string;
}

export const RecruitmentScheduleSchema =
  SchemaFactory.createForClass(RecruitmentSchedule);

@Schema({ timestamps: true })
export class RecruitmentConfig {
  @Prop({ required: true, unique: true })
  period!: string; // e.g., 'Winter 2026'

  @Prop({ default: false })
  isOpen!: boolean;

  @Prop()
  startDate?: Date;

  @Prop()
  endDate?: Date;
}

export const RecruitmentConfigSchema =
  SchemaFactory.createForClass(RecruitmentConfig);
