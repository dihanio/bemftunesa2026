import { test } from "node:test";
import assert from "node:assert/strict";

// ─── Stub fetch & import modul setelah stub dipasang ──────────────────────
// Shell mengekspor NEXT_PUBLIC_API_URL prod yang menimpa .env.local — pastikan
// test selalu memakai API lokal (bug env yang pernah menimpa frontend).
process.env.NEXT_PUBLIC_API_URL = "http://localhost:4000";

const originalFetch = globalThis.fetch;
let fetchCalls: { url: string; options?: RequestInit }[] = [];
let queue: Response[] = [];

const resp = (status: number, ok = status < 400): Response =>
  new Response(JSON.stringify({ success: ok, data: null }), {
    status,
    headers: { "Content-Type": "application/json" },
  });

globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input);
  fetchCalls.push({ url, options: init });
  const next = queue.shift() ?? resp(200);
  return next;
}) as typeof fetch;

const { apiFetch } = await import("./api.ts");

test.after(() => {
  globalThis.fetch = originalFetch;
});

function reset(mock: Response[]) {
  fetchCalls = [];
  queue = [...mock];
}

// ─── Test: 403 → refresh → retry → 200 ────────────────────────────────────
test("403 memicu refresh lalu retry sekali dan berhasil", async () => {
  // urutan: GET asli (403) → POST refresh (200) → GET ulang (200)
  reset([resp(403), resp(200), resp(200)]);
  const res = await apiFetch("/pkkmb/quiz");
  assert.equal(res.status, 200);
  assert.equal(fetchCalls.length, 3);
  assert.equal(fetchCalls[0].url, "http://localhost:4000/api/v1/pkkmb/quiz");
  assert.equal(fetchCalls[1].url, "http://localhost:4000/api/v1/auth/refresh");
  assert.equal(fetchCalls[1].options?.method, "POST");
  assert.equal(fetchCalls[2].url, "http://localhost:4000/api/v1/pkkmb/quiz");
});

// ─── Test: 403 → refresh berhasil → masih 403 → respons asli dikembalikan ─
test("masih 403 setelah refresh → biarkan respons asli", async () => {
  reset([resp(403), resp(200), resp(403)]);
  const res = await apiFetch("/pkkmb/quiz");
  assert.equal(res.status, 403);
  assert.equal(fetchCalls.length, 3);
});

// ─── Test: refresh gagal (401) → tidak retry ──────────────────────────────
test("refresh gagal → jangan retry, kembalikan 401", async () => {
  reset([resp(401), resp(401)]);
  const res = await apiFetch("/pkkmb/quiz");
  assert.equal(res.status, 401);
  assert.equal(fetchCalls.length, 2);
});

// ─── Test: 200 normal tanpa refresh ───────────────────────────────────────
test("response sukses → tanpa refresh", async () => {
  reset([resp(200)]);
  const res = await apiFetch("/pkkmb/quiz");
  assert.equal(res.status, 200);
  assert.equal(fetchCalls.length, 1);
});

// ─── Test: single-flight — request konkuren hanya 1x refresh ──────────────
test("request konkuren memicu satu refresh (single-flight)", async () => {
  // 5 request asli (403) + 1 refresh + 5 retry (200)
  reset([
    ...Array.from({ length: 5 }, () => resp(403)),
    resp(200),
    ...Array.from({ length: 5 }, () => resp(200)),
  ]);
  const results = await Promise.all(
    Array.from({ length: 5 }, () => apiFetch("/pkkmb/quiz")),
  );
  assert.ok(results.every((r) => r.status === 200));
  const refreshCount = fetchCalls.filter(
    (c) => c.url === "http://localhost:4000/api/v1/auth/refresh",
  ).length;
  assert.equal(refreshCount, 1);
  assert.equal(fetchCalls.length, 11);
});

// ─── Test: API_URL strip trailing /api/v1 (regresi doubled prefix) ────────
test("API_URL men-strip /api/v1 agar tidak dobel prefix", async () => {
  // Modul sudah di-import dengan env bawaan; verifikasi lewat string URL
  // request yang dihasilkan helper (tanpa /api/v1/api/v1).
  reset([resp(200)]);
  await apiFetch("/auth/me");
  const last = fetchCalls[fetchCalls.length - 1];
  assert.equal(last.url, "http://localhost:4000/api/v1/auth/me");
  assert.ok(!last.url.includes("/api/v1/api/v1"));
});
