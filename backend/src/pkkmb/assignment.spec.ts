/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unnecessary-type-assertion */
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { PkkmbService } from './pkkmb.service';

// ─── HELPERS ────────────────────────────────────────────────────────────────

const QUIZ_ID = '507f1f77bcf86cd799439011';
const OTHER_QUIZ = '507f1f77bcf86cd799439012';
const USER_ID = '507f1f77bcf86cd799439013';
const ASSIGNMENT_ID = '507f1f77bcf86cd799439014';

function makeQuiz(overrides: Record<string, unknown> = {}) {
  return {
    _id: { toString: () => QUIZ_ID },
    title: 'Pretest PKKMB FT 2026',
    description: 'Kerjakan sebelum PKKMB',
    type: 'PRETEST',
    status: 'PUBLISHED',
    durationMinutes: 15,
    maxAttempts: 1,
    passingScore: 70,
    targetType: 'ALL',
    targetIds: [],
    questions: [
      {
        question: 'Q1',
        options: [
          { id: 'A', text: 'a' },
          { id: 'B', text: 'b' },
        ],
        correctAnswer: 'A',
        points: 1,
        order: 0,
      },
    ],
    deletedAt: null,
    save: jest.fn().mockResolvedValue(true),
    ...overrides,
  };
}

function makeAttempt(overrides: Record<string, unknown> = {}) {
  return {
    _id: { toString: () => 'attempt-1' },
    quizId: { toString: () => QUIZ_ID },
    userId: { toString: () => USER_ID },
    attemptNumber: 1,
    status: 'SUBMITTED',
    score: 10,
    correctCount: 1,
    totalQuestions: 1,
    percentage: 100,
    startedAt: new Date('2026-08-01T00:00:00Z'),
    submittedAt: new Date('2026-08-01T00:10:00Z'),
    ...overrides,
  };
}

// Mock service dengan model yang dibutuhkan integrasi assignment.
function buildService(
  opts: {
    quiz?: ReturnType<typeof makeQuiz> | null;
    attempts?: ReturnType<typeof makeAttempt>[];
    assignment?: Record<string, unknown> | null;
    user?: Record<string, unknown> | null;
    submission?: Record<string, unknown> | null;
  } = {},
) {
  const {
    quiz = makeQuiz(),
    attempts = [],
    assignment = null,
    user = {
      _id: { toString: () => USER_ID },
      pkkmbGroup: null,
      studyProgramId: null,
    },
    submission = null,
  } = opts;

  const quizModel = {
    findOne: jest
      .fn()
      .mockImplementation((filter?: Record<string, unknown>) => {
        const byId =
          filter && typeof filter._id === 'string' ? filter._id : QUIZ_ID;
        const found = quiz && quiz._id.toString() === byId ? quiz : null;
        return {
          select: jest.fn().mockReturnValue({
            lean: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(found),
            }),
          }),
          exec: jest.fn().mockResolvedValue(found),
        };
      }),
    find: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(quiz ? [quiz] : []),
        }),
      }),
    }),
  };

  const quizAttemptModel = {
    find: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest
            .fn()
            .mockReturnValue({ exec: jest.fn().mockResolvedValue(attempts) }),
        }),
        lean: jest
          .fn()
          .mockReturnValue({ exec: jest.fn().mockResolvedValue(attempts) }),
      }),
    }),
  };

  const userModel = {
    findById: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest
          .fn()
          .mockReturnValue({ exec: jest.fn().mockResolvedValue(user) }),
      }),
    }),
  };

  const submissionModel = {
    findOne: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest
          .fn()
          .mockReturnValue({ exec: jest.fn().mockResolvedValue(submission) }),
      }),
    }),
    find: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest
          .fn()
          .mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }),
      }),
    }),
  };

  const taskModel = {
    create: jest
      .fn()
      .mockImplementation((data: Record<string, unknown>) =>
        Promise.resolve({ _id: { toString: () => ASSIGNMENT_ID }, ...data }),
      ),
    findOne: jest
      .fn()
      .mockImplementation((filter?: Record<string, unknown>) => {
        const byId =
          filter && typeof filter._id === 'string' ? filter._id : ASSIGNMENT_ID;
        const found =
          assignment &&
          (assignment._id as { toString: () => string }).toString() === byId
            ? assignment
            : null;
        return {
          select: jest.fn().mockReturnValue({
            lean: jest
              .fn()
              .mockReturnValue({ exec: jest.fn().mockResolvedValue(found) }),
          }),
          exec: jest.fn().mockResolvedValue(found),
        };
      }),
    find: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest
                .fn()
                .mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }),
            }),
          }),
        }),
        lean: jest
          .fn()
          .mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }),
      }),
    }),
    countDocuments: jest.fn().mockResolvedValue(0),
  };

  const studyProgramModel = {
    findById: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest
          .fn()
          .mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
      }),
    }),
  };

  const svc = new PkkmbService(
    userModel as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    taskModel as never,
    submissionModel as never,
    quizModel as never,
    quizAttemptModel as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    studyProgramModel as never,
    {} as never,
    {} as never,
  );

  return {
    svc: svc,
    taskModel,
    quizModel,
    quizAttemptModel,
    userModel,
    submissionModel,
    studyProgramModel,
  };
}

const baseDto = {
  title: 'Pretest PKKMB FT',
  description: 'Kerjakan pretest',
  deadline: '2026-08-10T23:59:59Z',
};

// ─── CREATE ASSIGNMENT ─────────────────────────────────────────────────────

describe('PkkmbService — createTask (assignment TASK/QUIZ)', () => {
  test('type QUIZ → quizId wajib (tanpa quizId → 400)', async () => {
    const { svc } = buildService();
    await expect(
      svc.createTask({ ...baseDto, assignmentType: 'QUIZ' } as never, USER_ID),
    ).rejects.toThrow(BadRequestException);
  });

  test('type QUIZ → quizId wajib valid (quiz tidak ada → 400)', async () => {
    const { svc } = buildService({ quiz: null });
    await expect(
      svc.createTask(
        { ...baseDto, assignmentType: 'QUIZ', quizId: OTHER_QUIZ } as never,
        USER_ID,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  test('type QUIZ + quiz valid → assignment dibuat dgn quizId (bukan salinan soal)', async () => {
    const { svc, taskModel } = buildService();
    const res = await svc.createTask(
      { ...baseDto, assignmentType: 'QUIZ', quizId: QUIZ_ID } as never,
      USER_ID,
    );
    expect(taskModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ assignmentType: 'QUIZ' }),
    );
    const createArg = taskModel.create.mock.calls[0][0];
    expect(createArg.quizId?.toString?.()).toBe(QUIZ_ID);
    expect(res.assignmentType).toBe('QUIZ');
    // Soal tidak disimpan di assignment — hanya quizId (container).
    expect(
      (res as unknown as { questions?: unknown }).questions,
    ).toBeUndefined();
  });

  test('type TASK → tipe submisi wajib (tanpa type → 400)', async () => {
    const { svc } = buildService();
    await expect(
      svc.createTask({ ...baseDto, assignmentType: 'TASK' } as never, USER_ID),
    ).rejects.toThrow(BadRequestException);
  });

  test('type TASK → quizId diabaikan (null)', async () => {
    const { svc, taskModel } = buildService();
    await svc.createTask(
      {
        ...baseDto,
        assignmentType: 'TASK',
        type: 'individu',
        quizId: QUIZ_ID,
      } as never,
      USER_ID,
    );
    const createArg = taskModel.create.mock.calls[0][0];
    expect(createArg.quizId).toBeUndefined();
    expect(createArg.type).toBe('individu');
  });

  test('default assignmentType = TASK (backward compatible)', async () => {
    const { svc, taskModel } = buildService();
    await svc.createTask({ ...baseDto, type: 'individu' }, USER_ID);
    const createArg = taskModel.create.mock.calls[0][0];
    expect(createArg.assignmentType).toBe('TASK');
  });
});

// ─── DELETE PROTECTION ─────────────────────────────────────────────────────

describe('PkkmbService — deleteQuiz protection', () => {
  test('quiz dipakai assignment → 400 (tidak dihapus)', async () => {
    const assignment = {
      _id: { toString: () => ASSIGNMENT_ID },
      title: 'Pretest PKKMB FT',
      quizId: { toString: () => QUIZ_ID },
      deletedAt: null,
    };
    const { svc, taskModel } = buildService({ assignment });
    taskModel.findOne.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest
          .fn()
          .mockReturnValue({ exec: jest.fn().mockResolvedValue(assignment) }),
      }),
    });
    await expect(svc.deleteQuiz(QUIZ_ID)).rejects.toThrow(BadRequestException);
  });

  test('quiz tidak dipakai assignment → soft delete', async () => {
    const quiz = makeQuiz();
    const { svc, taskModel } = buildService({ quiz });
    taskModel.findOne.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest
          .fn()
          .mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
      }),
    });
    const res = await svc.deleteQuiz(QUIZ_ID);
    expect(res.id.toString()).toBe(QUIZ_ID);
    expect((quiz as unknown as { deletedAt?: Date }).deletedAt).toBeInstanceOf(
      Date,
    );
  });
});

// ─── STATUS DERIVATION (dari QuizAttempt) ──────────────────────────────────

describe('PkkmbService — studentAssignmentStatus (derivasi dari attempt)', () => {
  test('belum ada attempt → NOT_STARTED', async () => {
    const { svc } = buildService({ attempts: [] });
    const status = await svc.studentAssignmentStatus(
      {
        _id: { toString: () => ASSIGNMENT_ID },
        assignmentType: 'QUIZ',
        quizId: { toString: () => QUIZ_ID },
        deadline: new Date('2026-08-10T23:59:59Z'),
      },
      USER_ID,
    );
    expect(status.status).toBe('NOT_STARTED');
  });

  test('attempt IN_PROGRESS (timer belum lewat) → IN_PROGRESS + activeAttemptId', async () => {
    const { svc } = buildService({
      attempts: [
        makeAttempt({
          status: 'IN_PROGRESS',
          _id: { toString: () => 'attempt-active' },
          startedAt: new Date(Date.now() - 60 * 1000), // 1 menit lalu (durasi 15 mnt)
        }),
      ],
    });
    const status = await svc.studentAssignmentStatus(
      {
        _id: { toString: () => ASSIGNMENT_ID },
        assignmentType: 'QUIZ',
        quizId: { toString: () => QUIZ_ID },
        deadline: new Date('2026-08-10T23:59:59Z'),
      },
      USER_ID,
    );
    expect(status.status).toBe('IN_PROGRESS');
    expect(status.activeAttemptId).toBe('attempt-active');
  });

  test('attempt SUBMITTED/GRADED → COMPLETED + bestAttempt', async () => {
    const { svc } = buildService({
      attempts: [makeAttempt({ status: 'GRADED', percentage: 100 })],
    });
    const status = await svc.studentAssignmentStatus(
      {
        _id: { toString: () => ASSIGNMENT_ID },
        assignmentType: 'QUIZ',
        quizId: { toString: () => QUIZ_ID },
        deadline: new Date('2026-08-10T23:59:59Z'),
      },
      USER_ID,
    );
    expect(status.status).toBe('COMPLETED');
    expect(status.bestAttempt?.percentage).toBe(100);
    // attemptId di bestAttempt → frontend bisa membangun route result
    // (/dashboard/quiz/:quizId/result/:attemptId) utk tombol "Lihat Hasil".
    expect(status.bestAttempt?.attemptId).toBe('attempt-1');
  });

  test('deadline lewat & belum dikerjakan → OVERDUE', async () => {
    const { svc } = buildService({ attempts: [] });
    const status = await svc.studentAssignmentStatus(
      {
        _id: { toString: () => ASSIGNMENT_ID },
        assignmentType: 'QUIZ',
        quizId: { toString: () => QUIZ_ID },
        deadline: new Date('2020-01-01T00:00:00Z'),
      },
      USER_ID,
    );
    expect(status.status).toBe('OVERDUE');
  });

  test('IN_PROGRESS STALE (timer attempt lewat) → tidak aktif (NOT_STARTED)', async () => {
    const { svc } = buildService({
      attempts: [
        makeAttempt({
          status: 'IN_PROGRESS',
          _id: { toString: () => 'attempt-stale' },
          startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 jam lalu > durasi 15 mnt
        }),
      ],
    });
    const status = await svc.studentAssignmentStatus(
      {
        _id: { toString: () => ASSIGNMENT_ID },
        assignmentType: 'QUIZ',
        quizId: { toString: () => QUIZ_ID },
        deadline: new Date('2026-08-10T23:59:59Z'),
      },
      USER_ID,
    );
    expect(status.status).toBe('NOT_STARTED');
    expect(status.activeAttemptId).toBeNull();
  });

  test('TASK: submission ada (batch) → SUBMITTED', async () => {
    const { svc, submissionModel } = buildService();
    (submissionModel.find as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([
            {
              taskId: { toString: () => ASSIGNMENT_ID },
              status: 'SUBMITTED',
              score: 90,
              submittedAt: new Date('2026-08-02T00:00:00Z'),
            },
          ]),
        }),
      }),
    });
    const status = await svc.studentAssignmentStatus(
      {
        _id: { toString: () => ASSIGNMENT_ID },
        assignmentType: 'TASK',
        type: 'individu',
        deadline: new Date('2026-08-10T23:59:59Z'),
      },
      USER_ID,
    );
    expect(status.status).toBe('SUBMITTED');
    expect(status.bestAttempt?.score).toBe(90);
  });
});

// ─── LIST VISIBILITY (targeting assignment AND quiz) ───────────────────────

describe('PkkmbService — listAssignments visibility quiz (AND targeting)', () => {
  const assignment = {
    _id: { toString: () => ASSIGNMENT_ID },
    title: 'Pretest PKKMB FT',
    description: 'd',
    assignmentType: 'QUIZ',
    quizId: { toString: () => QUIZ_ID },
    status: 'PUBLISHED',
    deadline: new Date('2026-08-10T23:59:59Z'),
    targetType: 'ALL',
    targetIds: [],
    deletedAt: null,
  };

  test('quiz non-target (INDIVIDUAL lain) → assignment DISEMBUNYIKAN', async () => {
    const quiz = makeQuiz({
      targetType: 'INDIVIDUAL',
      targetIds: [{ toString: () => '507f1f77bcf86cd799439099' }],
    });
    const { svc, taskModel } = buildService({ assignment, quiz });
    taskModel.find.mockReturnValue({
      select: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([assignment]),
          }),
        }),
      }),
    });
    const res = await svc.listAssignments(USER_ID, {} as never);
    expect(res.data).toHaveLength(0);
    expect(res.meta.total).toBe(0);
  });

  test('quiz target ALL → assignment terlihat + status NOT_STARTED', async () => {
    const { svc, taskModel } = buildService({ assignment, quiz: makeQuiz() });
    taskModel.find.mockReturnValue({
      select: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([assignment]),
          }),
        }),
      }),
    });
    const res = await svc.listAssignments(USER_ID, {} as never);
    expect(res.data).toHaveLength(1);
    expect(res.data[0].status).toBe('NOT_STARTED');
    expect(res.data[0].quiz?.totalQuestions).toBe(1);
  });

  test('panitia melihat SEMUA status (DRAFT/CLOSED ikut tampil) + status assignment, bukan per-user', async () => {
    const draftAssignment = {
      _id: { toString: () => ASSIGNMENT_ID },
      title: 'Draft Pretest',
      description: 'd',
      assignmentType: 'QUIZ',
      quizId: { toString: () => QUIZ_ID },
      status: 'DRAFT',
      deadline: new Date('2026-08-10T23:59:59Z'),
      targetType: 'ALL',
      targetIds: [],
      deletedAt: null,
    };
    const { svc, taskModel } = buildService({
      assignment: draftAssignment as never,
      quiz: makeQuiz(),
    });
    taskModel.countDocuments.mockResolvedValue(1);
    taskModel.find.mockReturnValue({
      select: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue([draftAssignment]),
              }),
            }),
          }),
        }),
      }),
    });
    const res = await svc.listAssignments(USER_ID, {} as never, true);
    expect(res.data).toHaveLength(1);
    // Panitia: status = status assignment (DRAFT), bukan status turunan per-user.
    expect(res.data[0].status).toBe('DRAFT');
    expect(res.meta.total).toBe(1);
  });
});

// ─── UPDATE ASSIGNMENT (PATCH parsial aman) ────────────────────────────────

describe('PkkmbService — updateAssignment (PATCH parsial aman)', () => {
  function makeAssignment(overrides: Record<string, unknown> = {}) {
    return {
      _id: { toString: () => ASSIGNMENT_ID },
      title: 'Tugas Lama',
      description: 'd',
      assignmentType: 'TASK',
      type: 'individu',
      status: 'PUBLISHED',
      targetType: 'GROUP',
      targetIds: [{ toString: () => '507f1f77bcf86cd799439099' }],
      deadline: new Date('2026-08-10T23:59:59Z'),
      quizId: null,
      save: jest.fn().mockResolvedValue(true),
      ...overrides,
    };
  }

  test('PATCH parsial tidak me-reset targetIds yang tidak dikirim', async () => {
    const assignment = makeAssignment();
    const { svc } = buildService({ assignment: assignment as never });
    await svc.updateAssignment(
      ASSIGNMENT_ID,
      { title: 'Baru' } as never,
      USER_ID,
    );
    expect(assignment.title).toBe('Baru');
    expect(assignment.targetType).toBe('GROUP');
    expect(assignment.targetIds).toHaveLength(1);
    expect(assignment.save).toHaveBeenCalled();
  });

  test('QUIZ → TASK: quizId di-unset (null)', async () => {
    const assignment = makeAssignment({
      assignmentType: 'QUIZ',
      quizId: { toString: () => QUIZ_ID },
    });
    const { svc } = buildService({ assignment: assignment as never });
    await svc.updateAssignment(
      ASSIGNMENT_ID,
      { assignmentType: 'TASK', type: 'individu' } as never,
      USER_ID,
    );
    expect(assignment.quizId).toBeNull();
    expect(assignment.assignmentType).toBe('TASK');
  });

  test('quizId tidak dapat diubah jika sudah direferensikan → 400', async () => {
    const assignment = makeAssignment({
      assignmentType: 'QUIZ',
      quizId: { toString: () => QUIZ_ID },
    });
    const { svc } = buildService({ assignment: assignment as never });
    await expect(
      svc.updateAssignment(
        ASSIGNMENT_ID,
        { quizId: OTHER_QUIZ } as never,
        USER_ID,
      ),
    ).rejects.toThrow(BadRequestException);
  });
});

// ─── TARGETING (non-target ditolak) ────────────────────────────────────────

describe('PkkmbService — getAssignmentDetail targeting', () => {
  test('student non-target → 403 (targetType INDIVIDUAL lain)', async () => {
    const assignment = {
      _id: { toString: () => ASSIGNMENT_ID },
      title: 'Tugas X',
      description: 'd',
      assignmentType: 'TASK',
      type: 'individu',
      status: 'PUBLISHED',
      deadline: new Date('2026-08-10T23:59:59Z'),
      targetType: 'INDIVIDUAL',
      targetIds: [{ toString: () => '507f1f77bcf86cd799439099' }],
      deletedAt: null,
    };
    const { svc } = buildService({ assignment });
    await expect(
      svc.getAssignmentDetail(ASSIGNMENT_ID, USER_ID),
    ).rejects.toThrow(ForbiddenException);
  });

  test('assignment QUIZ tapi user non-target quiz → 403', async () => {
    const quiz = makeQuiz({
      targetType: 'INDIVIDUAL',
      targetIds: [{ toString: () => '507f1f77bcf86cd799439099' }],
    });
    const assignment = {
      _id: { toString: () => ASSIGNMENT_ID },
      title: 'Pretest',
      description: 'd',
      assignmentType: 'QUIZ',
      status: 'PUBLISHED',
      deadline: new Date('2026-08-10T23:59:59Z'),
      targetType: 'ALL',
      targetIds: [],
      quizId: { toString: () => QUIZ_ID },
      deletedAt: null,
    };
    const { svc } = buildService({ assignment, quiz });
    await expect(
      svc.getAssignmentDetail(ASSIGNMENT_ID, USER_ID),
    ).rejects.toThrow(ForbiddenException);
  });

  test('targeting FACULTY: faculty ObjectId vs targetIds string → tetap cocok (normalisasi)', async () => {
    const quiz = makeQuiz({
      targetType: 'FACULTY',
      targetIds: ['Fakultas Teknik'],
    });
    const assignment = {
      _id: { toString: () => ASSIGNMENT_ID },
      title: 'Pretest FT',
      description: 'd',
      assignmentType: 'QUIZ',
      status: 'PUBLISHED',
      deadline: new Date('2026-08-10T23:59:59Z'),
      targetType: 'ALL',
      targetIds: [],
      quizId: { toString: () => QUIZ_ID },
      deletedAt: null,
    };
    const user = {
      _id: { toString: () => USER_ID },
      pkkmbGroup: null,
      studyProgramId: { toString: () => '507f1f77bcf86cd799439015' },
    };
    const { svc, studyProgramModel } = buildService({
      assignment,
      quiz,
      user,
    });
    // faculty disimpan sebagai ObjectId-like (punya toString) — harus
    // dinormalisasi ke string sebelum dibandingkan dengan targetIds.
    studyProgramModel.findById.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({
            faculty: { toString: () => 'Fakultas Teknik' },
          }),
        }),
      }),
    });
    const res = await svc.getAssignmentDetail(ASSIGNMENT_ID, USER_ID);
    expect(res.title).toBe('Pretest FT');
    expect(res.quiz?.title).toBe('Pretest PKKMB FT 2026');
  });
});
