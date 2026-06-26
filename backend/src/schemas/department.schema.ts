import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { ContentSeo, ContentSeoSchema } from './content.schema';

export type DepartmentDocument = HydratedDocument<Department>;

@Schema({ _id: false })
export class SocialMedia {
  @Prop()
  instagram: string;

  @Prop()
  twitter: string;

  @Prop()
  youtube: string;

  @Prop()
  linkedin: string;
}

@Schema({ _id: false })
export class DepartmentContacts {
  @Prop()
  email: string;

  @Prop()
  phone: string;

  @Prop({ type: SocialMedia, default: () => ({}) })
  socialMedia: SocialMedia;
}

@Schema({ timestamps: true })
export class Department {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'CabinetPeriod', required: true })
  cabinetPeriod: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  slug: string;

  @Prop()
  description: string;

  @Prop()
  color: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Media' })
  logo: MongooseSchema.Types.ObjectId;

  @Prop()
  vision: string;

  @Prop({ type: [String], default: [] })
  mission: string[];

  @Prop({ type: DepartmentContacts, default: () => ({}) })
  contacts: DepartmentContacts;

  @Prop({ type: ContentSeoSchema, default: () => ({}) })
  seo: ContentSeo;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  order: number;

  @Prop()
  deletedAt?: Date;
}

export const DepartmentSchema = SchemaFactory.createForClass(Department);

DepartmentSchema.index({ cabinetPeriod: 1, slug: 1 }, { unique: true });
DepartmentSchema.index({ cabinetPeriod: 1, isActive: 1, order: 1 });
