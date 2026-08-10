import { test } from "node:test";
import assert from "node:assert/strict";
import {
  formatWIB,
  formatWIBLong,
  getPeriodStatus,
  WIB_TZ,
} from "./presensi-time.ts";

// ─── REGRESSION: bug crash halaman presensi ───────────────────────────────
// ECMA-402 melarang timeZoneName digabung dengan dateStyle/timeStyle dalam
// satu Intl.DateTimeFormat (RangeError: "Invalid option"). Dulu formatWIB()
// SELALU menambahkan timeZoneName:'short', sehingga panggilan dengan
// {dateStyle, timeStyle} (kartu riwayat presensi) melempar dan menggagalkan
// seluruh halaman tepat setelah check-in pertama. Fix: timeZoneName hanya
// disertakan untuk opsi field-by-field. Test ini mencegah regresi.

test("regression: dateStyle+timeStyle tidak melempar RangeError", () => {
  assert.doesNotThrow(() =>
    formatWIB("2026-08-10T08:00:00Z", { dateStyle: "medium", timeStyle: "short" }),
  );
  assert.doesNotThrow(() =>
    formatWIB("2026-08-10T08:00:00Z", { dateStyle: "short" }),
  );
  assert.doesNotThrow(() =>
    formatWIB("2026-08-10T08:00:00Z", { timeStyle: "short" }),
  );
});

test("regression: semua kombinasi opsi yang dipakai halaman presensi aman", () => {
  // Setiap pemanggilan formatWIB yang ada di presensi/page.tsx
  const safe = [
    { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" },
    { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" },
    { hour: "2-digit", minute: "2-digit" },
    { dateStyle: "medium", timeStyle: "short" },
  ] as const;
  for (const opts of safe) {
    assert.doesNotThrow(() => formatWIB("2026-08-10T08:00:00Z", opts), JSON.stringify(opts));
  }
});

test("regression: hasil dateStyle+timeStyle tidak mengandung label WIB (timeZoneName dihilangkan)", () => {
  const s = formatWIB("2026-08-10T08:00:00Z", { dateStyle: "medium", timeStyle: "short" });
  assert.ok(!s.includes("WIB"), `seharusnya tanpa "WIB", didapat: ${s}`);
  assert.ok(s.includes("2026"), `harus berisi tahun, didapat: ${s}`);
});

test("dokumentasi: kombinasi buggy (timeZoneName + dateStyle) memang melempar RangeError", () => {
  // Test ini MENDOKUMENTASIKAN bug yang dicegah fix di presensi-time.ts:
  // kombinasi lama memicu "Invalid option" dari ECMA-402. Jika seseorang
  // "menyederhanakan" kembali formatWIB (selalu tambah timeZoneName),
  // test doesNotThrow di atas akan gagal — guard mutasi.
  assert.throws(
    () =>
      new Intl.DateTimeFormat("id-ID", {
        timeZone: WIB_TZ,
        timeZoneName: "short",
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date("2026-08-10T08:00:00Z")),
    /Invalid option/,
  );
});

// ─── Perilaku normal ─────────────────────────────────────────────────────

test("timeZoneName tetap ada untuk opsi field-by-field", () => {
  const s = formatWIB("2026-08-10T08:00:00Z", { hour: "2-digit", minute: "2-digit" });
  assert.ok(s.includes("WIB"), `harus mengandung WIB, didapat: ${s}`);
});

test("konversi timezone benar: 08:00 UTC = 15:00 WIB", () => {
  const s = formatWIB("2026-08-10T08:00:00Z", { hour: "2-digit", minute: "2-digit" });
  assert.ok(s.includes("15.00"), `harus 15.00, didapat: ${s}`);
  assert.ok(s.includes("WIB"), s);
});

test("tanggal + weekday benar: 10 Agu 2026 = Senin", () => {
  const s = formatWIB("2026-08-10T08:00:00Z", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  assert.ok(s.includes("Sen"), `weekday harus Sen, didapat: ${s}`);
  assert.ok(s.includes("10 Agu"), `tanggal harus 10 Agu, didapat: ${s}`);
});

test("formatWIBLong berisi hari, bulan, tahun, jam, dan WIB", () => {
  const s = formatWIBLong("2026-08-10T08:00:00Z");
  assert.ok(s.includes("10 Agustus 2026"), s);
  assert.ok(s.includes("15.00"), s);
  assert.ok(s.includes("WIB"), s);
});

test("input tak valid melempar RangeError (perilaku Intl standar, bukan bug timeZoneName)", () => {
  // Panggilan dengan tanggal invalid melempar "Invalid time value" — itu
  // perilaku standar Intl, BUKAN bug kombinasi timeZoneName+style. Yang wajib
  // dicegah (dan dicek test di atas) adalah RangeError "Invalid option".
  assert.throws(
    () => formatWIB("not-a-date", { hour: "2-digit" }),
    /Invalid time value/,
  );
  // epoch 0 = valid
  assert.doesNotThrow(() => formatWIB(0, { dateStyle: "medium" }));
});

// ─── getPeriodStatus ─────────────────────────────────────────────────────

test("getPeriodStatus: belum / aktif / tutup", () => {
  const start = "2026-08-10T08:00:00Z";
  const end = "2026-08-10T12:00:00Z";
  assert.equal(getPeriodStatus(Date.parse("2026-08-10T07:00:00Z"), start, end), "belum");
  assert.equal(getPeriodStatus(Date.parse("2026-08-10T10:00:00Z"), start, end), "aktif");
  assert.equal(getPeriodStatus(Date.parse("2026-08-10T13:00:00Z"), start, end), "tutup");
});

test("getPeriodStatus: waktu tidak lengkap => tutup (default aman)", () => {
  const t = Date.parse("2026-08-10T10:00:00Z");
  assert.equal(getPeriodStatus(t, undefined, "2026-08-10T12:00:00Z"), "tutup");
  assert.equal(getPeriodStatus(t, "2026-08-10T08:00:00Z", undefined), "tutup");
  assert.equal(getPeriodStatus(t, undefined, undefined), "tutup");
});

test("WIB_TZ = Asia/Jakarta", () => {
  assert.equal(WIB_TZ, "Asia/Jakarta");
});
