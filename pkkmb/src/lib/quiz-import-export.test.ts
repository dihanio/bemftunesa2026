import { test } from "node:test";
import assert from "node:assert/strict";
import * as XLSX from "xlsx";
import {
  parseImportFile,
  validateImportRows,
  toManagedQuestions,
  normalizeOrders,
  buildTemplateWorkbook,
} from "./quiz-import-export.ts";

const HEADER = ["question", "option_a", "option_b", "option_c", "option_d", "correct_answer", "points", "order"];

function makeFile(rows: unknown[][], sheetName = "SOAL"): File {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), sheetName);
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return new File([buf], "test.xlsx");
}

function validRow(over: Partial<Record<string, unknown>> = {}): unknown[] {
  const base: unknown[] = ["Q?", "A", "B", "C", "D", "A", 10, 1];
  const idx: Record<string, number> = { question: 0, option_a: 1, option_b: 2, option_c: 3, option_d: 4, correct_answer: 5, points: 6, order: 7 };
  for (const [k, v] of Object.entries(over)) base[idx[k]] = v;
  return base;
}

test("1. valid excel → all valid", async () => {
  const f = makeFile([HEADER, validRow(), validRow({ question: "Q2" })]);
  const { rows, sheetMissingMsg } = await parseImportFile(f);
  assert.equal(sheetMissingMsg, undefined);
  assert.equal(rows.length, 2);
  const { invalid } = validateImportRows(rows);
  assert.equal(invalid.length, 0);
});

test("2. header salah → error jelas", async () => {
  const f = makeFile([["question", "option_a", "option_b", "option_c", "option_d", "x", "y", "z"], validRow()]);
  const { sheetMissingMsg } = await parseImportFile(f);
  assert.match(sheetMissingMsg || "", /correct_answer/i);
});

test("3. sheet SOAL tidak ada", async () => {
  const f = makeFile([HEADER, validRow()], "LAIN");
  const { sheetMissingMsg, sheetMissing } = await parseImportFile(f);
  assert.equal(sheetMissing, true);
  assert.match(sheetMissingMsg || "", /SOAL/i);
});

const fieldTests: [string, Partial<Record<string, unknown>>, RegExp][] = [
  ["4. question kosong", { question: "" }, /question kosong/],
  ["5. option_a kosong", { option_a: "" }, /option_a kosong/],
  ["6. option_b kosong", { option_b: "" }, /option_b kosong/],
  ["7. option_c kosong", { option_c: "" }, /option_c kosong/],
  ["8. option_d kosong", { option_d: "" }, /option_d kosong/],
  ["9. correct_answer = E", { correct_answer: "E" }, /A\/B\/C\/D/],
  ["9b. correct_answer kosong", { correct_answer: "" }, /wajib diisi/],
  ["10. points = 0", { points: 0 }, /lebih dari 0/],
  ["11. points negatif", { points: -5 }, /lebih dari 0/],
  ["11b. points kosong", { points: "" }, /wajib diisi/],
  ["12. order invalid (desimal)", { order: 2.5 }, /bilangan bulat/],
  ["12b. order kosong", { order: "" }, /wajib diisi/],
];

for (const [name, over, re] of fieldTests) {
  test(name, async () => {
    const f = makeFile([HEADER, validRow(over)]);
    const { rows } = await parseImportFile(f);
    const { invalid } = validateImportRows(rows);
    assert.equal(invalid.length, 1);
    assert.match(invalid[0].errors.join(" "), re);
  });
}

test("13. duplicate question → flagged", async () => {
  const f = makeFile([HEADER, validRow(), validRow()]);
  const { rows } = await parseImportFile(f);
  const { invalid } = validateImportRows(rows);
  assert.equal(invalid.length, 1);
  assert.match(invalid[0].errors.join(" "), /duplikat/i);
});

test("14. multiple valid rows", async () => {
  const rows: unknown[][] = [HEADER];
  for (let i = 1; i <= 5; i++) rows.push(validRow({ question: `Q${i}`, order: i }));
  const f = makeFile(rows);
  const { rows: parsed } = await parseImportFile(f);
  const { valid } = validateImportRows(parsed);
  assert.equal(valid.length, 5);
});

test("15. toManagedQuestions + normalizeOrders", async () => {
  const f = makeFile([HEADER, validRow({ order: 10 }), validRow({ question: "Q2", order: 3 })]);
  const { rows } = await parseImportFile(f);
  const qs = normalizeOrders(toManagedQuestions(rows));
  assert.equal(qs.length, 2);
  assert.deepEqual(qs.map((q) => q.order), [1, 2]);
  assert.equal(qs[0].options.length, 4);
  assert.equal(qs[0].correctAnswer, "A");
});

test("16. formula injection disanitasi", async () => {
  const f = makeFile([HEADER, validRow({ question: "=cmd|' /C calc'!A0" })]);
  const { rows } = await parseImportFile(f);
  assert.ok(!rows[0].question?.startsWith("="));
});

test("17. template workbook: sheet SOAL + PETUNJUK, header & contoh konsisten", async () => {
  const wb = buildTemplateWorkbook();
  assert.ok(wb.SheetNames.some((n) => n.toUpperCase() === "SOAL"));
  assert.ok(wb.SheetNames.some((n) => n.toUpperCase() === "PETUNJUK"));
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const f = new File([buf], "template.xlsx");
  const { rows } = await parseImportFile(f);
  const { invalid } = validateImportRows(rows);
  assert.equal(invalid.length, 0);
  assert.equal(rows[0].question, "Apa ibu kota Indonesia?");
});
