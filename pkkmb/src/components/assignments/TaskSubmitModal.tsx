"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
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

  // Validasi custom (bukan bawaan browser) agar pesan error konsisten dengan
  // bahasa & desain aplikasi — bukan bubble default "harap isi bidang ini".
  const validateLink = (value: string): string | null => {
    const v = value.trim();
    if (!v) return "Tautan belum diisi. Tempel link pengumpulan kamu di atas.";
    if (!/^https?:\/\//i.test(v)) {
      return "Tautan tidak valid. Pastikan diawali https:// (contoh: https://example.com/...)";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const invalid = validateLink(linkInput);
    if (invalid) {
      setError(invalid);
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
          <span
            className="w-1.5 h-1.5 rounded-full bg-gold-500"
            aria-hidden="true"
          />
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
            <span
              className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-2"
              aria-hidden="true"
            />
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
            <span
              className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0 mt-2"
              aria-hidden="true"
            />
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
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-white/80 mb-2">
                Tautan (Link) File Pengumpulan
              </label>
              <input
                type="text"
                inputMode="url"
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                placeholder="https://example.com/..."
                disabled={submitting}
                aria-invalid={!!error}
                className={`w-full bg-black/50 border rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-1 transition-colors ${
                  error
                    ? "border-red-500/50 focus:border-red-500 focus:ring-red-500"
                    : "border-white/10 focus:border-gold-500 focus:ring-gold-500"
                }`}
              />
              <p className="text-xs text-white/40 mt-2">
                Pastikan akses file/folder:{" "}
                <span className="text-white/60 font-medium">
                  &quot;Anyone with the link can view&quot;
                </span>{" "}
                agar panitia bisa membukanya.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 mt-1.5"
                  aria-hidden="true"
                />
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
