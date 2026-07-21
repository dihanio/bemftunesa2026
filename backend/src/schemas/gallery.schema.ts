import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type GalleryDocument = HydratedDocument<Gallery>;

@Schema({ timestamps: true, collection: 'galleries' })
export class Gallery {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ trim: true })
  description: string;

  @Prop()
  coverImage: string;

  @Prop({ type: [String], default: [] })
  photos: string[];

  @Prop()
  eventDate: Date;

  @Prop({ default: true })
  isPublished: boolean;

  @Prop({ trim: true })
  period: string;
}

export const GallerySchema = SchemaFactory.createForClass(Gallery);
GallerySchema.index({ slug: 1 });
GallerySchema.index({ isPublished: 1 });
