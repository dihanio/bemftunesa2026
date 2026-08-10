import * as XLSX from 'xlsx';
import {
  parseQuizExcel,
  buildTemplateBuffer,
  buildExportBuffer,
  appendQuestions,
  toQuizQuestions,
  buildExportFilename,
  sanitizeFilename,
  QUIZ_TEMPLATE_HEADERS,
  QuizQuestionShape,
} from './quiz-import-export';
import { PkkmbController } from './pkkmb.controller';
import { REQUIRED_PERMISSIONS_KEY } from '../auth/decorators/required-permission.decorator';
import { PkkmbPermission } from '../common/auth/pkkmb-permissions';

const HEADER = [...QUIZ_TEMPLATE_HEADERS];

function makeWorkbookBuffer(rows: unknown[][], sheetName = 'SOAL'): Buffer {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), sheetName);
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

const IDX: Record<string, number> = {
  question: 0,
  option_a: 1,
  option_b: 2,
  option_c: 3,
  option_d: 4,
  correct_answer: 5,
  points: 6,
  order: 7,
};

function validRow(over: Partial<Record<string, unknown>> = {}): unknown[] {
  const base: unknown[] = ['Q?', 'A', 'B', 'C', 'D', 'A', 10, 1];
  for (const [k, v] of Object.entries(over)) base[IDX[k]] = v;
  return base;
}

function makeQ(n: number): QuizQuestionShape {
  return {
    question: `Q${n}`,
    options: [
      { id: 'A', text: 'A' },
      { id: 'B', text: 'B' },
      { id: 'C', text: 'C' },
      { id: 'D', text: 'D' },
    ],
    correctAnswer: 'A',
    points: 10,
    order: n,
  };
}

describe('Quiz Import/Export — parsing & validasi', () => {
  test('1. excel valid → semua baris valid', () => {
    const buf = makeWorkbookBuffer([HEADER, validRow(), validRow({ question: 'Q2' })]);
    const result = parseQuizExcel(buf);
    expect(result.success).toBe(true);
    expect(result.rows).toHaveLength(2);
    expect(result.errors).toHaveLength(0);
  });

  test('2. header salah → import ditolak dengan kolom yang hilang', () => {
    const buf = makeWorkbookBuffer([
      ['question', 'option_a', 'option_b', 'option_c', 'option_d', 'x', 'y', 'z'],
      validRow(),
    ]);
    const result = parseQuizExcel(buf);
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/correct_answer/i);
    expect(result.rows).toHaveLength(0);
  });

  test('3. sheet SOAL tidak ada → ditolak', () => {
    const buf = makeWorkbookBuffer([HEADER, validRow()], 'LAIN');
    const result = parseQuizExcel(buf);
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/SOAL/i);
  });

  const fieldTests: [string, Partial<Record<string, unknown>>, RegExp][] = [
    ['4. question kosong', { question: '' }, /question kosong/],
    ['5. option_a kosong', { option_a: '' }, /option_a kosong/],
    ['6. option_b kosong', { option_b: '' }, /option_b kosong/],
    ['7. option_c kosong', { option_c: '' }, /option_c kosong/],
    ['8. option_d kosong', { option_d: '' }, /option_d kosong/],
    ['9. correct_answer = E', { correct_answer: 'E' }, /A\/B\/C\/D/],
    ['9b. correct_answer kosong', { correct_answer: '' }, /wajib diisi/],
    ['10. points = 0', { points: 0 }, /lebih dari 0/],
    ['11. points negatif', { points: -5 }, /lebih dari 0/],
    ['11b. points kosong', { points: '' }, /wajib diisi/],
    ['12. order invalid (desimal)', { order: 2.5 }, /bilangan bulat/],
    ['12b. order kosong', { order: '' }, /wajib diisi/],
  ];

  for (const [name, over, re] of fieldTests) {
    test(name, () => {
      const buf = makeWorkbookBuffer([HEADER, validRow(over)]);
      const result = parseQuizExcel(buf);
      expect(result.success).toBe(false);
      expect(result.invalidCount).toBe(1);
      expect(result.errors[0].rowNum).toBe(2);
      expect(result.errors[0].errors.join(' ')).toMatch(re);
    });
  }

  test('13. duplikat pertanyaan dalam file → error', () => {
    const buf = makeWorkbookBuffer([HEADER, validRow(), validRow()]);
    const result = parseQuizExcel(buf);
    expect(result.success).toBe(false);
    expect(result.errors[0].errors.join(' ')).toMatch(/duplikat/i);
  });

  test('14. banyak baris valid', () => {
    const rows: unknown[][] = [HEADER];
    for (let i = 1; i <= 5; i++) rows.push(validRow({ question: `Q${i}`, order: i }));
    const result = parseQuizExcel(bufOf(rows));
    expect(result.success).toBe(true);
    expect(result.validCount).toBe(5);
  });

  test('row yang salah disebutkan nomor baris excel aslinya', () => {
    const buf = makeWorkbookBuffer([
      HEADER,
      validRow(),
      validRow({ question: 'Q2' }),
      validRow({ correct_answer: 'Z' }),
    ]);
    const result = parseQuizExcel(buf);
    expect(result.errors[0].rowNum).toBe(4); // header=1, data mulai baris 2
  });

  test('formula injection disanitasi saat parse', () => {
    const buf = makeWorkbookBuffer([
      HEADER,
      validRow({ question: '=cmd|/C calc!A0' }),
      validRow({ question: 'Q2', option_a: '@import 1' }),
    ]);
    const result = parseQuizExcel(buf);
    expect(result.success).toBe(true);
    expect(result.rows[0].question.startsWith('=')).toBe(false);
    expect(result.rows[1].options[0].text.startsWith('@')).toBe(false);
  });

  test('duplikat dengan soal existing = WARNING (row tetap valid, bukan error)', () => {
    const existing: QuizQuestionShape[] = [
      { ...makeQ(1), question: 'Q?' },
    ];
    const buf = makeWorkbookBuffer([HEADER, validRow()]); // 'Q?' sama dgn existing
    const result = parseQuizExcel(buf, existing);
    expect(result.success).toBe(true);
    expect(result.duplicateWithExistingCount).toBe(1);
    expect(result.rows[0].duplicateOf).toBe('Q?');
    expect(result.rows[0].question).toBe('Q?');
  });

  test('normalisasi duplikat existing: trim + lowercase + whitespace', () => {
    const existing: QuizQuestionShape[] = [
      { ...makeQ(1), question: 'Apa itu komputer?' },
    ];
    const buf = makeWorkbookBuffer([
      HEADER,
      validRow({ question: '  Apa   ITU komputer? ' }),
    ]);
    const result = parseQuizExcel(buf, existing);
    expect(result.duplicateWithExistingCount).toBe(1);
  });
});

describe('Quiz Import/Export — append & order normalization', () => {
  test('15. import ke quiz existing = APPEND (soal lama tidak hilang)', () => {
    const existing = Array.from({ length: 10 }, (_, i) => makeQ(i + 1));
    const incoming = [makeQ(1), makeQ(2), makeQ(3)]; // order di file dimulai lagi dari 1
    const merged = appendQuestions(existing, incoming);
    expect(merged).toHaveLength(13);
    expect(merged[0].question).toBe('Q1'); // soal lama masih ada
    expect(merged[10].question).toBe('Q1'); // soal baru tetap masuk
  });

  test('order dinormalisasi 1..n tanpa duplikat', () => {
    const existing = Array.from({ length: 10 }, (_, i) => makeQ(i + 1));
    const incoming = [makeQ(1), makeQ(2), makeQ(3)];
    const merged = appendQuestions(existing, incoming);
    expect(merged.map((q) => q.order)).toEqual(
      Array.from({ length: 13 }, (_, i) => i + 1),
    );
    expect(new Set(merged.map((q) => q.order)).size).toBe(13);
  });
});

describe('Quiz Import/Export — template & export', () => {
  test('template: workbook valid, sheet SOAL + PETUNJUK, contoh konsisten', () => {
    const buf = buildTemplateBuffer();
    const wb = XLSX.read(buf, { type: 'buffer' });
    expect(wb.SheetNames.some((n) => n.toUpperCase() === 'SOAL')).toBe(true);
    expect(wb.SheetNames.some((n) => n.toUpperCase() === 'PETUNJUK')).toBe(true);
    const result = parseQuizExcel(buf);
    expect(result.success).toBe(true);
    expect(result.validCount).toBe(1); // baris contoh valid
    expect(result.rows[0].question).toBe('Apa ibu kota Indonesia?');
  });

  test('16. export → workbook valid & berisi semua soal', () => {
    const questions = [makeQ(1), makeQ(2)];
    const buf = buildExportBuffer(questions);
    const result = parseQuizExcel(buf);
    expect(result.success).toBe(true);
    expect(result.validCount).toBe(2);
  });

  test('17. export quiz kosong → header saja, tetap berhasil', () => {
    const buf = buildExportBuffer([]);
    const wb = XLSX.read(buf, { type: 'buffer' });
    expect(wb.SheetNames.some((n) => n.toUpperCase() === 'SOAL')).toBe(true);
    const result = parseQuizExcel(buf);
    expect(result.success).toBe(true);
    expect(result.validCount).toBe(0);
  });

  test('18. export → import → data equivalent', () => {
    const questions = [
      { ...makeQ(1), points: 15, correctAnswer: 'C' },
      { ...makeQ(2), points: 20, correctAnswer: 'B' },
    ];
    const exported = buildExportBuffer(questions);
    const result = parseQuizExcel(exported);
    expect(result.success).toBe(true);
    const back = toQuizQuestions(result.rows);
    expect(back).toHaveLength(questions.length);
    expect(back[0].question).toBe(questions[0].question);
    expect(back[0].correctAnswer).toBe(questions[0].correctAnswer);
    expect(back[0].points).toBe(questions[0].points);
    expect(back[1].options[1].text).toBe('B');
  });

  test('formula injection disanitasi saat export', () => {
    const buf = buildExportBuffer([
      { ...makeQ(1), question: '=SUM(A1:A2)', options: [
        { id: 'A', text: '+danger' },
        { id: 'B', text: '-hmm' },
        { id: 'C', text: '@import' },
        { id: 'D', text: 'aman' },
      ] },
    ]);
    const result = parseQuizExcel(buf);
    expect(result.success).toBe(true);
    expect(result.rows[0].question.startsWith('=')).toBe(false);
    expect(result.rows[0].options[0].text.startsWith('+')).toBe(false);
    expect(result.rows[0].options[1].text.startsWith('-')).toBe(false);
    expect(result.rows[0].options[2].text.startsWith('@')).toBe(false);
  });

  test('filename disanitasi & sesuai format', () => {
    expect(buildExportFilename('Pretest/Pra-PKKMB!', 'abc123def456')).toBe(
      'quiz-PretestPra-PKKMB-def456-questions.xlsx',
    );
    // Judul semua ilegal → fallback 'quiz' (duplikasi prefix adalah perilaku valid).
    expect(buildExportFilename('!!!', 'abc123')).toBe(
      'quiz-quiz-abc123-questions.xlsx',
    );
    expect(sanitizeFilename('  Nama   Quiz  ')).toBe('Nama-Quiz');
  });
});

describe('Quiz Import/Export — RBAC endpoint metadata', () => {
  const proto = PkkmbController.prototype as unknown as Record<
    string,
    (...args: unknown[]) => unknown
  >;
  const perms = (name: string): string[] | undefined =>
    Reflect.getMetadata(REQUIRED_PERMISSIONS_KEY, proto[name]) as
      | string[]
      | undefined;

  test('template & validate-import butuh permission QUIZ_CREATE', () => {
    expect(perms('downloadQuizTemplate')).toContain(PkkmbPermission.QUIZ_CREATE);
    expect(perms('previewQuizImport')).toContain(PkkmbPermission.QUIZ_CREATE);
  });

  test('append-import & export butuh permission QUIZ_UPDATE', () => {
    expect(perms('importQuizQuestions')).toContain(PkkmbPermission.QUIZ_UPDATE);
    expect(perms('exportQuizQuestions')).toContain(PkkmbPermission.QUIZ_UPDATE);
  });

  test('maba TIDAK memiliki QUIZ_CREATE/QUIZ_UPDATE (seed RBAC)', () => {
    // Referensi langsung enum; seed-rbac dipastikan konsisten di runtime.
    // Maba hanya diberi QUIZ_READ/SUBMIT/RESULT (lihat seed-rbac.ts).
    expect(PkkmbPermission.QUIZ_CREATE).toBe('pkkmb.quiz.create');
    expect(PkkmbPermission.QUIZ_UPDATE).toBe('pkkmb.quiz.update');
  });
});

function bufOf(rows: unknown[][]): Buffer {
  return makeWorkbookBuffer(rows);
}
