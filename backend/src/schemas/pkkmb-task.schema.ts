import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

// --- Task / Assignment ---
export type PkkmbTaskDocument = HydratedDocument<PkkmbTask>;

@Schema({ timestamps: true })
export class PkkmbTask {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  deadline: Date;

  @Prop({ required: true, enum: ['individu', 'kelompok'] })
  type: string;

  @Prop({ type: [String] })
  allowedFormats: string[]; // e.g. ['.pdf', '.zip']

  @Prop()
  deletedAt?: Date;
}

export const PkkmbTaskSchema = SchemaFactory.createForClass(PkkmbTask);

// --- Task Submission ---
export type PkkmbSubmissionDocument = HydratedDocument<PkkmbSubmission>;

@Schema({ timestamps: true })
export class PkkmbSubmission {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'PkkmbTask',
    required: true,
    index: true,
  })
  taskId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  userId?: Types.ObjectId; // Jika tugas individu

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'PkkmbGroup' })
  groupId?: Types.ObjectId; // Jika tugas kelompok

  @Prop({ required: true })
  fileUrl: string;

  @Prop({
    required: true,
    enum: ['Belum Submit', 'Sudah Submit', 'Terlambat'],
    default: 'Belum Submit',
  })
  status: string;

  @Prop()
  score?: number;

  @Prop()
  feedback?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  gradedBy?: Types.ObjectId;

  @Prop({ default: () => new Date() })
  submittedAt: Date;

  @Prop()
  deletedAt?: Date;
}

export const PkkmbSubmissionSchema =
  SchemaFactory.createForClass(PkkmbSubmission);

PkkmbSubmissionSchema.index({ taskId: 1, userId: 1 });
PkkmbSubmissionSchema.index({ taskId: 1, groupId: 1 });
