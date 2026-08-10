"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Globe, School, Group, User, Download, Trash2, AlertTriangle, Activity } from "lucide-react";
import { API_URL } from "@/lib/api";
import { ManagedQuiz, TYPE_LABEL, STATUS_LABEL } from "@/lib/quiz";
import { sanitizeFilename } from "@/lib/quiz-import-export";
import toast from "react-hot-toast";

const TYPE_STYLE: Record<string, string> = {
  PRETEST: "bg-purple-500/10 border-purple-500/30 text-purple-300",
  POSTTEST: "bg-blue-500/10 border-blue-500/30 text-blue-300",
  MATERIAL: "bg-orange-500/10 border-orange-500/30 text-orange-300",
};

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-white/5 border-white/10 text-white/40",
  PUBLISHED: "bg-green-500/10 border-green-500/30 text-green-400",
  CLOSED: "bg-red-500/10 border-red-500/30 text-red-400",
};

const TARGET_ICON: Record<string, React.ReactNode> = {
  ALL: <Globe className="w-3 h-3" />,
  FACULTY: <School className="w-3 h-3" />,
  STUDY_PROGRAM: <Group className="w-3 h-3" />,
  GROUP: <Group className="w-3 h-3" />,
  INDIVIDUAL: <User className="w-3 h-3" />,
};

export default function ManageQuizPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<ManagedQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ManagedQuiz | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const q = search ? `?search=${encodeURIComponent(search)}` : "";
      const res = await fetch(`${API_URL}/api/v1/pkkmb/quiz${q}`, { credentials: "include" });
      if (res.status === 401) { router.push("/login"); return; }
      if (res.status === 403) { toast.error("Kamu tidak memiliki akses ke halaman ini."); return; }
      const json = await res.json();
      if (json.success) setQuizzes(json.data || []);
      else toast.error(json.message || "Gagal memuat quiz.");
    } catch {
      toast.error("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  }, [router, search]);

  useEffect(() => {
    const t = setTimeout(() => fetchData(), search ? 300 : 0);
    return () => clearTimeout(t);
  }, [fetchData, search]);

  // Hapus quiz (SOFT DELETE backend). Histori attempt tetap aman.
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/pkkmb/quiz/${deleteTarget._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.status === 401) { router.push("/login"); return; }
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Quiz berhasil dihapus.");
        setDeleteTarget(null);
        fetchData();
      } else if (res.status === 403) {
        toast.error("Kamu tidak memiliki izin untuk menghapus quiz.");
      } else if (res.status === 404) {
        toast.error("Quiz tidak ditemukan.");
        setDeleteTarget(null);
        fetchData();
      } else {
        toast.error(json.message || "Gagal menghapus quiz.");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan.");
    } finally {
      setDeleting(false);
    }
  };

  // Export selalu dari BACKEND (bukan dari data tampilan/state frontend).
  const handleExport = async (q: ManagedQuiz) => {
    try {
      const res = await fetch(`${API_URL}/api/v1/pkkmb/quiz/${q._id}/export`, {
        credentials: "include",
      });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (res.status === 403) {
        toast.error("Kamu tidak memiliki izin untuk mengexport soal.");
        return;
      }
      if (!res.ok) {
        toast.error("Gagal mengexport soal.");
        return;
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="?([^";]+)"?/);
      const filename =
        match?.[1] ||
        `quiz-${sanitizeFilename(q.title)}-${q._id.slice(-6)}-questions.xlsx`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("File Excel berhasil diexport.");
    } catch {
      toast.error("Terjadi kesalahan jaringan.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold mb-2">Manajemen Quiz</h1>
          <p className="text-white/60">Buat, atur, dan terbitkan quiz untuk mahasiswa.</p>
        </div>
        <button
          onClick={() => router.push("/dashboard/manage/quiz/create")}
          className="flex items-center gap-2 px-5 py-3 bg-gold-500 hover:bg-gold-400 text-black rounded-xl font-bold transition-colors"
        >
          <Plus className="w-4 h-4" /> Buat Quiz
        </button>
      </div>

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Cari judul quiz..."
        className="w-full max-w-md bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors"
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-gold-500/20 border-t-gold-500 rounded-full animate-spin" />
        </div>
      ) : quizzes.length === 0 ? (
        <div className="text-center py-20 bg-white/5 border border-white/10 rounded-3xl">
          <h3 className="text-xl font-bold text-white/50">Belum ada quiz.</h3>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-white/40 border-b border-white/10">
                <th className="pb-3 pr-4">Judul</th>
                <th className="pb-3 pr-4">Type</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4">Target</th>
                <th className="pb-3 pr-4">Periode</th>
                <th className="pb-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {quizzes.map((q) => (
                <tr key={q._id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                  <td className="py-3 pr-4 font-semibold">{q.title}</td>
                  <td className="py-3 pr-4">
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-lg border ${TYPE_STYLE[q.type] || TYPE_STYLE.MATERIAL}`}>
                      {TYPE_LABEL[q.type]}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-lg border flex items-center gap-1.5 w-fit ${STATUS_STYLE[q.status] || STATUS_STYLE.DRAFT}`}>
                      {STATUS_LABEL[q.status]}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="flex items-center gap-1.5 text-white/60">
                      {TARGET_ICON[q.targetType]} {q.targetType.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-white/50">
                    {q.startTime ? new Date(q.startTime).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" }) : "—"}
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => router.push(`/dashboard/manage/quiz/${q._id}/attempts`)}
                        title="Lihat aktivitas pengerjaan (anti-cheat monitoring)"
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/70 hover:text-white transition-colors"
                      >
                        <Activity className="w-3.5 h-3.5" /> Aktivitas
                      </button>
                      <button
                        onClick={() => handleExport(q)}
                        title="Export ke Excel"
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/70 hover:text-white transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" /> Export
                      </button>
                      <button
                        onClick={() => router.push(`/dashboard/manage/quiz/${q._id}/edit`)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/70 hover:text-white transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(q)}
                        title="Hapus quiz"
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !deleting && setDeleteTarget(null)} />
          <div className="bg-[#111] border border-white/10 p-6 md:p-8 rounded-3xl w-full max-w-md relative z-10 shadow-2xl">
            <h2 className="font-display font-bold text-xl text-white mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" /> Hapus Quiz?
            </h2>
            <p className="text-sm text-white/60 mb-4">
              <span className="font-semibold">"{deleteTarget.title}"</span> akan dihapus dari daftar aktif.
            </p>
            <div className="grid grid-cols-3 gap-2 mb-4 text-sm">
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="text-xs text-white/40 mb-1">Status</div>
                <span className={`px-2 py-0.5 text-xs font-bold rounded-lg border ${STATUS_STYLE[deleteTarget.status] || STATUS_STYLE.DRAFT}`}>
                  {STATUS_LABEL[deleteTarget.status]}
                </span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="text-xs text-white/40 mb-1">Soal</div>
                <div className="font-semibold">
                  {deleteTarget.questionCount ?? deleteTarget.questions?.length ?? "—"} soal
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="text-xs text-white/40 mb-1">Attempt</div>
                <div className="font-semibold">
                  {deleteTarget.attemptCount ?? "—"} pengerjaan
                </div>
              </div>
            </div>
            <p className="text-sm text-white/40 mb-6">
              Tindakan ini tidak dapat dibatalkan. Histori pengerjaan mahasiswa tetap aman.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 py-3 bg-white/10 hover:bg-white/15 text-white rounded-xl font-bold transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-3 bg-red-500 hover:bg-red-400 text-white rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" /> Hapus
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
