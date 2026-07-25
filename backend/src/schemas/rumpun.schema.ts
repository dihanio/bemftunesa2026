import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type RumpunDocument = HydratedDocument<Rumpun>;

@Schema({ timestamps: true, collection: 'pkkmb_rumpun' })
export class Rumpun {
  @Prop({ required: true, unique: true, trim: true })
  name: string; // e.g., "Rumpun Teknik Mesin", "Rumpun Teknik Informatika"

  @Prop({ default: '#3B82F6' })
  color: string; // HEX color for visual analytics

  @Prop({ default: 'BookOpen' })
  icon: string; // Icon name

  @Prop({ default: 0 })
  order: number;
}

export const RumpunSchema = SchemaFactory.createForClass(Rumpun);
