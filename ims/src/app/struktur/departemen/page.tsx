"use client";

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from "react";
import DashboardShell from "@/components/DashboardShell";
import ImsApiService from "@/lib/api";
import {
  Building,
  Search,
  Plus,
  Edit2,
  Trash2,
  Info,
  CheckCircle,
  X,
} from "lucide-react";
import { useConfirm } from "@/components/ui/CustomConfirm";

interface Department {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  order?: number;
  isActive: boolean;
  taskBoardUrl?: string;
}

const emptyForm = { name: "", slug: "", description: "", order: 0, taskBoardUrl: "" };

export default function DepartemenPage() {
  const { confirm } = useConfirm();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  const dialogRef = React.useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (modalOpen) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [modalOpen]);

  // Auto-dismiss success
  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(null), 3000);
    return () => clearTimeout(t);
  }, [success]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await ImsApiService.getDepartments<Department>();
      if (res?.data) setDepartments(res.data);
    } catch {
      setError("Gagal memuat daftar departemen.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const filtered = departments.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const autoSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const openCreate = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setModalOpen(true);
    setError(null);
  };

  const openEdit = (d: Department) => {
    setEditingId(d._id);
    setFormData({
      name: d.name,
      slug: d.slug,
      description: d.description || "",
      order: d.order ?? 0,
      taskBoardUrl: d.taskBoardUrl || "",
    });
    setModalOpen(true);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    const payload = {
      name: formData.name,
      slug: formData.slug || autoSlug(formData.name),
      description: formData.description || undefined,
      order: formData.order,
      taskBoardUrl: formData.taskBoardUrl || undefined,
    };

    try {
      if (editingId) {
        await ImsApiService.updateDepartment(editingId, payload);
        setSuccess("Departemen berhasil diperbarui.");
      } else {
        await ImsApiService.createDepartment(payload);
        setSuccess("Departemen berhasil ditambahkan.");
      }
      setModalOpen(false);
      load();
    } catch (err: unknown) {
      setError((err as Error)?.message || "Gagal menyimpan departemen.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (d: Department) => {
    const ok = await confirm({
      title: "Hapus Departemen",
      message: `Yakin ingin menghapus departemen "${d.name}"?`,
      type: "danger",
      confirmLabel: "Ya, Hapus",
    });
    if (!ok) return;
    setError(null);
    setSuccess(null);
    try {
      await ImsApiService.deleteDepartment(d._id);
      setSuccess("Departemen berhasil dihapus.");
      load();
    } catch (err: unknown) {
      setError((err as Error)?.message || "Gagal menghapus departemen.");
    }
  };

  return (
    <DashboardShell allowedRoles={['super-admin', 'kabem', 'wakabem', 'sekretaris', 'sekretaris-umum', 'sekretaris-administrasi', 'sekretaris-kegiatan']}>
      <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-hairline pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold text-ink tracking-tight">Departemen</h1>
              {!loading && (
                <span className="text-xs font-bold bg-surface-2 text-ink-muted px-2.5 py-1 rounded-full border border-hairline">
                  {departments.length}
                </span>
              )}
            </div>
            <p className="text-sm text-ink-subtle mt-1">
              Kelola struktur departemen organisasi BEM FT UNESA.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="fixed bottom-6 right-6 z-40 md:static md:bottom-auto md:right-auto bg-primary hover:bg-primary-hover text-on-primary font-bold py-3 px-6 md:py-2.5 md:px-5 rounded-md md:rounded-lg text-sm flex items-center gap-2 transition-all active:scale-95 md: border border-primary-focus"
          >
            <Plus size={18} className="md:w-4 md:h-4" /> Tambah Departemen
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="flex items-start gap-3 p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-sm animate-fade-in">
            <Info size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-400/60 hover:text-red-400"><X size={14} /></button>
          </div>
        )}
        {success && (
          <div className="flex items-start gap-3 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-sm animate-fade-in">
            <CheckCircle size={16} className="mt-0.5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Search */}
        <div className="flex bg-surface-1 p-4 rounded-xl border border-hairline">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-3.5 text-ink-subtle" size={16} />
            <input
              type="text"
              placeholder="Cari departemen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-canvas border border-hairline rounded-lg pl-10 pr-4 py-2.5 text-sm text-ink placeholder-ink-subtle focus:outline-none focus:border-hairline-strong focus:ring-1 focus:ring-hairline-strong"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-8 h-8 animate-spin rounded-full border-4 border-surface-3 border-t-primary" />
            <span className="text-sm text-ink-muted">Memuat departemen...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-hairline rounded-xl bg-surface-1 text-ink-subtle text-sm gap-2">
            <Building size={32} className="text-ink-tertiary" />
            <span>{searchQuery ? "Tidak ada departemen yang cocok." : "Belum ada departemen."}</span>
          </div>
        ) : (
          <div className="bg-surface-1 border border-hairline rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-2 text-xs font-bold text-ink-muted uppercase tracking-wider border-b border-hairline">
                    <th className="px-6 py-4">Departemen</th>
                    <th className="px-6 py-4 hidden md:table-cell">Deskripsi</th>
                    <th className="px-6 py-4 text-center w-24">Urutan</th>
                    <th className="px-6 py-4 text-center w-24">Status</th>
                    <th className="px-6 py-4 text-right w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline text-sm text-ink">
                  {filtered.map((d) => (
                    <tr key={d._id} className="hover:bg-surface-2 transition-all">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-ink leading-snug">{d.name}</span>
                          <span className="text-[11px] text-ink-subtle font-mono mt-0.5">{d.slug}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-ink-muted text-xs max-w-xs hidden md:table-cell">
                        <span className="line-clamp-2">{d.description || "—"}</span>
                      </td>
                      <td className="px-6 py-4 text-center text-ink-muted font-mono text-xs">{d.order ?? "—"}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                          d.isActive !== false
                            ? "bg-semantic-success/10 text-semantic-success border-semantic-success/20"
                            : "bg-surface-3 text-ink-muted border-hairline-strong"
                        }`}>
                          {d.isActive !== false ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => openEdit(d)} className="p-2 hover:bg-surface-3 rounded-md text-ink-muted hover:text-ink transition-all active:scale-90" title="Edit">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDelete(d)} className="p-2 hover:bg-red-500/10 rounded-md text-red-400 hover:text-red-300 transition-all active:scale-90" title="Hapus">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal */}
        <dialog
          ref={dialogRef}
          className="bg-surface-1 border border-hairline-strong rounded-xl w-full max-w-lg overflow-hidden bg-surface-1 p-0 backdrop:backdrop-blur-sm backdrop:bg-black/60 m-auto animate-fade-in"
          onClose={() => setModalOpen(false)}
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
        >
          {modalOpen && (
            <div className="flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 border-b border-hairline flex justify-between items-center bg-surface-2">
                <h2 className="text-lg font-bold text-ink">
                  {editingId ? "Edit Departemen" : "Tambah Departemen"}
                </h2>
                <button type="button" onClick={() => setModalOpen(false)} className="text-ink-subtle hover:text-ink p-1 rounded-md hover:bg-surface-3">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 overflow-y-auto">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-ink-muted uppercase tracking-wider">Nama Departemen *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        name,
                        slug: editingId ? prev.slug : autoSlug(name),
                      }));
                    }}
                    placeholder="Contoh: Departemen Komunikasi"
                    className="bg-canvas border border-hairline rounded-lg px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-hairline-strong placeholder-ink-subtle"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-ink-muted uppercase tracking-wider">Slug</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                    className="bg-canvas border border-hairline rounded-lg px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-hairline-strong font-mono text-ink-muted"
                  />
                  <span className="text-[10px] text-ink-tertiary">Otomatis dari nama jika dikosongkan</span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-ink-muted uppercase tracking-wider">Deskripsi</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Deskripsi singkat tugas dan fungsi departemen"
                    className="bg-canvas border border-hairline rounded-lg px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-hairline-strong resize-none placeholder-ink-subtle"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-ink-muted uppercase tracking-wider">Urutan Tampil</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData((prev) => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                    className="bg-canvas border border-hairline rounded-lg px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-hairline-strong w-32"
                  />
                  <span className="text-[10px] text-ink-tertiary">Angka kecil tampil lebih dulu</span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-ink-muted uppercase tracking-wider">URL Trello / Notion Divisi</label>
                  <input
                    type="url"
                    value={formData.taskBoardUrl}
                    onChange={(e) => setFormData((prev) => ({ ...prev, taskBoardUrl: e.target.value }))}
                    placeholder="https://trello.com/b/..."
                    className="bg-canvas border border-hairline rounded-lg px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-hairline-strong placeholder-ink-subtle"
                  />
                  <span className="text-[10px] text-ink-tertiary">Opsional: Tautan eksternal Kanban Board divisi</span>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-primary hover:bg-primary-hover text-on-primary font-medium py-2.5 rounded-lg transition-all active:scale-95 text-sm mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-primary-focus"
                >
                  {submitting ? (
                    <><div className="w-4 h-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Menyimpan...</>
                  ) : (
                    editingId ? "Simpan Perubahan" : "Tambah Departemen"
                  )}
                </button>
              </form>
            </div>
          )}
        </dialog>
      </div>
    </DashboardShell>
  );
}
