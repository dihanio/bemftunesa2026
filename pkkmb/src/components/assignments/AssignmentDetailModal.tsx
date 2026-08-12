"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { statusMeta, quizScoreText, type MabaAssignment } from "@/lib/maba";
import TaskSubmitModal from "./TaskSubmitModal";

interface AssignmentDetail {
  _id: string;
  title: string;
  description?: string;
  assignmentType: "TASK" | "QUIZ";
  quizId?: string;
  startTime?: string;
  deadline: string;
  status: string;
  activeAttemptId: string | null;
  bestAttempt: MabaAssignment["bestAttempt"];
  attachment?: string;
  link?: string;
  type?: string;
  quiz?: MabaAssignment["quiz"];
}

interface AssignmentDetailModalProps {
  /** Data dari daftar Aktivitas — dirender seketika (tanpa menunggu fetch). */
  assignment: MabaAssignment;
  isKetuaGugus: boolean;
  fileUrl?: string;
  onClose: () => void;
  onSubmitted?: () => void;
}

export default function AssignmentDetailModal({
  assignment,
  isKetuaGugus,
  fileUrl,
  onClose,
  onSubmitted,
}: AssignmentDetailModalProps) {
  const router = useRouter();
  const [detail, setDetail] = useState<AssignmentDetail | null>(null);
  const [selectedTask, setSelectedTask] = useState<AssignmentDetail | null>(
    null,
  );
  // True setelah submit sukses — dipakai agar layar sukses TaskSubmitModal
  // tetap terlihat sampai user menutupnya (baru tutup seluruh stack).
  const [submitCompleted, setSubmitCompleted] = useState(false);

  // Ambil detail (attachment/link) — konten utama sudah tampil dari `assignment`.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await apiFetch(`/pkkmb/assignments/${assignment._id}`);
        if (!alive) return;
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        const json = await res.json();
        if (json.success) setDetail(json.data);
      } catch {
        /* non-fatal — tampilkan data dari daftar */
      }
    })();
    return () => {
      alive = false;
    };
  }, [assignment._id, router]);

  const a: AssignmentDetail = detail || {
    _id: assignment._id,
    title: assignment.title,
    description: assignment.description,
    assignmentType: assignment.assignmentType,
    quizId: assignment.quizId,
    startTime: assignment.startTime,
    deadline: assignment.deadline,
    status: assignment.status,
    activeAttemptId: assignment.activeAttemptId,
    bestAttempt: assignment.bestAttempt,
    type: assignment.type,
    quiz: assignment.quiz,
  };

  const st = statusMeta(a.status);
  const isQuiz = a.assignmentType === "QUIZ";
  const isLate = a.status === "OVERDUE";
  const memberBlocked =
    !isQuiz &&
    (a.type === "kelompok" || a.type === "angkatan") &&
    !isKetuaGugus &&
    a.status !== "SUBMITTED" &&
    a.status !== "COMPLETED";

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

  // CTA utama — logika sama dengan halaman detail.
  const primaryAction = () => {
    if (isQuiz) {
      if (a.status === "IN_PROGRESS" && a.activeAttemptId) {
        router.push(`/dashboard/quiz/${a.quizId}/play/${a.activeAttemptId}`);
      } else if (a.status === "COMPLETED" && a.bestAttempt?.attemptId) {
        router.push(
          `/dashboard/quiz/${a.quizId}/result/${a.bestAttempt.attemptId}`,
        );
      } else if (a.status === "OVERDUE") {
        return;
      } else if (a.quizId) {
        router.push(`/dashboard/quiz/${a.quizId}`);
      }
    } else {
      if (a.status === "COMPLETED") return;
      // Buka modal submit di atas modal detail.
      setSelectedTask(a);
    }
  };

  const actionDisabled =
    isQuiz
      ? a.status === "OVERDUE"
      : a.status === "OVERDUE" ||
        a.status === "COMPLETED" ||
        memberBlocked;

  const actionLabel = isQuiz
    ? a.status === "IN_PROGRESS"
      ? "Lanjutkan Quiz"
      : a.status === "COMPLETED"
        ? "Lihat Hasil"
        : a.status === "OVERDUE"
          ? "Quiz Ditutup"
          : "Kerjakan Quiz"
    : a.status === "COMPLETED"
      ? "Sudah Dinilai"
      : a.status === "SUBMITTED"
        ? "Perbarui Pengumpulan"
        : a.status === "OVERDUE"
          ? "Terlambat"
          : memberBlocked
            ? "Menunggu Ketua"
            : "Kumpulkan Tugas";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={() => !selectedTask && onClose()}
      />
      <div className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-lg relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          disabled={!!selectedTask}
          className="absolute top-5 right-5 text-white/50 hover:text-white transition-colors z-20"
          aria-label="Tutup detail"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="p-6 pb-0">
          <div className="flex items-center gap-2 flex-wrap pr-10">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg border ${
                isQuiz
                  ? "bg-purple-500/10 border-purple-500/25 text-purple-300"
                  : "bg-blue-500/10 border-blue-500/25 text-blue-300"
              }`}
            >
              {isQuiz ? "Quiz" : "Tugas"}
            </span>
            {!isQuiz && a.type && (
              <span className="text-[10px] px-2 py-0.5 rounded-lg border font-medium capitalize bg-white/5 border-white/10 text-white/50">
                {a.type}
              </span>
            )}
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${st.cls}`}
            >
              {st.label}
            </span>
          </div>
          <h2 className="font-display font-bold text-xl md:text-2xl mt-3 pr-8">
            {a.title}
          </h2>
        </div>

        {/* Body */}
        <div className="p-6">
          {a.description && (
            <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">
              {a.description}
            </p>
          )}

          {/* Info deadline & mulai */}
          <div className="mt-5 space-y-2.5 text-sm">
            <div className="flex items-center gap-2.5">
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  isLate ? "bg-red-400" : "bg-gold-500"
                }`}
                aria-hidden="true"
              />
              <span className="text-white/50">Deadline:</span>
              <span className={`text-white/85 ${isLate ? "text-red-300" : ""}`}>
                {fmtDate(a.deadline)}
              </span>
            </div>
            {a.startTime && (
              <div className="flex items-center gap-2.5">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-white/30 shrink-0"
                  aria-hidden="true"
                />
                <span className="text-white/50">Mulai:</span>
                <span className="text-white/85">{fmtDate(a.startTime)}</span>
              </div>
            )}
          </div>

          {/* Lampiran / link materi */}
          {!isQuiz && (a.attachment || a.link) && (
            <div className="mt-5 flex flex-wrap gap-2">
              {a.attachment && (
                <a
                  href={a.attachment}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-white/80 text-sm hover:bg-white/10 transition-colors"
                >
                  Buka Lampiran
                </a>
              )}
              {a.link && (
                <a
                  href={a.link}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-white/80 text-sm hover:bg-white/10 transition-colors"
                >
                  Buka Link Materi
                </a>
              )}
            </div>
          )}

          {/* Info quiz */}
          {isQuiz && a.quiz && (
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Soal", value: `${a.quiz.totalQuestions} soal` },
                { label: "Durasi", value: `${a.quiz.durationMinutes} menit` },
                { label: "Percobaan", value: `${a.quiz.maxAttempts}x` },
                { label: "Passing", value: `${a.quiz.passingScore}%` },
              ].map((it) => (
                <div
                  key={it.label}
                  className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5"
                >
                  <p className="text-[10px] uppercase tracking-wide text-white/40">
                    {it.label}
                  </p>
                  <p className="text-white text-sm font-semibold mt-0.5">
                    {it.value}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Hasil */}
          {a.status === "COMPLETED" && a.bestAttempt && (
            <div className="mt-5 flex items-center gap-2.5 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
              <span
                className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0"
                aria-hidden="true"
              />
              {isQuiz
                ? `Skor ${quizScoreText(
                    a.bestAttempt.score,
                    a.bestAttempt.percentage,
                  )}`
                : "Tugas telah dikumpulkan & dinilai"}
            </div>
          )}
          {a.status === "SUBMITTED" && (
            <div className="mt-5 flex items-center gap-2.5 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-300">
              <span
                className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0"
                aria-hidden="true"
              />
              Sudah dikumpulkan — menunggu penilaian.
            </div>
          )}
          {memberBlocked && (
            <div className="mt-5 flex items-center gap-2.5 rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-200">
              <span
                className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0"
                aria-hidden="true"
              />
              Tugas kelompok — dikumpulkan oleh Ketua Gugus.
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="px-6 pb-6 pt-2">
          <button
            onClick={primaryAction}
            disabled={actionDisabled}
            className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${
              actionDisabled
                ? "bg-white/5 text-white/30 cursor-not-allowed border border-white/10"
                : "bg-gold-500 hover:bg-gold-400 text-black"
            }`}
          >
            {actionLabel}
          </button>
          <button
            onClick={onClose}
            className="w-full mt-2 py-3 rounded-xl text-sm font-semibold text-white/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Modal submit tugas — ditumpuk di atas modal detail */}
      {selectedTask && (
        <TaskSubmitModal
          task={selectedTask}
          isKetuaGugus={isKetuaGugus}
          hasSubmitted={
            selectedTask.status === "SUBMITTED" ||
            selectedTask.status === "COMPLETED"
          }
          fileUrl={fileUrl}
          deadline={selectedTask.deadline}
          onClose={() => {
            if (submitCompleted) {
              // Layar sukses sudah dilihat → tutup seluruh stack.
              onClose();
            } else {
              // Batal / kembali → kembali ke modal detail.
              setSelectedTask(null);
            }
          }}
          onSubmitted={() => {
            setSubmitCompleted(true);
            onSubmitted?.();
          }}
        />
      )}
    </div>
  );
}
