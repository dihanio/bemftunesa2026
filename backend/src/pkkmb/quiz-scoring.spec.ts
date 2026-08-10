import { gradeQuizAnswers } from './quiz-scoring';

describe('gradeQuizAnswers', () => {
  const questions = [
    { question: 'Q1', options: [], correctAnswer: 'B', points: 10, order: 0 },
    { question: 'Q2', options: [], correctAnswer: 'A', points: 10, order: 1 },
  ];

  it('semua benar -> score 20, percentage 100', () => {
    const r = gradeQuizAnswers(questions, [
      { questionId: '0', selectedAnswer: 'B' },
      { questionId: '1', selectedAnswer: 'A' },
    ]);
    expect(r.score).toBe(20);
    expect(r.correctCount).toBe(2);
    expect(r.percentage).toBe(100);
  });

  it('satu salah -> score 10, percentage 50', () => {
    const r = gradeQuizAnswers(questions, [
      { questionId: '0', selectedAnswer: 'A' },
      { questionId: '1', selectedAnswer: 'A' },
    ]);
    expect(r.score).toBe(10);
    expect(r.correctCount).toBe(1);
    expect(r.percentage).toBe(50);
  });

  it('jawaban tidak dikenal -> 0 poin, tidak crash', () => {
    const r = gradeQuizAnswers(questions, [
      { questionId: '99', selectedAnswer: 'Z' },
    ]);
    expect(r.score).toBe(0);
    expect(r.correctCount).toBe(0);
  });
});
