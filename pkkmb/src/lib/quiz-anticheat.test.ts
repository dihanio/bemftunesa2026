import { test } from "node:test";
import assert from "node:assert/strict";
import {
  riskLevelFromCount,
  warningMessageForCount,
  makeViolationReporter,
  QUIZ_VIOLATION_TYPES,
  VIOLATION_LABEL,
  isInformationalEvent,
} from "./quiz-anticheat.ts";

test("riskLevelFromCount: LOW 0-2, MEDIUM 3-5, HIGH >5", () => {
  assert.equal(riskLevelFromCount(0), "LOW");
  assert.equal(riskLevelFromCount(2), "LOW");
  assert.equal(riskLevelFromCount(3), "MEDIUM");
  assert.equal(riskLevelFromCount(5), "MEDIUM");
  assert.equal(riskLevelFromCount(6), "HIGH");
});

test("warningMessageForCount: hanya di ambang 1/3/5", () => {
  assert.ok(warningMessageForCount(1));
  assert.equal(warningMessageForCount(2), null);
  assert.ok(warningMessageForCount(3));
  assert.equal(warningMessageForCount(4), null);
  assert.ok(warningMessageForCount(5));
  assert.ok(warningMessageForCount(6)); // >=5
});

test("makeViolationReporter: dedupe tipe sama dalam window", () => {
  const sent: string[] = [];
  const report = makeViolationReporter((type) => sent.push(type), 5000);
  report("TAB_HIDDEN");
  report("TAB_HIDDEN"); // dalam window → skip
  report("COPY"); // beda tipe → tetap dikirim
  assert.deepEqual(sent, ["TAB_HIDDEN", "COPY"]);
});

test("makeViolationReporter: tipe sama setelah window → dikirim lagi", () => {
  const sent: string[] = [];
  const report = makeViolationReporter((type) => sent.push(type), 5);
  report("WINDOW_BLUR");
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      report("WINDOW_BLUR");
      assert.equal(sent.length, 2);
      resolve();
    }, 10);
  });
});

test("QUIZ_VIOLATION_TYPES lengkap & label tersedia untuk semua", () => {
  assert.equal(QUIZ_VIOLATION_TYPES.length, 16);
  for (const t of QUIZ_VIOLATION_TYPES) {
    assert.ok(VIOLATION_LABEL[t], `label untuk ${t}`);
  }
});

test("isInformationalEvent: event kembali/fokus/refresh/resume tidak dihitung sebagai pelanggaran", () => {
  assert.ok(isInformationalEvent("TAB_VISIBLE"));
  assert.ok(isInformationalEvent("WINDOW_FOCUS"));
  assert.ok(isInformationalEvent("PAGE_REFRESH"));
  assert.ok(isInformationalEvent("ATTEMPT_RESUMED"));
  assert.equal(isInformationalEvent("TAB_HIDDEN"), false);
  assert.equal(isInformationalEvent("COPY"), false);
  assert.equal(isInformationalEvent("KEYBOARD_SHORTCUT"), false);
});
