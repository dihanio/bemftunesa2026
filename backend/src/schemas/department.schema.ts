import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DepartmentDocument = HydratedDocument<Department>;

@Schema({ timestamps: true })
export class Department {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop({ uppercase: true })
  code: string; // Kode formal departemen (e.g. "RISTEK", "EKRAF") — untuk nomor surat

  @Prop()
  description: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  order: number;

  @Prop()
  taskBoardUrl?: string;
}

export const DepartmentSchema = SchemaFactory.createForClass(Department);

DepartmentSchema.index({ slug: 1 }, { unique: true });
DepartmentSchema.index({ isActive: 1, order: 1 });

