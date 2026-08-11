"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  ClipboardList,
  Play,
  ArrowRight,
  AlertTriangle,
  Loader2,
  Clock,
  CheckCircle2,
  ExternalLink,
  Paperclip,
  Users,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import TaskSubmitModal from "@/components/assignments/TaskSubmitModal";

interface AssignmentDetail {
  _id: string;
  title: string;
  description?: string;
  assignmentType: "TASK" | "QUIZ";
  quizId?: string;
  startTime?: string;
  deadline: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE" | string;
  activeAttemptId: string | null;
  bestAttempt: {
    status: string;
    score?: number;
    percentage?: number;
    submittedAt?: string;
    attemptId?: string;
  } | null;
  attachment?: string;
  link?: string;
  type?: string;
  quiz?: {
    _id: string;
    title: string;
    type: string;
    durationMinutes: number;
    maxAttempts: number;
    passingScore: number;
    totalQuestions: number;
  };
}

const STATUS_STYLE: Record<string, string> = {
  NOT_STARTED: "bg-white/5 border-white/10 text-white/60",
  IN_PROGRESS: "bg-amber-500/10 border-amber-500/30 text-amber-300",
  COMPLETED: "bg-green-500/10 border-green-500/30 text-green-400",
  OVERDUE: "bg-red-500/10 border-red-500/30 text-red-400",
  SUBMITTED: "bg-green-500/10 border-green-500/30 text-green-400",
};

const STATUS_LABEL: Record<string, string> = {
  NOT_STARTED: "Belum Dikerjakan",
  IN_PROGRESS: "Sedang Dikerjakan",
  COMPLETED: "Selesai",
  OVERDUE: "Terlambat",
  SUBMITTED: "Dikumpulkan",
};

export default function AssignmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isKetuaGugus, setIsKetuaGugus] = useState(false);
  const [selectedTask, setSelectedTask] = useState<AssignmentDetail | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const fmtDate = (iso?: string) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await apiFetch(`/pkkmb/assignments/${id}`);
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        if (res.status === 403) {
          setLoading(false);
          return;
        }
        const json = await res.json();
        if (json.success) setAssignment(json.data);
        const meRes = await apiFetch("/auth/me");
        const meJson = await meRes.json().catch(() => null);
        if (meJson?.success && meJson.data) {
          setIsKetuaGugus(!!meJson.data.isKetuaGugus);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, reloadKey]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="p-6 max-w-3xl mx-auto text-center text-white/40">
        <p>Penugasan tidak ditemukan atau kamu tidak memiliki akses.</p>
        <button
          onClick={() => router.push("/dashboard/assignments")}
          className="mt-4 text-gold-400 hover:underline text-sm"
        >
          ← Kembali ke Penugasan
        </button>
      </div>
    );
  }

  const st = STATUS_STYLE[assignment.status] || STATUS_STYLE.NOT_STARTED;
  const stLabel = STATUS_LABEL[assignment.status] || assignment.status;
  const isQuiz = assignment.assignmentType === "QUIZ";

  const primaryAction = () => {
    if (isQuiz) {
      if (assignment.status === "IN_PROGRESS" && assignment.activeAttemptId) {
        router.push(
          `/dashboard/quiz/${assignment.quizId}/play/${assignment.activeAttemptId}`,
        );
      } else if (assignment.status === "COMPLETED" && assignment.quiz) {
        // Lihat Hasil → halaman result existing (pakai attempt terbaik).
        if (assignment.bestAttempt?.attemptId) {
          router.push(
            `/dashboard/quiz/${assignment.quizId}/result/${assignment.bestAttempt.attemptId}`,
          );
        } else {
          router.push(`/dashboard/quiz/${assignment.quizId}`);
        }
      } else if (assignment.status === "OVERDUE") {
        return; // tombol dinonaktifkan
      } else {
        router.push(`/dashboard/quiz/${assignment.quizId}`);
      }
    } else {
      // TASK: buka modal submit langsung di tempat (tanpa pindah halaman).
      if (assignment.status === "COMPLETED") return; // sudah di halaman ini
      setSelectedTask(assignment);
    }
  };

  const isOverdue = assignment.status === "OVERDUE";
  // Anggota non-ketua pada tugas kelompok: tidak bisa submit (dicegah juga di backend).
  const memberBlocked =
    !isQuiz &&
    (assignment.type === "kelompok" || assignment.type === "angkatan") &&
    !isKetuaGugus &&
    assignment.status !== "SUBMITTED" &&
    assignment.status !== "COMPLETED";

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <button
        onClick={() => router.push("/dashboard/assignments")}
        className="inline-flex items-center gap-1.5 text-white/50 hover:text-gold-400 text-sm mb-5 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Penugasan
      </button>

      <div className="border border-white/10 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-12 h-12 rounded-lg bg-gold-500/10 border border-gold-500/30 text-gold-400 flex items-center justify-center">
              {isQuiz ? (
                <ClipboardList className="w-6 h-6" />
              ) : (
                <FileText className="w-6 h-6" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-white">
                {assignment.title}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${
                    isQuiz
                      ? "bg-purple-500/10 border-purple-500/30 text-purple-300"
                      : "bg-blue-500/10 border-blue-500/30 text-blue-300"
                  }`}
                >
                  {isQuiz ? "Quiz" : "Tugas"}
                </span>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full border ${st}`}
                >
                  {stLabel}
                </span>
              </div>
            </div>
          </div>

          {assignment.description && (
            <p className="text-white/60 text-sm mt-4 leading-relaxed whitespace-pre-wrap">
              {assignment.description}
            </p>
          )}

          <div className="grid sm:grid-cols-2 gap-3 mt-5 text-sm">
            <div className="flex items-center gap-2 text-white/50">
              <AlertTriangle className="w-4 h-4 text-white/30" />
              Deadline:{" "}
              <span className="text-white/80">
                {fmtDate(assignment.deadline)}
              </span>
            </div>
            {assignment.startTime && (
              <div className="flex items-center gap-2 text-white/50">
                <Clock className="w-4 h-4 text-white/30" />
                Mulai:{" "}
                <span className="text-white/80">
                  {fmtDate(assignment.startTime)}
                </span>
              </div>
            )}
          </div>

          {!isQuiz && assignment.attachment && (
            <a
              href={assignment.attachment}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-white/80 text-sm hover:bg-white/10 transition-colors"
            >
              <Paperclip className="w-4 h-4" />
              Lampiran
            </a>
          )}

          {!isQuiz && assignment.link && (
            <a
              href={assignment.link}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 mt-4 ml-2 px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-white/80 text-sm hover:bg-white/10 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Link Materi
            </a>
          )}
        </div>

        {isQuiz && assignment.quiz && (
          <div className="px-6 py-4 border-t border-white/5 grid sm:grid-cols-4 gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-white/40">
                Jumlah Soal
              </p>
              <p className="text-white text-base font-semibold mt-0.5">
                {assignment.quiz.totalQuestions} soal
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-white/40">
                Durasi
              </p>
              <p className="text-white text-base font-semibold mt-0.5">
                {assignment.quiz.durationMinutes} menit
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-white/40">
                Maks. Percobaan
              </p>
              <p className="text-white text-base font-semibold mt-0.5">
                {assignment.quiz.maxAttempts}x
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-white/40">
                Passing Score
              </p>
              <p className="text-white text-base font-semibold mt-0.5">
                {assignment.quiz.passingScore}%
              </p>
            </div>
          </div>
        )}

        {assignment.status === "COMPLETED" && assignment.bestAttempt && (
          <div className="px-6 py-3 border-t border-white/5 bg-green-500/5 flex items-center gap-2 text-sm text-green-400">
            <CheckCircle2 className="w-4 h-4" />
            {isQuiz
              ? `Nilai ${assignment.bestAttempt.score ?? 0} (${assignment.bestAttempt.percentage ?? 0}%) — dikumpulkan ${fmtDate(assignment.bestAttempt.submittedAt)}`
              : "Tugas telah dikumpulkan"}
          </div>
        )}

        <div className="px-6 py-4 border-t border-white/5 flex justify-end">
          <button
            onClick={primaryAction}
            disabled={
              isQuiz
                ? isOverdue
                : assignment.status === "OVERDUE" ||
                  memberBlocked ||
                  assignment.status === "COMPLETED"
            }
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              isQuiz
                ? isOverdue
                  ? "bg-white/5 text-white/30 cursor-not-allowed border border-white/10"
                  : assignment.status === "IN_PROGRESS"
                    ? "bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30"
                    : "bg-gold-500 text-black hover:bg-gold-400"
                : assignment.status === "COMPLETED" ||
                    assignment.status === "OVERDUE" ||
                    memberBlocked
                  ? "bg-white/5 text-white/30 cursor-not-allowed border border-white/10"
                  : "bg-gold-500 text-black hover:bg-gold-400"
            }`}
          >
            {isQuiz ? (
              isOverdue ? (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  Quiz Ditutup
                </>
              ) : assignment.status === "IN_PROGRESS" ? (
                <>
                  <Play className="w-4 h-4" />
                  Lanjutkan Quiz
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Mulai Quiz
                </>
              )
            ) : assignment.status === "COMPLETED" ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Sudah Dinilai
              </>
            ) : assignment.status === "SUBMITTED" ? (
              <>
                <ArrowRight className="w-4 h-4" />
                Perbarui Pengumpulan
              </>
            ) : isOverdue ? (
              <>
                <AlertTriangle className="w-4 h-4" />
                Terlambat
              </>
            ) : memberBlocked ? (
              <>
                <Users className="w-4 h-4" />
                Menunggu Ketua
              </>
            ) : (
              <>
                <ArrowRight className="w-4 h-4" />
                Kumpulkan Tugas
              </>
            )}
          </button>
        </div>
      </div>

      {selectedTask && (
        <TaskSubmitModal
          task={selectedTask}
          isKetuaGugus={isKetuaGugus}
          hasSubmitted={
            selectedTask.status === "SUBMITTED" ||
            selectedTask.status === "COMPLETED"
          }
          deadline={selectedTask.deadline}
          onClose={() => setSelectedTask(null)}
          onSubmitted={() => setReloadKey((k) => k + 1)}
        />
      )}
    </div>
  );
}
