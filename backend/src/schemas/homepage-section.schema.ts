import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type HomepageSectionDocument = HydratedDocument<HomepageSection>;

@Schema({ timestamps: true })
export class HomepageSection {
  @Prop({
    required: true,
    enum: ['hero', 'about', 'statistics', 'news', 'events', 'partners', 'cta'],
  })
  sectionType: string;

  @Prop()
  title: string;

  @Prop({ default: 0 })
  order: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  config: Record<string, unknown>;
}

export const HomepageSectionSchema = SchemaFactory.createForClass(HomepageSection);

HomepageSectionSchema.index({ order: 1 });
