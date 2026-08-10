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

  @Prop()
  startTime?: Date;

  @Prop({ required: true })
  deadline: Date;

  // Tipe ASSIGNMENT (Google Classroom-like): TASK = tugas biasa (submission),
  // QUIZ = quiz existing dijadikan penugasan (assignment = container/entry point
  // saja; soal/attempt/timer/scoring tetap milik Quiz Core). Backward
  // compatible: data lama tanpa assignmentType dianggap TASK.
  @Prop({
    enum: ['TASK', 'QUIZ'],
    default: 'TASK',
  })
  assignmentType: string;

  // Wajib diisi jika assignmentType = 'QUIZ' (ref ke PkkmbQuiz). NULL utk TASK.
  // Nullable: saat assignment QUIZ dikonversi ke TASK (PATCH), quizId di-unset
  // menjadi null (prompt §3: TASK → quizId harus kosong).
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'PkkmbQuiz' })
  quizId?: Types.ObjectId | null;

  // Tipe SUBMISSION utk TASK (legacy: individu/kelompok). Dipakai hanya utk TASK.
  @Prop({
    enum: ['individu', 'kelompok', 'INDIVIDU', 'KELOMPOK'],
  })
  type: string;

  @Prop()
  attachment?: string; // URL lampiran (TASK/MATERIAL)

  @Prop()
  link?: string; // URL link (MATERIAL/LINK)

  @Prop({
    required: true,
    enum: ['PUBLISHED', 'DRAFT', 'CLOSED'],
    default: 'PUBLISHED',
  })
  status: string;

  @Prop({
    enum: ['ALL', 'FACULTY', 'STUDY_PROGRAM', 'GROUP', 'INDIVIDUAL'],
    default: 'ALL',
  })
  targetType: string;

  // Mixed: ObjectId (PRODI/GROUP/INDIVIDUAL) atau string nama fakultas (FACULTY).
  @Prop({ type: [MongooseSchema.Types.Mixed], default: [] })
  targetIds: (Types.ObjectId | string)[];

  @Prop({ type: [String] })
  allowedFormats: string[]; // e.g. ['.pdf', '.zip']

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;

  @Prop()
  deletedAt?: Date;
}

export const PkkmbTaskSchema = SchemaFactory.createForClass(PkkmbTask);

PkkmbTaskSchema.index({ status: 1, deadline: 1 });
PkkmbTaskSchema.index({ deletedAt: 1 });

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
    enum: ['NOT_SUBMITTED', 'SUBMITTED', 'LATE', 'GRADED'],
    default: 'NOT_SUBMITTED',
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
PkkmbSubmissionSchema.index({ userId: 1, taskId: 1 });
PkkmbSubmissionSchema.index({ deletedAt: 1 });
