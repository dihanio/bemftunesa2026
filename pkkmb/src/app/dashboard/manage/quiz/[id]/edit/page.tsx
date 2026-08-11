"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { ManagedQuiz } from "@/lib/quiz";
import QuizForm from "@/components/quiz/QuizForm";

export default function EditQuizPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [quiz, setQuiz] = useState<ManagedQuiz | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        // Detail management dari endpoint tersendiri (bukan list lalu find).
        const res = await apiFetch(`/pkkmb/quiz/${id}`);
        if (res.status === 401) { router.push("/login"); return; }
        if (res.status === 403) { setQuiz(undefined); return; }
        const json = await res.json();
        if (json.success) setQuiz(json.data as ManagedQuiz);
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, [id, router]);

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
        <h3 className="text-xl font-bold text-white/60 mb-4">Quiz tidak ditemukan</h3>
        <button onClick={() => router.push("/dashboard/manage/quiz")} className="text-gold-500 hover:text-gold-400 font-semibold">Kembali</button>
      </div>
    );
  }

  return <QuizForm quiz={quiz} />;
}
