import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type RecruitmentDocument = HydratedDocument<Recruitment>;

@Schema({ _id: false })
class RecruitmentPosition {
  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ type: Number, default: null })
  quota: number;

  @Prop()
  requirements: string;
}
const RecruitmentPositionSchema = SchemaFactory.createForClass(RecruitmentPosition);

@Schema({ _id: false })
class RecruitmentTimeline {
  @Prop({ required: true })
  label: string;

  @Prop({ type: Date })
  startDate: Date;

  @Prop({ type: Date })
  endDate: Date;

  @Prop({ type: Number, default: 0 })
  order: number;
}
const RecruitmentTimelineSchema = SchemaFactory.createForClass(RecruitmentTimeline);

@Schema({ timestamps: true, collection: 'recruitments' })
export class Recruitment {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ trim: true })
  description: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Media' })
  poster: MongooseSchema.Types.ObjectId;

  @Prop({
    type: String,
    enum: ['draft', 'open', 'closed', 'announced'],
    default: 'draft',
  })
  status: string;

  @Prop({ type: Date })
  openDate: Date;

  @Prop({ type: Date })
  closeDate: Date;

  @Prop({ trim: true })
  formUrl: string;

  @Prop({ trim: true })
  contactPerson: string;

  @Prop({ trim: true })
  contactWhatsapp: string;

  @Prop({ type: [RecruitmentPositionSchema], default: [] })
  positions: RecruitmentPosition[];

  @Prop({ type: [RecruitmentTimelineSchema], default: [] })
  timeline: RecruitmentTimeline[];

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  createdBy: MongooseSchema.Types.ObjectId;

  @Prop({ type: Object, default: {} })
  seo: {
    metaTitle?: string;
    metaDescription?: string;
  };

  /** Period label, e.g. "2024/2025" */
  @Prop({ trim: true })
  period: string;
}

export const RecruitmentSchema = SchemaFactory.createForClass(Recruitment);
RecruitmentSchema.index({ status: 1 });
RecruitmentSchema.index({ openDate: 1, closeDate: 1 });
