import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DocumentNumberingFormatDocument = DocumentNumberingFormat & Document;

@Schema({ timestamps: true })
export class DocumentNumberingFormat {
  @Prop({ required: true, unique: true })
  documentType: string;

  @Prop({ required: true })
  formatPattern: string; 

  @Prop({ required: true, default: 3 })
  sequenceLength: number;

  @Prop({ 
    required: true, 
    enum: ['never', 'monthly', 'quarterly', 'semester', 'yearly', 'cabinet_period'], 
    default: 'yearly' 
  })
  resetPeriod: string;

  @Prop({ required: true, default: 1 })
  version: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const DocumentNumberingFormatSchema = SchemaFactory.createForClass(DocumentNumberingFormat);
