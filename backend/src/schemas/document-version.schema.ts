import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DocumentVersionDocument = DocumentVersion & Document;

@Schema({ timestamps: true, collection: 'document_versions' })
export class DocumentVersion {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  documentId: Types.ObjectId; // References Surat, Proposal, LPJ, etc.

  @Prop({ required: true })
  documentModel: string; // Dynamic reference model name: e.g. 'Surat', 'Proposal'

  @Prop({ required: true })
  versionNumber: number;

  @Prop({ required: true, enum: ['draft', 'review', 'numbered', 'internal_signed', 'final_external'] })
  versionType: string;

  @Prop({ required: true })
  fileUrl: string;

  @Prop()
  fileHash: string; // SHA-256 hash for integrity

  @Prop()
  fileSize: number; // in bytes

  @Prop()
  mimeType: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  uploadedBy: Types.ObjectId;

  @Prop()
  notes: string;

  @Prop({ default: false })
  isCurrent: boolean;

  @Prop()
  relatedWorkflowStage: string;
}

export const DocumentVersionSchema = SchemaFactory.createForClass(DocumentVersion);

// Indexes
DocumentVersionSchema.index({ documentId: 1, versionNumber: 1 }, { unique: true });
DocumentVersionSchema.index({ documentId: 1, isCurrent: 1 });
