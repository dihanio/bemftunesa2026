import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type MediaDocument = HydratedDocument<Media>;

@Schema({ _id: false })
export class MediaDimensions {
  @Prop()
  width: number;

  @Prop()
  height: number;
}

@Schema({ timestamps: true })
export class Media {
  @Prop({ required: true })
  filename: string;

  @Prop({ required: true })
  originalName: string;

  @Prop({ required: true })
  mimeType: string;

  @Prop({ required: true })
  size: number;

  @Prop({ required: true })
  url: string;

  @Prop()
  thumbnail: string;

  @Prop()
  alt: string;

  @Prop()
  caption: string;

  @Prop()
  folder: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: MediaDimensions, default: undefined })
  dimensions: MediaDimensions;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  uploadedBy: MongooseSchema.Types.ObjectId;
}

export const MediaSchema = SchemaFactory.createForClass(Media);

MediaSchema.index({ folder: 1 });
MediaSchema.index({ tags: 1 });
MediaSchema.index({ mimeType: 1 });
MediaSchema.index({ createdAt: -1 });
