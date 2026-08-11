"use client";

import { useState } from "react";
import { UploadCloud, Users, CheckCircle2, X, Loader2, AlertTriangle } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { canSubmitTask } from "@/lib/maba";

interface TaskSubmitModalProps {
  task: { _id: string; title: string; description?: string; type?: string };
  isKetuaGugus: boolean;
  hasSubmitted: boolean;
  /** Tautan submission sebelumnya (opsional, di-prefill untuk perbarui). */
  fileUrl?: string;
  /** Deadline tugas (untuk mencegah perbarui setelah lewat waktu). */
  deadline?: string;
  onClose: () => void;
  /** Dipanggil setelah submit sukses agar parent me-refresh daftar. */
  onSubmitted?: () => void;
}

export default function TaskSubmitModal({
  task,
  isKetuaGugus,
  hasSubmitted,
  fileUrl,
  deadline,
  onClose,
  onSubmitted,
}: TaskSubmitModalProps) {
  const [linkInput, setLinkInput] = useState(fileUrl || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const isGroupTask = task.type === "kelompok" || task.type === "angkatan";
  const memberBlocked = isGroupTask && !isKetuaGugus;
  const submitDisabled =
    !canSubmitTask({
      type: task.type,
      isKetuaGugus,
      hasSubmitted,
      deadline: deadline || "",
    }) || submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkInput.trim()) {
      setError("Link Google Drive tidak boleh kosong.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await apiFetch(`/pkkmb/maba/tasks/${task._id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrl: linkInput.trim() }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setSuccess(true);
        onSubmitted?.();
      } else {
        setError(json.message || "Gagal mengumpulkan tugas.");
      }
    } catch {
      setError("Terjadi kesalahan jaringan. Periksa koneksi lalu coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={() => !submitting && onClose()}
      />
      <div className="bg-[#111] border border-white/10 p-6 md:p-8 rounded-3xl w-full max-w-lg relative z-10 shadow-2xl">
        <button
          onClick={onClose}
          disabled={submitting}
          className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="font-display font-bold text-2xl mb-1 pr-10">
          {task.title}
        </h2>
        <div className="flex items-center gap-2 text-sm text-gold-500 mb-6">
          <UploadCloud className="w-4 h-4" />
          <span>
            {isGroupTask ? "Pengumpulan Tugas Kelompok" : "Pengumpulan Tugas Individu"}
          </span>
        </div>

        {task.description ? (
          <p className="text-sm text-white/70 mb-6 leading-relaxed whitespace-pre-wrap">
            {task.description}
          </p>
        ) : null}

        {memberBlocked ? (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
            <Users className="w-5 h-5 shrink-0 mt-0.5 text-blue-400" />
            <div className="text-sm text-blue-200 leading-relaxed">
              <p className="font-bold mb-1">Tugas Kelompok</p>
              <p>
                Kamu adalah <strong>Anggota Gugus</strong>. Pengumpulan tugas ini
                dilakukan oleh <strong>Ketua Gugus</strong> — kamu tidak perlu
                melakukan submit.
              </p>
            </div>
          </div>
        ) : success ? (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-green-400" />
            <div>
              <p className="text-green-400 font-bold mb-1">
                Tugas Berhasil Dikumpulkan!
              </p>
              <p className="text-sm text-white/60">
                Tautanmu sudah tersimpan. Kamu dapat memperbarui sebelum deadline.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-white/80 mb-2">
                Tautan (Link) File / Google Drive
              </label>
              <input
                type="url"
                required
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                placeholder="https://drive.google.com/..."
                disabled={submitting}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors"
              />
              <p className="text-xs text-white/40 mt-2">
                Pastikan akses file/folder:{" "}
                <span className="text-white/60 font-medium">
                  &quot;Anyone with the link can view&quot;
                </span>
                .
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitDisabled}
              className="w-full bg-gold-500 hover:bg-gold-400 text-black font-bold py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sedang menyimpan tugas... jangan tutup halaman
                </>
              ) : hasSubmitted ? (
                "Perbarui Pengumpulan"
              ) : (
                "Kirim Tugas"
              )}
            </button>
          </form>
        )}

        {success && (
          <button
            onClick={onClose}
            className="mt-4 w-full bg-white/10 hover:bg-white/15 text-white font-bold py-3 rounded-xl transition-colors"
          >
            Selesai
          </button>
        )}
      </div>
    </div>
  );
}
