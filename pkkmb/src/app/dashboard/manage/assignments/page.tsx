"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Loader2, Globe, School, Group, User, FileText, ClipboardList } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface ManagedAssignment {
  _id: string;
  title: string;
  assignmentType: "TASK" | "QUIZ";
  quizId?: string;
  deadline: string;
  status: string;
  targetType: string;
  targetIds: (string | { toString(): string })[];
  quiz?: {
    title: string;
    type: string;
    totalQuestions: number;
  };
}

const TARGET_LABEL: Record<string, string> = {
  ALL: "Semua Maba",
  FACULTY: "Fakultas",
  STUDY_PROGRAM: "Prodi",
  GROUP: "Gugus",
  INDIVIDUAL: "Individu",
};

const TARGET_ICON: Record<string, React.ReactNode> = {
  ALL: <Globe className="w-3.5 h-3.5" />,
  FACULTY: <School className="w-3.5 h-3.5" />,
  STUDY_PROGRAM: <Group className="w-3.5 h-3.5" />,
  GROUP: <Group className="w-3.5 h-3.5" />,
  INDIVIDUAL: <User className="w-3.5 h-3.5" />,
};

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-white/5 border-white/10 text-white/40",
  PUBLISHED: "bg-green-500/10 border-green-500/30 text-green-400",
  CLOSED: "bg-red-500/10 border-red-500/30 text-red-400",
};

export default function ManageAssignmentsPage() {
  const router = useRouter();
  const [items, setItems] = useState<ManagedAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/pkkmb/assignments");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const json = await res.json();
      if (json.success) setItems(json.data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    setTimeout(fetchData, 0);
  }, [fetchData]);

  const fmtDate = (iso?: string) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDelete = async (a: ManagedAssignment) => {
    if (
      !window.confirm(
        `Hapus penugasan "${a.title}"? Tindakan ini tidak bisa dibatalkan.`,
      )
    ) {
      return;
    }
    const res = await apiFetch(`/pkkmb/assignments/${a._id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setItems((prev) => prev.filter((x) => x._id !== a._id));
    } else {
      const json = await res.json().catch(() => ({}));
      alert(json.message || "Gagal menghapus penugasan.");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Manajemen Penugasan</h1>
          <p className="text-white/50 mt-1 text-sm">
            Tugas & Quiz dalam satu tempat. Untuk Quiz, pilih quiz existing — soal/durasi/passing score diatur di Manajemen Quiz.
          </p>
        </div>
        <button
          onClick={() => router.push("/dashboard/manage/assignments/create")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gold-500 text-black text-sm font-medium hover:bg-gold-400 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Buat Penugasan
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-white/40 border border-dashed border-white/10 rounded-xl">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>Belum ada penugasan.</p>
          <button
            onClick={() => router.push("/dashboard/manage/assignments/create")}
            className="mt-3 text-gold-400 hover:underline text-sm"
          >
            Buat penugasan pertama
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto border border-white/10 rounded-xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-white/40 uppercase text-xs">
                <th className="px-4 py-3 font-medium">Judul</th>
                <th className="px-4 py-3 font-medium">Tipe</th>
                <th className="px-4 py-3 font-medium">Target</th>
                <th className="px-4 py-3 font-medium">Deadline</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => {
                const st = STATUS_STYLE[a.status] || STATUS_STYLE.DRAFT;
                return (
                  <tr key={a._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-white font-medium">{a.title}</p>
                      {a.quiz && (
                        <p className="text-white/40 text-xs mt-0.5">
                          {a.quiz.title} · {a.quiz.totalQuestions} soal
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full border font-medium ${
                          a.assignmentType === "QUIZ"
                            ? "bg-purple-500/10 border-purple-500/30 text-purple-300"
                            : "bg-blue-500/10 border-blue-500/30 text-blue-300"
                        }`}
                      >
                        {a.assignmentType === "QUIZ" ? <ClipboardList className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                        {a.assignmentType === "QUIZ" ? "Quiz" : "Tugas"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/60">
                      <span className="inline-flex items-center gap-1">
                        {TARGET_ICON[a.targetType]}
                        {TARGET_LABEL[a.targetType] || a.targetType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/60">{fmtDate(a.deadline)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full border ${st}`}>{a.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() =>
                          router.push(`/dashboard/manage/assignments/create?id=${a._id}`)
                        }
                        className="inline-flex items-center gap-1.5 text-gold-400 hover:text-gold-300 text-sm mr-4"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(a)}
                        className="inline-flex items-center gap-1.5 text-red-400 hover:text-red-300 text-sm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Hapus
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
