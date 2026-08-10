// Timezone resmi PKKMB: Asia/Jakarta (WIB, UTC+7).
// String datetime TANPA offset (mis. "2026-08-11T08:00") diinterpretasikan
// sebagai waktu WIB, bukan waktu lokal/UTC server. String yang sudah punya
// offset (Z / ±hh:mm) dibiarkan apa adanya.
const WIB_OFFSET = '+07:00';

export function parseWibDate(input: string): Date {
  if (/[zZ]|[+-]\d{2}:\d{2}$/.test(input)) {
    return new Date(input);
  }
  return new Date(`${input}${WIB_OFFSET}`);
}

// Apakah `now` berada dalam periode [start, end] (inclusive) berdasarkan
// timestamp server (absolute, bebas timezone).
export function isWithinPeriod(
  now: Date,
  start: Date,
  end: Date,
): 'BEFORE' | 'ACTIVE' | 'AFTER' {
  if (now < start) return 'BEFORE';
  if (now > end) return 'AFTER';
  return 'ACTIVE';
}
