import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { ContentSeo, ContentSeoSchema } from './content.schema';

export type EventDocument = HydratedDocument<Event>;

@Schema({ _id: false })
export class EventSpeaker {
  @Prop({ required: true })
  name: string;

  @Prop()
  title: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Media' })
  avatar: MongooseSchema.Types.ObjectId;

  @Prop()
  bio: string;
}

@Schema({ _id: false })
export class EventSponsor {
  @Prop({ required: true })
  name: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Media' })
  logo: MongooseSchema.Types.ObjectId;

  @Prop()
  url: string;
}

@Schema({ timestamps: true })
export class Event {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop()
  description: string;

  @Prop()
  content: string;

  @Prop({ required: true, enum: ['draft', 'review', 'published', 'archived'], default: 'draft' })
  status: string;

  @Prop({ required: true })
  startDate: Date;

  @Prop()
  endDate: Date;

  @Prop()
  location: string;

  @Prop()
  registrationLink: string;

  @Prop()
  quota: number;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Media' })
  poster: MongooseSchema.Types.ObjectId;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Media' }], default: [] })
  gallery: MongooseSchema.Types.ObjectId[];

  @Prop({ type: [EventSpeaker], default: [] })
  speakers: EventSpeaker[];

  @Prop({ type: [EventSponsor], default: [] })
  sponsors: EventSponsor[];

  @Prop({ default: false })
  certificate: boolean;

  @Prop({ type: ContentSeoSchema, default: () => ({}) })
  seo: ContentSeo;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  author: MongooseSchema.Types.ObjectId;

  @Prop()
  publishedAt: Date;

  @Prop({ type: [String], default: [] })
  tags: string[];
}

export const EventSchema = SchemaFactory.createForClass(Event);

EventSchema.index({ status: 1, startDate: -1 });
EventSchema.index({ tags: 1 });
