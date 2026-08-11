"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ClipboardList,
  FileText,
  Play,
  ArrowRight,
  AlertTriangle,
  Users,
  PartyPopper,
} from "lucide-react";
import {
  nextActions,
  statusMeta,
  deadlineLabel,
  type MabaAssignment,
} from "@/lib/maba";
import TaskSubmitModal from "@/components/assignments/TaskSubmitModal";

interface NextActionsProps {
  assignments: MabaAssignment[];
  isKetuaGugus: boolean;
  /** Dipanggil setelah submit tugas agar parent me-refresh daftar. */
  onSubmitted: () => void;
}

export default function NextActions({
  assignments,
  isKetuaGugus,
  onSubmitted,
}: NextActionsProps) {
  const [selectedTask, setSelectedTask] = useState<MabaAssignment | null>(null);

  const items = nextActions(assignments, 3);
  const hasSubmittedTask = (a: MabaAssignment) =>
    a.status === "SUBMITTED" || a.status === "COMPLETED";
  const isMemberBlocked = (a: MabaAssignment) =>
    (a.type === "kelompok" || a.type === "angkatan") &&
    !isKetuaGugus &&
    !hasSubmittedTask(a);

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg text-white">
          Yang Perlu Kamu Selesaikan
        </h3>
        <Link
          href="/dashboard/assignments"
          className="text-xs text-gold-500 hover:text-gold-400 font-semibold"
        >
          Lihat semua &rarr;
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 text-center">
          <PartyPopper className="w-10 h-10 text-gold-500/60 mx-auto mb-3" />
          <p className="text-white/80 font-semibold">Semua beres! 🎉</p>
          <p className="text-sm text-white/40 mt-1">
            Tidak ada tugas atau quiz yang perlu dikerjakan hari ini.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((a) => {
            const st = statusMeta(a.status);
            const isQuiz = a.assignmentType === "QUIZ";
            const submitted = hasSubmittedTask(a);
            const blocked = isMemberBlocked(a);
            const overdue = a.status === "OVERDUE";

            // CTA quiz: deep-link langsung ke player/result.
            let ctaHref: string | null = null;
            let ctaLabel = "";
            if (isQuiz) {
              if (a.status === "IN_PROGRESS" && a.activeAttemptId) {
                ctaHref = `/dashboard/quiz/${a.quizId}/play/${a.activeAttemptId}`;
                ctaLabel = "Lanjutkan";
              } else if (a.status === "COMPLETED" && a.bestAttempt?.attemptId) {
                ctaHref = `/dashboard/quiz/${a.quizId}/result/${a.bestAttempt.attemptId}`;
                ctaLabel = "Lihat Hasil";
              } else if (overdue) {
                ctaLabel = "Ditutup";
              } else {
                ctaHref = `/dashboard/quiz/${a.quizId}`;
                ctaLabel = "Kerjakan";
              }
            } else {
              if (a.status === "COMPLETED") {
                ctaHref = `/dashboard/assignments/${a._id}`;
                ctaLabel = "Lihat Nilai";
              } else if (overdue && !submitted) {
                ctaLabel = "Terlambat";
              } else if (blocked) {
                ctaLabel = "Menunggu Ketua";
              } else {
                ctaLabel = submitted ? "Perbarui" : "Kumpulkan";
              }
            }

            const disabled = !ctaHref;

            return (
              <div
                key={a._id}
                className={`rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-4 flex items-start gap-3 ${
                  overdue ? "border-red-500/25" : ""
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/30 text-gold-400 flex items-center justify-center shrink-0">
                  {isQuiz ? (
                    <ClipboardList className="w-5 h-5" />
                  ) : (
                    <FileText className="w-5 h-5" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-white truncate">
                      {a.title}
                    </p>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${st.cls}`}
                    >
                      {st.label}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-white/45 flex-wrap">
                    {a.type && (
                      <span className="capitalize">
                        {a.type === "angkatan" ? "angkatan" : a.type}
                      </span>
                    )}
                    <span>Deadline {deadlineLabel(a.deadline)}</span>
                    {a.bestAttempt?.percentage !== undefined && (
                      <span className="text-green-400">
                        Nilai {a.bestAttempt.percentage}%
                      </span>
                    )}
                  </div>
                  {blocked && (
                    <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-blue-300 bg-blue-500/10 border border-blue-500/20 rounded-lg px-2 py-1">
                      <Users className="w-3 h-3" /> Pengumpulan oleh Ketua Gugus
                    </p>
                  )}
                </div>

                <div className="shrink-0">
                  {disabled ? (
                    <span
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border border-white/10 bg-white/5 text-white/30`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {ctaLabel}
                    </span>
                  ) : ctaHref ? (
                    <Link
                      href={ctaHref}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-gold-500 hover:bg-gold-400 text-black transition-colors"
                    >
                      {a.status === "IN_PROGRESS" ? (
                        <Play className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowRight className="w-3.5 h-3.5" />
                      )}
                      {ctaLabel}
                    </Link>
                  ) : (
                    <button
                      onClick={() => setSelectedTask(a)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-gold-500 hover:bg-gold-400 text-black transition-colors"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      {ctaLabel}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedTask && (
        <TaskSubmitModal
          task={selectedTask}
          isKetuaGugus={isKetuaGugus}
          hasSubmitted={hasSubmittedTask(selectedTask)}
          deadline={selectedTask.deadline}
          onClose={() => setSelectedTask(null)}
          onSubmitted={onSubmitted}
        />
      )}
    </section>
  );
}
