import { test } from "node:test";
import assert from "node:assert/strict";
import { quizScoreText } from "./maba.ts";

test("quizScoreText memformat persentase + poin mentah vs total", () => {
  assert.equal(quizScoreText(50, 83), "83% · 50/60 poin");
});

test("quizScoreText menangani skor sempurna", () => {
  assert.equal(quizScoreText(60, 100), "100% · 60/60 poin");
});

test("quizScoreText menangani nilai kosong tanpa error", () => {
  assert.equal(quizScoreText(undefined, undefined), "0% · 0/0 poin");
  assert.equal(quizScoreText(0, 0), "0% · 0/0 poin");
});
