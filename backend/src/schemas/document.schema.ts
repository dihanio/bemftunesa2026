import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type DocumentDocument = HydratedDocument<Document>;

@Schema({ timestamps: true })
export class Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'CabinetPeriod', required: true })
  cabinetPeriod: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Department' })
  department: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({
    enum: ['SOP', 'Proposal', 'TOR', 'LPJ', 'Notulensi', 'Surat', 'Kabinet', 'Other'],
    default: 'Other',
    required: true,
  })
  type: string;

  @Prop({ required: true })
  url: string;

  @Prop()
  size: number;

  @Prop()
  mimeType: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  uploader: MongooseSchema.Types.ObjectId;

  @Prop({ default: 1 })
  version: number;

  @Prop()
  deletedAt?: Date;
}

export const DocumentSchema = SchemaFactory.createForClass(Document);

DocumentSchema.index({ cabinetPeriod: 1, department: 1, type: 1 });
