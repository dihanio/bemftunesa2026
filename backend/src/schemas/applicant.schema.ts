import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type ApplicantDocument = HydratedDocument<Applicant>;

export const APPLICANT_STATUSES = [
  'waiting_review',
  'passed_review',
  'failed_review',
  'interview_scheduled',
  'interviewed',
  'accepted',
  'rejected',
  'withdrawn',
] as const;

export type ApplicantStatus = (typeof APPLICANT_STATUSES)[number];

@Schema({ _id: false })
export class ApplicantCv {
  @Prop({ trim: true })
  url: string;

  @Prop({ trim: true })
  filename: string;

  @Prop({ default: () => new Date() })
  uploadedAt: Date;
}

@Schema({ _id: false })
export class InterviewScoring {
  @Prop({ min: 0, max: 100 })
  communication?: number;

  @Prop({ min: 0, max: 100 })
  motivation?: number;

  @Prop({ min: 0, max: 100 })
  teamwork?: number;

  @Prop({ min: 0, max: 100 })
  leadership?: number;

  @Prop({ min: 0, max: 100 })
  technical?: number;

  @Prop({ min: 0, max: 100 })
  finalScore?: number; // ponytail: computed by backend, never from client
}

@Schema({ _id: false })
export class InterviewData {
  @Prop()
  scheduledAt: Date;

  @Prop({ trim: true })
  location: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  interviewerId?: Types.ObjectId;

  @Prop({ trim: true })
  interviewerName?: string;

  @Prop({ type: InterviewScoring })
  scoring?: InterviewScoring;

  @Prop()
  notes?: string;

  @Prop()
  completedAt?: Date;
}

@Schema({ _id: false })
export class StatusHistoryEntry {
  @Prop({ required: true })
  status: string;

  @Prop({ default: () => new Date() })
  updatedAt: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  updatedBy?: Types.ObjectId;

  @Prop()
  notes?: string;
}

@Schema({ timestamps: true, collection: 'applicants' })
export class Applicant {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Recruitment',
    required: true,
  })
  recruitmentId: Types.ObjectId;

  // ── Data Wajib ──
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  nim: string;

  @Prop({ required: true, trim: true, lowercase: true })
  email: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ required: true, trim: true })
  department: string;

  @Prop({ required: true, trim: true })
  batch: string;

  @Prop({ required: true, trim: true })
  positionChoice: string;

  @Prop()
  motivation?: string;

  // ── Data Opsional ──
  @Prop({ type: ApplicantCv })
  cv?: ApplicantCv;

  @Prop({ trim: true })
  portfolioUrl?: string;

  @Prop({ trim: true })
  instagramUrl?: string;

  @Prop({ trim: true })
  linkedinUrl?: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  extraFields?: Record<string, unknown>; // ponytail: extensible tanpa migrasi

  // ── Status ──
  @Prop({ type: String, enum: APPLICANT_STATUSES, default: 'waiting_review' })
  status: ApplicantStatus;

  @Prop({ type: [StatusHistoryEntry], default: [] })
  statusHistory: StatusHistoryEntry[];

  @Prop()
  adminNotes?: string;

  // ── Wawancara (embedded) ──
  @Prop({ type: InterviewData })
  interview?: InterviewData;
}

export const ApplicantSchema = SchemaFactory.createForClass(Applicant);
ApplicantSchema.index({ recruitmentId: 1, nim: 1 }, { unique: true });
ApplicantSchema.index({ recruitmentId: 1, email: 1 }, { unique: true });
ApplicantSchema.index({ recruitmentId: 1, status: 1 });
