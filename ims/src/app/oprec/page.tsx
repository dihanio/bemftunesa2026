"use client";

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from "react";
import DashboardShell from "@/components/DashboardShell";
import { CustomSelect } from "@/components/ui/CustomSelect";
import ImsApiService, { RecruitmentData } from "@/lib/api";
import { Plus, Edit2, Trash2, Calendar, Link as LinkIcon, Info, ChevronDown, Users, X } from "lucide-react";
import Link from "next/link";
import { useConfirm } from "@/components/ui/CustomConfirm";

export default function RecruitmentPage() {
  const { confirm } = useConfirm();
  const [recruitments, setRecruitments] = useState<RecruitmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form State
  const [formOpen, setFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const dialogRef = React.useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (formOpen) dialogRef.current?.showModal();
    else dialogRef.current?.close();
  }, [formOpen]);
  
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    poster: "",
    status: "open" as "open" | "closed" | "announced",
    openDate: "",
    closeDate: "",
    formUrl: "",
    period: "",
    requirements: "", // newline separated
    content: "",
    positions: "[\n  {\n    \"name\": \"Posisi 1\",\n    \"quota\": 1,\n    \"description\": \"Deskripsi\"\n  }\n]", // JSON string
  });

  const loadRecruitments = async () => {
    try {
      setLoading(true);
      const res = await ImsApiService.getRecruitments();
      if (res?.data) {
        setRecruitments(res.data);
      }
    } catch (err) {
      console.error("Failed to load recruitments:", err);
      setError("Gagal memuat daftar open recruitment.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecruitments();
  }, []);

  const handleOpenCreate = () => {
    setFormData({
      title: "",
      slug: "",
      description: "",
      poster: "",
      status: "open",
      openDate: "",
      closeDate: "",
      formUrl: "",
      period: new Date().getFullYear().toString(),
      requirements: "",
      content: "",
      positions: "[\n  {\n    \"name\": \"Staff\",\n    \"quota\": 5,\n    \"description\": \"Staff magang\"\n  }\n]",
    });
    setIsEditing(false);
    setEditingId(null);
    setFormOpen(true);
    setError(null);
  };

  const handleOpenEdit = (rec: RecruitmentData) => {
    setFormData({
      title: rec.title,
      slug: rec.slug,
      description: rec.description || "",
      poster: rec.poster || "",
      status: rec.status || "closed",
      openDate: rec.openDate ? new Date(rec.openDate).toISOString().slice(0, 16) : "",
      closeDate: rec.closeDate ? new Date(rec.closeDate).toISOString().slice(0, 16) : "",
      formUrl: rec.formUrl || "",
      period: rec.period || "",
      requirements: Array.isArray(rec.requirements) ? rec.requirements.join("\n") : "",
      content: rec.content || "",
      positions: Array.isArray(rec.positions) ? JSON.stringify(rec.positions, null, 2) : "[]",
    });
    setIsEditing(true);
    setEditingId(rec._id);
    setFormOpen(true);
    setError(null);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    setFormData((prev) => ({ ...prev, title, slug }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      // Parse complex fields
      let parsedPositions = [];
      try {
        parsedPositions = JSON.parse(formData.positions || "[]");
      } catch (e) {
        throw new Error("Format JSON untuk Positions tidak valid.");
      }

      const payload = {
        ...formData,
        requirements: formData.requirements.split("\n").map((r) => r.trim()).filter(Boolean),
        positions: parsedPositions,
      };

      if (isEditing && editingId) {
        await ImsApiService.updateRecruitment(editingId, payload);
        setSuccess("Oprec berhasil diperbarui.");
      } else {
        await ImsApiService.createRecruitment(payload);
        setSuccess("Oprec berhasil ditambahkan.");
      }
      setFormOpen(false);
      loadRecruitments();
    } catch (err: unknown) {
      console.error("Submit error:", err);
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || (err as Error)?.message || "Gagal menyimpan data.");
    }
  };

  const handleDelete = async (id: string, title: string) => {
    const confirmed = await confirm({
      title: "Hapus Rekrutmen (Oprec)",
      message: `Apakah Anda yakin ingin menghapus oprec "${title}"?`,
      type: "danger",
      confirmLabel: "Ya, Hapus"
    });
    if (!confirmed) return;
    setError(null);
    setSuccess(null);

    try {
      await ImsApiService.deleteRecruitment(id);
      setSuccess(`Oprec "${title}" berhasil dihapus.`);
      loadRecruitments();
    } catch (err: unknown) {
      console.error("Delete error:", err);
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || (err as Error)?.message || "Gagal menghapus oprec.");
    }
  };

  return (
    <DashboardShell allowedRoles={['super-admin', 'kabem', 'wakabem', 'sekretaris', 'sekretaris-umum', 'sekretaris-administrasi', 'sekretaris-kegiatan']}>
      <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-hairline pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-ink tracking-tight m-0">Manajemen Oprec</h1>
            <p className="text-sm text-ink-subtle mt-1">
              Kelola open recruitment, magang, dan kepanitiaan BEM FT UNESA.
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="fixed bottom-6 right-6 z-40 md:static md:bottom-auto md:right-auto bg-primary hover:bg-primary-hover text-on-primary font-medium py-3 px-6 md:py-2.5 md:px-5 rounded-md md:rounded-lg text-sm flex items-center gap-2 transition-all active:scale-95 md: border border-primary-focus"
          >
            <Plus size={18} className="md:w-4 md:h-4" /> Tambah Oprec
          </button>
        </div>

        {/* Feedback Banners */}
        {error && (
          <div className="flex items-start gap-3 p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-sm">
            <Info size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-start gap-3 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-sm">
            <Info size={16} className="mt-0.5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Loader */}
        {loading && recruitments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-8 h-8 animate-spin rounded-full border-4 border-surface-3 border-t-primary" />
            <span className="text-sm text-ink-muted">Memuat data oprec...</span>
          </div>
        ) : recruitments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-hairline rounded-xl bg-surface-1 text-ink-muted text-sm gap-2">
            <Users size={32} className="text-ink-tertiary" />
            <span>Belum ada data open recruitment.</span>
          </div>
        ) : (
          /* Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recruitments.map((rec) => (
              <div
                key={rec._id}
                className="bg-surface-1 border border-hairline rounded-xl p-5 transition-all flex flex-col hover: relative overflow-hidden"
              >
                <div className="flex justify-between items-start gap-2 mb-3">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-semantic-warning bg-semantic-warning/10 px-2 py-0.5 rounded border border-semantic-warning/20">
                    {rec.period}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${
                      rec.status === "open"
                        ? "bg-semantic-success/10 text-semantic-success border-semantic-success/20"
                        : rec.status === "announced"
                        ? "bg-primary/10 text-primary border-primary/20"
                        : "bg-surface-3 text-ink-muted border-hairline-strong"
                    }`}
                  >
                    {rec.status}
                  </span>
                </div>
                
                <h3 className="text-[17px] font-bold text-ink mb-1 leading-tight m-0">{rec.title}</h3>
                <span className="text-[11px] font-mono text-ink-muted block mb-3">/{rec.slug}</span>
                
                <p className="text-[13px] text-ink-subtle line-clamp-2 mb-4 leading-relaxed">
                  {rec.description || "Tidak ada deskripsi."}
                </p>

                <div className="flex flex-col gap-2 mt-auto mb-4 text-xs text-ink-muted">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-ink-subtle" />
                    <span>
                      {rec.openDate ? new Date(rec.openDate).toLocaleDateString("id-ID") : "-"} s/d{" "}
                      {rec.closeDate ? new Date(rec.closeDate).toLocaleDateString("id-ID") : "-"}
                    </span>
                  </div>
                  {rec.formUrl && (
                    <div className="flex items-center gap-2">
                      <LinkIcon size={14} className="text-ink-subtle" />
                      <a href={rec.formUrl} target="_blank" rel="noreferrer" className="hover:text-primary transition-colors truncate">
                        {rec.formUrl}
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 border-t border-hairline pt-4 justify-end mt-2">
                  <Link
                    href={`/oprec/applicants?id=${rec._id}`}
                    className="py-1.5 px-3 hover:bg-surface-2 border border-transparent hover:border-hairline rounded-full text-ink-subtle hover:text-ink transition-all active:scale-95 flex items-center gap-2 text-xs font-medium"
                    title="Kelola Pendaftar"
                  >
                    <Users size={14} /> Kelola Pendaftar
                  </Link>
                  <button
                    onClick={() => handleOpenEdit(rec)}
                    className="p-1.5 hover:bg-surface-2 border border-transparent hover:border-hairline rounded-md text-ink-subtle hover:text-ink transition-all active:scale-95"
                    title="Edit Oprec"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(rec._id, rec.title)}
                    className="p-1.5 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-md text-red-400 hover:text-red-300 transition-all active:scale-95"
                    title="Hapus Oprec"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Form */}
        <dialog
          ref={dialogRef}
          className="bg-surface-1 border border-hairline-strong rounded-xl w-full max-w-2xl overflow-hidden bg-surface-1 p-0 backdrop:backdrop-blur-sm backdrop:bg-black/60 m-auto animate-fade-in"
          onClose={() => setFormOpen(false)}
          onClick={(e) => { if (e.target === e.currentTarget) setFormOpen(false); }}
        >
          {formOpen && (
            <div className="flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 border-b border-hairline flex justify-between items-center bg-surface-2 sticky top-0 z-10">
                <h2 className="text-lg font-bold text-ink m-0">
                  {isEditing ? "Edit Oprec" : "Tambah Oprec Baru"}
                </h2>
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="text-ink-subtle hover:text-ink p-1 rounded-md hover:bg-surface-3 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-ink-muted uppercase tracking-wider">
                      Judul Oprec
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={handleTitleChange}
                      placeholder="Contoh: Oprec Staff Magang 2026"
                      className="bg-canvas border border-hairline rounded-lg px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-hairline-strong placeholder-ink-subtle w-full"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-ink-muted uppercase tracking-wider">
                      Slug (Auto-generated)
                    </label>
                    <input
                      type="text"
                      required
                      readOnly
                      value={formData.slug}
                      placeholder="oprec-staff-magang"
                      className="bg-surface-2 border border-hairline rounded-lg px-4 py-2.5 text-sm text-ink-muted focus:outline-none w-full font-mono cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-ink-muted uppercase tracking-wider">
                      Status
                    </label>
                    <div className="relative w-full z-20">
                      <CustomSelect
                        value={formData.status}
                        onChange={(val) => setFormData((prev) => ({ ...prev, status: val as "open" | "closed" | "announced" }))}
                        options={[
                          { value: "open", label: "Open" },
                          { value: "closed", label: "Closed" },
                          { value: "announced", label: "Announced" }
                        ]}
                        className="bg-canvas border border-hairline rounded-lg py-2.5 text-sm text-ink focus:border-hairline-strong w-full"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-ink-muted uppercase tracking-wider">
                      Tanggal Buka
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.openDate}
                      onChange={(e) => setFormData((prev) => ({ ...prev, openDate: e.target.value }))}
                      className="bg-canvas border border-hairline rounded-lg px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-hairline-strong w-full color-scheme-dark"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-ink-muted uppercase tracking-wider">
                      Tanggal Tutup
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.closeDate}
                      onChange={(e) => setFormData((prev) => ({ ...prev, closeDate: e.target.value }))}
                      className="bg-canvas border border-hairline rounded-lg px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-hairline-strong w-full color-scheme-dark"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-ink-muted uppercase tracking-wider">
                      URL Form (Gforms, dll)
                    </label>
                    <input
                      type="url"
                      value={formData.formUrl}
                      onChange={(e) => setFormData((prev) => ({ ...prev, formUrl: e.target.value }))}
                      placeholder="https://forms.gle/..."
                      className="bg-canvas border border-hairline rounded-lg px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-hairline-strong placeholder-ink-subtle w-full"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-ink-muted uppercase tracking-wider">
                      Periode
                    </label>
                    <input
                      type="text"
                      value={formData.period}
                      onChange={(e) => setFormData((prev) => ({ ...prev, period: e.target.value }))}
                      placeholder="2026"
                      className="bg-canvas border border-hairline rounded-lg px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-hairline-strong placeholder-ink-subtle w-full"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-ink-muted uppercase tracking-wider">
                    URL Poster
                  </label>
                  <input
                    type="url"
                    value={formData.poster}
                    onChange={(e) => setFormData((prev) => ({ ...prev, poster: e.target.value }))}
                    placeholder="https://..."
                    className="bg-canvas border border-hairline rounded-lg px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-hairline-strong placeholder-ink-subtle w-full"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-ink-muted uppercase tracking-wider">
                    Deskripsi Singkat
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Tulis ringkasan oprec..."
                    className="bg-canvas border border-hairline rounded-lg px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-hairline-strong placeholder-ink-subtle w-full resize-none"
                  />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-ink-muted uppercase tracking-wider">
                    Konten Lengkap
                  </label>
                  <textarea
                    rows={4}
                    value={formData.content}
                    onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                    placeholder="Tulis konten/pengumuman detail..."
                    className="bg-canvas border border-hairline rounded-lg px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-hairline-strong placeholder-ink-subtle w-full resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-ink-muted uppercase tracking-wider">
                      Persyaratan (Pisahkan dengan baris baru)
                    </label>
                    <textarea
                      rows={5}
                      value={formData.requirements}
                      onChange={(e) => setFormData((prev) => ({ ...prev, requirements: e.target.value }))}
                      placeholder="- Mahasiswa aktif&#10;- Berkomitmen&#10;..."
                      className="bg-canvas border border-hairline rounded-lg px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-hairline-strong placeholder-ink-subtle w-full resize-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-ink-muted uppercase tracking-wider">
                      Posisi (Format JSON Array)
                    </label>
                    <textarea
                      rows={5}
                      value={formData.positions}
                      onChange={(e) => setFormData((prev) => ({ ...prev, positions: e.target.value }))}
                      className="bg-canvas border border-hairline rounded-lg px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-hairline-strong w-full resize-none font-mono text-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="bg-primary hover:bg-primary-hover text-on-primary font-medium py-2.5 rounded-lg transition-all active:scale-95 text-sm mt-4 sticky bottom-0 border border-primary-focus"
                >
                  {isEditing ? "Simpan Perubahan" : "Buat Oprec"}
                </button>
              </form>
            </div>
          )}
        </dialog>
      </div>
    </DashboardShell>
  );
}
