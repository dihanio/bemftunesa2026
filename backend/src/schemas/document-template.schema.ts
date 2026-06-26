import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

export type DocumentTemplateDocument = DocumentTemplate & Document;


@Schema({ timestamps: true, collection: 'document_templates' })
export class DocumentTemplate {
  @Prop({ required: true })
  code: string; // e.g., 'TPL-SURAT-DELEGASI'

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  documentType: string; // e.g., 'surat', 'proposal', 'lpj'

  @Prop({ required: true, enum: ['internal', 'external'] })
  category: string;

  @Prop()
  description: string;

  @Prop({ required: true, default: 1 })
  version: number;

  @Prop({ required: true, enum: ['draft', 'validated', 'published', 'deprecated'], default: 'draft' })
  status: string;

  @Prop({ required: true, default: 'HTML', enum: ['HTML', 'DOCX', 'MD'] })
  sourceType: string;

  @Prop()
  googleDriveId?: string;

  @Prop()
  googleDriveUrl?: string;

  @Prop()
  lastSyncedAt?: Date;

  @Prop({ type: [String], default: [] })
  workflow: string[];

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  updatedBy: Types.ObjectId;
}

export const DocumentTemplateSchema = SchemaFactory.createForClass(DocumentTemplate);

// Indexes
DocumentTemplateSchema.index({ code: 1, version: 1 }, { unique: true });
DocumentTemplateSchema.index({ documentType: 1 });
DocumentTemplateSchema.index({ status: 1 });
