import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type AspirationDocument = HydratedDocument<Aspiration>;

@Schema({ timestamps: true })
export class Aspiration {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'CabinetPeriod', required: true })
  cabinetPeriod: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop()
  category: string;

  @Prop({ default: false })
  isAnonymous: boolean;

  // Bisa mahasiswa luar yang login atau tidak login
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  submitter: MongooseSchema.Types.ObjectId;

  @Prop({
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'low',
    required: true,
  })
  urgency: string;

  @Prop({
    enum: ['new', 'processing', 'pending', 'resolved', 'rejected'],
    default: 'new',
    required: true,
  })
  status: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Department' })
  assignedDepartment: MongooseSchema.Types.ObjectId;

  @Prop()
  officialResponse: string;

  @Prop({ default: Date.now })
  dateSubmitted: Date;

  @Prop()
  targetResponseDate: Date;

  @Prop()
  firstResponseDate: Date;

  @Prop()
  resolutionDate: Date;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Document' }], default: [] })
  attachments: MongooseSchema.Types.ObjectId[];

  @Prop()
  deletedAt?: Date;
}

export const AspirationSchema = SchemaFactory.createForClass(Aspiration);

AspirationSchema.index({ cabinetPeriod: 1, status: 1, urgency: 1 });
AspirationSchema.index({ assignedDepartment: 1 });
