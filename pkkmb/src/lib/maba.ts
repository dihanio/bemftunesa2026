// ─── HELPERS & TIPE BERSAMA — PENGALAMAN MABA ────────────────────────────────
// Semua halaman MABA (dashboard & aktivitas) memakai satu sumber status/label
// di sini agar tidak ada status yang tidak sinkron antar halaman.

export type AssignmentStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "OVERDUE"
  | "SUBMITTED"
  | string;

export interface MabaQuizMeta {
  _id: string;
  title: string;
  type: string;
  durationMinutes: number;
  maxAttempts: number;
  passingScore: number;
  totalQuestions: number;
}

export interface MabaBestAttempt {
  status: string;
  score?: number;
  percentage?: number;
  submittedAt?: string;
  attemptId?: string;
  attemptNumber?: number;
}

export interface MabaAssignment {
  _id: string;
  title: string;
  description?: string;
  assignmentType: "TASK" | "QUIZ";
  quizId?: string;
  startTime?: string;
  deadline: string;
  status: AssignmentStatus;
  activeAttemptId: string | null;
  bestAttempt: MabaBestAttempt | null;
  quiz?: MabaQuizMeta;
  // TASK metadata (dari backend listAssignments)
  type?: string; // individu | kelompok | angkatan
  allowedFormats?: string[];
  attachment?: string;
  link?: string;
}

export interface MabaGroup {
  _id: string;
  nomor: number;
  name: string;
  grupLink?: string;
  pendampingName?: string;
  pendampingWhatsApp?: string;
  pendampingId?: { name?: string; phone?: string };
}

export interface MabaSchedule {
  _id: string;
  name: string;
  startTime: string;
  endTime: string;
  location?: string;
  isOnline?: boolean;
}

export interface MabaAnnouncement {
  _id: string;
  title: string;
  content: string;
  createdAt: string;
  isPriority?: boolean;
}

// ─── SATU SET STATUS MANUSIAWI (masalah B6) ─────────────────────────────────
export const STATUS_META: Record<string, { label: string; cls: string }> = {
  NOT_STARTED: {
    label: "Belum dikerjakan",
    cls: "bg-white/5 border-white/10 text-white/60",
  },
  IN_PROGRESS: {
    label: "Sedang dikerjakan",
    cls: "bg-amber-500/10 border-amber-500/30 text-amber-300",
  },
  COMPLETED: {
    label: "Selesai",
    cls: "bg-green-500/10 border-green-500/30 text-green-400",
  },
  OVERDUE: {
    label: "Terlambat",
    cls: "bg-red-500/10 border-red-500/30 text-red-400",
  },
  SUBMITTED: {
    label: "Menunggu nilai",
    cls: "bg-blue-500/10 border-blue-500/30 text-blue-300",
  },
};

export function statusMeta(status: string): { label: string; cls: string } {
  return STATUS_META[status] || STATUS_META.NOT_STARTED;
}

// ─── GREETING & HARI KE-N ────────────────────────────────────────────────────
export function greeting(d = new Date()): string {
  const h = d.getHours();
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 18) return "Selamat sore";
  return "Selamat malam";
}

// Tanggal mulai PKKMB — sesuai jadwal resmi panitia (Pra-PKKMB FT dimulai
// 12 Agustus 2026). Format ISO offset WIB.
export const PKKMB_START_DATE: string | null = "2026-08-12T00:00:00+07:00";

const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

export function pkkmbDay(d = new Date()): number | null {
  if (!PKKMB_START_DATE) return null;
  const start = startOfDay(new Date(PKKMB_START_DATE));
  const diff = Math.round(
    (startOfDay(d).getTime() - start.getTime()) / 86_400_000,
  );
  return diff >= 0 ? diff + 1 : null;
}

// ─── LABEL DEADLINE RELATIF ──────────────────────────────────────────────────
export function deadlineLabel(iso: string): string {
  const d = new Date(iso);
  const dayDiff = Math.round(
    (startOfDay(d).getTime() - startOfDay(new Date()).getTime()) / 86_400_000,
  );
  const time = d.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (dayDiff < 0) return "Sudah lewat";
  if (dayDiff === 0) return `Hari ini, ${time}`;
  if (dayDiff === 1) return `Besok, ${time}`;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

// ─── PRIORITAS AKSI (urutan: Terlambat → Sedang dikerjakan → deadline dekat) ─
export function nextActions(
  assignments: MabaAssignment[],
  limit = 3,
): MabaAssignment[] {
  const rank = (a: MabaAssignment) => {
    if (a.status === "OVERDUE") return 0;
    if (a.status === "IN_PROGRESS") return 1;
    return 2; // NOT_STARTED
  };
  return [...assignments]
    .filter((a) => a.status !== "COMPLETED" && a.status !== "SUBMITTED")
    .sort(
      (x, y) =>
        rank(x) - rank(y) ||
        new Date(x.deadline).getTime() - new Date(y.deadline).getTime(),
    )
    .slice(0, limit);
}

export function quizCounts(assignments: MabaAssignment[]): {
  total: number;
  done: number;
} {
  const quizzes = assignments.filter((a) => a.assignmentType === "QUIZ");
  const done = quizzes.filter((a) => a.status === "COMPLETED").length;
  return { total: quizzes.length, done };
}

// ─── TEKS SKOR QUIZ ──────────────────────────────────────────────────────────
// Satu format skor yang jelas bagi maba: persentase + poin mentah vs total
// (mis. "83% · 50/60 poin"). Total poin dihitung dari score/percentage agar
// tidak butuh field tambahan dari backend.
export function quizScoreText(score?: number, percentage?: number): string {
  const s = score ?? 0;
  const p = percentage ?? 0;
  const total = p > 0 ? Math.round(s / (p / 100)) : 0;
  return `${p}% · ${s}/${total} poin`;
}

// ─── GATE SUBMIT TUGAS ───────────────────────────────────────────────────────
// Kelompok/angkatan hanya ketua gugus yang submit; submission yang sudah
// lewat deadline tidak boleh diubah lagi (backend tetap authority).
export function canSubmitTask(opts: {
  type?: string;
  isKetuaGugus: boolean;
  hasSubmitted: boolean;
  deadline: string;
}): boolean {
  if (
    (opts.type === "kelompok" || opts.type === "angkatan") &&
    !opts.isKetuaGugus
  ) {
    return false;
  }
  if (opts.hasSubmitted && new Date() > new Date(opts.deadline)) return false;
  return true;
}

// ─── NOTIFIKASI & DEEP-LINK ─────────────────────────────────────────────────
export type NotificationActionType =
  | "quiz"
  | "task"
  | "attendance"
  | "schedule"
  | "general"
  | string;

export interface MabaNotification {
  _id: string;
  title: string;
  content: string;
  isPriority?: boolean;
  createdAt: string;
  isRead: boolean;
  actionType?: NotificationActionType;
  actionId?: string;
}

// Peta notifikasi → tujuan deep-link.
// - actionType eksplisit (dari backend) diprioritaskan.
// - Fallback: inferensi dari judul/isi agar pengumuman lama (tanpa field)
//   tetap mengarahkan Maba ke halaman yang relevan.
export function notificationHref(n: MabaNotification): string | null {
  const t = (n.actionType || "").toLowerCase();
  const id = n.actionId;
  if (t === "quiz")
    return id ? `/dashboard/quiz/${id}` : "/dashboard/assignments";
  if (t === "task")
    return id ? `/dashboard/assignments/${id}` : "/dashboard/assignments";
  if (t === "attendance") return "/dashboard/presensi";
  if (t === "schedule") return "/dashboard/jadwal";

  const hay = `${n.title} ${n.content || ""}`.toLowerCase();
  if (/(quiz|pretest|posttest|kuis)/.test(hay)) return "/dashboard/assignments";
  if (/(tugas|pengumpulan|submit|kumpul|upload)/.test(hay))
    return "/dashboard/assignments";
  if (/(presensi|absen|absensi|check.?in)/.test(hay))
    return "/dashboard/presensi";
  if (/(jadwal|agenda|materi|kegiatan)/.test(hay)) return "/dashboard/jadwal";
  return null;
}

// ─── PITA (NON-SENSITIF) ─────────────────────────────────────────────────────
// Pita hanya menampilkan warna — TANPA diagnosis. Detail kondisi hanya untuk
// tim medis/panitia yang berwenang. null = tidak perlu pita khusus.
export type MabaRibbon = "MERAH" | "KUNING" | null;

export const RIBBON_META: Record<
  string,
  { label: string; dot: string; chip: string; border: string }
> = {
  MERAH: {
    label: "Pita Merah",
    dot: "bg-red-500",
    chip: "bg-red-500/10 border-red-500/30 text-red-300",
    border: "border-red-500/25",
  },
  KUNING: {
    label: "Pita Kuning",
    dot: "bg-yellow-400",
    chip: "bg-yellow-500/10 border-yellow-500/30 text-yellow-300",
    border: "border-yellow-500/25",
  },
};

// ─── LINK WA PENDAMPING ──────────────────────────────────────────────────────
export function pendampingWaLink(
  group: MabaGroup | null | undefined,
  studentName: string,
  fallback: string,
): string {
  if (group?.pendampingWhatsApp) return group.pendampingWhatsApp;
  if (group?.pendampingId?.phone) {
    let phone = group.pendampingId.phone.replace(/[^0-9]/g, "");
    if (phone.startsWith("0")) phone = "62" + phone.substring(1);
    const name =
      group.pendampingId.name || group.pendampingName || "Pendamping";
    return `https://wa.me/${phone}?text=${encodeURIComponent(
      `Halo Kak ${name}, saya ${studentName} dari Gugus ${group.nomor} izin bertanya...`,
    )}`;
  }
  return fallback;
}
