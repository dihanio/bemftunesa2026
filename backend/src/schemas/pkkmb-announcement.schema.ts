import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type PkkmbAnnouncementDocument = HydratedDocument<PkkmbAnnouncement>;

@Schema({ timestamps: true })
export class PkkmbAnnouncement {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop({ type: [String] })
  attachments: string[];

  @Prop({ required: true, enum: ['all', 'specific_groups'], default: 'all' })
  targetAudience: string;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'PkkmbGroup' }] })
  targetGroups?: Types.ObjectId[];

  @Prop({ default: false })
  isPriority: boolean;

  @Prop()
  deletedAt?: Date;
}

export const PkkmbAnnouncementSchema =
  SchemaFactory.createForClass(PkkmbAnnouncement);
