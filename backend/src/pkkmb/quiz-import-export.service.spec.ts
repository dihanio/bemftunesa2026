import * as XLSX from 'xlsx';
import {
  BadRequestException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PkkmbService } from './pkkmb.service';
import {
  QUIZ_TEMPLATE_HEADERS,
  XLSX_MIME,
  QuizQuestionShape,
} from './quiz-import-export';

const HEADER = [...QUIZ_TEMPLATE_HEADERS];

function makeBuffer(rows: unknown[][]): Buffer {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'SOAL');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

const validRow = (q: string): unknown[] => [
  q,
  'A',
  'B',
  'C',
  'D',
  'A',
  10,
  1,
];

function makeFile(over: Partial<Express.Multer.File> = {}): Express.Multer.File {
  const buf = makeBuffer([HEADER, validRow('Q1'), validRow('Q2')]);
  return {
    originalname: 'test.xlsx',
    mimetype: XLSX_MIME,
    size: buf.length,
    buffer: buf,
    ...over,
  } as Express.Multer.File;
}

function makeQuizDoc(existing: QuizQuestionShape[] = []) {
  const save = jest.fn().mockResolvedValue(undefined);
  return {
    _id: { toString: () => 'quiz123abc' },
    title: 'Quiz Test',
    status: 'DRAFT',
    questions: existing,
    save,
  };
}

function buildService(quizOverrides: {
  quiz?: ReturnType<typeof makeQuizDoc> | null;
}) {
  const execQ = jest.fn().mockResolvedValue(quizOverrides.quiz ?? null);
  const quizModel = {
    findOne: jest.fn().mockReturnValue({
      exec: execQ,
      lean: jest.fn().mockReturnValue({ exec: execQ }),
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
  return { svc: svc as PkkmbService, quizModel };
}

describe('PkkmbService — previewQuizImport', () => {
  test('file valid → baris soal dikembalikan', async () => {
    const { svc } = buildService({});
    const result = await svc.previewQuizImport(makeFile());
    expect(result.total).toBe(2);
    expect(result.rows[0].question).toBe('Q1');
  });

  test('ekstensi bukan .xlsx → 400', async () => {
    const { svc } = buildService({});
    await expect(
      svc.previewQuizImport(
        makeFile({ originalname: 'soal.csv', mimetype: 'text/csv' }),
      ),
    ).rejects.toThrow(BadRequestException);
  });

  test('file tidak ada → 400', async () => {
    const { svc } = buildService({});
    await expect(svc.previewQuizImport(undefined)).rejects.toThrow(
      BadRequestException,
    );
  });

  test('satu baris invalid → 422, TIDAK ada hasil parsial', async () => {
    const { svc } = buildService({});
    const bad = makeBuffer([HEADER, validRow('Q1'), validRow('Q1')]); // duplikat
    await expect(
      svc.previewQuizImport(makeFile({ buffer: bad, size: bad.length })),
    ).rejects.toThrow(UnprocessableEntityException);
  });
});

describe('PkkmbService — importQuizQuestions (APPEND existing)', () => {
  const existing: QuizQuestionShape[] = Array.from({ length: 3 }, (_, i) => ({
    question: `Old${i + 1}`,
    options: [
      { id: 'A', text: 'A' },
      { id: 'B', text: 'B' },
      { id: 'C', text: 'C' },
      { id: 'D', text: 'D' },
    ],
    correctAnswer: 'A',
    points: 5,
    order: i + 1,
  }));

  test('quiz tidak ada → 404 (tidak ada perubahan apa pun)', async () => {
    const { svc } = buildService({ quiz: null });
    await expect(svc.importQuizQuestions('nope', makeFile())).rejects.toThrow(
      NotFoundException,
    );
  });

  test('valid → soal lama + baru tersimpan, order dinormalisasi 1..n', async () => {
    const quiz = makeQuizDoc(existing);
    const { svc } = buildService({ quiz });
    const result = await svc.importQuizQuestions('quiz123abc', makeFile());

    expect(result.imported).toBe(2);
    expect(result.questions).toHaveLength(5);
    expect(result.questions.map((q) => q.order)).toEqual([1, 2, 3, 4, 5]);
    expect(result.questions[0].question).toBe('Old1'); // soal lama tidak hilang
    expect(result.questions[3].question).toBe('Q1'); // soal baru ada
    expect(quiz.save).toHaveBeenCalledTimes(1);
    expect(quiz.status).toBe('DRAFT'); // tidak auto-publish
  });

  test('invalid → 422 dan quiz TIDAK tersentuh', async () => {
    const quiz = makeQuizDoc(existing);
    const { svc } = buildService({ quiz });
    const bad = makeBuffer([HEADER, validRow('Q1'), ['', 'A', 'B', 'C', 'D', 'A', 10, 1]]);
    await expect(
      svc.importQuizQuestions('quiz123abc', makeFile({ buffer: bad, size: bad.length })),
    ).rejects.toThrow(UnprocessableEntityException);
    expect(quiz.save).not.toHaveBeenCalled();
    expect(quiz.questions).toHaveLength(3);
  });

  test('duplikat dgn soal existing → 422 + daftar duplicates, quiz TIDAK berubah', async () => {
    const quiz = makeQuizDoc([existing[0]]); // existing berisi 'Old1'
    const { svc } = buildService({ quiz });
    const dup = makeBuffer([
      HEADER,
      validRow('Old1'),
      validRow('Q2'),
    ]);
    const file = makeFile({ buffer: dup, size: dup.length });
    try {
      await svc.importQuizQuestions('quiz123abc', file);
      fail('harus 422');
    } catch (e) {
      expect(e).toBeInstanceOf(UnprocessableEntityException);
      expect((e as UnprocessableEntityException).getResponse()).toMatchObject({
        duplicates: [{ rowNum: 2, question: 'Old1', existing: 'Old1' }],
      });
    }
    expect(quiz.save).not.toHaveBeenCalled();
    expect(quiz.questions).toHaveLength(1);
  });

  test('skipDuplicates=true → semua soal tetap diimport (tidak menimpa existing)', async () => {
    const quiz = makeQuizDoc([existing[0]]);
    const { svc } = buildService({ quiz });
    const dup = makeBuffer([HEADER, validRow('Old1'), validRow('Q2')]);
    const file = makeFile({ buffer: dup, size: dup.length });
    const result = await svc.importQuizQuestions('quiz123abc', file, true);
    expect(result.imported).toBe(2);
    expect(result.questions).toHaveLength(3);
    expect(result.questions[0].question).toBe('Old1'); // existing tidak hilang
    expect(quiz.save).toHaveBeenCalledTimes(1);
  });

  test('quiz PUBLISHED tetap boleh diimport (konsisten dgn updateQuiz existing)', async () => {
    const quiz = makeQuizDoc([]);
    quiz.status = 'PUBLISHED';
    const { svc } = buildService({ quiz });
    const result = await svc.importQuizQuestions('quiz123abc', makeFile());
    expect(result.imported).toBe(2);
    expect(quiz.status).toBe('PUBLISHED'); // tidak diubah oleh import
  });

  test('file > 5 MB → 400 "Ukuran file maksimal 5 MB."', async () => {
    const quiz = makeQuizDoc([]);
    const { svc } = buildService({ quiz });
    const big = Buffer.alloc(6 * 1024 * 1024);
    await expect(
      svc.importQuizQuestions('quiz123abc', makeFile({ buffer: big, size: big.length })),
    ).rejects.toThrow(BadRequestException);
    expect(quiz.save).not.toHaveBeenCalled();
  });
});

describe('PkkmbService — exportQuizQuestions', () => {
  test('quiz tidak ada → 404', async () => {
    const { svc } = buildService({ quiz: null });
    await expect(svc.exportQuizQuestions('nope')).rejects.toThrow(
      NotFoundException,
    );
  });

  test('quiz ada → buffer xlsx + nama file sesuai format', async () => {
    const quiz = makeQuizDoc(existing());
    const { svc } = buildService({ quiz });
    const result = await svc.exportQuizQuestions('quiz123abc');
    expect(result.filename).toMatch(
      /^quiz-Quiz-Test-123abc-questions\.xlsx$/,
    );
    const wb = XLSX.read(result.buffer, { type: 'buffer' });
    expect(wb.SheetNames.some((n) => n.toUpperCase() === 'SOAL')).toBe(true);
  });

  test('quiz tanpa soal → tetap berhasil (header saja)', async () => {
    const quiz = makeQuizDoc([]);
    const { svc } = buildService({ quiz });
    const result = await svc.exportQuizQuestions('quiz123abc');
    const wb = XLSX.read(result.buffer, { type: 'buffer' });
    expect(wb.SheetNames.some((n) => n.toUpperCase() === 'SOAL')).toBe(true);
  });
});

function existing(): QuizQuestionShape[] {
  return [
    {
      question: 'E1',
      options: [
        { id: 'A', text: 'A' },
        { id: 'B', text: 'B' },
        { id: 'C', text: 'C' },
        { id: 'D', text: 'D' },
      ],
      correctAnswer: 'A',
      points: 5,
      order: 1,
    },
  ];
}
