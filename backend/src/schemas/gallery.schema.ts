import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type GalleryDocument = HydratedDocument<Gallery>;

@Schema({ timestamps: true, collection: 'galleries' })
export class Gallery {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ trim: true })
  description: string;

  /** Cover image for the album */
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Media' })
  cover: MongooseSchema.Types.ObjectId;

  /** Array of Media references (photos in the album) */
  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Media' }], default: [] })
  photos: MongooseSchema.Types.ObjectId[];

  @Prop({
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
  })
  status: string;

  @Prop({ type: Date })
  eventDate: Date;

  /** Tags for filtering */
  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  createdBy: MongooseSchema.Types.ObjectId;

  @Prop({ type: Number, default: 0 })
  order: number;

  @Prop({ type: Object, default: {} })
  seo: {
    metaTitle?: string;
    metaDescription?: string;
  };
}

export const GallerySchema = SchemaFactory.createForClass(Gallery);
GallerySchema.index({ status: 1 });
GallerySchema.index({ tags: 1 });
GallerySchema.index({ eventDate: -1 });
