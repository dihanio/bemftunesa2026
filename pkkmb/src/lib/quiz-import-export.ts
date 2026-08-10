import * as XLSX from "xlsx";
import type { ManagedQuestion, QuizOption } from "./quiz";

export const QUIZ_TEMPLATE_HEADERS = [
  "question",
  "option_a",
  "option_b",
  "option_c",
  "option_d",
  "correct_answer",
  "points",
  "order",
];

export interface ImportRowResult {  rowNum: number; // nomor baris excel (1-based), header = 1
  question?: string;
  options?: QuizOption[];
  correctAnswer?: string;
  points?: number;
  order?: number;
  errors: string[];
}

export function sanitizeCell(raw: unknown): string {
  const s = String(raw ?? "").trim();
  if (!s) return s;
  // Cegah formula injection (Excel/CSV): nilai diawali = + - @ → text polos.
  // - diikuti digit = angka negatif sah (bukan formula), biarkan.
  if (/^[=+@]/.test(s)) return `'${s}`;
  if (/^-(?!\d)/.test(s)) return `'${s}`;
  return s;
}

// Baca workbook dari File → parse sheet "SOAL" → validasi per baris.
export async function parseImportFile(
  file: File,
): Promise<{ rows: ImportRowResult[]; sheetMissing: boolean; sheetMissingMsg?: string }> {
  let wb: XLSX.WorkBook;
  try {
    const buf = await file.arrayBuffer();
    wb = XLSX.read(new Uint8Array(buf), { type: "array" });
  } catch {
    return { rows: [], sheetMissing: false, sheetMissingMsg: "Format Excel tidak valid." };
  }

  const sheetName = wb.SheetNames.find(
    (n) => n.trim().toUpperCase() === "SOAL",
  );
  if (!sheetName) {
    return {
      rows: [],
      sheetMissing: true,
      sheetMissingMsg: "Sheet SOAL tidak ditemukan.",
    };
  }
  const sheet = wb.Sheets[sheetName];
  const raw = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    raw: true,
  });
  if (raw.length === 0) {
    return { rows: [], sheetMissing: false, sheetMissingMsg: "Sheet SOAL kosong." };
  }
  const headerRow = (raw[0] || []).map((c) => sanitizeCell(c).toLowerCase());
  const headerOk = QUIZ_TEMPLATE_HEADERS.every((h) => headerRow.includes(h));
  if (!headerOk) {
    const missingCols = QUIZ_TEMPLATE_HEADERS.filter((h) => !headerRow.includes(h));
    return {
      rows: [],
      sheetMissing: false,
      sheetMissingMsg: `Header salah. Kolom tidak ditemukan: ${missingCols.join(", ")}.`,
    };
  }
  return { rows: buildRows(raw.slice(1) as unknown[][]), sheetMissing: false };
}

function buildRows(raw: unknown[][]): ImportRowResult[] {
  const colIndex = (name: string) => QUIZ_TEMPLATE_HEADERS.indexOf(name);

  const out: ImportRowResult[] = [];
  for (let i = 0; i < raw.length; i++) {
    const r = raw[i] || [];
    const rowNum = i + 2; // excel row (header = 1)
    const get = (name: string) => sanitizeCell(r[colIndex(name)]);
    const question = get("question");
    const optionA = get("option_a");
    const optionB = get("option_b");
    const optionC = get("option_c");
    const optionD = get("option_d");
    const correctAnswer = get("correct_answer").toUpperCase();
    const pointsRaw = get("points");
    const orderRaw = get("order");

    const errors: string[] = [];

    if (!question) errors.push("question kosong");
    if (!optionA) errors.push("option_a kosong");
    if (!optionB) errors.push("option_b kosong");
    if (!optionC) errors.push("option_c kosong");
    if (!optionD) errors.push("option_d kosong");
    if (!correctAnswer) {
      errors.push("correct_answer wajib diisi");
    } else if (!["A", "B", "C", "D"].includes(correctAnswer)) {
      errors.push("correct_answer harus A/B/C/D");
    }

    let points: number | undefined;
    if (pointsRaw === "") {
      errors.push("points wajib diisi");
    } else {
      const pn = Number(pointsRaw);
      if (Number.isNaN(pn)) {
        errors.push("points harus angka");
      } else if (pn <= 0) {
        errors.push("points harus lebih dari 0");
      } else {
        points = pn;
      }
    }

    let order: number | undefined;
    if (orderRaw === "") {
      errors.push("order wajib diisi");
    } else {
      const on = Number(orderRaw);
      if (Number.isNaN(on) || !Number.isInteger(on)) {
        errors.push("order harus bilangan bulat");
      } else if (on <= 0) {
        errors.push("order harus lebih dari 0");
      } else {
        order = on;
      }
    }

    if (!question && !optionA && !optionB && !optionC && !optionD && correctAnswer === "" && pointsRaw === "" && orderRaw === "") {
      continue; // baris kosong → skip
    }

    out.push({
      rowNum,
      question: question || undefined,
      options: [{ id: "A", text: optionA }, { id: "B", text: optionB }, { id: "C", text: optionC }, { id: "D", text: optionD }],
      correctAnswer: correctAnswer || undefined,
      points,
      order,
      errors,
    });
  }
  return out;
}

export function validateImportRows(rows: ImportRowResult[]): {
  valid: ImportRowResult[];
  invalid: ImportRowResult[];
} {
  const seen = new Set<string>();
  const valid: ImportRowResult[] = [];
  const invalid: ImportRowResult[] = [];
  for (const r of rows) {
    const errs = [...r.errors];
    if (r.question) {
      const norm = r.question.toLowerCase().replace(/\s+/g, " ").trim();
      if (seen.has(norm)) errs.push("Pertanyaan duplikat");
      else seen.add(norm);
    }
    if (errs.length > 0) invalid.push({ ...r, errors: errs });
    else valid.push(r);
  }
  return { valid, invalid };
}

export function toManagedQuestions(rows: ImportRowResult[]): ManagedQuestion[] {
  return rows.map((r) => ({
    question: r.question as string,
    options: r.options as QuizOption[],
    correctAnswer: r.correctAnswer as string,
    points: r.points as number,
    order: r.order,
  }));
}

// Normalisasi order jadi 1..n.
export function normalizeOrders(qs: ManagedQuestion[]): ManagedQuestion[] {
  return qs.map((q, i) => ({ ...q, order: i + 1 }));
}

function headerLine() {
  return QUIZ_TEMPLATE_HEADERS;
}

function aoaToRows(aoa: unknown[][]): unknown[][] {
  return aoa.map((r) => r.map((c) => sanitizeCell(c)));
}

// Satu sumber template: struktur IDENTIK dengan buildTemplateBuffer (backend)
// — sheet SOAL (header + contoh) + sheet PETUNJUK.
export function buildTemplateWorkbook(): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  const soal = XLSX.utils.aoa_to_sheet(
    aoaToRows([
      headerLine(),
      [
        "Apa ibu kota Indonesia?",
        "Jakarta",
        "Bandung",
        "Surabaya",
        "Medan",
        "A",
        10,
        1,
      ],
    ]),
  );
  XLSX.utils.book_append_sheet(wb, soal, "SOAL");

  const petunjuk = XLSX.utils.aoa_to_sheet([
    ["PETUNJUK PENGISIAN TEMPLATE SOAL"],
    ["", ""],
    ["Kolom", "Keterangan"],
    ["question", "Teks pertanyaan"],
    ["option_a", "Pilihan jawaban A"],
    ["option_b", "Pilihan jawaban B"],
    ["option_c", "Pilihan jawaban C"],
    ["option_d", "Pilihan jawaban D"],
    ["correct_answer", "Jawaban benar (A/B/C/D)"],
    ["points", "Nilai soal (angka > 0)"],
    ["order", "Nomor urut soal (bilangan bulat > 0)"],
    ["", ""],
    ["Catatan:", ""],
    ["- Baris contoh boleh dihapus sebelum import.", ""],
    ["- Semua kolom wajib diisi.", ""],
    ["- Pertanyaan tidak boleh duplikat dalam satu file.", ""],
  ]);
  XLSX.utils.book_append_sheet(wb, petunjuk, "PETUNJUK");
  return wb;
}

export function downloadTemplate() {
  XLSX.writeFile(buildTemplateWorkbook(), "quiz-question-template.xlsx");
}

export function downloadExport(filename: string, questions: ManagedQuestion[]) {
  const rows: unknown[][] = [headerLine()];
  for (const q of questions) {
    const opts = q.options || [];
    const text = (id: string) => opts.find((o) => o.id === id)?.text ?? "";
    rows.push([
      q.question,
      text("A"),
      text("B"),
      text("C"),
      text("D"),
      q.correctAnswer,
      q.points ?? 1,
      q.order ?? 0,
    ]);
  }
  const wb = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet(aoaToRows(rows));
  XLSX.utils.book_append_sheet(wb, sheet, "SOAL");
  XLSX.writeFile(wb, filename);
}

export function sanitizeFilename(name: string): string {
  const clean = name.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-");
  return clean || "quiz";
}
