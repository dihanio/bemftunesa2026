import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Article {
  @Prop({ required: true })
  title!: string;

  @Prop({ required: true, unique: true })
  slug!: string;

  @Prop({ required: true })
  content!: string;

  @Prop()
  thumbnailUrl?: string;

  @Prop({
    type: String,
    enum: ['Kegiatan', 'Prestasi', 'Pengumuman', 'Opini'],
    default: 'Kegiatan',
  })
  category!: string;

  @Prop({ type: String, enum: ['Draft', 'Published'], default: 'Draft' })
  status!: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  authorId?: Types.ObjectId;

  @Prop([String])
  tags?: string[];

  @Prop({ default: null })
  deletedAt?: Date;
}

export const ArticleSchema = SchemaFactory.createForClass(Article);
