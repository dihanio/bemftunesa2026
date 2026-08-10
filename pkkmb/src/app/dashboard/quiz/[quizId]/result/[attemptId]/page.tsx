"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Trophy, Check, XCircle, Home } from "lucide-react";
import { API_URL } from "@/lib/api";
import { QuizResult } from "@/lib/quiz";

export default function QuizResultPage() {
  const { quizId, attemptId } = useParams<{ quizId: string; attemptId: string }>();
  const router = useRouter();
  const [result, setResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/pkkmb/quiz/${quizId}/result/${attemptId}`, { credentials: "include" });
        if (res.status === 401) { router.push("/login"); return; }
        const json = await res.json();
        if (res.ok && json.success) setResult(json.data);
        else setError(json.message || "Gagal memuat hasil.");
      } catch {
        setError("Terjadi kesalahan jaringan.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [quizId, attemptId, router]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-4 border-gold-500/20 border-t-gold-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 bg-white/5 border border-white/10 rounded-3xl">
        <h3 className="text-xl font-bold text-white/60 mb-4">{error || "Hasil tidak ditemukan"}</h3>
        <button onClick={() => router.push("/dashboard/quiz")} className="text-gold-500 hover:text-gold-400 font-semibold">Kembali ke daftar quiz</button>
      </div>
    );
  }

  const pct = result.percentage ?? 0;
  const passingScore = result.passingScore ?? 0;
  const passed =
    result.passed !== undefined ? result.passed : pct >= passingScore;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center bg-black/40 backdrop-blur-md border border-white/10 rounded-3xl p-8 md:p-10 mb-6">
        <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-gold-500/10 border border-gold-500/30">
          <Trophy className="w-8 h-8 text-gold-400" />
        </div>
        <h1 className="font-display font-bold text-2xl mb-1">Quiz selesai!</h1>
        <p className="text-white/50 text-sm mb-8">{result.quizTitle || "Quiz"}</p>

        <div className="w-36 h-36 mx-auto mb-8 relative">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="15.9" fill="none" stroke="#ca8a04" strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${pct * 2.5} 100`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-gold-400">{pct}%</span>
          </div>
        </div>

        <div
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border font-bold text-sm mb-6 ${
            passed
              ? "bg-green-500/10 border-green-500/40 text-green-400"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}
        >
          {passed ? <Check className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {passed ? "LULUS" : "TIDAK LULUS"}
          <span className="font-medium text-white/50">(minimal {passingScore}%)</span>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="text-2xl font-black text-white">{result.score ?? 0}</div>
            <div className="text-xs text-white/40 mt-1">Score</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="text-2xl font-black text-white flex items-center justify-center gap-1">
              {result.correctCount ?? 0}<span className="text-white/40 text-base font-bold">/ {result.totalQuestions ?? 0}</span>
            </div>
            <div className="text-xs text-white/40 mt-1">Benar</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="text-2xl font-black text-white">
              {passingScore}%
            </div>
            <div className="text-xs text-white/40 mt-1">Batas Lulus</div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => router.push("/dashboard/quiz")}
            className="flex-1 py-3 bg-white/10 hover:bg-white/15 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" /> Daftar Quiz
          </button>
        </div>
      </div>

      <button onClick={() => router.push("/dashboard")} className="flex items-center gap-2 text-white/50 hover:text-white mx-auto transition-colors">
        <ArrowLeft className="w-4 h-4" /> Kembali ke dashboard
      </button>
    </div>
  );
}
