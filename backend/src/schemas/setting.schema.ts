import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type SettingDocument = HydratedDocument<Setting>;

@Schema({ timestamps: true })
export class Setting {
  @Prop({ required: true, unique: true })
  key: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  value: unknown;

  @Prop()
  group: string;

  @Prop()
  description: string;
}

export const SettingSchema = SchemaFactory.createForClass(Setting);

SettingSchema.index({ group: 1 });
