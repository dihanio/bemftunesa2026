"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Play, Repeat, CheckCircle2, Calendar, Timer, ShieldCheck } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { StudentQuizDetail, TYPE_LABEL } from "@/lib/quiz";
import toast from "react-hot-toast";

export default function QuizDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [quiz, setQuiz] = useState<StudentQuizDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  // Modal "Aturan Pengerjaan Quiz" (anti-AI deterrence) — attempt TIDAK
  // dimulai sebelum user menyetujui.
  const [rulesOpen, setRulesOpen] = useState(false);
  const [rulesAgreed, setRulesAgreed] = useState(false);
  // Mode Fullscreen (opsional, deterrence) — disimpan sbg preferensi session.
  const [fullscreenOpt, setFullscreenOpt] = useState(false);

  // Detail diambil dari endpoint tersendiri (GET /pkkmb/quiz/:id) —
  // bukan lagi dari daftar quiz lalu find(id).
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/pkkmb/quiz/${id}`);
      if (res.status === 401) { router.push("/login"); return; }
      const json = await res.json();
      if (res.ok && json.success) {
        // AUTO-REDIRECT ke player bila attempt IN_PROGRESS aktif — pola sama
        // dengan card list & tombol "Lanjutkan Quiz". Cache lama dibersihkan
        // agar player me-resume data terbaru dari server (soal + jawaban
        // tersimpan via autosave). Halaman detail tetap bisa dibuka manual
        // untuk attempt yang sudah selesai/expired (isInProgress=false).
        const d = json.data;
        if (d?.isInProgress && d?.activeAttemptId) {
          try {
            sessionStorage.removeItem(`quiz_attempt_${d.activeAttemptId}`);
            sessionStorage.removeItem(`quiz_answers_${d.activeAttemptId}`);
            sessionStorage.removeItem(`quiz_current_${d.activeAttemptId}`);
          } catch {}
          // replace() agar halaman detail tidak mengotori history (kembali
          // dari player tidak lagi menampilkan halaman yang akan redirect).
          router.replace(`/dashboard/quiz/${id}/play/${d.activeAttemptId}`);
          return;
        }
        setQuiz(d);
      } else if (res.status === 403 || res.status === 400 || res.status === 404) {
        // Tidak ditarget / belum dibuka / ditutup / tidak ditemukan.
        setQuiz(null);
        if (json.message) toast.error(json.message);
      } else {
        toast.error(json.message || "Gagal memuat quiz.");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const now = new Date().getTime();
  const notOpen = !!quiz?.startTime && now < new Date(quiz.startTime).getTime();
  const closed = !!quiz?.endTime && now > new Date(quiz.endTime).getTime();
  const attemptsLeft = quiz ? quiz.maxAttempts - (quiz.usedAttempts ?? 0) : 0;
  const noAttemptsLeft = attemptsLeft <= 0;
  const alreadyDone = quiz?.bestAttempt && !quiz.isInProgress && (quiz.bestAttempt.status === "SUBMITTED" || quiz.bestAttempt.status === "GRADED");
  // Attempt IN_PROGRESS aktif tetap bisa dilanjutkan meski slot sudah habis
  // (start → resume attempt yang sama, bukan membuat attempt baru).
  const disabled = notOpen || closed || (noAttemptsLeft && !quiz?.isInProgress);

  const beginAttempt = async () => {
    setStarting(true);
    try {
      const res = await apiFetch(`/pkkmb/quiz/${quiz!._id}/start`, { method: "POST" });
      const json = await res.json();
      if (res.ok && json.success) {
        try {
          sessionStorage.setItem(`quiz_attempt_${json.data.attemptId}`, JSON.stringify({ quizId: quiz!._id, title: quiz!.title, type: quiz!.type, ...json.data }));
          sessionStorage.removeItem(`quiz_answers_${json.data.attemptId}`);
          sessionStorage.removeItem(`quiz_current_${json.data.attemptId}`);
        } catch {}
        router.push(`/dashboard/quiz/${quiz!._id}/play/${json.data.attemptId}`);
      } else {
        const msg = json.message || "Tidak dapat memulai quiz.";
        if (msg.toLowerCase().includes("belum dibuka")) toast.error("Quiz belum dibuka.");
        else if (msg.toLowerCase().includes("ditutup")) toast.error("Quiz telah ditutup.");
        else if (msg.toLowerCase().includes("habis") || msg.toLowerCase().includes("batas")) toast.error("Kesempatan mengerjakan sudah habis.");
        else toast.error(msg);
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan.");
    } finally {
      setStarting(false);
    }
  };

  const handleStart = async () => {
    if (!quiz) return;
    // Attempt IN_PROGRESS aktif → langsung ke player (resume) tanpa round-trip
    // ke /start. Cache lama dibersihkan agar player me-resume data terbaru
    // dari server (soal + jawaban tersimpan via autosave).
    if (quiz.isInProgress && quiz.activeAttemptId) {
      try {
        sessionStorage.removeItem(`quiz_attempt_${quiz.activeAttemptId}`);
        sessionStorage.removeItem(`quiz_answers_${quiz.activeAttemptId}`);
        sessionStorage.removeItem(`quiz_current_${quiz.activeAttemptId}`);
      } catch {}
      router.push(`/dashboard/quiz/${quiz._id}/play/${quiz.activeAttemptId}`);
      return;
    }
    // Mulai baru → wajib menyetujui aturan pengerjaan dulu (deterrence).
    setRulesAgreed(false);
    setRulesOpen(true);
  };

  const confirmRules = () => {
    if (!rulesAgreed) return;
    setRulesOpen(false);
    try {
      sessionStorage.setItem(`quiz_fullscreen_${quiz!._id}`, fullscreenOpt ? "1" : "0");
    } catch {}
    void beginAttempt();
  };


  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-4 border-gold-500/20 border-t-gold-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 bg-white/5 border border-white/10 rounded-3xl">
        <h3 className="text-xl font-bold text-white/60 mb-2">Quiz tidak ditemukan</h3>
        <p className="text-white/40 text-sm mb-6">Quiz mungkin tidak menarget kamu atau sudah tidak tersedia.</p>
        <button onClick={() => router.push("/dashboard/quiz")} className="text-gold-500 hover:text-gold-400 font-semibold">Kembali ke daftar quiz</button>
      </div>
    );
  }

  const infoRows = [
    { label: "Jenis Quiz", value: TYPE_LABEL[quiz.type], Icon: null },
    { label: "Jumlah Soal", value: `${quiz.totalQuestions} soal`, Icon: null },
    { label: "Waktu Buka", value: quiz.startTime ? new Date(quiz.startTime).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "—", Icon: Calendar },
    { label: "Waktu Tutup", value: quiz.endTime ? new Date(quiz.endTime).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "—", Icon: Calendar },
    { label: "Durasi", value: `${quiz.durationMinutes} menit`, Icon: Timer },
    { label: "Maksimal Percobaan", value: `${quiz.maxAttempts}`, Icon: Repeat },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => router.push("/dashboard/quiz")} className="flex items-center gap-2 text-white/50 hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Kembali
      </button>

      <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-3xl p-6 md:p-8">
        <h1 className="font-display font-bold text-2xl mb-1">{quiz.title}</h1>
        <p className="text-white/60 mb-6">{quiz.description || "Tidak ada deskripsi."}</p>

        <div className="space-y-3 border-t border-white/10 pt-6 mb-6">
          {infoRows.map((r) => (
            <div key={r.label} className="flex items-center justify-between text-sm">
              <span className="text-white/40 flex items-center gap-2">
                {r.Icon && <r.Icon className="w-4 h-4" />}
                {r.label}
              </span>
              <span className="text-white font-semibold">{r.value}</span>
            </div>
          ))}
        </div>

        {quiz.bestAttempt && (
          <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-sm mb-6">
            <span className="text-white/40">Attempt terakhir: </span>
            <span className="text-white font-semibold">#{quiz.bestAttempt.attemptNumber ?? "-"}</span>
            <span className="text-white/40"> — </span>
            <span className={quiz.bestAttempt.percentage !== undefined ? "text-gold-400 font-semibold" : "text-white/70"}>
              {quiz.isInProgress
                ? "Sedang dikerjakan"
                : quiz.bestAttempt.percentage !== undefined
                  ? `${quiz.bestAttempt.percentage}%${quiz.bestAttempt.passed ? " · LULUS" : " · TIDAK LULUS"}`
                  : quiz.bestAttempt.status}
            </span>
          </div>
        )}

        {noAttemptsLeft && !quiz.isInProgress && !alreadyDone && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-300 text-sm mb-4">
            Kesempatan mengerjakan sudah habis.
          </div>
        )}
        {alreadyDone && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-green-300 text-sm mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Quiz sudah kamu selesaikan.
          </div>
        )}

        <button
          onClick={handleStart}
          disabled={disabled || starting}
          className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
            disabled || starting
              ? "bg-white/10 text-white/30 cursor-not-allowed"
              : "bg-gold-500 hover:bg-gold-400 text-black"
          }`}
        >
          {starting ? (
            <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
          ) : (
            <>
              <Play className="w-4 h-4" />
              {quiz.isInProgress ? "Lanjutkan Quiz" : "Mulai Quiz"}
            </>
          )}
        </button>

        {disabled && !noAttemptsLeft && !alreadyDone && (
          <p className="text-center text-xs text-white/40 mt-3">
            {notOpen ? "Quiz belum dibuka." : closed ? "Quiz telah ditutup." : ""}
          </p>
        )}
      </div>

      {/* Modal Aturan Pengerjaan (anti-AI deterrence) — wajib setuju sebelum mulai */}
      {rulesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setRulesOpen(false)} />
          <div className="bg-[#111] border border-white/10 p-6 md:p-8 rounded-3xl w-full max-w-lg relative z-10 shadow-2xl max-h-[85vh] overflow-y-auto">
            <h2 className="font-display font-bold text-xl text-white mb-2 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-gold-400" /> Aturan Pengerjaan Quiz
            </h2>
            <p className="text-sm text-white/50 mb-4">
              Quiz ini menggunakan pemantauan aktivitas untuk menjaga integritas pengerjaan.
            </p>
            <ul className="space-y-2 text-sm text-white/70 mb-4 list-disc list-inside">
              <li>Kerjakan quiz secara mandiri.</li>
              <li>Jangan membuka AI assistant selama pengerjaan.</li>
              <li>Jangan menggunakan search engine untuk mencari jawaban.</li>
              <li>Jangan melakukan copy/paste.</li>
              <li>Jangan berpindah tab/aplikasi.</li>
              <li>Aktivitas selama pengerjaan dapat dicatat sebagai bagian dari monitoring.</li>
              <li>Sistem tidak menjamin dapat mendeteksi seluruh bentuk kecurangan.</li>
            </ul>
            <label className="flex items-start gap-3 p-3 rounded-xl border border-white/10 bg-white/5 cursor-pointer mb-3">
              <input
                type="checkbox"
                checked={rulesAgreed}
                onChange={(e) => setRulesAgreed(e.target.checked)}
                className="accent-gold-500 w-4 h-4 mt-0.5 shrink-0"
              />
              <span className="text-sm text-white/80">
                Saya memahami dan menyetujui aturan pengerjaan.
              </span>
            </label>
            <label className="flex items-start gap-3 p-3 rounded-xl border border-white/10 bg-white/5 cursor-pointer mb-6">
              <input
                type="checkbox"
                checked={fullscreenOpt}
                onChange={(e) => setFullscreenOpt(e.target.checked)}
                className="accent-gold-500 w-4 h-4 mt-0.5 shrink-0"
              />
              <span className="text-sm text-white/70">
                Aktifkan mode fullscreen saat mengerjakan (opsional, mengurangi
                godaan berpindah aplikasi). Keluar dari fullscreen akan dicatat.
              </span>
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setRulesOpen(false)}
                className="flex-1 py-3 bg-white/10 hover:bg-white/15 text-white rounded-xl font-bold transition-colors"
              >
                Batal
              </button>
              <button
                onClick={confirmRules}
                disabled={!rulesAgreed || starting}
                className="flex-1 py-3 bg-gold-500 hover:bg-gold-400 text-black rounded-xl font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {starting ? (
                  <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ) : (
                  "Mulai Quiz"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
