import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type RecruitmentDocument = HydratedDocument<Recruitment>;

@Schema({ timestamps: true, collection: 'recruitments' })
export class Recruitment {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ trim: true })
  description: string;

  @Prop()
  poster: string;

  @Prop({ type: String, enum: ['open', 'closed', 'announced'], default: 'closed' })
  status: string;

  @Prop()
  openDate: Date;

  @Prop()
  closeDate: Date;

  @Prop()
  formUrl: string;

  @Prop({ default: true })
  useInternalForm: boolean;

  @Prop({ type: [{ name: String, quota: Number, description: String }], default: [] })
  positions: { name: string; quota: number; description: string }[];

  @Prop({ trim: true })
  period: string;

  @Prop({ type: [String], default: [] })
  requirements: string[];

  @Prop({ trim: true })
  content: string;
}

export const RecruitmentSchema = SchemaFactory.createForClass(Recruitment);
RecruitmentSchema.index({ slug: 1 });
RecruitmentSchema.index({ status: 1 });
