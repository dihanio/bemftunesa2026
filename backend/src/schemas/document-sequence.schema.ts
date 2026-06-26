import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

export type DocumentSequenceDocument = DocumentSequence & Document;

@Schema({ timestamps: true })
export class DocumentSequence {
  @Prop({ required: true })
  documentType: string;

  // e.g. "YEAR:2026|CABINET:60d5ec...", "GLOBAL", "YEAR:2026|MONTH:7"
  @Prop({ required: true })
  scopeKey: string; 

  @Prop({ required: true, default: 0 })
  lastSequence: number;
}

export const DocumentSequenceSchema = SchemaFactory.createForClass(DocumentSequence);

// Ensure only one sequence tracker per documentType + scopeKey
DocumentSequenceSchema.index({ documentType: 1, scopeKey: 1 }, { unique: true });
