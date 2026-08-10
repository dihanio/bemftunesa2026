export type QuizType = "PRETEST" | "POSTTEST" | "MATERIAL";
export type QuizStatus = "DRAFT" | "PUBLISHED" | "CLOSED";
export type TargetType = "ALL" | "FACULTY" | "STUDY_PROGRAM" | "GROUP" | "INDIVIDUAL";

export const TYPE_LABEL: Record<QuizType, string> = {
  PRETEST: "Pretest",
  POSTTEST: "Posttest",
  MATERIAL: "Quiz Materi",
};

export const STATUS_LABEL: Record<QuizStatus, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  CLOSED: "Closed",
};

export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  questionId: string;
  question: string;
  options: QuizOption[];
  points: number;
  order?: number;
}

export interface StudentQuiz {
  _id: string;
  title: string;
  description?: string;
  type: QuizType;
  startTime?: string;
  endTime?: string;
  durationMinutes: number;
  maxAttempts: number;
  passingScore: number;
  isInProgress: boolean;
  // Attempt IN_PROGRESS aktif milik user (belum expired) — langsung resume.
  activeAttemptId: string | null;
  bestAttempt: {
    status: string;
    score?: number;
    percentage?: number;
    submittedAt?: string;
    attemptNumber?: number;
  } | null;
}

export interface StudentQuizDetail {
  _id: string;
  title: string;
  description?: string;
  type: QuizType;
  status: string;
  startTime?: string;
  endTime?: string;
  durationMinutes: number;
  maxAttempts: number;
  passingScore: number;
  totalQuestions: number;
  attemptCount: number;
  usedAttempts: number;
  available: boolean;
  canStart: boolean;
  isInProgress: boolean;
  activeAttemptId: string | null;
  bestAttempt: {
    attemptNumber?: number;
    status: string;
    score?: number;
    percentage?: number;
    submittedAt?: string;
    passed?: boolean;
  } | null;
}

export interface StartQuizResponse {
  attemptId: string;
  attemptNumber: number;
  status?: string;
  startedAt: string;
  durationMinutes: number;
  deadlineAt: string;
  remainingSeconds?: number;
  isResume?: boolean;
  answers?: { questionId: string; selectedAnswer: string }[];
  questions: QuizQuestion[];
  title?: string;
  type?: QuizType;
}

export interface ResumeAttemptResponse {
  attemptId: string;
  quizId: string;
  status: string;
  startedAt: string;
  deadlineAt?: string;
  submittedAt?: string;
  title?: string;
  type?: QuizType;
  durationMinutes?: number;
  remainingSeconds?: number;
  answers: { questionId: string; selectedAnswer: string }[];
  questions: QuizQuestion[];
}

export interface QuizResult {
  quizTitle?: string;
  quizType?: QuizType;
  score?: number;
  correctCount?: number;
  totalQuestions?: number;
  percentage?: number;
  passingScore?: number;
  passed?: boolean;
  status?: string;
  attemptNumber?: number;
  submittedAt?: string;
}

// Management DTO (CreateQuizDto backend)
export interface ManagedQuestion {
  question: string;
  options: QuizOption[];
  correctAnswer: string;
  points: number;
  order?: number;
}

export interface ManagedQuiz {
  _id: string;
  title: string;
  description?: string;
  type: QuizType;
  status: QuizStatus;
  targetType: TargetType;
  targetIds: string[];
  startTime?: string;
  endTime?: string;
  durationMinutes: number;
  maxAttempts: number;
  passingScore: number;
  questions?: ManagedQuestion[];
  createdAt?: string;
  // Dari list management (listAllQuizzes): jumlah soal & attempt untuk UI
  // (mis. modal konfirmasi hapus). Soal lengkap TIDAK dikirim di list.
  questionCount?: number;
  attemptCount?: number;
}

// Attempt + aktivitas anti-cheat utk halaman monitoring management.
export interface ManagedAttempt {
  attemptId: string;
  attemptNumber: number;
  user: { id: string; name: string | null; nim: string | null } | null;
  score: number;
  correctCount: number;
  totalQuestions: number;
  percentage: number;
  status: string;
  startedAt: string;
  submittedAt: string | null;
  antiCheat: {
    violationCount: number;
    riskLevel: "LOW" | "MEDIUM" | "HIGH";
    lastHeartbeatAt: string | null;
    violations: {
      type: string;
      occurredAt: string;
      questionId: string | null;
    }[];
  };
}
