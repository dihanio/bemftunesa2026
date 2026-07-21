import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type OrganizationDocument = HydratedDocument<Organization>;

@Schema({ timestamps: true, collection: 'organizations' })
export class Organization {
  @Prop({ required: true, trim: true })
  name: string; // e.g. "Kabinet Harmoni Karya"

  @Prop({ required: true, unique: true, trim: true })
  period: string; // e.g. "2026"

  @Prop()
  vision: string;

  @Prop({ type: [String], default: [] })
  missions: string[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  logo: string;

  @Prop()
  startDate: Date;

  @Prop()
  endDate: Date;
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);
OrganizationSchema.index({ period: 1 }, { unique: true });
