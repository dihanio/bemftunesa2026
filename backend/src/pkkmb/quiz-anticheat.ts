// Anti-cheat / anti-AI DETERRENCE + violation MONITORING.
// PENTING: ini BUKAN deteksi AI yang mutlak — browser tidak dapat menjamin
// bahwa mahasiswa tidak memakai perangkat/HP/browser/AI lain. Semua signal
// hanya menjadi indikator untuk keputusan panitia (tidak ada auto-punishment).

export const QUIZ_VIOLATION_TYPES = [
  'TAB_HIDDEN',
  'WINDOW_BLUR',
  'COPY',
  'CUT',
  'PASTE',
  'CONTEXT_MENU',
  'PRINT_ATTEMPT',
  'DEVTOOLS_SUSPECTED',
  'FULLSCREEN_EXIT',
  'PAGE_LEAVE',
  'HEARTBEAT_TIMEOUT',
  // Informational: dicatat di histori audit, TIDAK menaikkan violationCount/risk.
  // (kembali ke tab / fokus jendela / refresh halaman / resume pengerjaan).
  'TAB_VISIBLE',
  'WINDOW_FOCUS',
  'PAGE_REFRESH',
  'ATTEMPT_RESUMED',
  // Shortcut keyboard terblokir selain copy/cut/paste (mis. Ctrl/Cmd+S, Ctrl/Cmd+U).
  'KEYBOARD_SHORTCUT',
] as const;

export type QuizViolationType = (typeof QUIZ_VIOLATION_TYPES)[number];

export const QUIZ_RISK_LEVELS = ['LOW', 'MEDIUM', 'HIGH'] as const;
export type QuizRiskLevel = (typeof QUIZ_RISK_LEVELS)[number];

export interface QuizAntiCheatViolation {
  type: QuizViolationType;
  occurredAt: Date;
  metadata?: {
    durationMs?: number;
    questionId?: string;
    clientTimestamp?: string;
  };
}

// Event informasional: tetap dicatat (audit/timeline) tapi bukan pelanggaran —
// tidak menaikkan violationCount & tidak memengaruhi risk level.
export const QUIZ_INFORMATIONAL_TYPES = [
  'TAB_VISIBLE',
  'WINDOW_FOCUS',
  'PAGE_REFRESH',
  'ATTEMPT_RESUMED',
] as const;

export function isInformationalType(type: QuizViolationType): boolean {
  return (QUIZ_INFORMATIONAL_TYPES as readonly string[]).includes(type);
}

// Threshold sederhana: LOW 0-2, MEDIUM 3-5, HIGH >5. Dihitung BACKEND.
export function riskLevelFromCount(count: number): QuizRiskLevel {
  if (count <= 2) return 'LOW';
  if (count <= 5) return 'MEDIUM';
  return 'HIGH';
}

export function isQuizViolationType(
  value: unknown,
): value is QuizViolationType {
  return (
    typeof value === 'string' &&
    (QUIZ_VIOLATION_TYPES as readonly string[]).includes(value)
  );
}

// Dedupe: abaikan event ber-tipe sama beruntun dalam window (mis. blur
// beruntun / event duplication browser). Default 5 detik.
export function shouldDedupeViolation(
  last: QuizAntiCheatViolation | undefined,
  type: QuizViolationType,
  now: Date,
  windowMs = 5000,
): boolean {
  if (!last || last.type !== type) return false;
  return now.getTime() - new Date(last.occurredAt).getTime() < windowMs;
}

// Rate limit per attempt: maks event dalam 60 detik (cegah spam endpoint).
export const QUIZ_VIOLATION_RATE_LIMIT = 30;
export const QUIZ_VIOLATION_RATE_WINDOW_MS = 60_000;

export function countViolationsInWindow(
  violations: QuizAntiCheatViolation[],
  now: Date,
  windowMs = QUIZ_VIOLATION_RATE_WINDOW_MS,
): number {
  return violations.filter(
    (v) => now.getTime() - new Date(v.occurredAt).getTime() < windowMs,
  ).length;
}

// Batas panjang histori violations (simpan N terbaru saja).
export const QUIZ_VIOLATIONS_MAX_STORED = 100;

// Maksimal event per batch request (POST .../events). > ini → 400.
export const QUIZ_EVENTS_MAX_PER_REQUEST = 50;

// Interval heartbeat client (15-30 detik).
export const QUIZ_HEARTBEAT_INTERVAL_MS = 20_000;
