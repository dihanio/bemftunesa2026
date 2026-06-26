import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MenuDocument = HydratedDocument<Menu>;

@Schema({ _id: false })
export class MenuItemChild {
  @Prop({ required: true })
  label: string;

  @Prop({ required: true })
  url: string;

  @Prop({ default: 0 })
  order: number;

  @Prop({ enum: ['_self', '_blank'], default: '_self' })
  target: string;
}

@Schema({ _id: false })
export class MenuItem {
  @Prop({ required: true })
  label: string;

  @Prop({ required: true })
  url: string;

  @Prop()
  icon: string;

  @Prop({ default: 0 })
  order: number;

  @Prop({ enum: ['_self', '_blank'], default: '_self' })
  target: string;

  @Prop({ type: [MenuItemChild], default: [] })
  children: MenuItemChild[];
}

@Schema({ timestamps: true })
export class Menu {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop({ type: [MenuItem], default: [] })
  items: MenuItem[];

  @Prop({ default: true })
  isActive: boolean;
}

export const MenuSchema = SchemaFactory.createForClass(Menu);
