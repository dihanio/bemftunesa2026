import * as XLSX from 'xlsx';

/**
 * Quiz Import / Export Excel (backend).
 *
 * Modul MURNI (tanpa ketergantungan DB / Nest) agar mudah diuji unit.
 * Format template:
 *   Sheet utama  : SOAL
 *   Kolom        : question, option_a, option_b, option_c, option_d,
 *                  correct_answer, points, order
 *   Sheet kedua  : PETUNJUK (hanya untuk template / manusia)
 */

export const QUIZ_TEMPLATE_HEADERS = [
  'question',
  'option_a',
  'option_b',
  'option_c',
  'option_d',
  'correct_answer',
  'points',
  'order',
] as const;

export const QUIZ_IMPORT_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export interface QuizOptionShape {
  id: string;
  text: string;
}

/** Bentuk soal yang tersimpan di skema quiz (tidak wajib impor skema). */
export interface QuizQuestionShape {
  question: string;
  options: QuizOptionShape[];
  correctAnswer: string;
  points: number;
  order: number;
}

/** Baris valid hasil parsing Excel (sudah lolos validasi). */
export interface ImportedQuestion extends QuizQuestionShape {
  rowNum: number; // nomor baris excel sebenarnya (header = 1)
  /** Teks soal existing yang identik (WARNING, bukan error). */
  duplicateOf?: string;
}

export interface ImportRowError {
  rowNum: number;
  question?: string;
  errors: string[];
}

export interface DuplicateWithExisting {
  rowNum: number;
  question: string;
  existing: string;
}

export interface QuizExcelParseResult {
  success: boolean;
  /** Pesan error level file (workbook invalid, sheet/header salah). */
  message?: string;
  rows: ImportedQuestion[];
  errors: ImportRowError[];
  validCount: number;
  invalidCount: number;
  /** Jumlah soal yang pertanyaannya sama dengan soal existing (WARNING). */
  duplicateWithExistingCount: number;
  duplicatesWithExisting: DuplicateWithExisting[];
}

// ─── SANITASI ───────────────────────────────────────────────────────────────

/** Cegah formula injection (Excel/CSV): nilai diawali = + - @ → text polos. */
export function sanitizeCell(raw: unknown): string {
  const s = String(raw ?? '').trim();
  if (!s) return s;
  if (/^[=+@]/.test(s)) return `'${s}`;
  if (/^-(?!\d)/.test(s)) return `'${s}`;
  return s;
}

/** Normalisasi teks pertanyaan untuk deteksi duplikat. */
export function normalizeQuestionText(question: string): string {
  return question.toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Nama file aman (hanya alfanumerik/spasi/tanda hubung). */
export function sanitizeFilename(name: string): string {
  const clean = name
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  return clean || 'quiz';
}

// ─── PARSE + VALIDASI ───────────────────────────────────────────────────────

function buildRows(
  raw: unknown[][],
  existingByNorm?: Map<string, string>,
): {
  rows: ImportedQuestion[];
  errors: ImportRowError[];
  duplicatesWithExisting: DuplicateWithExisting[];
} {
  const colIndex = (name: string) => QUIZ_TEMPLATE_HEADERS.indexOf(name as never);

  const rows: ImportedQuestion[] = [];
  const errors: ImportRowError[] = [];
  const duplicatesWithExisting: DuplicateWithExisting[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < raw.length; i++) {
    const r = raw[i] || [];
    const rowNum = i + 2; // baris excel asli (header = 1)
    const get = (name: string) => sanitizeCell(r[colIndex(name)]);

    const question = get('question');
    const optionA = get('option_a');
    const optionB = get('option_b');
    const optionC = get('option_c');
    const optionD = get('option_d');
    const correctAnswer = get('correct_answer').toUpperCase();
    const pointsRaw = get('points');
    const orderRaw = get('order');

    // Baris kosong → skip.
    if (
      !question &&
      !optionA &&
      !optionB &&
      !optionC &&
      !optionD &&
      correctAnswer === '' &&
      pointsRaw === '' &&
      orderRaw === ''
    ) {
      continue;
    }

    const errs: string[] = [];

    if (!question) errs.push('question kosong');
    if (!optionA) errs.push('option_a kosong');
    if (!optionB) errs.push('option_b kosong');
    if (!optionC) errs.push('option_c kosong');
    if (!optionD) errs.push('option_d kosong');
    // Semua kolom wajib diisi (aturan template).
    if (!correctAnswer) {
      errs.push('correct_answer wajib diisi');
    } else if (!['A', 'B', 'C', 'D'].includes(correctAnswer)) {
      errs.push('correct_answer harus A/B/C/D');
    }

    let points = 0;
    if (pointsRaw === '') {
      errs.push('points wajib diisi');
    } else {
      const pn = Number(pointsRaw);
      if (Number.isNaN(pn)) {
        errs.push('points harus angka');
      } else if (pn <= 0) {
        errs.push('points harus lebih dari 0');
      } else {
        points = pn;
      }
    }

    let order = 0;
    if (orderRaw === '') {
      errs.push('order wajib diisi');
    } else {
      const on = Number(orderRaw);
      if (Number.isNaN(on) || !Number.isInteger(on)) {
        errs.push('order harus bilangan bulat');
      } else if (on <= 0) {
        errs.push('order harus lebih dari 0');
      } else {
        order = on;
      }
    }

    // Duplikat pertanyaan DALAM file → error (aturan: file tidak boleh punya
    // soal yang sama persis setelah normalisasi).
    if (question) {
      const norm = normalizeQuestionText(question);
      if (seen.has(norm)) errs.push('Pertanyaan duplikat');
      else seen.add(norm);
    }

    if (errs.length > 0) {
      errors.push({ rowNum, question: question || undefined, errors: errs });
    } else {
      // Duplikat dengan soal EXISTING = WARNING (bukan error): row tetap valid,
      // pemanggil memutuskan apakah melanjutkan (Import Tetap) atau batal.
      let duplicateOf: string | undefined;
      if (question && existingByNorm) {
        const norm = normalizeQuestionText(question);
        const existingText = existingByNorm.get(norm);
        if (existingText !== undefined) {
          duplicateOf = existingText;
          duplicatesWithExisting.push({
            rowNum,
            question,
            existing: existingText,
          });
        }
      }
      rows.push({
        rowNum,
        question,
        options: [
          { id: 'A', text: optionA },
          { id: 'B', text: optionB },
          { id: 'C', text: optionC },
          { id: 'D', text: optionD },
        ],
        correctAnswer,
        points,
        order,
        duplicateOf,
      });
    }
  }

  return { rows, errors, duplicatesWithExisting };
}

/**
 * Parse buffer Excel (.xlsx) menjadi soal valid + daftar error per baris.
 * Seluruh file divalidasi dulu; panggil memutuskan apakah commit (atomic).
 * `existingQuestions` (opsional) dipakai untuk menandai duplikat dengan soal
 * quiz existing sebagai WARNING (row tetap valid, tidak pernah error).
 */
export function parseQuizExcel(
  buffer: Buffer,
  existingQuestions: QuizQuestionShape[] = [],
): QuizExcelParseResult {
  const fail = (message: string): QuizExcelParseResult => ({
    success: false,
    message,
    rows: [],
    errors: [],
    validCount: 0,
    invalidCount: 0,
    duplicateWithExistingCount: 0,
    duplicatesWithExisting: [],
  });

  let wb: XLSX.WorkBook;
  try {
    wb = XLSX.read(buffer, { type: 'buffer' });
  } catch {
    return fail('File harus berupa Excel (.xlsx).');
  }

  const sheetName = wb.SheetNames.find(
    (n) => n.trim().toUpperCase() === 'SOAL',
  );
  if (!sheetName) {
    return fail('Sheet SOAL tidak ditemukan.');
  }

  const sheet = wb.Sheets[sheetName];
  const raw = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
    raw: true,
  });
  if (!raw || raw.length === 0) {
    return fail('Sheet SOAL kosong.');
  }

  const headerRow = (raw[0] || []).map((c) => sanitizeCell(c).toLowerCase());
  const missingCols = QUIZ_TEMPLATE_HEADERS.filter(
    (h) => !headerRow.includes(h),
  );
  if (missingCols.length > 0) {
    return fail(
      `Header salah. Kolom tidak ditemukan: ${missingCols.join(', ')}.`,
    );
  }

  const existingByNorm = new Map<string, string>();
  for (const q of existingQuestions) {
    if (q.question) {
      existingByNorm.set(normalizeQuestionText(q.question), q.question);
    }
  }

  const { rows, errors, duplicatesWithExisting } = buildRows(
    raw.slice(1),
    existingByNorm,
  );
  return {
    success: errors.length === 0,
    rows,
    errors,
    validCount: rows.length,
    invalidCount: errors.length,
    duplicateWithExistingCount: duplicatesWithExisting.length,
    duplicatesWithExisting,
  };
}

// ─── GENERATE EXCEL ─────────────────────────────────────────────────────────

function aoaToSanitizedRows(aoa: unknown[][]): unknown[][] {
  return aoa.map((r) => r.map((c) => sanitizeCell(c)));
}

/** Template soal: sheet SOAL (header + contoh) + sheet PETUNJUK. */
export function buildTemplateBuffer(): Buffer {
  const wb = XLSX.utils.book_new();

  const soal = XLSX.utils.aoa_to_sheet(
    aoaToSanitizedRows([
      [...QUIZ_TEMPLATE_HEADERS],
      [
        'Apa ibu kota Indonesia?',
        'Jakarta',
        'Bandung',
        'Surabaya',
        'Medan',
        'A',
        10,
        1,
      ],
    ]),
  );
  XLSX.utils.book_append_sheet(wb, soal, 'SOAL');

  // Struktur IDENTIK dengan buildTemplateWorkbook (frontend).
  const petunjuk = XLSX.utils.aoa_to_sheet([
    ['PETUNJUK PENGISIAN TEMPLATE SOAL'],
    ['', ''],
    ['Kolom', 'Keterangan'],
    ['question', 'Teks pertanyaan'],
    ['option_a', 'Pilihan jawaban A'],
    ['option_b', 'Pilihan jawaban B'],
    ['option_c', 'Pilihan jawaban C'],
    ['option_d', 'Pilihan jawaban D'],
    ['correct_answer', 'Jawaban benar (A/B/C/D)'],
    ['points', 'Nilai soal (angka > 0)'],
    ['order', 'Nomor urut soal (bilangan bulat > 0)'],
    ['', ''],
    ['Catatan:', ''],
    ['- Baris contoh boleh dihapus sebelum import.', ''],
    ['- Semua kolom wajib diisi.', ''],
    ['- Pertanyaan tidak boleh duplikat dalam satu file.', ''],
  ]);
  XLSX.utils.book_append_sheet(wb, petunjuk, 'PETUNJUK');

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

/** Export soal quiz → workbook (selalu berisi header; boleh tanpa data). */
export function buildExportBuffer(questions: QuizQuestionShape[]): Buffer {
  const wb = XLSX.utils.book_new();

  const rows: unknown[][] = [[...QUIZ_TEMPLATE_HEADERS]];
  for (const q of questions) {
    const opts = q.options || [];
    const text = (id: string) => opts.find((o) => o.id === id)?.text ?? '';
    rows.push([
      q.question,
      text('A'),
      text('B'),
      text('C'),
      text('D'),
      q.correctAnswer,
      q.points ?? 1,
      q.order ?? 0,
    ]);
  }

  const sheet = XLSX.utils.aoa_to_sheet(aoaToSanitizedRows(rows));
  XLSX.utils.book_append_sheet(wb, sheet, 'SOAL');

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

// ─── MAPPING + APPEND ───────────────────────────────────────────────────────

/** Map baris valid hasil parsing → bentuk soal schema. */
export function toQuizQuestions(rows: ImportedQuestion[]): QuizQuestionShape[] {
  return rows.map((r) => ({
    question: r.question,
    options: r.options,
    correctAnswer: r.correctAnswer,
    points: r.points,
    order: r.order,
  }));
}

/**
 * APPEND soal baru ke soal existing, lalu normalisasi order 1..n.
 * Soal lama TIDAK dihapus; hasil = existing + incoming (urut berurutan).
 */
export function appendQuestions(
  existing: QuizQuestionShape[],
  incoming: QuizQuestionShape[],
): QuizQuestionShape[] {
  return [...existing, ...incoming].map((q, i) => ({ ...q, order: i + 1 }));
}

/** Nama file export: quiz-{slug-or-id}-questions.xlsx (slug = judul tersanitasi). */
export function buildExportFilename(title: string, quizId: string): string {
  return `quiz-${sanitizeFilename(title)}-${String(quizId).slice(-6)}-questions.xlsx`;
}
