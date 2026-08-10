"use client";

import { useEffect, useState, useCallback } from "react";
import { ClipboardList, Clock, Timer, Repeat, CheckCircle2, Lock, Play } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { StudentQuiz, TYPE_LABEL } from "@/lib/quiz";
import { useRouter } from "next/navigation";

const TYPE_STYLE: Record<string, string> = {
  PRETEST: "bg-purple-500/10 border-purple-500/30 text-purple-300",
  POSTTEST: "bg-blue-500/10 border-blue-500/30 text-blue-300",
  MATERIAL: "bg-orange-500/10 border-orange-500/30 text-orange-300",
};

export default function QuizListPage() {
  const [quizzes, setQuizzes] = useState<StudentQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/pkkmb/quiz");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const json = await res.json();
      if (json.success) setQuizzes(json.data || []);
      else setError(json.message || "Gagal memuat quiz.");
    } catch {
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  const getState = (q: StudentQuiz) => {
    const now = new Date().getTime();
    if (q.startTime && now < new Date(q.startTime).getTime()) {
      return { state: "not_open", label: "Belum Dibuka", disabled: true, Icon: Lock, style: "bg-white/5 border-white/10 text-white/40" };
    }
    if (q.endTime && now > new Date(q.endTime).getTime()) {
      return { state: "closed", label: "Telah Ditutup", disabled: true, Icon: Lock, style: "bg-white/5 border-white/10 text-white/40" };
    }
    if (q.isInProgress) {
      return { state: "in_progress", label: "Sedang Dikerjakan", disabled: false, Icon: Play, style: "bg-gold-500/10 border-gold-500/30 text-gold-400" };
    }
    return { state: "open", label: "Tersedia", disabled: false, Icon: Play, style: "bg-green-500/10 border-green-500/30 text-green-400" };
  };

  // Card "Lanjutkan pengerjaan": jika ada attempt IN_PROGRESS aktif
  // (activeAttemptId dari backend), langsung ke player (resume) tanpa
  // round-trip ke /start — pola sama seperti halaman detail quiz.
  const openQuiz = (q: StudentQuiz) => {
    if (q.isInProgress && q.activeAttemptId) {
      try {
        sessionStorage.removeItem(`quiz_attempt_${q.activeAttemptId}`);
        sessionStorage.removeItem(`quiz_answers_${q.activeAttemptId}`);
        sessionStorage.removeItem(`quiz_current_${q.activeAttemptId}`);
      } catch {}
      router.push(`/dashboard/quiz/${q._id}/play/${q.activeAttemptId}`);
      return;
    }
    router.push(`/dashboard/quiz/${q._id}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-4 border-gold-500/20 border-t-gold-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold mb-2">Quiz PKKMB</h1>
        <p className="text-white/60">Kerjakan Pretest, Posttest, dan Quiz Materi di sini.</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-red-300 text-sm">
          {error}
        </div>
      )}

      {!error && quizzes.length === 0 ? (
        <div className="text-center py-20 bg-white/5 border border-white/10 rounded-3xl">
          <ClipboardList className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white/50">Belum ada quiz untukmu.</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((q) => {
            const s = getState(q);
            const SIcon = s.Icon;
            const allDone = q.bestAttempt && (q.bestAttempt.status === "SUBMITTED" || q.bestAttempt.status === "GRADED") && !q.isInProgress;
            const attemptsLeft = q.maxAttempts - (q.bestAttempt?.attemptNumber ?? 0);
            return (
              <button
                key={q._id}
                onClick={() => !s.disabled && openQuiz(q)}
                className={`text-left group bg-black/40 backdrop-blur-md border rounded-3xl p-6 flex flex-col hover:border-gold-500/50 transition-colors relative overflow-hidden ${s.disabled ? "border-white/10 opacity-60 cursor-not-allowed" : "border-white/10 cursor-pointer"}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-3 py-1 text-xs font-bold rounded-lg border ${TYPE_STYLE[q.type] || TYPE_STYLE.MATERIAL}`}>
                    {TYPE_LABEL[q.type]}
                  </span>
                  <span className={`px-3 py-1 text-xs font-bold rounded-lg border flex items-center gap-1.5 ${s.style}`}>
                    <SIcon className="w-3 h-3" />
                    <span>{s.label}</span>
                  </span>
                </div>

                <h3 className="font-display font-bold text-lg leading-tight mb-2">{q.title}</h3>
                <p className="text-sm text-white/50 line-clamp-2 mb-6">{q.description}</p>

                <div className="mt-auto space-y-2 text-sm text-white/50">
                  <div className="flex items-center gap-2"><Clock className="w-4 h-4" /> Durasi: {q.durationMinutes} menit</div>
                  <div className="flex items-center gap-2"><Repeat className="w-4 h-4" /> Maks. percobaan: {q.maxAttempts}</div>
                  {allDone && q.bestAttempt?.percentage !== undefined ? (
                    <div className="flex items-center gap-2 text-gold-400"><CheckCircle2 className="w-4 h-4" /> Selesai · {q.bestAttempt.percentage}%</div>
                  ) : q.isInProgress ? (
                    <div className="flex items-center gap-2 text-gold-400"><Timer className="w-4 h-4" /> Lanjutkan pengerjaan</div>
                  ) : q.bestAttempt ? (
                    <div className="flex items-center gap-2 text-white/40"><Repeat className="w-4 h-4" /> Sisa percobaan: {Math.max(attemptsLeft, 0)}</div>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {quizzes.length > 0 && quizzes.every((q) => getState(q).disabled) && (
        <div className="text-center text-white/40 text-sm mt-8">
          Semua quiz sudah kamu kerjakan.
        </div>
      )}
    </div>
  );
}
