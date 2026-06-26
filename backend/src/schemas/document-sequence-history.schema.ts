import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

export type DocumentSequenceHistoryDocument = DocumentSequenceHistory & Document;

export enum SequenceStatus {
  RESERVED = 'reserved',
  COMMITTED = 'committed',
  VOID = 'void',
}

@Schema({ timestamps: true })
export class DocumentSequenceHistory {
  @Prop({ required: true })
  documentType: string;

  @Prop({ required: true })
  scopeKey: string;

  @Prop({ required: true })
  sequence: number;

  @Prop({ required: true })
  generatedNumber: string; // The formatted string

  @Prop({ required: true, enum: SequenceStatus, default: SequenceStatus.RESERVED })
  status: SequenceStatus;

  // The ID of the actual document using this number (e.g. Surat ID)
  @Prop({ type: MongooseSchema.Types.ObjectId })
  documentId?: Types.ObjectId; 

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  generatedBy?: Types.ObjectId;
}

export const DocumentSequenceHistorySchema = SchemaFactory.createForClass(DocumentSequenceHistory);

DocumentSequenceHistorySchema.index({ documentType: 1, scopeKey: 1, sequence: 1 }, { unique: true });
