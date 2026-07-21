import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PkkmbGalleryDocument = HydratedDocument<PkkmbGallery>;

@Schema({ timestamps: true })
export class PkkmbGallery {
  @Prop()
  title: string;

  @Prop({ required: true })
  imageUrl: string;

  @Prop()
  eventDate: Date;

  @Prop()
  deletedAt?: Date;
}

export const PkkmbGallerySchema = SchemaFactory.createForClass(PkkmbGallery);
