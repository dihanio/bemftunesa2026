import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: true })
export class GalleryAlbum {
  @Prop({ required: true })
  title!: string;

  @Prop()
  description?: string;

  @Prop()
  coverUrl?: string;

  @Prop({ default: null })
  deletedAt?: Date;
}

export const GalleryAlbumSchema = SchemaFactory.createForClass(GalleryAlbum);

@Schema({ timestamps: true })
export class GalleryPhoto {
  @Prop({ type: Types.ObjectId, ref: 'GalleryAlbum', required: true })
  albumId!: Types.ObjectId;

  @Prop({ required: true })
  url!: string;

  @Prop()
  caption?: string;
}

export const GalleryPhotoSchema = SchemaFactory.createForClass(GalleryPhoto);
