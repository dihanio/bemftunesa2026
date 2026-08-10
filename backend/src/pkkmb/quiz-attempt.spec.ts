import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PkkmbService } from './pkkmb.service';

// ─── Fixtures ──────────────────────────────────────────────────────────────

const USER_ID = '64b000000000000000000001';
const OTHER_USER = '64b000000000000000000002';
const QUIZ_ID = '64b000000000000000000101';
const OTHER_QUIZ = '64b000000000000000000102';
const ATTEMPT_ID = '64b000000000000000000201';

const QUESTIONS = [
  {
    question: 'Q1',
    options: [
      { id: 'A', text: 'A' },
      { id: 'B', text: 'B' },
      { id: 'C', text: 'C' },
      { id: 'D', text: 'D' },
    ],
    correctAnswer: 'A',
    points: 10,
    order: 1,
  },
  {
    question: 'Q2',
    options: [
      { id: 'A', text: 'A' },
      { id: 'B', text: 'B' },
      { id: 'C', text: 'C' },
      { id: 'D', text: 'D' },
    ],
    correctAnswer: 'B',
    points: 10,
    order: 2,
  },
];

function makeQuiz(over: Record<string, unknown> = {}) {
  return {
    _id: { toString: () => QUIZ_ID },
    title: 'Quiz Final',
    description: 'desc',
    type: 'PRETEST',
    status: 'PUBLISHED',
    targetType: 'ALL',
    targetIds: [],
    startTime: undefined,
    endTime: undefined,
    durationMinutes: 30,
    maxAttempts: 1,
    passingScore: 75,
    questions: QUESTIONS,
    save: jest.fn().mockResolvedValue(undefined),
    ...over,
  };
}

function makeAttempt(over: Record<string, unknown> = {}) {
  return {
    _id: { toString: () => ATTEMPT_ID },
    quizId: { toString: () => QUIZ_ID },
    userId: { toString: () => USER_ID },
    status: 'IN_PROGRESS',
    startedAt: new Date(),
    answers: [],
    score: 0,
    correctCount: 0,
    totalQuestions: 2,
    percentage: 0,
    attemptNumber: 1,
    save: jest.fn().mockResolvedValue(undefined),
    ...over,
  };
}

function buildService(
  opts: {
    quiz?: ReturnType<typeof makeQuiz> | null;
    activeAttempt?: ReturnType<typeof makeAttempt> | null;
    usedCount?: number;
    lastAttemptNumber?: number;
    attempts?: ReturnType<typeof makeAttempt>[];
    attemptById?: ReturnType<typeof makeAttempt> | null;
    resultAttempt?: ReturnType<typeof makeAttempt> | null;
    userById?: { pkkmbGroup?: string } | null;
  } = {},
) {
  const {
    quiz = makeQuiz(),
    activeAttempt = null,
    usedCount = 0,
    lastAttemptNumber = 0,
    attempts = [],
    attemptById = null,
    resultAttempt = null,
    userById = null,
  } = opts;

  const execQuiz = jest.fn().mockResolvedValue(quiz);
  const quizModel = {
    findOne: jest.fn().mockReturnValue({
      exec: execQuiz,
      lean: jest.fn().mockReturnValue({ exec: execQuiz }),
    }),
  };

  const quizAttemptModel = {
    findOne: jest
      .fn()
      .mockImplementation((filter?: Record<string, unknown>) => {
        if (filter && filter.status === 'IN_PROGRESS') {
          // startQuiz: attempt aktif milik user
          return {
            sort: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(activeAttempt),
            }),
          };
        }
        if (filter && filter._id) {
          // resumeQuizAttempt / submitQuiz (exec langsung) & getQuizResult (populate)
          return {
            exec: jest.fn().mockResolvedValue(attemptById),
            populate: jest.fn().mockReturnValue({
              lean: jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(resultAttempt),
              }),
            }),
          };
        }
        // startQuiz: cari attemptNumber terakhir
        return {
          sort: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              lean: jest.fn().mockReturnValue({
                exec: jest
                  .fn()
                  .mockResolvedValue(
                    lastAttemptNumber
                      ? { attemptNumber: lastAttemptNumber }
                      : null,
                  ),
              }),
            }),
          }),
        };
      }),
    countDocuments: jest.fn().mockResolvedValue(usedCount),
    find: jest
      .fn()
      .mockReturnValue({ exec: jest.fn().mockResolvedValue(attempts) }),
    create: jest
      .fn()
      .mockImplementation((data: Record<string, unknown>) =>
        Promise.resolve(
          makeAttempt({ ...data, _id: { toString: () => 'new-attempt' } }),
        ),
      ),
  };

  const userModel = {
    findById: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(userById),
        }),
      }),
    }),
  };

  // deleteQuiz: cek apakah quiz dipakai assignment (taskModel.findOne).
  const taskModel = {
    findOne: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      }),
    }),
    find: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }),
    countDocuments: jest.fn().mockResolvedValue(0),
  };

  // 17 arg constructor: user, role, group, session, log, task, submission,
  // quiz, quizAttempt, schedule, announcement, pointLog, gallery, rumpun,
  // studyProgram, publishConfig, redis.
  const svc = new PkkmbService(
    userModel as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    taskModel as never,
    {} as never,
    quizModel as never,
    quizAttemptModel as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  );
  return {
    svc: svc,
    quizModel,
    quizAttemptModel,
    userModel,
    taskModel,
  };
}

// ─── startQuiz / attempt lifecycle ─────────────────────────────────────────

describe('PkkmbService — startQuiz (attempt lifecycle)', () => {
  test('membuat attempt IN_PROGRESS, soal tanpa correctAnswer, deadline server', async () => {
    const { svc, quizAttemptModel } = buildService({});
    const res = await svc.startQuiz(QUIZ_ID, USER_ID);

    expect(quizAttemptModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'IN_PROGRESS', attemptNumber: 1 }),
    );
    expect(res.attemptNumber).toBe(1);
    expect(res.status).toBe('IN_PROGRESS');
    expect(res.isResume).toBe(false);
    expect(res.questions).toHaveLength(2);
    expect(res.questions[0]).not.toHaveProperty('correctAnswer');
    const expected = new Date(new Date(res.startedAt).getTime() + 30 * 60000);
    expect(new Date(res.deadlineAt).getTime()).toBe(expected.getTime());
    expect(res.remainingSeconds).toBeGreaterThan(0);
  });

  test('start ulang saat IN_PROGRESS masih aktif → return attempt SAMA (resume)', async () => {
    const { svc, quizAttemptModel } = buildService({
      activeAttempt: makeAttempt(),
    });
    const res = await svc.startQuiz(QUIZ_ID, USER_ID);

    expect(res.isResume).toBe(true);
    expect(res.attemptId.toString()).toBe(ATTEMPT_ID);
    expect(quizAttemptModel.create).not.toHaveBeenCalled();
  });

  test('refresh simulation → TIDAK membuat attempt baru / kuota tidak berkurang', async () => {
    const { svc, quizAttemptModel } = buildService({
      activeAttempt: makeAttempt(),
    });
    await svc.startQuiz(QUIZ_ID, USER_ID);
    await svc.startQuiz(QUIZ_ID, USER_ID);

    expect(quizAttemptModel.create).not.toHaveBeenCalled();
    expect(quizAttemptModel.countDocuments).not.toHaveBeenCalled();
  });

  test('IN_PROGRESS lewat deadline → EXPIRED, lalu attempt baru dibuat', async () => {
    const expired = makeAttempt({
      startedAt: new Date(Date.now() - 40 * 60000), // 40 menit lalu (durasi 30)
    });
    const { svc, quizAttemptModel } = buildService({
      activeAttempt: expired,
      lastAttemptNumber: 1,
    });
    const res = await svc.startQuiz(QUIZ_ID, USER_ID);

    expect(expired.status).toBe('EXPIRED');
    expect(expired.save).toHaveBeenCalled();
    expect(quizAttemptModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ attemptNumber: 2, status: 'IN_PROGRESS' }),
    );
    expect(res.attemptNumber).toBe(2);
    expect(res.isResume).toBe(false);
  });

  test('maxAttempts=1 + EXPIRED → student masih dapat memulai attempt baru', async () => {
    const expired = makeAttempt({
      startedAt: new Date(Date.now() - 40 * 60000),
    });
    const { svc, quizAttemptModel } = buildService({
      activeAttempt: expired,
      usedCount: 0, // EXPIRED tidak dihitung
    });
    const res = await svc.startQuiz(QUIZ_ID, USER_ID);
    expect(res.attemptNumber).toBeGreaterThan(0);
    expect(quizAttemptModel.create).toHaveBeenCalled();
  });

  test('maxAttempts=1 + IN_PROGRESS aktif → resume, TIDAK membuat attempt kedua', async () => {
    const { svc, quizAttemptModel } = buildService({
      activeAttempt: makeAttempt(),
      usedCount: 1,
    });
    const res = await svc.startQuiz(QUIZ_ID, USER_ID);
    expect(res.isResume).toBe(true);
    expect(quizAttemptModel.create).not.toHaveBeenCalled();
  });

  test('maxAttempts=1 + SUBMITTED → ditolak (BadRequest)', async () => {
    const { svc, quizAttemptModel } = buildService({ usedCount: 1 });
    await expect(svc.startQuiz(QUIZ_ID, USER_ID)).rejects.toThrow(
      BadRequestException,
    );
    expect(quizAttemptModel.create).not.toHaveBeenCalled();
  });
});

// ─── resumeQuizAttempt ─────────────────────────────────────────────────────

describe('PkkmbService — resumeQuizAttempt', () => {
  test('attempt sendiri IN_PROGRESS → soal (tanpa correctAnswer) + deadline server', async () => {
    const { svc } = buildService({
      attemptById: makeAttempt({
        answers: [{ questionId: '0', selectedAnswer: 'A' }],
      }),
    });
    const res = await svc.resumeQuizAttempt(QUIZ_ID, ATTEMPT_ID, USER_ID);

    expect(res.status).toBe('IN_PROGRESS');
    expect(res.quizId.toString()).toBe(QUIZ_ID);
    expect(res.questions).toHaveLength(2);
    expect(res.questions[0]).not.toHaveProperty('correctAnswer');
    expect(res.answers).toHaveLength(1);
    expect(
      (res as { remainingSeconds?: number }).remainingSeconds ?? 0,
    ).toBeGreaterThan(0);
  });

  test('attempt milik user lain → 403', async () => {
    const { svc } = buildService({
      attemptById: makeAttempt({ userId: { toString: () => OTHER_USER } }),
    });
    await expect(
      svc.resumeQuizAttempt(QUIZ_ID, ATTEMPT_ID, USER_ID),
    ).rejects.toThrow(ForbiddenException);
  });

  test('attempt tidak ditemukan → 404', async () => {
    const { svc } = buildService({ attemptById: null });
    await expect(
      svc.resumeQuizAttempt(QUIZ_ID, ATTEMPT_ID, USER_ID),
    ).rejects.toThrow(NotFoundException);
  });

  test('attempt milik quiz lain (IDOR via path) → 404, tidak bocor', async () => {
    const { svc } = buildService({
      attemptById: makeAttempt({ quizId: { toString: () => OTHER_QUIZ } }),
    });
    await expect(
      svc.resumeQuizAttempt(QUIZ_ID, ATTEMPT_ID, USER_ID),
    ).rejects.toThrow(NotFoundException);
  });

  test('IN_PROGRESS sudah lewat deadline → status EXPIRED, tidak bisa resume', async () => {
    const attempt = makeAttempt({
      startedAt: new Date(Date.now() - 40 * 60000),
    });
    const { svc } = buildService({ attemptById: attempt });
    const res = await svc.resumeQuizAttempt(QUIZ_ID, ATTEMPT_ID, USER_ID);

    expect(attempt.status).toBe('EXPIRED');
    expect(attempt.save).toHaveBeenCalled();
    expect(res.status).toBe('EXPIRED');
    expect(res.questions).toHaveLength(0);
  });

  test('SUBMITTED → bukan active attempt (questions kosong utk redirect)', async () => {
    const { svc } = buildService({
      attemptById: makeAttempt({
        status: 'SUBMITTED',
        percentage: 80,
        submittedAt: new Date(),
      }),
    });
    const res = await svc.resumeQuizAttempt(QUIZ_ID, ATTEMPT_ID, USER_ID);
    expect(res.status).toBe('SUBMITTED');
    expect(res.questions).toHaveLength(0);
  });
});

// ─── saveQuizAnswers (in-progress) ────────────────────────────────────────

describe('PkkmbService — saveQuizAnswers', () => {
  const dto = { answers: [{ questionId: '0', selectedAnswer: 'A' }] };

  test('IN_PROGRESS → jawaban disimpan (hanya questionId+selectedAnswer)', async () => {
    const attempt = makeAttempt();
    const { svc } = buildService({ attemptById: attempt });
    const res = await svc.saveQuizAnswers(QUIZ_ID, ATTEMPT_ID, USER_ID, dto);

    expect(res.saved).toBe(1);
    expect(attempt.answers).toEqual([{ questionId: '0', selectedAnswer: 'A' }]);
    expect(attempt.save).toHaveBeenCalledTimes(1);
  });

  test('attempt user lain → 403', async () => {
    const { svc } = buildService({
      attemptById: makeAttempt({ userId: { toString: () => OTHER_USER } }),
    });
    await expect(
      svc.saveQuizAnswers(QUIZ_ID, ATTEMPT_ID, USER_ID, dto),
    ).rejects.toThrow(ForbiddenException);
  });

  test('attempt milik quiz lain (IDOR via path) → 404', async () => {
    const { svc } = buildService({
      attemptById: makeAttempt({ quizId: { toString: () => OTHER_QUIZ } }),
    });
    await expect(
      svc.saveQuizAnswers(QUIZ_ID, ATTEMPT_ID, USER_ID, dto),
    ).rejects.toThrow(NotFoundException);
  });

  test('attempt sudah SUBMITTED → ditolak', async () => {
    const { svc } = buildService({
      attemptById: makeAttempt({ status: 'SUBMITTED' }),
    });
    await expect(
      svc.saveQuizAnswers(QUIZ_ID, ATTEMPT_ID, USER_ID, dto),
    ).rejects.toThrow(BadRequestException);
  });

  test('waktu pengerjaan habis → ditandai EXPIRED + ditolak', async () => {
    const attempt = makeAttempt({
      startedAt: new Date(Date.now() - 40 * 60000),
    });
    const { svc } = buildService({ attemptById: attempt });
    await expect(
      svc.saveQuizAnswers(QUIZ_ID, ATTEMPT_ID, USER_ID, dto),
    ).rejects.toThrow(BadRequestException);
    expect(attempt.status).toBe('EXPIRED');
    expect(attempt.save).toHaveBeenCalled();
  });
});

// ─── submitQuiz ────────────────────────────────────────────────────────────

describe('PkkmbService — submitQuiz', () => {
  const dto = {
    answers: [
      { questionId: '0', selectedAnswer: 'A' },
      { questionId: '1', selectedAnswer: 'B' },
    ],
  };

  test('quizId di path tidak cocok → 404 (IDOR protection)', async () => {
    const { svc } = buildService({
      attemptById: makeAttempt({ quizId: { toString: () => OTHER_QUIZ } }),
    });
    await expect(
      svc.submitQuiz(QUIZ_ID, ATTEMPT_ID, USER_ID, dto),
    ).rejects.toThrow(NotFoundException);
  });

  test('waktu pengerjaan habis → attempt ditandai EXPIRED + ditolak', async () => {
    const attempt = makeAttempt({
      startedAt: new Date(Date.now() - 40 * 60000),
    });
    const { svc } = buildService({ attemptById: attempt });
    await expect(
      svc.submitQuiz(QUIZ_ID, ATTEMPT_ID, USER_ID, dto),
    ).rejects.toThrow(BadRequestException);
    expect(attempt.status).toBe('EXPIRED');
    expect(attempt.save).toHaveBeenCalled();
  });

  test('valid → score dihitung backend + passingScore & passed dikembalikan', async () => {
    const attempt = makeAttempt();
    const { svc } = buildService({ attemptById: attempt });
    const res = await svc.submitQuiz(QUIZ_ID, ATTEMPT_ID, USER_ID, dto);

    expect(res.score).toBe(20); // 2/2 benar × 10
    expect(res.percentage).toBe(100);
    expect(res.passingScore).toBe(75);
    expect(res.passed).toBe(true);
    expect(res.status).toBe('SUBMITTED');
    expect(attempt.status).toBe('SUBMITTED');
    expect(attempt.save).toHaveBeenCalled();
  });

  test('nilai di bawah passingScore → passed=false', async () => {
    const attempt = makeAttempt();
    const { svc } = buildService({ attemptById: attempt });
    const wrong = {
      answers: [
        { questionId: '0', selectedAnswer: 'B' },
        { questionId: '1', selectedAnswer: 'A' },
      ],
    };
    const res = await svc.submitQuiz(QUIZ_ID, ATTEMPT_ID, USER_ID, wrong);
    expect(res.percentage).toBe(0);
    expect(res.passed).toBe(false);
  });

  test('sudah dikumpulkan → ditolak', async () => {
    const { svc } = buildService({
      attemptById: makeAttempt({ status: 'SUBMITTED' }),
    });
    await expect(
      svc.submitQuiz(QUIZ_ID, ATTEMPT_ID, USER_ID, dto),
    ).rejects.toThrow(BadRequestException);
  });
});

// ─── getQuizResult ─────────────────────────────────────────────────────────

describe('PkkmbService — getQuizResult', () => {
  test('mengembalikan passingScore & passed', async () => {
    const { svc } = buildService({
      resultAttempt: makeAttempt({
        status: 'SUBMITTED',
        percentage: 80,
        quizId: { title: 'Quiz Final', type: 'PRETEST', passingScore: 75 },
      }),
    });
    const res = await svc.getQuizResult(ATTEMPT_ID, USER_ID);
    expect(res.passingScore).toBe(75);
    expect(res.passed).toBe(true);
    expect(res.percentage).toBe(80);
  });

  test('attempt user lain → 403', async () => {
    const { svc } = buildService({
      resultAttempt: makeAttempt({ userId: { toString: () => OTHER_USER } }),
    });
    await expect(svc.getQuizResult(ATTEMPT_ID, USER_ID)).rejects.toThrow(
      ForbiddenException,
    );
  });
});

// ─── getQuizDetail (role-based) ────────────────────────────────────────────

describe('PkkmbService — getQuizDetail', () => {
  test('student → metadata aman, TANPA soal/correctAnswer, canStart dihitung', async () => {
    const { svc } = buildService({
      attempts: [makeAttempt()], // IN_PROGRESS aktif
    });
    const res = await svc.getStudentQuizDetail(QUIZ_ID, USER_ID);

    expect(res.title).toBe('Quiz Final');
    expect(res.status).toBe('PUBLISHED');
    expect(res).not.toHaveProperty('questions');
    expect(res.attemptCount).toBe(1);
    expect(res.usedAttempts).toBe(1);
    expect(res.isInProgress).toBe(true);
    expect(res.canStart).toBe(false); // maxAttempts=1 & ada attempt aktif
    expect(res.passingScore).toBe(75);
    expect(JSON.stringify(res)).not.toContain('correctAnswer');
  });

  test('student dgn SUBMITTED → bestAttempt + passed', async () => {
    const { svc } = buildService({
      attempts: [
        makeAttempt({ status: 'SUBMITTED', percentage: 60, attemptNumber: 1 }),
        makeAttempt({ status: 'SUBMITTED', percentage: 90, attemptNumber: 2 }),
      ],
    });
    const res = await svc.getStudentQuizDetail(QUIZ_ID, USER_ID);
    expect(res.bestAttempt?.attemptNumber).toBe(2);
    expect(res.bestAttempt?.percentage).toBe(90);
    expect(res.bestAttempt?.passed).toBe(true);
    expect(res.usedAttempts).toBe(2);
    expect(res.canStart).toBe(false);
  });

  test('student non-target → 403', async () => {
    const { svc } = buildService({
      quiz: makeQuiz({ targetType: 'GROUP', targetIds: ['g2'] }),
      userById: { pkkmbGroup: 'g1' },
    });
    await expect(svc.getStudentQuizDetail(QUIZ_ID, USER_ID)).rejects.toThrow(
      ForbiddenException,
    );
  });

  test('management → detail penuh termasuk correctAnswer', async () => {
    const { svc } = buildService({});
    const res = await svc.getQuizDetail(QUIZ_ID, USER_ID, 'panitia');
    const mgmt = res as {
      _id: { toString: () => string };
      questions: { correctAnswer: string }[];
    };
    expect(mgmt._id.toString()).toBe(QUIZ_ID);
    expect(mgmt.questions[0].correctAnswer).toBe('A');
  });

  test('dispatcher: maba → getStudentQuizDetail, management → penuh', async () => {
    const { svc } = buildService({});
    const canStart: unknown = expect.any(Boolean);
    await expect(
      svc.getQuizDetail(QUIZ_ID, USER_ID, 'user'),
    ).resolves.toMatchObject({ canStart });
    const mgmt = (await svc.getQuizDetail(QUIZ_ID, USER_ID, 'sekretaris')) as {
      questions?: unknown;
    };
    expect(mgmt.questions).toBeDefined();
  });
});

// ─── deleteQuiz (soft delete) ──────────────────────────────────────────────

describe('PkkmbService — deleteQuiz', () => {
  test('quiz ada → soft delete (deletedAt diisi, save dipanggil)', async () => {
    const quiz = makeQuiz();
    const { svc } = buildService({ quiz });
    const res = await svc.deleteQuiz(QUIZ_ID);
    expect(res.id.toString()).toBe(QUIZ_ID);
    expect((quiz as unknown as { deletedAt?: Date }).deletedAt).toBeInstanceOf(
      Date,
    );
    expect(quiz.save).toHaveBeenCalledTimes(1);
  });

  test('quiz tidak ditemukan → 404', async () => {
    const { svc } = buildService({ quiz: null });
    await expect(svc.deleteQuiz('nope')).rejects.toThrow(NotFoundException);
  });
});
