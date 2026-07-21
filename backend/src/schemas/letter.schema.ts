import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type LetterDocument = HydratedDocument<Letter>;

@Schema({ timestamps: true })
export class Letter {
  @Prop({ unique: true, sparse: true })
  referenceNumber?: string;

  @Prop({
    enum: ['incoming', 'outgoing', 'proposal', 'lpj'],
    required: true,
  })
  type: string;

  @Prop({ required: true })
  subject: string;

  @Prop({ required: true })
  sender: string;

  @Prop({ required: true })
  recipient: string;

  @Prop({
    enum: ['draft', 'review_kadep', 'review_ketua', 'approved', 'rejected', 'archived'],
    default: 'draft',
    required: true,
  })
  status: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Department' })
  department?: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  createdBy: MongooseSchema.Types.ObjectId;

  @Prop()
  documentUrl?: string;

  @Prop()
  approvalNotes?: string;

  @Prop()
  dateApproved?: Date;

  @Prop()
  deletedAt?: Date;

  // --- DSS Fields ---
  @Prop()
  deadlineDate?: Date;

  @Prop({
    enum: ['internal', 'fakultas', 'universitas', 'eksternal'],
    default: 'internal',
  })
  impactScale: string;

  @Prop({
    enum: ['normal', 'high', 'urgent'],
    default: 'normal',
  })
  urgencyLevel: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const LetterSchema = SchemaFactory.createForClass(Letter);

// Index for auto-increment logic (searching by type and date/number)
LetterSchema.index({ type: 1, createdAt: -1 });
