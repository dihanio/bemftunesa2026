import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

// --- Quiz Question (embedded) ---
export class QuizQuestion {
  @Prop({ required: true })
  question: string;

  @Prop({
    type: [{ id: String, text: String }],
    required: true,
    default: [],
  })
  options: { id: string; text: string }[];

  @Prop({ required: true })
  correctAnswer: string;

  @Prop({ required: true, default: 1 })
  points: number;

  @Prop({ required: true, default: 0 })
  order: number;
}

// --- Quiz ---
export type PkkmbQuizDocument = HydratedDocument<PkkmbQuiz>;

@Schema({ timestamps: true, collection: 'pkkmb_quizzes' })
export class PkkmbQuiz {
  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({
    required: true,
    enum: ['PRETEST', 'POSTTEST', 'MATERIAL'],
  })
  type: string;

  @Prop({
    required: true,
    enum: ['DRAFT', 'PUBLISHED', 'CLOSED'],
    default: 'DRAFT',
  })
  status: string;

  @Prop({ type: [MongooseSchema.Types.Mixed], default: [] })
  questions: QuizQuestion[];

  @Prop({
    enum: ['ALL', 'FACULTY', 'STUDY_PROGRAM', 'GROUP', 'INDIVIDUAL'],
    default: 'ALL',
  })
  targetType: string;

  // Mixed: ObjectId (PRODI/GROUP/INDIVIDUAL) atau string nama fakultas (FACULTY).
  @Prop({ type: [MongooseSchema.Types.Mixed], default: [] })
  targetIds: (Types.ObjectId | string)[];

  @Prop()
  startTime?: Date;

  @Prop()
  endTime?: Date;

  @Prop({ required: true, default: 30 })
  durationMinutes: number;

  @Prop({ required: true, default: 1 })
  maxAttempts: number;

  @Prop({ required: true, default: 0 })
  passingScore: number;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;

  @Prop()
  deletedAt?: Date;
}

export const PkkmbQuizSchema = SchemaFactory.createForClass(PkkmbQuiz);

PkkmbQuizSchema.index({ status: 1, startTime: 1, endTime: 1 });
PkkmbQuizSchema.index({ targetType: 1, targetIds: 1 });
PkkmbQuizSchema.index({ deletedAt: 1 });

// --- Quiz Attempt ---
export type PkkmbQuizAttemptDocument = HydratedDocument<PkkmbQuizAttempt>;

// Jenis pelanggaran anti-cheat / anti-AI deterrence (monitoring, BUKAN bukti
// mutlak — browser tidak bisa mendeteksi AI/perangkat lain secara pasti).
export enum QuizViolationType {
  TAB_HIDDEN = 'TAB_HIDDEN',
  WINDOW_BLUR = 'WINDOW_BLUR',
  COPY = 'COPY',
  CUT = 'CUT',
  PASTE = 'PASTE',
  CONTEXT_MENU = 'CONTEXT_MENU',
  PRINT_ATTEMPT = 'PRINT_ATTEMPT',
  DEVTOOLS_SUSPECTED = 'DEVTOOLS_SUSPECTED',
  FULLSCREEN_EXIT = 'FULLSCREEN_EXIT',
  PAGE_LEAVE = 'PAGE_LEAVE',
  HEARTBEAT_TIMEOUT = 'HEARTBEAT_TIMEOUT',
  // Informational (audit log saja — tidak menaikkan violationCount/risk)
  TAB_VISIBLE = 'TAB_VISIBLE',
  WINDOW_FOCUS = 'WINDOW_FOCUS',
  PAGE_REFRESH = 'PAGE_REFRESH',
  ATTEMPT_RESUMED = 'ATTEMPT_RESUMED',
  // Shortcut keyboard terblokir (selain copy/cut/paste)
  KEYBOARD_SHORTCUT = 'KEYBOARD_SHORTCUT',
}

export type QuizRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export class QuizAntiCheat {
  @Prop({ required: true, default: 0 })
  violationCount: number;

  @Prop({
    type: [
      {
        type: {
          type: String,
          enum: Object.values(QuizViolationType),
        },
        occurredAt: { type: Date },
        metadata: { type: Object },
      },
    ],
    default: [],
  })
  violations: {
    type: QuizViolationType;
    occurredAt: Date;
    metadata?: {
      durationMs?: number;
      questionId?: string;
      clientTimestamp?: string;
    };
  }[];

  @Prop({
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    default: 'LOW',
  })
  riskLevel: QuizRiskLevel;

  @Prop()
  lastHeartbeatAt?: Date;
}

@Schema({ timestamps: true, collection: 'pkkmb_quiz_attempts' })
export class PkkmbQuizAttempt {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'PkkmbQuiz',
    required: true,
    index: true,
  })
  quizId: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId: Types.ObjectId;

  @Prop({
    type: [
      {
        questionId: String,
        selectedAnswer: String,
        isCorrect: Boolean,
        points: Number,
      },
    ],
    default: [],
  })
  // Saat IN_PROGRESS, jawaban hanya berisi questionId + selectedAnswer
  // (hasil autosave). isCorrect/points diisi saat submit oleh backend.
  answers: {
    questionId: string;
    selectedAnswer: string;
    isCorrect?: boolean;
    points?: number;
  }[];

  @Prop({ default: 0 })
  score: number;

  @Prop({ default: 0 })
  correctCount: number;

  @Prop({ default: 0 })
  totalQuestions: number;

  @Prop({ default: 0 })
  percentage: number;

  // IN_PROGRESS = sedang dikerjakan (memakai slot attempt).
  // SUBMITTED/GRADED = sudah dikumpulkan (memakai slot attempt).
  // EXPIRED = ditinggal sampai lewat deadline — TIDAK memakai slot attempt,
  // jadi student tetap dapat memulai attempt baru.
  @Prop({
    enum: ['IN_PROGRESS', 'SUBMITTED', 'GRADED', 'EXPIRED'],
    default: 'IN_PROGRESS',
  })
  status: string;

  @Prop({ default: () => new Date() })
  startedAt: Date;

  @Prop()
  submittedAt?: Date;

  @Prop({ default: 1 })
  attemptNumber: number;

  // Monitoring anti-cheat: hanya event metadata (type + waktu server),
  // TIDAK menyimpan isi clipboard/layar/ketikan/data sensitif.
  @Prop({ type: QuizAntiCheat, default: () => ({ violationCount: 0, violations: [], riskLevel: 'LOW' }) })
  antiCheat: QuizAntiCheat;

  @Prop()
  deletedAt?: Date;
}

export const PkkmbQuizAttemptSchema =
  SchemaFactory.createForClass(PkkmbQuizAttempt);

// Satu attempt aktif per (quiz, user). Unique memastikan tidak ada duplikat
// pada attemptNumber yang sama; validasi maxAttempts dilakukan di service.
PkkmbQuizAttemptSchema.index(
  { quizId: 1, userId: 1, attemptNumber: 1 },
  { unique: true },
);
PkkmbQuizAttemptSchema.index({ userId: 1, quizId: 1 });
PkkmbQuizAttemptSchema.index({ deletedAt: 1 });
