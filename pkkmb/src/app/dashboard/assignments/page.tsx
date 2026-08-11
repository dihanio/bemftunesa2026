"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
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
  Users,
  User,
} from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { statusMeta, deadlineLabel } from "@/lib/maba";
import TaskSubmitModal from "@/components/assignments/TaskSubmitModal";

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
  quiz?: {
    _id: string;
    title: string;
    type: string;
    durationMinutes: number;
    maxAttempts: number;
    passingScore: number;
    totalQuestions: number;
  };
  // TASK metadata (backend listAssignments)
  type?: string;
  allowedFormats?: string[];
}

interface Submission {
  taskId: { _id: string } | string;
  fileUrl: string;
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
  {
    key: "SELESAI",
    match: (a) => a.status === "COMPLETED" || a.status === "SUBMITTED",
  },
  { key: "TERLAMBAT", match: (a) => a.status === "OVERDUE" },
];

const TYPE_ICON = {
  TASK: <FileText className="w-6 h-6" />,
  QUIZ: <ClipboardList className="w-6 h-6" />,
};

export default function AssignmentsPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("SEMUA");
  const [isKetuaGugus, setIsKetuaGugus] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedTask, setSelectedTask] = useState<Assignment | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [res, meRes, subsRes] = await Promise.all([
        apiFetch("/pkkmb/assignments"),
        apiFetch("/auth/me"),
        apiFetch("/pkkmb/maba/submissions"),
      ]);
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const json = await res.json();
      if (json.success) setAssignments(json.data || []);

      const meJson = await meRes.json().catch(() => null);
      if (meJson?.success && meJson.data) {
        setIsKetuaGugus(!!meJson.data.isKetuaGugus);
      }

      const subsJson = await subsRes.json().catch(() => null);
      if (subsJson?.success) setSubmissions(subsJson.data || []);
    } catch {
      // network error — biarkan list kosong
    } finally {
      setLoading(false);
    }
  }, [router]);

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

  const hasSubmitted = (a: Assignment) =>
    a.status === "SUBMITTED" || a.status === "COMPLETED";

  const submissionFileUrl = (a: Assignment) => {
    const sub = submissions.find(
      (s) =>
        (typeof s.taskId === "object" ? s.taskId?._id : s.taskId) === a._id,
    );
    return sub?.fileUrl;
  };

  const isMemberBlocked = (a: Assignment) =>
    (a.type === "kelompok" || a.type === "angkatan") &&
    !isKetuaGugus &&
    !hasSubmitted(a);

  const openAssignment = (a: Assignment) => {
    if (a.assignmentType === "QUIZ") {
      if (a.activeAttemptId) {
        router.push(`/dashboard/quiz/${a.quizId}/play/${a.activeAttemptId}`);
      } else if (a.status === "COMPLETED" && a.bestAttempt?.attemptId) {
        router.push(
          `/dashboard/quiz/${a.quizId}/result/${a.bestAttempt.attemptId}`,
        );
      } else if (a.quiz) {
        router.push(`/dashboard/quiz/${a.quizId}`);
      } else {
        router.push(`/dashboard/assignments/${a._id}`);
      }
    } else {
      if (a.status === "COMPLETED") {
        // Tugas sudah dinilai → buka halaman detail (nilai & feedback).
        router.push(`/dashboard/assignments/${a._id}`);
        return;
      }
      // TASK: buka modal submit langsung di tempat (tanpa pindah halaman).
      setSelectedTask(a);
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
      return { label: "Lihat Nilai", icon: <ArrowRight className="w-4 h-4" /> };
    if (a.status === "SUBMITTED")
      return { label: "Perbarui", icon: <ArrowRight className="w-4 h-4" /> };
    if (a.status === "OVERDUE")
      return { label: "Terlambat", icon: <AlertTriangle className="w-4 h-4" /> };
    if (isMemberBlocked(a))
      return { label: "Menunggu Ketua", icon: <Users className="w-4 h-4" /> };
    return { label: "Kumpulkan", icon: <ArrowRight className="w-4 h-4" /> };
  };

  const actionDisabled = (a: Assignment) => {
    if (a.assignmentType === "QUIZ") return a.status === "OVERDUE";
    if (a.status === "OVERDUE" && !hasSubmitted(a)) return true;
    if (a.status === "COMPLETED") return false; // tombol = lihat detail
    return isMemberBlocked(a);
  };

  const allDone =
    assignments.length > 0 &&
    assignments.every(
      (a) => a.status === "COMPLETED" || a.status === "SUBMITTED",
    );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ListTodo className="w-6 h-6 text-gold-500" />
          Aktivitas Saya
        </h1>
        <p className="text-white/50 mt-1 text-sm">
          Semua tugas & quiz dalam satu tempat. Status selalu terbarui setelah
          kamu mengerjakan.
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
          {allDone && activeTab === "SEMUA" ? (
            <>
              <div className="text-4xl mb-3">🎉</div>
              <p className="text-white/70 font-semibold">
                Semua aktivitas selesai!
              </p>
              <p className="text-sm text-white/40 mt-1">
                Tidak ada tugas atau quiz yang perlu dikerjakan.
              </p>
            </>
          ) : (
            <>
              <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>Tidak ada aktivitas pada filter ini.</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((a) => {
            const st = statusMeta(a.status);
            const action = actionLabel(a);
            const disabled = actionDisabled(a);
            const blocked = isMemberBlocked(a);
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
                      {a.assignmentType === "TASK" && a.type && (
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-full border font-medium capitalize inline-flex items-center gap-1 ${
                            a.type === "individu"
                              ? "bg-white/5 border-white/10 text-white/50"
                              : "bg-orange-500/10 border-orange-500/30 text-orange-300"
                          }`}
                        >
                          {a.type === "individu" ? (
                            <User className="w-3 h-3" />
                          ) : (
                            <Users className="w-3 h-3" />
                          )}
                          {a.type}
                        </span>
                      )}
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
                        Deadline {deadlineLabel(a.deadline)}
                      </span>
                    </div>

                    {blocked && (
                      <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-blue-300 bg-blue-500/10 border border-blue-500/20 rounded-lg px-2 py-1">
                        <Users className="w-3 h-3" /> Tugas kelompok —
                        pengumpulan oleh Ketua Gugus. Kamu tidak perlu submit.
                      </p>
                    )}

                    {a.assignmentType === "TASK" && (
                      <Link
                        href={`/dashboard/assignments/${a._id}`}
                        className="mt-2 inline-block text-xs text-gold-500 hover:text-gold-400 font-semibold"
                      >
                        Lihat detail &rarr;
                      </Link>
                    )}
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
                      ? `Selesai — nilai ${a.bestAttempt.score ?? 0} (${a.bestAttempt.percentage ?? 0}%)`
                      : `Selesai — dinilai ${a.bestAttempt.score ?? 0}/100`}
                  </div>
                )}
                {a.status === "SUBMITTED" && (
                  <div className="px-5 py-2 border-t border-white/5 bg-blue-500/5 flex items-center gap-2 text-xs text-blue-300">
                    <CheckCircle2 className="w-4 h-4" />
                    Sudah dikumpulkan — menunggu penilaian.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selectedTask && (
        <TaskSubmitModal
          task={selectedTask}
          isKetuaGugus={isKetuaGugus}
          hasSubmitted={hasSubmitted(selectedTask)}
          fileUrl={submissionFileUrl(selectedTask)}
          deadline={selectedTask.deadline}
          onClose={() => setSelectedTask(null)}
          onSubmitted={() => {
            // Biarkan modal menampilkan layar sukses; daftar di-refresh di baliknya.
            void fetchData();
          }}
        />
      )}
    </div>
  );
}
