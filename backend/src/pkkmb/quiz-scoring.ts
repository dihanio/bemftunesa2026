export interface QuizQuestionForScoring {
  correctAnswer: string;
  points: number;
}

export interface QuizAnswerForScoring {
  questionId: string;
  selectedAnswer: string;
}

export interface QuizScoreResult {
  answers: {
    questionId: string;
    selectedAnswer: string;
    isCorrect: boolean;
    points: number;
  }[];
  score: number;
  correctCount: number;
  totalQuestions: number;
  percentage: number;
}

// Scoring otomatis multiple choice. Backend authority; jangan percaya input dari frontend.
export function gradeQuizAnswers(
  questions: QuizQuestionForScoring[],
  submitted: QuizAnswerForScoring[],
): QuizScoreResult {
  const ordered = questions.slice().sort((a, b) => {
    const ao = (a as { order?: number }).order ?? 0;
    const bo = (b as { order?: number }).order ?? 0;
    return ao - bo;
  });
  let score = 0;
  let correctCount = 0;
  const answers = (submitted || []).map((ans) => {
    const qi = parseInt(ans.questionId, 10);
    const q = ordered[qi];
    const isCorrect = !!q && q.correctAnswer === ans.selectedAnswer;
    const pts = isCorrect ? (q.points ?? 1) : 0;
    if (isCorrect) {
      score += pts;
      correctCount++;
    }
    return {
      questionId: ans.questionId,
      selectedAnswer: ans.selectedAnswer,
      isCorrect,
      points: pts,
    };
  });
  const maxScore = ordered.reduce((sum, q) => sum + (q.points ?? 1), 0);
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  return {
    answers,
    score,
    correctCount,
    totalQuestions: ordered.length,
    percentage,
  };
}
