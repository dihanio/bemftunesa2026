"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  ClipboardList,
  Play,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  ListTodo,
} from "lucide-react";
import { API_URL } from "@/lib/api";

interface AssignmentQuizMeta {
  _id: string;
  title: string;
  type: string;
  durationMinutes: number;
  maxAttempts: number;
  passingScore: number;
  totalQuestions: number;
}

interface Assignment {
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
  quiz?: AssignmentQuizMeta;
}

type FilterTab =
  | "SEMUA"
  | "BELUM DIKERJAKAN"
  | "SEDANG DIKERJAKAN"
  | "SELESAI"
  | "TERLAMBAT";

const FILTERS: { key: FilterTab; match: (a: Assignment) => boolean }[] = [
  { key: "SEMUA", match: () => true },
  { key: "BELUM DIKERJAKAN", match: (a) => a.status === "NOT_STARTED" },
  { key: "SEDANG DIKERJAKAN", match: (a) => a.status === "IN_PROGRESS" },
  { key: "SELESAI", match: (a) => a.status === "COMPLETED" },
  { key: "TERLAMBAT", match: (a) => a.status === "OVERDUE" },
];

const STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  NOT_STARTED: {
    label: "Belum Dikerjakan",
    cls: "bg-white/5 border-white/10 text-white/60",
  },
  IN_PROGRESS: {
    label: "Sedang Dikerjakan",
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
    label: "Dikumpulkan",
    cls: "bg-green-500/10 border-green-500/30 text-green-400",
  },
};

const TYPE_ICON = {
  TASK: <FileText className="w-6 h-6" />,
  QUIZ: <ClipboardList className="w-6 h-6" />,
};

export default function AssignmentsPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("SEMUA");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/pkkmb/assignments`, {
        credentials: "include",
      });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const json = await res.json();
      if (json.success) setAssignments(json.data || []);
    } catch {
      // network error — biarkan list kosong
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(fetchData, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(
    () =>
      assignments.filter(
        (a) => FILTERS.find((f) => f.key === activeTab)?.match(a) ?? true,
      ),
    [assignments, activeTab],
  );

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

  const openAssignment = (a: Assignment) => {
    if (a.assignmentType === "QUIZ") {
      if (a.activeAttemptId) {
        router.push(`/dashboard/quiz/${a.quizId}/play/${a.activeAttemptId}`);
      } else if (a.status === "COMPLETED" && a.bestAttempt?.attemptId) {
        // Lihat Hasil → halaman result existing (pakai attempt terbaik).
        router.push(
          `/dashboard/quiz/${a.quizId}/result/${a.bestAttempt.attemptId}`,
        );
      } else if (a.quiz) {
        router.push(`/dashboard/quiz/${a.quizId}`);
      } else {
        router.push(`/dashboard/assignments/${a._id}`);
      }
    } else {
      router.push(`/dashboard/assignments/${a._id}`);
    }
  };

  const actionLabel = (a: Assignment) => {
    if (a.assignmentType === "QUIZ") {
      if (a.status === "IN_PROGRESS")
        return { label: "Lanjutkan Quiz", icon: <Play className="w-4 h-4" /> };
      if (a.status === "COMPLETED")
        return {
          label: "Lihat Hasil",
          icon: <ArrowRight className="w-4 h-4" />,
        };
      if (a.status === "OVERDUE")
        return {
          label: "Quiz Ditutup",
          icon: <AlertTriangle className="w-4 h-4" />,
        };
      return { label: "Mulai", icon: <Play className="w-4 h-4" /> };
    }
    if (a.status === "COMPLETED")
      return {
        label: "Lihat Detail",
        icon: <ArrowRight className="w-4 h-4" />,
      };
    return { label: "Kerjakan", icon: <ArrowRight className="w-4 h-4" /> };
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ListTodo className="w-6 h-6 text-gold-500" />
          Penugasan
        </h1>
        <p className="text-white/50 mt-1 text-sm">
          Semua tugas & quiz dalam satu tempat. Quiz dikerjakan lewat Quiz
          Player.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map((f) => {
          const count = assignments.filter(f.match).length;
          const active = activeTab === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setActiveTab(f.key)}
              className={`px-4 py-1.5 rounded-full text-sm border transition-all ${
                active
                  ? "bg-gold-500/20 border-gold-500/40 text-gold-400 font-medium"
                  : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"
              }`}
            >
              {f.key}
              <span className="ml-1.5 text-xs opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-white/40">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>Tidak ada penugasan pada filter ini.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((a) => {
            const st = STATUS_STYLE[a.status] || STATUS_STYLE.NOT_STARTED;
            const action = actionLabel(a);
            const disabled = a.status === "OVERDUE";
            return (
              <div
                key={a._id}
                className="group border border-white/10 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] hover:border-gold-500/40 transition-all overflow-hidden"
              >
                <div className="p-5 flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="w-11 h-11 rounded-lg bg-gold-500/10 border border-gold-500/30 text-gold-400 flex items-center justify-center shrink-0">
                    {TYPE_ICON[a.assignmentType] || TYPE_ICON.TASK}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-semibold text-white truncate">
                        {a.title}
                      </h3>
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${
                          a.assignmentType === "QUIZ"
                            ? "bg-purple-500/10 border-purple-500/30 text-purple-300"
                            : "bg-blue-500/10 border-blue-500/30 text-blue-300"
                        }`}
                      >
                        {a.assignmentType === "QUIZ" ? "Quiz" : "Tugas"}
                      </span>
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full border ${st.cls}`}
                      >
                        {st.label}
                      </span>
                    </div>

                    {a.description ? (
                      <p className="text-white/50 text-sm mt-1 line-clamp-2">
                        {a.description}
                      </p>
                    ) : null}

                    <div className="flex items-center gap-4 text-xs text-white/45 mt-2 flex-wrap">
                      {a.assignmentType === "QUIZ" && a.quiz ? (
                        <>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {a.quiz.durationMinutes} menit
                          </span>
                          <span>{a.quiz.totalQuestions} soal</span>
                          <span>Passing {a.quiz.passingScore}%</span>
                          {a.bestAttempt?.percentage !== undefined && (
                            <span className="text-green-400">
                              Skor terbaik {a.bestAttempt.percentage}%
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5" />
                          Tugas pengumpulan
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Deadline {fmtDate(a.deadline)}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 flex sm:items-center">
                    <button
                      onClick={() => openAssignment(a)}
                      disabled={disabled}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        disabled
                          ? "bg-white/5 text-white/30 cursor-not-allowed border border-white/10"
                          : a.status === "IN_PROGRESS"
                            ? "bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30"
                            : "bg-gold-500 text-black hover:bg-gold-400"
                      }`}
                    >
                      {action.icon}
                      {action.label}
                    </button>
                  </div>
                </div>

                {a.status === "COMPLETED" && a.bestAttempt && (
                  <div className="px-5 py-2 border-t border-white/5 bg-green-500/5 flex items-center gap-2 text-xs text-green-400">
                    <CheckCircle2 className="w-4 h-4" />
                    {a.assignmentType === "QUIZ"
                      ? `Selesai — nilai ${a.bestAttempt.score ?? 0} (${a.bestAttempt.percentage ?? 0}%), dikumpulkan ${fmtDate(a.bestAttempt.submittedAt)}`
                      : "Selesai — telah dikumpulkan"}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
