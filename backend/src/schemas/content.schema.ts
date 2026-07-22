import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type ContentDocument = HydratedDocument<Content>;

@Schema({ timestamps: true })
export class ContentSeo {
  @Prop()
  metaTitle: string;

  @Prop()
  metaDescription: string;

  @Prop({ type: [String], default: [] })
  keywords: string[];

  @Prop()
  ogImage: string;

  @Prop()
  canonicalUrl: string;
}

export const ContentSeoSchema = SchemaFactory.createForClass(ContentSeo);

@Schema({ timestamps: true })
export class Content {
  @Prop({ required: true, enum: ['news', 'announcement', 'page', 'service'] })
  type: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  slug: string;

  @Prop()
  excerpt: string;

  @Prop()
  content: string;

  @Prop({
    required: true,
    enum: ['draft', 'review', 'published', 'archived'],
    default: 'draft',
  })
  status: string;

  @Prop()
  featuredImage: string;

  @Prop({ type: ContentSeoSchema, default: () => ({}) })
  seo: ContentSeo;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  author: MongooseSchema.Types.ObjectId;

  @Prop()
  publishedAt: Date;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: MongooseSchema.Types.Mixed })
  metadata: Record<string, unknown>;
}

export const ContentSchema = SchemaFactory.createForClass(Content);

ContentSchema.index({ type: 1, status: 1 });
ContentSchema.index({ slug: 1, type: 1 }, { unique: true });
ContentSchema.index({ publishedAt: -1 });
ContentSchema.index({ tags: 1 });
