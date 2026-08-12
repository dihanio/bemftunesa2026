"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { statusMeta, deadlineLabel, quizScoreText } from "@/lib/maba";
import TaskSubmitModal from "@/components/assignments/TaskSubmitModal";
import AssignmentDetailModal from "@/components/assignments/AssignmentDetailModal";

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

// Warna aksen per tab (dot indikator) — menggantikan icon.
const FILTERS: {
  key: FilterTab;
  label: string;
  dot: string;
  match: (a: Assignment) => boolean;
}[] = [
  { key: "SEMUA", label: "Semua", dot: "bg-white/40", match: () => true },
  {
    key: "BELUM DIKERJAKAN",
    label: "Belum dikerjakan",
    dot: "bg-white/60",
    match: (a) => a.status === "NOT_STARTED",
  },
  {
    key: "SEDANG DIKERJAKAN",
    label: "Sedang dikerjakan",
    dot: "bg-amber-400",
    match: (a) => a.status === "IN_PROGRESS",
  },
  {
    key: "SELESAI",
    label: "Selesai",
    dot: "bg-green-400",
    match: (a) => a.status === "COMPLETED" || a.status === "SUBMITTED",
  },
  {
    key: "TERLAMBAT",
    label: "Terlambat",
    dot: "bg-red-400",
    match: (a) => a.status === "OVERDUE",
  },
];

export default function AssignmentsPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("SEMUA");
  const [isKetuaGugus, setIsKetuaGugus] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedTask, setSelectedTask] = useState<Assignment | null>(null);
  const [detailAssignment, setDetailAssignment] = useState<Assignment | null>(
    null,
  );

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
        // Halaman ini khusus maba — panitia/pendamping dialihkan ke dashboard.
        const roleObj = meJson.data.role;
        const roleString =
          typeof roleObj === "object" && roleObj !== null
            ? (roleObj.slug || roleObj.name || "user").toLowerCase()
            : String(roleObj || "user").toLowerCase();
        if (roleString !== "user" && roleString !== "maba") {
          router.replace("/dashboard");
          return;
        }
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

  const doneCount = useMemo(
    () =>
      assignments.filter(
        (a) => a.status === "COMPLETED" || a.status === "SUBMITTED",
      ).length,
    [assignments],
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

  // CTA: teks saja (tanpa icon) + warna sesuai urgensi.
  const actionMeta = (a: Assignment) => {
    if (a.assignmentType === "QUIZ") {
      if (a.status === "IN_PROGRESS")
        return { label: "Lanjutkan", cls: "bg-amber-500 text-black" };
      if (a.status === "COMPLETED")
        return { label: "Lihat Hasil", cls: "bg-white/10 text-white" };
      if (a.status === "OVERDUE")
        return { label: "Quiz Ditutup", cls: "bg-white/5 text-white/30" };
      return { label: "Kerjakan", cls: "bg-gold-500 text-black" };
    }
    if (a.status === "COMPLETED")
      return { label: "Lihat Nilai", cls: "bg-white/10 text-white" };
    if (a.status === "SUBMITTED")
      return { label: "Perbarui", cls: "bg-gold-500 text-black" };
    if (a.status === "OVERDUE")
      return { label: "Terlambat", cls: "bg-white/5 text-white/30" };
    if (isMemberBlocked(a))
      return { label: "Menunggu Ketua", cls: "bg-white/5 text-white/30" };
    return { label: "Kumpulkan", cls: "bg-gold-500 text-black" };
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

  const progressPct =
    assignments.length > 0
      ? Math.round((doneCount / assignments.length) * 100)
      : 0;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header: teks + garis aksen (tanpa icon) */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-5 mb-6">
        <span
          className="absolute left-0 top-0 h-full w-1 bg-gold-500"
          aria-hidden="true"
        />
        <h1 className="text-2xl font-bold text-white">Aktivitas Saya</h1>
        <p className="text-white/50 mt-1 text-sm">
          Semua tugas & quiz dalam satu tempat. Status selalu terbarui setelah
          kamu mengerjakan.
        </p>
        {assignments.length > 0 && (
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-gold-500 to-amber-500 transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-xs text-white/50 shrink-0">
              <span className="text-white font-bold">{doneCount}</span>/
              {assignments.length} selesai
            </p>
          </div>
        )}
      </div>

      {/* Filter tabs: pill dengan dot warna */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-6 -mx-1 px-1">
        {FILTERS.map((f) => {
          const count = assignments.filter(f.match).length;
          const active = activeTab === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setActiveTab(f.key)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm border transition-all ${
                active
                  ? "bg-gold-500/20 border-gold-500/50 text-gold-400 font-semibold"
                  : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${f.dot}`}
                aria-hidden="true"
              />
              {f.label}
              <span
                className={`text-xs ${active ? "text-gold-400/70" : "opacity-60"}`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="space-y-3" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-28 rounded-2xl bg-white/5 animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white/[0.02] border border-white/10 rounded-2xl">
          {allDone && activeTab === "SEMUA" ? (
            <>
              <div className="mx-auto mb-3 flex items-center justify-center gap-1.5" aria-hidden="true">
                <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-400/30" />
              </div>
              <p className="text-white/80 font-semibold">
                Semua aktivitas selesai!
              </p>
              <p className="text-sm text-white/40 mt-1">
                Tidak ada tugas atau quiz yang perlu dikerjakan.
              </p>
            </>
          ) : (
            <>
              <div className="mx-auto mb-3 flex items-center justify-center gap-1.5" aria-hidden="true">
                <span className="w-2.5 h-2.5 rounded-full bg-gold-500/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-gold-500/40" />
                <span className="w-2.5 h-2.5 rounded-full bg-gold-500/20" />
              </div>
              <p className="text-white/70 font-semibold">
                Tidak ada aktivitas pada filter ini.
              </p>
              <p className="text-sm text-white/40 mt-1">
                {activeTab === "BELUM DIKERJAKAN"
                  ? "Semua tugas & quiz sudah dikerjakan. Mantap!"
                  : activeTab === "TERLAMBAT"
                    ? "Tidak ada aktivitas yang terlewat. Bagus!"
                    : "Pilih filter lain untuk melihat aktivitas kamu."}
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => {
            const st = statusMeta(a.status);
            const action = actionMeta(a);
            const disabled = actionDisabled(a);
            const blocked = isMemberBlocked(a);
            const isQuiz = a.assignmentType === "QUIZ";
            const isLate = a.status === "OVERDUE";
            return (
              <div
                key={a._id}
                className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br from-white/[0.05] to-white/[0.02] transition-all hover:border-gold-500/40 ${
                  isLate ? "border-red-500/25" : "border-white/10"
                }`}
              >
                {/* Strip kiri: warna tipe aktivitas */}
                <span
                  className={`absolute left-0 top-0 h-full w-1 ${
                    isQuiz ? "bg-purple-400" : "bg-blue-400"
                  }`}
                  aria-hidden="true"
                />

                <div className="p-5 flex flex-col sm:flex-row sm:items-start gap-4 pl-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg border ${
                          isQuiz
                            ? "bg-purple-500/10 border-purple-500/25 text-purple-300"
                            : "bg-blue-500/10 border-blue-500/25 text-blue-300"
                        }`}
                      >
                        {isQuiz ? "Quiz" : "Tugas"}
                      </span>
                      {a.assignmentType === "TASK" && a.type && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-lg border font-medium capitalize ${
                            a.type === "individu"
                              ? "bg-white/5 border-white/10 text-white/50"
                              : "bg-orange-500/10 border-orange-500/25 text-orange-300"
                          }`}
                        >
                          {a.type}
                        </span>
                      )}
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${st.cls}`}
                      >
                        {st.label}
                      </span>
                    </div>

                    <h3 className="text-base font-semibold text-white mt-2 truncate">
                      {a.title}
                    </h3>

                    {a.description ? (
                      <p className="text-white/50 text-sm mt-1 line-clamp-2">
                        {a.description}
                      </p>
                    ) : null}

                    <div className="flex items-center gap-x-4 gap-y-1 text-xs text-white/45 mt-2 flex-wrap">
                      {isQuiz && a.quiz ? (
                        <>
                          <span>{a.quiz.durationMinutes} menit</span>
                          <span>{a.quiz.totalQuestions} soal</span>
                          <span>Passing {a.quiz.passingScore}%</span>
                          {a.bestAttempt?.percentage !== undefined && (
                            <span className="text-green-400 font-medium">
                              Skor {a.bestAttempt.percentage}%
                            </span>
                          )}
                        </>
                      ) : (
                        <span>Pengumpulan file / link</span>
                      )}
                      <span
                        className={
                          isLate ? "text-red-400 font-medium" : undefined
                        }
                      >
                        Deadline {deadlineLabel(a.deadline)}
                      </span>
                    </div>

                    {blocked && (
                      <p className="mt-2 inline-block text-[11px] text-blue-300 bg-blue-500/10 border border-blue-500/20 rounded-lg px-2 py-1">
                        Tugas kelompok — dikumpulkan oleh Ketua Gugus.
                      </p>
                    )}

                    <button
                      onClick={() => setDetailAssignment(a)}
                      className="mt-2 inline-block text-xs text-gold-500 hover:text-gold-400 font-semibold"
                    >
                      Lihat detail &rarr;
                    </button>
                  </div>

                  <div className="shrink-0 flex sm:items-center">
                    <button
                      onClick={() => openAssignment(a)}
                      disabled={disabled}
                      className={`inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        disabled
                          ? "bg-white/5 text-white/30 cursor-not-allowed border border-white/10"
                          : `${action.cls} hover:scale-[1.02] active:scale-[0.98]`
                      }`}
                    >
                      {action.label}
                    </button>
                  </div>
                </div>

                {/* Footer status: dot + teks (tanpa icon) */}
                {a.status === "COMPLETED" && a.bestAttempt && (
                  <div className="px-5 py-2 border-t border-white/5 bg-green-500/5 flex items-center gap-2 text-xs text-green-400">
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0"
                      aria-hidden="true"
                    />
                    {isQuiz
                      ? `Selesai — ${quizScoreText(
                          a.bestAttempt.score,
                          a.bestAttempt.percentage,
                        )}`
                      : `Selesai — dinilai ${a.bestAttempt.score ?? 0}/100`}
                  </div>
                )}
                {a.status === "SUBMITTED" && (
                  <div className="px-5 py-2 border-t border-white/5 bg-blue-500/5 flex items-center gap-2 text-xs text-blue-300">
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0"
                      aria-hidden="true"
                    />
                    Sudah dikumpulkan — menunggu penilaian.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {detailAssignment && (
        <AssignmentDetailModal
          assignment={detailAssignment}
          isKetuaGugus={isKetuaGugus}
          fileUrl={submissionFileUrl(detailAssignment)}
          onClose={() => setDetailAssignment(null)}
          onSubmitted={() => {
            // Jangan tutup di sini — layar sukses TaskSubmitModal ditampilkan
            // dulu; penutupan ditangani AssignmentDetailModal setelah user
            // klik "Selesai". Daftar tetap di-refresh di baliknya.
            void fetchData();
          }}
        />
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
