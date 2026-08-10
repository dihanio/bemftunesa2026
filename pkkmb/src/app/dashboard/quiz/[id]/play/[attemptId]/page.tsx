"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Send,
  Timer,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import { API_URL } from "@/lib/api";
import { StartQuizResponse, TYPE_LABEL } from "@/lib/quiz";
import {
  makeViolationReporter,
  warningMessageForCount,
  HEARTBEAT_INTERVAL_MS,
} from "@/lib/quiz-anticheat";
import type { QuizViolationType } from "@/lib/quiz-anticheat";
import toast from "react-hot-toast";

function readSession<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeSession(key: string, value: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage penuh / privat mode — cache UX saja, backend tetap authority */
  }
}

// Apakah cache attempt ada di sessionStorage saat halaman dimuat (refresh /
// buka ulang tab yang sama) — dasar event ATTEMPT_RESUMED.
function initialHadCachedAttempt(attemptId: string): boolean {
  try {
    return sessionStorage.getItem(`quiz_attempt_${attemptId}`) !== null;
  } catch {
    return false;
  }
}

export default function QuizPlayerPage() {
  const { id, attemptId } = useParams<{ id: string; attemptId: string }>();
  const router = useRouter();

  const [data, setData] = useState<StartQuizResponse | null>(() =>
    readSession<StartQuizResponse>(`quiz_attempt_${attemptId}`),
  );
  const [resuming, setResuming] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(`quiz_attempt_${attemptId}`) === null;
    } catch {
      return true;
    }
  });
  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    readSession<Record<string, string>>(`quiz_answers_${attemptId}`) ?? {},
  );
  const [current, setCurrent] = useState<number>(() =>
    readSession<number>(`quiz_current_${attemptId}`) ?? 0,
  );
  const [timeLeft, setTimeLeft] = useState<number | null>(() => {
    const cached = readSession<{ deadlineAt?: string }>(`quiz_attempt_${attemptId}`);
    if (!cached?.deadlineAt) return null;
    return Math.max(0, Math.floor((new Date(cached.deadlineAt).getTime() - Date.now()) / 1000));
  });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submittedRef = useRef(false);
  // Apakah halaman dimuat dengan cache attempt (refresh / buka ulang tab yang
  // sama) — dipakai untuk event ATTEMPT_RESUMED (fresh start TIDAK dicatat
  // sebagai resume agar timeline audit akurat).
  const hadCachedAttempt = useRef<boolean>(initialHadCachedAttempt(attemptId));

  // Monitoring aktif = attempt masih IN_PROGRESS & data soal sudah dimuat.
  const monitoringActive =
    !!data && data.status === "IN_PROGRESS" && !resuming;

  // ─── FULLSCREEN (optional deterrence) ─────────────────────────────────────
  // Jika user memilih fullscreen di modal aturan, minta requestFullscreen saat
  // attempt aktif. Jangan memaksa bila browser menolak — hanya deterrence.
  useEffect(() => {
    if (!monitoringActive) return;
    let enabled = false;
    try {
      enabled = sessionStorage.getItem(`quiz_fullscreen_${id}`) === "1";
    } catch {}
    if (!enabled) return;
    const el = document.documentElement;
    const request = () => {
      if (!document.fullscreenElement && el.requestFullscreen) {
        el.requestFullscreen().catch(() => {
          /* browser menolak — non-fatal */
        });
      }
    };
    const t = setTimeout(request, 800);
    return () => {
      clearTimeout(t);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [monitoringActive, id]);

  // ─── ANTI-CHEAT / ANTI-AI DETERRENCE ──────────────────────────────────────
  // BUKAN deteksi AI yang mutlak & BUKAN security boundary. Frontend hanya
  // mengirim event type + (opsional) questionId; risk/violationCount dihitung
  // backend. Tidak ada auto-punishment, tidak ada penyimpanan data sensitif.
  // Reporter dibuat SEKALI per mount via lazy useState initializer (stable) —
  // menghindari baca/tulis ref selama render (react-hooks/refs). Debounce
  // window & lastSent internal di-maintain oleh makeViolationReporter.
  const [reportViolation] = useState(() => {
    // Counter warning toast — internal reporter (plain variable, bukan ref:
    // tidak pernah dibaca saat render).
    let lastViolationCount = 0;
    return makeViolationReporter(
      async (type: QuizViolationType, questionId?: string) => {
        try {
          const res = await fetch(
            `${API_URL}/api/v1/pkkmb/quiz/${id}/attempt/${attemptId}/violation`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ type, ...(questionId ? { questionId } : {}) }),
            },
          );
          if (!res.ok) return;
          const json = await res.json();
          const count = json?.data?.violationCount as number | undefined;
          if (typeof count !== "number") return;
          const msg = warningMessageForCount(count);
          if (msg && count > lastViolationCount) {
            lastViolationCount = count;
            toast(msg, { icon: "⚠️" });
          }
        } catch {
          /* monitoring non-blocking */
        }
      },
    );
  });

  useEffect(() => {
    if (!monitoringActive) return;

    // 1) Tab visibility — TAB_HIDDEN saat pergi, TAB_VISIBLE saat kembali
    //    (informasional: dicatat backend, tidak menaikkan violationCount).
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        reportViolation("TAB_HIDDEN", String(current));
      } else {
        reportViolation("TAB_VISIBLE", String(current));
      }
    };
    // 2) Window blur/focus (debounce di reporter — blur beruntun aman).
    //    WINDOW_FOCUS informasional: tidak menaikkan violationCount.
    const onBlur = () => reportViolation("WINDOW_BLUR", String(current));
    const onFocus = () => reportViolation("WINDOW_FOCUS", String(current));
    // 3) Copy / cut / paste — preventDefault + catat (TIDAK baca clipboard)
    const onCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      reportViolation("COPY");
    };
    const onCut = (e: ClipboardEvent) => {
      e.preventDefault();
      reportViolation("CUT");
    };
    const onPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      reportViolation("PASTE");
    };
    // 4) Context menu
    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      reportViolation("CONTEXT_MENU");
    };
    // 5) Keyboard shortcut blocker (block list dari spec; jangan blokir navigasi normal)
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      const blockedShortcut =
        (mod && ["c", "x", "v", "p", "s", "u", "a"].includes(key)) ||
        (mod && e.shiftKey && ["i", "j", "c"].includes(key)) ||
        e.key === "F12" ||
        (mod && e.altKey && ["i", "j", "c"].includes(key));
      if (blockedShortcut) {
        e.preventDefault();
        // Map sesuai event nyata: c/x/v = COPY/CUT/PASTE (keydown menekan
        // event copy/cut/paste native, jadi dicatat di sini); s/u = shortcut
        // terblokir (KEYBOARD_SHORTCUT); p = percobaan cetak; sisanya
        // (i/j/F12/Ctrl+Shift+*) hanya DEVTOOLS_SUSPECTED (heuristic).
        if (key === "p") reportViolation("PRINT_ATTEMPT");
        else if (key === "c") reportViolation("COPY");
        else if (key === "x") reportViolation("CUT");
        else if (key === "v") reportViolation("PASTE");
        else if (key === "s" || key === "u" || key === "a")
          reportViolation("KEYBOARD_SHORTCUT");
        else reportViolation("DEVTOOLS_SUSPECTED");
      }
    };
    // 6) Page leave — native confirmation; PAGE_LEAVE via sendBeacon (reliable saat unload)
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
      const body = new Blob(
        [JSON.stringify({ type: "PAGE_LEAVE" })],
        { type: "application/json" },
      );
      navigator.sendBeacon(
        `${API_URL}/api/v1/pkkmb/quiz/${id}/attempt/${attemptId}/violation`,
        body,
      );
    };
    // 7) Fullscreen exit (deterrence — optional di detail page)
    const onFullscreen = () => {
      if (!document.fullscreenElement) {
        reportViolation("FULLSCREEN_EXIT", String(current));
      }
    };
    // 8) DevTools heuristic — window size anomaly, HANYA signal (tidak merusak UI)
    let devtoolsTimer: ReturnType<typeof setTimeout> | undefined;
    const checkDevtools = () => {
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;
      if (widthDiff > 160 || heightDiff > 160) {
        reportViolation("DEVTOOLS_SUSPECTED");
      }
    };
    const onResize = () => {
      if (devtoolsTimer) clearTimeout(devtoolsTimer);
      devtoolsTimer = setTimeout(checkDevtools, 500);
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    window.addEventListener("copy", onCopy);
    window.addEventListener("cut", onCut);
    window.addEventListener("paste", onPaste);
    document.addEventListener("contextmenu", onContextMenu);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("fullscreenchange", onFullscreen);
    window.addEventListener("resize", onResize);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("copy", onCopy);
      window.removeEventListener("cut", onCut);
      window.removeEventListener("paste", onPaste);
      document.removeEventListener("contextmenu", onContextMenu);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("fullscreenchange", onFullscreen);
      window.removeEventListener("resize", onResize);
      if (devtoolsTimer) clearTimeout(devtoolsTimer);
    };
  }, [monitoringActive, reportViolation, id, attemptId, current]);

  // 8b) Saat halaman dimuat / attempt di-resume (refresh, buka ulang): catat
  //     PAGE_REFRESH + ATTEMPT_RESUMED (informasional — tidak menaikkan
  //     violationCount). Murni audit signal, bukan hukuman.
  useEffect(() => {
    if (!monitoringActive) return;
    // PAGE_REFRESH selalu (halaman dimuat). ATTEMPT_RESUMED hanya jika ada
    // cache attempt (refresh/buka ulang) — fresh start tidak dicatat sebagai
    // resume agar timeline audit tidak menyesatkan panitia.
    reportViolation("PAGE_REFRESH");
    if (hadCachedAttempt.current) reportViolation("ATTEMPT_RESUMED");
  }, [monitoringActive, reportViolation]);

  // 9) Heartbeat selama attempt aktif (backend memperbarui lastHeartbeatAt).
  // Heartbeat berhenti ≠ auto-submit/auto-gagal — hanya indikator bagi panitia.
  useEffect(() => {
    if (!monitoringActive) return;
    const ping = async () => {
      try {
        await fetch(
          `${API_URL}/api/v1/pkkmb/quiz/${id}/attempt/${attemptId}/heartbeat`,
          { method: "POST", credentials: "include" },
        );
      } catch {
        /* non-blocking */
      }
    };
    ping();
    const t = setInterval(ping, HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(t);
  }, [monitoringActive, id, attemptId]);

  // Persist jawaban & posisi soal (cache UX). Backend tetap authority untuk
  // status, deadline, dan scoring.
  useEffect(() => {
    writeSession(`quiz_answers_${attemptId}`, answers);
  }, [answers, attemptId]);
  useEffect(() => {
    writeSession(`quiz_current_${attemptId}`, current);
  }, [current, attemptId]);

  // Autosave jawaban in-progress ke backend (debounce) agar bisa dipulihkan
  // setelah tab ditutup. Non-blocking: kegagalan autosave tidak mengganggu UI.
  useEffect(() => {
    if (!data || data.status === "SUBMITTED" || data.status === "GRADED" || data.status === "EXPIRED") return;
    if (Object.keys(answers).length === 0) return; // hindari PATCH kosong saat mount
    const t = setTimeout(async () => {
      const payload = (data.questions || [])
        .map((q, i) => ({
          questionId: q.questionId,
          selectedAnswer: answers[i.toString()] ?? answers[q.questionId] ?? "",
        }))
        .filter((a) => a.selectedAnswer);
      try {
        await fetch(`${API_URL}/api/v1/pkkmb/quiz/${id}/attempt/${attemptId}/answers`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ answers: payload }),
        });
      } catch {
        /* autosave non-blocking */
      }
    }, 1200);
    return () => clearTimeout(t);
  }, [answers, data, id, attemptId]);

  // Resume dari server saat state lokal hilang (tab ditutup / browser restart).
  useEffect(() => {
    if (data) return;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/pkkmb/quiz/${id}/attempt/${attemptId}`, { credentials: "include" });
        if (res.status === 401) { router.push("/login"); return; }
        const json = await res.json();
        if (!res.ok || !json.success) {
          toast.error(json.message || "Gagal memuat attempt.");
          router.push(`/dashboard/quiz/${id}`);
          return;
        }
        const d = json.data;
        if (d.status === "SUBMITTED" || d.status === "GRADED") {
          // Sudah dikumpulkan → arahkan ke result.
          router.push(`/dashboard/quiz/${id}/result/${attemptId}`);
          return;
        }
        if (d.status === "EXPIRED") {
          toast.error("Waktu pengerjaan quiz telah habis.");
          router.push(`/dashboard/quiz/${id}`);
          return;
        }
        setData({
          attemptId: d.attemptId,
          attemptNumber: d.attemptNumber,
          status: d.status,
          startedAt: d.startedAt,
          durationMinutes: d.durationMinutes ?? 0,
          deadlineAt: d.deadlineAt,
          remainingSeconds: d.remainingSeconds,
          answers: d.answers,
          questions: d.questions,
          title: d.title,
          type: d.type,
        });
        setTimeLeft(d.remainingSeconds ?? null);
        setAnswers((prev) =>
          Object.keys(prev).length > 0
            ? prev
            : Object.fromEntries((d.answers || []).map((a: { questionId: string; selectedAnswer: string }) => [a.questionId, a.selectedAnswer])),
        );
      } catch {
        toast.error("Terjadi kesalahan jaringan. Muat ulang halaman.");
        router.push(`/dashboard/quiz/${id}`);
      } finally {
        setResuming(false);
      }
    })();
  }, [data, id, attemptId, router]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const t = setTimeout(() => setTimeLeft((s) => (s === null ? s : s - 1)), 1000);
    return () => clearTimeout(t);
  }, [timeLeft]);

  const timeUp = timeLeft !== null && timeLeft <= 0;

  const questions = data?.questions || [];
  const total = questions.length;
  const fmt = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const answeredCount = Object.keys(answers).length;
  const isLast = current === total - 1;

  const handleSubmit = async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      const payload = questions.map((q, i) => ({
        questionId: q.questionId,
        selectedAnswer: answers[i.toString()] ?? answers[q.questionId] ?? "",
      })).filter((a) => a.selectedAnswer);
      const res = await fetch(`${API_URL}/api/v1/pkkmb/quiz/${id}/attempt/${attemptId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ answers: payload }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Quiz berhasil dikumpulkan!");
        try {
          sessionStorage.removeItem(`quiz_attempt_${attemptId}`);
          sessionStorage.removeItem(`quiz_answers_${attemptId}`);
          sessionStorage.removeItem(`quiz_current_${attemptId}`);
        } catch {}
        router.push(`/dashboard/quiz/${id}/result/${attemptId}`);
      } else {
        submittedRef.current = false;
        const msg = json.message || "Gagal mengumpulkan quiz.";
        if (msg.toLowerCase().includes("habis")) toast.error("Waktu pengerjaan telah habis.");
        else toast.error(msg);
        setSubmitting(false);
        setConfirmOpen(false);
      }
    } catch {
      submittedRef.current = false;
      toast.error("Terjadi kesalahan jaringan.");
      setSubmitting(false);
      setConfirmOpen(false);
    }
  };

  if (resuming) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-white/60">
        <div className="w-10 h-10 border-4 border-gold-500/20 border-t-gold-500 rounded-full animate-spin" />
        <p className="text-sm">Memulihkan pengerjaan quiz...</p>
      </div>
    );
  }

  if (!data || total === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 bg-white/5 border border-white/10 rounded-3xl">
        <h3 className="text-xl font-bold text-white/60 mb-2">Data quiz tidak ditemukan</h3>
        <p className="text-white/40 text-sm mb-6">Silakan mulai quiz kembali dari halaman detail.</p>
        <button onClick={() => router.push(`/dashboard/quiz/${id}`)} className="text-gold-500 hover:text-gold-400 font-semibold">
          Kembali ke detail quiz
        </button>
      </div>
    );
  }

  const q = questions[current];
  const key = current.toString();
  const selected = answers[key];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.push(`/dashboard/quiz/${id}`)} className="flex items-center gap-2 text-white/50 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Keluar
        </button>
        <div className="flex items-center gap-2">
          {monitoringActive && (
            <span
              title="Aktivitas selama pengerjaan quiz sedang dimonitor."
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-semibold"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              Monitoring aktif
            </span>
          )}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-bold tabular-nums ${timeUp ? "bg-red-500/20 border-red-500/40 text-red-300" : "bg-gold-500/10 border-gold-500/30 text-gold-400"}`}>
            <Timer className="w-4 h-4" />
            {fmt(timeLeft ?? 0)}
          </div>
        </div>
      </div>

      <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-3xl p-6 md:p-8 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-display font-bold text-lg">{data.title || "Quiz"}</h1>
          <span className="px-3 py-1 text-xs font-bold rounded-lg border bg-white/5 border-white/10 text-white/50">
            {TYPE_LABEL[data.type as keyof typeof TYPE_LABEL] || data.type}
          </span>
        </div>
        <div className="text-sm text-white/40 mb-4">Soal {current + 1} dari {total}</div>

        <p className="text-white text-lg leading-relaxed mb-6">{q.question}</p>

        <fieldset className="space-y-3" disabled={timeUp || submitting}>
          {q.options.map((opt) => (
            <label
              key={opt.id}
              className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                selected === opt.id
                  ? "bg-gold-500/10 border-gold-500/50 text-gold-300"
                  : "bg-white/5 border-white/10 hover:border-gold-500/40 text-white"
              }`}
            >
              <input
                type="radio"
                name={`q-${current}`}
                value={opt.id}
                checked={selected === opt.id}
                onChange={() => setAnswers((a) => ({ ...a, [key]: opt.id }))}
                className="accent-gold-500 w-4 h-4 shrink-0"
              />
              <span className="font-semibold shrink-0">{opt.id}.</span>
              <span>{opt.text}</span>
            </label>
          ))}
        </fieldset>
      </div>

      {timeUp && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-300 text-sm mb-6">
          <AlertTriangle className="w-5 h-5" />
          Waktu pengerjaan telah habis. Kumpulkan jawaban sebelum halaman ditutup, atau keluar.
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-6">
        {questions.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-9 h-9 rounded-lg text-sm font-bold border transition-colors ${
              i === current
                ? "bg-gold-500 text-black border-gold-500"
                : answers[i.toString()]
                  ? "bg-green-500/20 border-green-500/40 text-green-300"
                  : "bg-white/5 border-white/10 text-white/50 hover:border-white/30"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0}
          className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 bg-white/5 text-white font-semibold hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" /> Sebelumnya
        </button>

        <span className="text-sm text-white/50">{answeredCount}/{total} dijawab</span>

        {!isLast ? (
          <button
            onClick={() => setCurrent((c) => Math.min(total - 1, c + 1))}
            className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 bg-white/5 text-white font-semibold hover:bg-white/10 transition-colors"
          >
            Berikutnya <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => setConfirmOpen(true)}
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gold-500 hover:bg-gold-400 text-black font-bold transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" /> Kumpulkan Quiz
          </button>
        )}
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !submitting && setConfirmOpen(false)} />
          <div className="bg-[#111] border border-white/10 p-6 md:p-8 rounded-3xl w-full max-w-md relative z-10 shadow-2xl">
            <h2 className="font-display font-bold text-xl text-white mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-gold-400" /> Kumpulkan Quiz
            </h2>
            <p className="text-sm text-white/60 mb-2">Apakah kamu yakin ingin mengumpulkan quiz?</p>
            <p className="text-sm text-white/40 mb-6">Jawaban yang sudah dikumpulkan tidak dapat diubah setelah submission.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                disabled={submitting}
                className="flex-1 py-3 bg-white/10 hover:bg-white/15 text-white rounded-xl font-bold transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-3 bg-gold-500 hover:bg-gold-400 text-black rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ) : (
                  "Kumpulkan"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
