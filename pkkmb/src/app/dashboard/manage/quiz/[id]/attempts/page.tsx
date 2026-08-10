"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ShieldCheck, ShieldAlert, Eye, X } from "lucide-react";
import { API_URL } from "@/lib/api";
import { ManagedAttempt } from "@/lib/quiz";
import { VIOLATION_LABEL, RISK_LABEL } from "@/lib/quiz-anticheat";
import type { QuizViolationType } from "@/lib/quiz-anticheat";
import toast from "react-hot-toast";

const STATUS_STYLE: Record<string, string> = {
  IN_PROGRESS: "bg-blue-500/10 border-blue-500/30 text-blue-300",
  SUBMITTED: "bg-white/5 border-white/10 text-white/50",
  GRADED: "bg-green-500/10 border-green-500/30 text-green-400",
  EXPIRED: "bg-orange-500/10 border-orange-500/30 text-orange-300",
};

const RISK_STYLE: Record<string, string> = {
  LOW: "bg-green-500/10 border-green-500/30 text-green-400",
  MEDIUM: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
  HIGH: "bg-red-500/10 border-red-500/30 text-red-400",
};

const fmtTime = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })
    : "—";

export default function ManageQuizAttemptsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [attempts, setAttempts] = useState<ManagedAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<ManagedAttempt | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/pkkmb/quiz/${id}/attempts`, {
        credentials: "include",
      });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (res.status === 403) {
        toast.error("Kamu tidak memiliki akses ke halaman ini.");
        return;
      }
      const json = await res.json();
      if (res.ok && json.success) setAttempts(json.data || []);
      else toast.error(json.message || "Gagal memuat aktivitas pengerjaan.");
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

  const highCount = attempts.filter((a) => a.antiCheat.riskLevel === "HIGH").length;
  const mediumCount = attempts.filter((a) => a.antiCheat.riskLevel === "MEDIUM").length;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <button
          onClick={() => router.push("/dashboard/manage/quiz")}
          className="flex items-center gap-2 text-white/50 hover:text-white mb-4 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Manajemen Quiz
        </button>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold mb-2 flex items-center gap-2">
              <ShieldCheck className="w-7 h-7 text-gold-400" /> Aktivitas Pengerjaan
            </h1>
            <p className="text-white/60 max-w-2xl">
              Monitoring anti-cheat / anti-AI (deterrence). Pelanggaran adalah{" "}
              <span className="text-white/80">indikator</span>, bukan bukti mutlak —
              keputusan tindakan tetap di tangan panitia.
            </p>
          </div>
          <div className="flex gap-2 text-xs font-semibold">
            <span className="px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300">
              {highCount} HIGH
            </span>
            <span className="px-3 py-1.5 rounded-lg border border-yellow-500/30 bg-yellow-500/10 text-yellow-300">
              {mediumCount} MEDIUM
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-gold-500/20 border-t-gold-500 rounded-full animate-spin" />
        </div>
      ) : attempts.length === 0 ? (
        <div className="text-center py-20 bg-white/5 border border-white/10 rounded-3xl">
          <h3 className="text-xl font-bold text-white/50">Belum ada pengerjaan.</h3>
          <p className="text-white/40 text-sm mt-2">
            Attempt akan muncul setelah mahasiswa mulai mengerjakan quiz ini.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-white/40 border-b border-white/10">
                <th className="pb-3 pr-4">User</th>
                <th className="pb-3 pr-4">Nilai</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4">Violations</th>
                <th className="pb-3 pr-4">Risk</th>
                <th className="pb-3 pr-4">Mulai</th>
                <th className="pb-3 pr-4">Selesai</th>
                <th className="pb-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((a) => (
                <tr
                  key={a.attemptId}
                  className="border-b border-white/5 hover:bg-white/[0.03] transition-colors"
                >
                  <td className="py-3 pr-4">
                    <div className="font-semibold">{a.user?.name || "—"}</div>
                    <div className="text-xs text-white/40">{a.user?.nim || ""}</div>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="font-bold text-gold-400">
                      {a.status === "GRADED" || a.status === "SUBMITTED"
                        ? `${a.percentage}%`
                        : "—"}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`px-2 py-0.5 text-xs font-bold rounded-lg border ${STATUS_STYLE[a.status] || STATUS_STYLE.SUBMITTED}`}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4 font-bold">
                    {a.antiCheat.violationCount > 0 ? (
                      <span className="text-red-300">{a.antiCheat.violationCount}</span>
                    ) : (
                      <span className="text-white/40">0</span>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`px-2 py-0.5 text-xs font-bold rounded-lg border ${RISK_STYLE[a.antiCheat.riskLevel] || RISK_STYLE.LOW}`}
                    >
                      {RISK_LABEL[a.antiCheat.riskLevel] || a.antiCheat.riskLevel}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-white/50">{fmtTime(a.startedAt)}</td>
                  <td className="py-3 pr-4 text-white/50">{fmtTime(a.submittedAt)}</td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => setActive(a)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/70 hover:text-white transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Activity
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Timeline aktivitas (metadata saja — tidak ada isi clipboard/layar) */}
      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setActive(null)} />
          <div className="bg-[#111] border border-white/10 p-6 md:p-8 rounded-3xl w-full max-w-lg relative z-10 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-gold-400" /> Timeline Aktivitas
              </h2>
              <button onClick={() => setActive(null)} className="text-white/50 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-sm text-white/60 mb-4">
              <span className="font-semibold text-white">{active.user?.name || "—"}</span>
              {active.user?.nim ? ` (${active.user.nim})` : ""} · Attempt #
              {active.attemptNumber}
            </div>
            <div className="flex items-center gap-2 mb-5 text-xs">
              <span className={`px-2 py-1 rounded-lg border font-bold ${RISK_STYLE[active.antiCheat.riskLevel] || RISK_STYLE.LOW}`}>
                Risk: {RISK_LABEL[active.antiCheat.riskLevel] || active.antiCheat.riskLevel}
              </span>
              <span className="text-white/40">
                {active.antiCheat.violationCount} pelanggaran tercatat
              </span>
            </div>
            {active.antiCheat.violations.length === 0 ? (
              <p className="text-sm text-white/40 text-center py-8">
                Tidak ada pelanggaran yang tercatat.
              </p>
            ) : (
              <ol className="relative border-l border-white/10 ml-2 space-y-4">
                {[...active.antiCheat.violations].reverse().map((v, i) => (
                  <li key={i} className="ml-6">
                    <span className="absolute -left-1.5 mt-1.5 w-3 h-3 rounded-full bg-gold-500" />
                    <div className="text-xs text-white/40 tabular-nums">
                      {new Date(v.occurredAt).toLocaleString("id-ID", {
                        dateStyle: "medium",
                        timeStyle: "medium",
                      })}
                    </div>
                    <div className="text-sm font-semibold text-white">
                      {VIOLATION_LABEL[v.type as QuizViolationType] || v.type}
                    </div>
                    {v.questionId !== null && Number.isFinite(Number(v.questionId)) && (
                      <div className="text-xs text-white/40">
                        Saat mengerjakan soal #{Number(v.questionId) + 1}
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            )}
            <p className="text-xs text-white/30 mt-6">
              Monitoring tidak menyimpan isi clipboard, layar, atau ketikan. Semua event
              hanyalah metadata untuk pertimbangan panitia.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
