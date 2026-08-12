import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PkkmbService } from './pkkmb.service';
import {
  riskLevelFromCount,
  shouldDedupeViolation,
  countViolationsInWindow,
  isQuizViolationType,
  isInformationalType,
  QUIZ_VIOLATION_RATE_LIMIT,
  QUIZ_EVENTS_MAX_PER_REQUEST,
} from './quiz-anticheat';

// ─── Fixtures ──────────────────────────────────────────────────────────────

const USER_ID = '64b000000000000000000001';
const OTHER_USER = '64b000000000000000000002';
const QUIZ_ID = '64b000000000000000000101';
const OTHER_QUIZ = '64b000000000000000000102';
const ATTEMPT_ID = '64b000000000000000000201';

type AntiCheatFixture = {
  violationCount: number;
  violations: {
    type: string;
    occurredAt: Date;
    metadata?: { questionId?: string; clientTimestamp?: string };
  }[];
  riskLevel: string;
  lastHeartbeatAt?: Date;
};

function makeAttempt(over: Record<string, unknown> = {}) {
  const antiCheat: AntiCheatFixture = {
    violationCount: 0,
    violations: [],
    riskLevel: 'LOW',
  };
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
    antiCheat,
    save: jest.fn().mockResolvedValue(undefined),
    ...over,
  };
}

function makeQuiz(over: Record<string, unknown> = {}) {
  return {
    _id: { toString: () => QUIZ_ID },
    title: 'Quiz Final',
    status: 'PUBLISHED',
    ...over,
  };
}

function buildService(
  opts: {
    quiz?: ReturnType<typeof makeQuiz> | null;
    attemptById?: ReturnType<typeof makeAttempt> | null;
    attempts?: ReturnType<typeof makeAttempt>[];
  } = {},
) {
  const { quiz = makeQuiz(), attemptById = null, attempts = [] } = opts;

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
        if (filter && filter._id) {
          return { exec: jest.fn().mockResolvedValue(attemptById) };
        }
        return { exec: jest.fn().mockResolvedValue(null) };
      }),
    find: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(attempts),
          }),
        }),
      }),
    }),
  };

  // 17 arg constructor: user, role, group, session, log, task, submission,
  // quiz, quizAttempt, schedule, announcement, pointLog, gallery, rumpun,
  // studyProgram, publishConfig, redis.
  const svc = new PkkmbService(
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
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
    {} as never,
    {} as never,
  );
  return { svc: svc, quizModel, quizAttemptModel };
}

// ─── Pure module (quiz-anticheat.ts) ───────────────────────────────────────

describe('quiz-anticheat (pure)', () => {
  test('riskLevelFromCount: LOW 0-2, MEDIUM 3-5, HIGH >5', () => {
    expect(riskLevelFromCount(0)).toBe('LOW');
    expect(riskLevelFromCount(2)).toBe('LOW');
    expect(riskLevelFromCount(3)).toBe('MEDIUM');
    expect(riskLevelFromCount(5)).toBe('MEDIUM');
    expect(riskLevelFromCount(6)).toBe('HIGH');
    expect(riskLevelFromCount(100)).toBe('HIGH');
  });

  test('isQuizViolationType: hanya enum yang valid (termasuk tipe baru)', () => {
    expect(isQuizViolationType('TAB_HIDDEN')).toBe(true);
    expect(isQuizViolationType('COPY')).toBe(true);
    expect(isQuizViolationType('KEYBOARD_SHORTCUT')).toBe(true);
    expect(isQuizViolationType('TAB_VISIBLE')).toBe(true);
    expect(isQuizViolationType('ATTEMPT_RESUMED')).toBe(true);
    expect(isQuizViolationType('NOPE')).toBe(false);
    expect(isQuizViolationType(123)).toBe(false);
    expect(isQuizViolationType('')).toBe(false);
  });

  test('isInformationalType: event kembali/fokus/refresh/resume TIDAK pelanggaran', () => {
    expect(isInformationalType('TAB_VISIBLE')).toBe(true);
    expect(isInformationalType('WINDOW_FOCUS')).toBe(true);
    expect(isInformationalType('PAGE_REFRESH')).toBe(true);
    expect(isInformationalType('ATTEMPT_RESUMED')).toBe(true);
    expect(isInformationalType('TAB_HIDDEN')).toBe(false);
    expect(isInformationalType('COPY')).toBe(false);
    expect(isInformationalType('KEYBOARD_SHORTCUT')).toBe(false);
    expect(isInformationalType('FULLSCREEN_EXIT')).toBe(false);
  });

  test('shouldDedupeViolation: tipe sama dalam 5 detik → dedupe', () => {
    const now = new Date();
    const last = {
      type: 'TAB_HIDDEN' as const,
      occurredAt: new Date(now.getTime() - 1000),
    };
    expect(shouldDedupeViolation(last, 'TAB_HIDDEN', now)).toBe(true);
    expect(shouldDedupeViolation(last, 'WINDOW_BLUR', now)).toBe(false); // beda tipe
    expect(
      shouldDedupeViolation(
        {
          type: 'TAB_HIDDEN' as const,
          occurredAt: new Date(now.getTime() - 6000),
        },
        'TAB_HIDDEN',
        now,
      ),
    ).toBe(false); // lewat window
    expect(shouldDedupeViolation(undefined, 'COPY', now)).toBe(false);
  });

  test('countViolationsInWindow: hanya event dalam 60 detik', () => {
    const now = new Date();
    const violations = [
      { type: 'COPY' as const, occurredAt: new Date(now.getTime() - 5000) },
      { type: 'COPY' as const, occurredAt: new Date(now.getTime() - 90_000) },
      { type: 'PASTE' as const, occurredAt: new Date(now.getTime() - 10_000) },
    ];
    expect(countViolationsInWindow(violations, now)).toBe(2);
  });
});

// ─── reportViolation ───────────────────────────────────────────────────────

describe('PkkmbService — reportViolation', () => {
  test('valid → tercatat + risk dihitung backend + server timestamp', async () => {
    const attempt = makeAttempt();
    const { svc } = buildService({ attemptById: attempt });
    const before = new Date();
    const res = await svc.reportViolation(QUIZ_ID, ATTEMPT_ID, USER_ID, {
      type: 'TAB_HIDDEN',
    });
    const after = new Date();

    expect(res.recorded).toBe(true);
    expect(res.violationCount).toBe(1);
    expect(res.riskLevel).toBe('LOW');
    expect(attempt.antiCheat.violationCount).toBe(1);
    expect(attempt.antiCheat.riskLevel).toBe('LOW');
    expect(attempt.antiCheat.violations).toHaveLength(1);
    const occurred = new Date(attempt.antiCheat.violations[0].occurredAt);
    expect(occurred.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(occurred.getTime()).toBeLessThanOrEqual(after.getTime());
    expect(attempt.antiCheat.violations[0].type).toBe('TAB_HIDDEN');
    expect(attempt.save).toHaveBeenCalled();
  });

  test('duplicate event (tipe sama beruntun <5 dtk) → di-dedupe, tidak menambah count', async () => {
    const attempt = makeAttempt({
      antiCheat: {
        violationCount: 1,
        violations: [
          {
            type: 'TAB_HIDDEN',
            occurredAt: new Date(Date.now() - 1000),
          },
        ],
        riskLevel: 'LOW',
      },
    });
    const { svc } = buildService({ attemptById: attempt });
    const res = await svc.reportViolation(QUIZ_ID, ATTEMPT_ID, USER_ID, {
      type: 'TAB_HIDDEN',
    });

    expect(res.recorded).toBe(false);
    expect(res.deduplicated).toBe(true);
    expect(attempt.save).not.toHaveBeenCalled();
    expect(attempt.antiCheat.violationCount).toBe(1);
  });

  test('rate limit: >30 event dalam 60 dtk → di-ignore (tidak error)', async () => {
    const violations = Array.from(
      { length: QUIZ_VIOLATION_RATE_LIMIT },
      (_, i) => ({
        type: 'COPY' as const,
        occurredAt: new Date(Date.now() - i * 1000),
      }),
    );
    const attempt = makeAttempt({
      antiCheat: {
        violationCount: QUIZ_VIOLATION_RATE_LIMIT,
        violations,
        riskLevel: 'HIGH',
      },
    });
    const { svc } = buildService({ attemptById: attempt });
    const res = await svc.reportViolation(QUIZ_ID, ATTEMPT_ID, USER_ID, {
      type: 'PASTE',
    });

    expect(res.recorded).toBe(false);
    expect(res.rateLimited).toBe(true);
    expect(attempt.save).not.toHaveBeenCalled();
  });

  test('invalid violation type → 400', async () => {
    const { svc } = buildService({ attemptById: makeAttempt() });
    await expect(
      svc.reportViolation(QUIZ_ID, ATTEMPT_ID, USER_ID, {
        type: 'NOT_A_TYPE',
      } as never),
    ).rejects.toThrow(BadRequestException);
  });

  test('attempt milik user lain → 403', async () => {
    const { svc } = buildService({
      attemptById: makeAttempt({ userId: { toString: () => OTHER_USER } }),
    });
    await expect(
      svc.reportViolation(QUIZ_ID, ATTEMPT_ID, USER_ID, {
        type: 'COPY',
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  test('attempt tidak ditemukan → 404', async () => {
    const { svc } = buildService({ attemptById: null });
    await expect(
      svc.reportViolation(QUIZ_ID, ATTEMPT_ID, USER_ID, {
        type: 'COPY',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  test('attempt milik quiz lain (IDOR via path) → 404, tidak bocor', async () => {
    const { svc } = buildService({
      attemptById: makeAttempt({ quizId: { toString: () => OTHER_QUIZ } }),
    });
    await expect(
      svc.reportViolation(QUIZ_ID, ATTEMPT_ID, USER_ID, {
        type: 'COPY',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  test('attempt sudah SUBMITTED → ditolak', async () => {
    const { svc } = buildService({
      attemptById: makeAttempt({ status: 'SUBMITTED' }),
    });
    await expect(
      svc.reportViolation(QUIZ_ID, ATTEMPT_ID, USER_ID, {
        type: 'COPY',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  test('risk naik ke MEDIUM saat 3 violations, HIGH saat 6', async () => {
    const attempt = makeAttempt();
    const { svc } = buildService({ attemptById: attempt });
    for (const type of ['TAB_HIDDEN', 'WINDOW_BLUR', 'COPY'] as const) {
      await svc.reportViolation(QUIZ_ID, ATTEMPT_ID, USER_ID, { type });
    }
    expect(attempt.antiCheat.violationCount).toBe(3);
    expect(attempt.antiCheat.riskLevel).toBe('MEDIUM');

    // 3 lagi → total 6 → HIGH (tipe bergantian agar tidak ter-dedupe)
    const more = ['PASTE', 'CONTEXT_MENU', 'PRINT_ATTEMPT'] as const;
    for (const type of more) {
      await svc.reportViolation(QUIZ_ID, ATTEMPT_ID, USER_ID, { type });
    }
    expect(attempt.antiCheat.violationCount).toBe(6);
    expect(attempt.antiCheat.riskLevel).toBe('HIGH');
  });

  test('metadata questionId disimpan, isi clipboard/layar tidak pernah dikirim', async () => {
    const attempt = makeAttempt();
    const { svc } = buildService({ attemptById: attempt });
    await svc.reportViolation(QUIZ_ID, ATTEMPT_ID, USER_ID, {
      type: 'WINDOW_BLUR',
      questionId: '3',
    });
    expect(attempt.antiCheat.violations[0].metadata).toEqual({
      questionId: '3',
    });
    expect(JSON.stringify(attempt.antiCheat)).not.toContain('clipboard');
  });
});

// ─── reportQuizEvents (batch) ──────────────────────────────────────────────

describe('PkkmbService — reportQuizEvents (batch)', () => {
  test('batch valid → semua tercatat, count & risk naik sesuai', async () => {
    const attempt = makeAttempt();
    const { svc } = buildService({ attemptById: attempt });
    const res = await svc.reportQuizEvents(QUIZ_ID, ATTEMPT_ID, USER_ID, {
      events: [
        { type: 'KEYBOARD_SHORTCUT' },
        { type: 'CONTEXT_MENU', questionId: '2' },
      ],
    });

    expect(res.recordedCount).toBe(2);
    expect(res.violationCount).toBe(2);
    expect(attempt.antiCheat.violations).toHaveLength(2);
    expect(attempt.antiCheat.violations[1].metadata).toEqual({
      questionId: '2',
    });
    expect(attempt.save).toHaveBeenCalledTimes(2);
  });

  test('event informasional (TAB_VISIBLE) dicatat tapi TIDAK menaikkan violationCount', async () => {
    const attempt = makeAttempt();
    const { svc } = buildService({ attemptById: attempt });
    const res = await svc.reportQuizEvents(QUIZ_ID, ATTEMPT_ID, USER_ID, {
      events: [
        { type: 'TAB_HIDDEN' },
        { type: 'TAB_VISIBLE' },
        { type: 'WINDOW_FOCUS' },
      ],
    });

    expect(res.recordedCount).toBe(3);
    expect(res.violationCount).toBe(1); // hanya TAB_HIDDEN
    expect(res.riskLevel).toBe('LOW');
    expect(attempt.antiCheat.violations).toHaveLength(3); // 3 event di timeline
    expect(attempt.antiCheat.riskLevel).toBe('LOW');
  });

  test('lebih dari 50 event per request → 400', async () => {
    const { svc } = buildService({ attemptById: makeAttempt() });
    const events = Array.from(
      { length: QUIZ_EVENTS_MAX_PER_REQUEST + 1 },
      () => ({
        type: 'COPY' as const,
      }),
    );
    await expect(
      svc.reportQuizEvents(QUIZ_ID, ATTEMPT_ID, USER_ID, { events }),
    ).rejects.toThrow(BadRequestException);
  });

  test('rate limit tetap berlaku DI DALAM batch: 30 pertama tercatat, sisanya di-ignore', async () => {
    const violations = Array.from(
      { length: QUIZ_VIOLATION_RATE_LIMIT },
      (_, i) => ({
        type: 'COPY' as const,
        occurredAt: new Date(Date.now() - i * 1000),
      }),
    );
    const attempt = makeAttempt({
      antiCheat: {
        violationCount: QUIZ_VIOLATION_RATE_LIMIT,
        violations,
        riskLevel: 'HIGH',
      },
    });
    const { svc } = buildService({ attemptById: attempt });
    const res = await svc.reportQuizEvents(QUIZ_ID, ATTEMPT_ID, USER_ID, {
      events: [{ type: 'PASTE' }, { type: 'PASTE' }],
    });

    expect(res.recordedCount).toBe(0);
    expect(res.results[0].rateLimited).toBe(true);
    expect(attempt.save).not.toHaveBeenCalled();
  });

  test('clientTimestamp dikirim → disimpan sebagai metadata (server time tetap occurredAt)', async () => {
    const attempt = makeAttempt();
    const { svc } = buildService({ attemptById: attempt });
    await svc.reportQuizEvents(QUIZ_ID, ATTEMPT_ID, USER_ID, {
      events: [{ type: 'TAB_HIDDEN', timestamp: '2026-08-08T01:00:00.000Z' }],
    });
    expect(attempt.antiCheat.violations[0].metadata?.clientTimestamp).toBe(
      '2026-08-08T01:00:00.000Z',
    );
    expect(attempt.antiCheat.violations[0].occurredAt).toBeInstanceOf(Date);
  });

  test('events kosong → 400', async () => {
    const { svc } = buildService({ attemptById: makeAttempt() });
    await expect(
      svc.reportQuizEvents(QUIZ_ID, ATTEMPT_ID, USER_ID, {
        events: [],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  test('satu event invalid type → 400 (tanpa partial record)', async () => {
    const attempt = makeAttempt();
    const { svc } = buildService({ attemptById: attempt });
    await expect(
      svc.reportQuizEvents(QUIZ_ID, ATTEMPT_ID, USER_ID, {
        events: [{ type: 'COPY' }, { type: 'NOT_A_TYPE' }],
      } as never),
    ).rejects.toThrow(BadRequestException);
    expect(attempt.save).not.toHaveBeenCalled();
  });

  test('attempt user lain → 403; attempt hilang → 404', async () => {
    const { svc } = buildService({
      attemptById: makeAttempt({ userId: { toString: () => OTHER_USER } }),
    });
    await expect(
      svc.reportQuizEvents(QUIZ_ID, ATTEMPT_ID, USER_ID, {
        events: [{ type: 'COPY' }],
      }),
    ).rejects.toThrow(ForbiddenException);

    const { svc: svc2 } = buildService({ attemptById: null });
    await expect(
      svc2.reportQuizEvents(QUIZ_ID, ATTEMPT_ID, USER_ID, {
        events: [{ type: 'COPY' }],
      }),
    ).rejects.toThrow(NotFoundException);
  });
});

// ─── heartbeatAttempt ──────────────────────────────────────────────────────

describe('PkkmbService — heartbeatAttempt', () => {
  test('IN_PROGRESS → lastHeartbeatAt diperbarui (server time)', async () => {
    const attempt = makeAttempt();
    const { svc } = buildService({ attemptById: attempt });
    const res = await svc.heartbeatAttempt(QUIZ_ID, ATTEMPT_ID, USER_ID);

    expect(res.status).toBe('IN_PROGRESS');
    expect(attempt.antiCheat.lastHeartbeatAt).toBeInstanceOf(Date);
    expect(attempt.save).toHaveBeenCalled();
  });

  test('attempt user lain → 403', async () => {
    const { svc } = buildService({
      attemptById: makeAttempt({ userId: { toString: () => OTHER_USER } }),
    });
    await expect(
      svc.heartbeatAttempt(QUIZ_ID, ATTEMPT_ID, USER_ID),
    ).rejects.toThrow(ForbiddenException);
  });

  test('attempt tidak ditemukan → 404', async () => {
    const { svc } = buildService({ attemptById: null });
    await expect(
      svc.heartbeatAttempt(QUIZ_ID, ATTEMPT_ID, USER_ID),
    ).rejects.toThrow(NotFoundException);
  });

  test('SUBMITTED → dikembalikan tanpa error (client berhenti heartbeat)', async () => {
    const attempt = makeAttempt({ status: 'SUBMITTED' });
    const { svc } = buildService({ attemptById: attempt });
    const res = await svc.heartbeatAttempt(QUIZ_ID, ATTEMPT_ID, USER_ID);
    expect(res.status).toBe('SUBMITTED');
    expect(attempt.save).not.toHaveBeenCalled();
  });
});

// ─── listQuizAttempts ──────────────────────────────────────────────────────

describe('PkkmbService — listQuizAttempts (management)', () => {
  test('quiz ada → daftar attempt + antiCheat (tanpa jawaban/isi privat)', async () => {
    const { svc } = buildService({
      attempts: [
        makeAttempt({
          status: 'GRADED',
          percentage: 85,
          userId: {
            _id: 'u1',
            name: 'Maba A',
            nim: '24001',
          },
          antiCheat: {
            violationCount: 4,
            riskLevel: 'MEDIUM',
            lastHeartbeatAt: new Date(),
            violations: [
              { type: 'TAB_HIDDEN', occurredAt: new Date() },
              { type: 'COPY', occurredAt: new Date() },
            ],
          },
        }),
      ],
    });
    const list = await svc.listQuizAttempts(QUIZ_ID);

    expect(list).toHaveLength(1);
    const first = list[0];
    expect(first.attemptId.toString()).toBe(ATTEMPT_ID);
    expect(first.percentage).toBe(85);
    expect(first.user).toEqual({ id: 'u1', name: 'Maba A', nim: '24001' });
    expect(first.antiCheat.violationCount).toBe(4);
    expect(first.antiCheat.riskLevel).toBe('MEDIUM');
    expect(first.antiCheat.violations).toHaveLength(2);
    // Tidak pernah membocorkan isi jawaban/isi privat ke tampilan management.
    expect(JSON.stringify(list)).not.toContain('answers');
    expect(JSON.stringify(list)).not.toContain('correctAnswer');
  });

  test('quiz tidak ditemukan → 404', async () => {
    const { svc } = buildService({ quiz: null });
    await expect(svc.listQuizAttempts(QUIZ_ID)).rejects.toThrow(
      NotFoundException,
    );
  });
});
