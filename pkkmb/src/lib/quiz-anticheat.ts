// Anti-cheat / anti-AI DETERRENCE (frontend) — mirror dari quiz-anticheat.ts
// backend. Murni pure functions (bisa di-test dengan node:test).
// PENTING: ini BUKAN deteksi AI yang mutlak & BUKAN security boundary.
// Backend tetap authority untuk scoring/timer/ownership/risk.

export const QUIZ_VIOLATION_TYPES = [
  "TAB_HIDDEN",
  "WINDOW_BLUR",
  "COPY",
  "CUT",
  "PASTE",
  "CONTEXT_MENU",
  "PRINT_ATTEMPT",
  "DEVTOOLS_SUSPECTED",
  "FULLSCREEN_EXIT",
  "PAGE_LEAVE",
  "HEARTBEAT_TIMEOUT",
  // Informational: dicatat di histori audit, TIDAK menaikkan violationCount/risk
  "TAB_VISIBLE",
  "WINDOW_FOCUS",
  "PAGE_REFRESH",
  "ATTEMPT_RESUMED",
  // Shortcut keyboard terblokir selain copy/cut/paste (mis. Ctrl/Cmd+S, Ctrl/Cmd+U)
  "KEYBOARD_SHORTCUT",
] as const;

export type QuizViolationType = (typeof QUIZ_VIOLATION_TYPES)[number];

// Event informasional — tetap tampil di timeline audit management, tapi tidak
// dihitung sebagai pelanggaran (mirror backend QUIZ_INFORMATIONAL_TYPES).
export const INFORMATIONAL_EVENT_TYPES: ReadonlySet<string> = new Set([
  "TAB_VISIBLE",
  "WINDOW_FOCUS",
  "PAGE_REFRESH",
  "ATTEMPT_RESUMED",
]);

export function isInformationalEvent(type: QuizViolationType): boolean {
  return INFORMATIONAL_EVENT_TYPES.has(type);
}

export const VIOLATION_LABEL: Record<QuizViolationType, string> = {
  TAB_HIDDEN: "Berpindah tab",
  WINDOW_BLUR: "Berpindah fokus jendela",
  COPY: "Menyalin teks (copy)",
  CUT: "Memotong teks (cut)",
  PASTE: "Menempel teks (paste)",
  CONTEXT_MENU: "Klik kanan",
  PRINT_ATTEMPT: "Percobaan mencetak",
  DEVTOOLS_SUSPECTED: "Developer tools terdeteksi (heuristic)",
  FULLSCREEN_EXIT: "Keluar dari fullscreen",
  PAGE_LEAVE: "Meninggalkan halaman quiz",
  HEARTBEAT_TIMEOUT: "Heartbeat terputus",
  TAB_VISIBLE: "Kembali ke tab quiz",
  WINDOW_FOCUS: "Kembali fokus ke jendela quiz",
  PAGE_REFRESH: "Halaman di-refresh",
  ATTEMPT_RESUMED: "Pengerjaan dilanjutkan",
  KEYBOARD_SHORTCUT: "Shortcut keyboard terblokir",
};

export type QuizRiskLevel = "LOW" | "MEDIUM" | "HIGH";

export const RISK_LABEL: Record<QuizRiskLevel, string> = {
  LOW: "Rendah",
  MEDIUM: "Sedang",
  HIGH: "Tinggi",
};

// Threshold backend: LOW 0-2, MEDIUM 3-5, HIGH >5. Frontend hanya memakai
// nilai yang DIKEMBALIKAN backend (tidak pernah mengirim riskLevel).
export function riskLevelFromCount(count: number): QuizRiskLevel {
  if (count <= 2) return "LOW";
  if (count <= 5) return "MEDIUM";
  return "HIGH";
}

// Ambang warning toast untuk mahasiswa (deterrence ringan, bukan hukuman).
export const WARNING_THRESHOLDS = [1, 3, 5] as const;

export function warningMessageForCount(count: number): string | null {
  if (count === 1) {
    return "Aktivitas berpindah fokus terdeteksi dan dicatat.";
  }
  if (count === 3) {
    return "Beberapa aktivitas tidak sesuai dengan aturan pengerjaan telah terdeteksi.";
  }
  if (count >= 5) {
    return "Jumlah pelanggaran cukup tinggi. Aktivitas Anda terus tercatat.";
  }
  return null;
}

// Debounce helper: pastikan tiap tipe violation hanya dilaporkan sekali per
// window (ms). Mencegah event duplication browser (blur beruntun dll).
export function makeViolationReporter(
  report: (type: QuizViolationType, questionId?: string) => void,
  windowMs = 5000,
): (type: QuizViolationType, questionId?: string) => void {
  const lastSent = new Map<QuizViolationType, number>();
  return (type, questionId) => {
    const now = Date.now();
    const prev = lastSent.get(type) ?? 0;
    if (now - prev < windowMs) return;
    lastSent.set(type, now);
    report(type, questionId);
  };
}

// Interval heartbeat client (sinkron dengan backend 20 detik).
export const HEARTBEAT_INTERVAL_MS = 20_000;
