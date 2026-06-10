import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Point {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ required: true })
  amount!: number;

  @Prop({ required: true })
  reason!: string;

  @Prop({ type: String, enum: ['EARN', 'DEBIT'], default: 'EARN' })
  type!: string;

  @Prop({
    type: String,
    enum: ['rapat', 'panitia', 'proker', 'kontribusi', 'lainnya'],
    default: 'lainnya',
  })
  category!: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  awardedBy?: Types.ObjectId;
}

export const PointSchema = SchemaFactory.createForClass(Point);

@Schema({ timestamps: true })
export class Asset {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  code!: string; // e.g., 'BEM-2026-CHAIR-001'

  @Prop({ default: 0 })
  stock!: number;

  @Prop({
    type: String,
    enum: ['Good', 'Broken', 'Maintenance'],
    default: 'Good',
  })
  condition!: string;

  @Prop()
  location?: string;

  @Prop({ default: null })
  deletedAt?: Date;
}

export const AssetSchema = SchemaFactory.createForClass(Asset);

@Schema({ timestamps: true })
export class AssetLoan {
  @Prop({ type: Types.ObjectId, ref: 'Asset', required: true })
  assetId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  borrowerId!: Types.ObjectId;

  @Prop({ required: true })
  quantity!: number;

  @Prop({ required: true })
  loanDate!: Date;

  @Prop()
  returnDate?: Date;

  @Prop({
    type: String,
    enum: ['Requested', 'Approved', 'Borrowed', 'Returned', 'Rejected'],
    default: 'Requested',
  })
  status!: string;

  @Prop({ default: null })
  deletedAt?: Date;
}

export const AssetLoanSchema = SchemaFactory.createForClass(AssetLoan);

@Schema({ timestamps: true })
export class Partnership {
  @Prop({ required: true })
  companyName!: string;

  @Prop()
  contactPerson?: string;

  @Prop()
  phone?: string;

  @Prop({
    type: String,
    enum: ['Prospect', 'Follow Up', 'Deal', 'Rejected'],
    default: 'Prospect',
  })
  status!: string;

  @Prop()
  notes?: string;

  @Prop({ default: null })
  deletedAt?: Date;
}

export const PartnershipSchema = SchemaFactory.createForClass(Partnership);

@Schema({ timestamps: true })
export class WikiArticle {
  @Prop({ required: true })
  title!: string;

  @Prop({ required: true, unique: true })
  slug!: string;

  @Prop({ required: true })
  content!: string; // Markdown/HTML

  @Prop([String])
  tags?: string[];

  @Prop({ type: Types.ObjectId, ref: 'User' })
  authorId?: Types.ObjectId;

  @Prop({ default: null })
  deletedAt?: Date;
}

export const WikiArticleSchema = SchemaFactory.createForClass(WikiArticle);
