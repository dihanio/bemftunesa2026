import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type StudyProgramDocument = HydratedDocument<StudyProgram>;

@Schema({ timestamps: true, collection: 'pkkmb_study_programs' })
export class StudyProgram {
  @Prop({ required: true, unique: true, trim: true })
  code: string; // e.g. "S1-TI", "S1-SI"

  @Prop({ required: true, trim: true })
  name: string; // e.g. "S1 Teknik Informatika"

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Rumpun',
    required: true,
    index: true,
  })
  rumpun: Types.ObjectId;

  @Prop({ required: true, default: 'Fakultas Teknik' })
  faculty: string;

  @Prop({ required: true, enum: ['S1', 'D4'], default: 'S1' })
  degree: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const StudyProgramSchema = SchemaFactory.createForClass(StudyProgram);
