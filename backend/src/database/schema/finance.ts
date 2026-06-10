import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Proposal {
  @Prop({ type: Types.ObjectId, ref: 'Proker', required: true })
  prokerId!: Types.ObjectId;

  @Prop({ required: true })
  title!: string;

  @Prop()
  description?: string;

  @Prop({ default: 1 })
  version!: number;

  @Prop({
    type: String,
    enum: [
      'Draft',
      'Submitted',
      'Validated Admin',
      'Validated Finance',
      'Revision',
      'Approved',
    ],
    default: 'Draft',
  })
  status!: string;

  @Prop()
  fileUrl?: string;

  @Prop({
    type: [
      {
        authorName: { type: String, required: true },
        note: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  notes?: { authorName: string; note: string; createdAt: Date }[];

  @Prop({ default: null })
  deletedAt?: Date;
}

export const ProposalSchema = SchemaFactory.createForClass(Proposal);

@Schema({ timestamps: true })
export class RAB {
  @Prop({ type: Types.ObjectId, ref: 'Proker', required: true })
  prokerId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Proposal', required: true })
  proposalId!: Types.ObjectId;

  @Prop({ required: true })
  itemName!: string;

  @Prop({ required: true })
  quantity!: number;

  @Prop({ required: true })
  pricePerUnit!: number;

  @Prop({ required: true })
  totalPrice!: number;

  @Prop({
    type: String,
    enum: ['Planned', 'Approved', 'Rejected'],
    default: 'Planned',
  })
  status!: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  approvedBy?: Types.ObjectId;

  @Prop({ default: null })
  deletedAt?: Date;
}

export const RABSchema = SchemaFactory.createForClass(RAB);

@Schema({ timestamps: true })
export class LPJ {
  @Prop({ type: Types.ObjectId, ref: 'Proker', required: true })
  prokerId!: Types.ObjectId;

  @Prop()
  content?: string;

  @Prop({
    type: String,
    enum: ['Pending', 'Validated', 'Revision'],
    default: 'Pending',
  })
  status!: string;

  @Prop()
  fileUrl?: string;

  @Prop({ default: null })
  deletedAt?: Date;
}

export const LPJSchema = SchemaFactory.createForClass(LPJ);

@Schema({ timestamps: true })
export class SPJ {
  @Prop({ type: Types.ObjectId, ref: 'Proker', required: true })
  prokerId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'LPJ' })
  lpjId?: Types.ObjectId;

  @Prop({ required: true })
  description!: string;

  @Prop({ required: true })
  amount!: number;

  @Prop({ required: true })
  receiptUrl!: string;

  @Prop({ default: Date.now })
  transactionDate!: Date;

  @Prop({ default: null })
  deletedAt?: Date;
}

export const SPJSchema = SchemaFactory.createForClass(SPJ);
