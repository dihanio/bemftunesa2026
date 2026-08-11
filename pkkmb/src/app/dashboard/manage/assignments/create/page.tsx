"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, ClipboardList, Check } from "lucide-react";
import { apiFetch } from "@/lib/api";
import toast from "react-hot-toast";

interface QuizOption {
  _id: string;
  title: string;
  type: string;
  durationMinutes: number;
  maxAttempts: number;
  passingScore: number;
  questionCount?: number;
}

const TARGET_TYPES = [
  { value: "ALL", label: "Semua Maba" },
  { value: "FACULTY", label: "Fakultas" },
  { value: "STUDY_PROGRAM", label: "Program Studi" },
  { value: "GROUP", label: "Gugus" },
  { value: "INDIVIDUAL", label: "Individu" },
];

export default function CreateAssignmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");

  const [assignmentType, setAssignmentType] = useState<"TASK" | "QUIZ">("TASK");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [taskType, setTaskType] = useState<"individu" | "kelompok">("individu");
  const [deadline, setDeadline] = useState("");
  const [startTime, setStartTime] = useState("");
  const [targetType, setTargetType] = useState("ALL");
  const [quizId, setQuizId] = useState("");
  const [attachment, setAttachment] = useState("");
  const [link, setLink] = useState("");

  const [quizzes, setQuizzes] = useState<QuizOption[]>([]);
  // true di awal: fetch quiz hanya sekali saat mount (spinner tampil tanpa
  // setState sinkron dalam effect — react-hooks/set-state-in-effect).
  const [loadingQuiz, setLoadingQuiz] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(!!editId);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch("/pkkmb/quiz");
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        const json = await res.json();
        if (json.success) {
          setQuizzes(json.data || []);
        }
      } catch {
        // ignore
      } finally {
        setLoadingQuiz(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!editId) return;
    (async () => {
      try {
        const res = await apiFetch(`/pkkmb/assignments/${editId}`);
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        const json = await res.json();
        if (json.success) {
          const d = json.data;
          setTitle(d.title || "");
          setDescription(d.description || "");
          setAssignmentType(d.assignmentType || "TASK");
          setTaskType(d.type === "kelompok" ? "kelompok" : "individu");
          setDeadline(d.deadline ? d.deadline.slice(0, 16) : "");
          setStartTime(d.startTime ? d.startTime.slice(0, 16) : "");
          setTargetType(d.targetType || "ALL");
          setQuizId(d.quizId || "");
          setAttachment(d.attachment || "");
          setLink(d.link || "");
        }
      } catch {
        // ignore
      } finally {
        setLoadingEdit(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  // Derive di render (bukan setState dalam effect — react-hooks/set-state-in-effect).
  const selectedQuiz = quizzes.find((q) => q._id === quizId) || null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Judul wajib diisi.");
      return;
    }
    if (!deadline) {
      toast.error("Deadline wajib diisi.");
      return;
    }
    if (assignmentType === "QUIZ" && !quizId) {
      toast.error("Pilih Quiz existing untuk assignment Quiz.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title,
        description,
        assignmentType,
        ...(assignmentType === "QUIZ" ? { quizId } : { type: taskType }),
        deadline: new Date(deadline).toISOString(),
        ...(startTime ? { startTime: new Date(startTime).toISOString() } : {}),
        targetType,
        ...(attachment ? { attachment } : {}),
        ...(link ? { link } : {}),
      };
      const res = await apiFetch(
        editId
          ? `/pkkmb/assignments/${editId}`
          : "/pkkmb/assignments",
        {
          method: editId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(editId ? "Penugasan diperbarui." : "Penugasan berhasil dibuat.");
        router.push("/dashboard/manage/assignments");
      } else {
        toast.error(json.message || "Gagal menyimpan penugasan.");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan.");
    } finally {
      setSaving(false);
    }
  };

  if (loadingEdit) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <button
        onClick={() => router.push("/dashboard/manage/assignments")}
        className="inline-flex items-center gap-1.5 text-white/50 hover:text-gold-400 text-sm mb-5 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Manajemen Penugasan
      </button>

      <h1 className="text-2xl font-bold text-white mb-1">
        {editId ? "Ubah Penugasan" : "Buat Penugasan"}
      </h1>
      <p className="text-white/50 text-sm mb-6">
        Quiz memakai quiz existing — soal, durasi, & passing score diatur di Manajemen Quiz.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Tipe */}
        <div className="grid grid-cols-2 gap-3">
          {(["TASK", "QUIZ"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setAssignmentType(t)}
              className={`p-4 rounded-xl border text-left transition-all ${
                assignmentType === t
                  ? "border-gold-500/50 bg-gold-500/10"
                  : "border-white/10 bg-white/5 hover:bg-white/10"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-white font-medium">
                  {t === "TASK" ? "📄 Tugas" : "📝 Quiz"}
                </span>
                {assignmentType === t && <Check className="w-4 h-4 text-gold-400" />}
              </div>
              <p className="text-white/40 text-xs mt-1">
                {t === "TASK"
                  ? "Pengumpulan file/link oleh maba"
                  : "Container ke quiz existing (engine Quiz Core)"}
              </p>
            </button>
          ))}
        </div>

        {/* Judul & deskripsi */}
        <div>
          <label className="block text-sm text-white/60 mb-1">Judul *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Contoh: Pretest PKKMB FT 2026"
            className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-gold-500/50"
          />
        </div>

        <div>
          <label className="block text-sm text-white/60 mb-1">Deskripsi</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Deskripsi penugasan…"
            className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-gold-500/50"
          />
        </div>

        {/* TASK: tipe submisi */}
        {assignmentType === "TASK" && (
          <div className="grid grid-cols-2 gap-3">
            {(["individu", "kelompok"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTaskType(t)}
                className={`p-3 rounded-xl border text-sm transition-all ${
                  taskType === t
                    ? "border-gold-500/50 bg-gold-500/10 text-white"
                    : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                }`}
              >
                {t === "individu" ? "Individu" : "Kelompok (Ketua Gugus)"}
              </button>
            ))}
          </div>
        )}

        {/* QUIZ: pilih quiz existing */}
        {assignmentType === "QUIZ" && (
          <div>
            <label className="block text-sm text-white/60 mb-1">
              Gunakan Quiz Existing *
            </label>
            {loadingQuiz ? (
              <div className="flex items-center gap-2 text-white/40 text-sm py-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Memuat quiz…
              </div>
            ) : (
              <select
                value={quizId}
                onChange={(e) => setQuizId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-gold-500/50"
              >
                <option value="">— Pilih Quiz —</option>
                {quizzes.map((q) => (
                  <option key={q._id} value={q._id} className="bg-zinc-900">
                    {q.title} ({q.type})
                  </option>
                ))}
              </select>
            )}

            {selectedQuiz && (
              <div className="mt-3 p-4 rounded-xl border border-white/10 bg-white/5">
                <p className="text-[11px] uppercase tracking-wide text-white/40 mb-2">
                  Ringkasan Quiz (read-only — diatur di Manajemen Quiz)
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                  <div>
                    <p className="text-white/40 text-xs">Soal</p>
                    <p className="text-white font-semibold">{selectedQuiz.questionCount ?? "—"} soal</p>
                  </div>
                  <div>
                    <p className="text-white/40 text-xs">Durasi</p>
                    <p className="text-white font-semibold">{selectedQuiz.durationMinutes} menit</p>
                  </div>
                  <div>
                    <p className="text-white/40 text-xs">Percobaan</p>
                    <p className="text-white font-semibold">{selectedQuiz.maxAttempts}x</p>
                  </div>
                  <div>
                    <p className="text-white/40 text-xs">Passing</p>
                    <p className="text-white font-semibold">{selectedQuiz.passingScore}%</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Periode */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-white/60 mb-1">Mulai (opsional)</label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-gold-500/50 [color-scheme:dark]"
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">Deadline *</label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-gold-500/50 [color-scheme:dark]"
            />
          </div>
        </div>

        {/* Target */}
        <div>
          <label className="block text-sm text-white/60 mb-1">Target</label>
          <select
            value={targetType}
            onChange={(e) => setTargetType(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-gold-500/50"
          >
            {TARGET_TYPES.map((t) => (
              <option key={t.value} value={t.value} className="bg-zinc-900">
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Lampiran / link (TASK) */}
        {assignmentType === "TASK" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-1">Lampiran URL (opsional)</label>
              <input
                value={attachment}
                onChange={(e) => setAttachment(e.target.value)}
                placeholder="https://…"
                className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-gold-500/50"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Link Materi (opsional)</label>
              <input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://…"
                className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-gold-500/50"
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-gold-500 text-black text-sm font-semibold hover:bg-gold-400 transition-colors disabled:opacity-50"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          <ClipboardList className="w-4 h-4" />
          {editId ? "Simpan Perubahan" : "Buat Penugasan"}
        </button>
      </form>
    </div>
  );
}
