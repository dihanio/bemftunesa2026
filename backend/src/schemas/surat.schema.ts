import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

export type SuratDocument = Surat & Document;

export type SuratType = 'incoming' | 'outgoing';
export type SuratCategory = 'internal' | 'external';

@Schema({ _id: false })
export class AiMetadata {
  @Prop() provider: string;
  @Prop() model: string;
  @Prop() prompt: string;
  @Prop({ type: [MongooseSchema.Types.Mixed], default: [] }) revisionHistory: any[];
  @Prop() generatedAt: Date;
  @Prop({ type: Types.ObjectId, ref: 'User' }) generatedBy: Types.ObjectId;
}

@Schema({ _id: false })
export class SignatureData {
  @Prop({ enum: ['image', 'qr', 'certificate', 'bsre'] }) type: string;
  @Prop() data: string; // URL to image, or hash/signature string
  @Prop() signedAt: Date;
  @Prop({ type: Types.ObjectId, ref: 'User' }) signedBy: Types.ObjectId;
}

@Schema({ timestamps: true })
export class Surat {
  @Prop({ required: true })
  title: string;

  @Prop({ default: '' })
  letterNumber: string;

  @Prop({ required: true, enum: ['incoming', 'outgoing'] })
  type: SuratType;

  @Prop({ required: true, enum: ['internal', 'external'] })
  category: SuratCategory;

  @Prop({ required: true })
  sender: string;

  @Prop({ required: true })
  recipient: string;

  @Prop({ type: Types.ObjectId, ref: 'DocumentVersion' })
  currentVersion: Types.ObjectId; // Pointer to the active DocumentVersion

  @Prop()
  summary: string;

  @Prop({ type: [String], default: [] })
  attachments: string[];

  @Prop({ type: Types.ObjectId, ref: 'DocumentTemplate' })
  template: Types.ObjectId;

  @Prop({ type: AiMetadata })
  aiMetadata: AiMetadata;

  @Prop({ type: Types.ObjectId, ref: 'WorkflowInstance' })
  workflowInstance: Types.ObjectId; // Reference to the active workflow

  @Prop({ type: SignatureData })
  signature: SignatureData;

  @Prop({ default: '' })
  notes: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  submittedBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  approvedBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Department' })
  department: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'CabinetPeriod' })
  cabinetPeriod: Types.ObjectId;

  // Optimistic Locking & Soft Delete
  @Prop({ default: 1 })
  revision: number; // Custom revision for optimistic lock

  @Prop()
  deletedAt: Date;
}

export const SuratSchema = SchemaFactory.createForClass(Surat);

// Prevent duplicate letter numbers within same cabinet period (ignoring empty strings and deleted records)
SuratSchema.index(
  { letterNumber: 1, cabinetPeriod: 1 },
  { unique: true, sparse: true, partialFilterExpression: { letterNumber: { $ne: '' }, deletedAt: { $exists: false } } }
);

// Middleware for Optimistic Locking
SuratSchema.pre('save', function(next) {
  if (!this.isNew && this.isModified()) {
    this.revision = (this.revision || 1) + 1;
  }
  next();
});

