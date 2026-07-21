"use client";

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from "react";
import DashboardShell from "@/components/DashboardShell";
import { CustomSelect } from "@/components/ui/CustomSelect";
import ImsApiService from "@/lib/api";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Calendar,
  ChevronDown,
  ExternalLink,
  CheckCircle,
  FileText,
  UploadCloud,
  Newspaper,
  User,
  Info,
  Globe,
  Archive,
  Send,
  Eye,
} from "lucide-react";
import { useConfirm } from "@/components/ui/CustomConfirm";

interface Author {
  _id: string;
  name: string;
  email: string;
}

interface ContentItem {
  _id: string;
  type: "news" | "announcement" | "page" | "service";
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  status: "draft" | "review" | "published" | "archived";
  featuredImage?: string;
  author: Author;
  publishedAt?: string;
  tags?: string[];
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
  createdAt: string;
}

export default function BeritaKontenPage() {
  const { confirm } = useConfirm();
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filter & Search
  const [activeTab, setActiveTab] = useState<"news" | "announcement">("news");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // Modal Form State
  const [formOpen, setFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    type: "news" as "news" | "announcement" | "page" | "service",
    excerpt: "",
    content: "",
    status: "draft" as "draft" | "review" | "published" | "archived",
    featuredImage: "",
    tagsRaw: "",
    metaTitle: "",
    metaDescription: "",
    keywordsRaw: "",
  });

  const loadContents = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await ImsApiService.getContents(activeTab, selectedStatus || undefined, searchQuery);
      const data = res?.data;
      if (Array.isArray(data)) {
        setContents(data as ContentItem[]);
      } else if (data && typeof data === 'object') {
        const d = data as { data?: ContentItem[], docs?: ContentItem[] };
        if (Array.isArray(d.data)) {
          setContents(d.data);
        } else if (Array.isArray(d.docs)) {
          setContents(d.docs);
        } else {
          setContents([]);
        }
      } else {
        setContents([]);
      }
    } catch (err: unknown) {
      console.error("Failed to load contents:", err);
      setError("Gagal memuat daftar berita & konten.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContents();
  }, [activeTab, selectedStatus, searchQuery]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    
    setFormData((prev) => ({
      ...prev,
      title,
      slug: isEditing ? prev.slug : slug, // Don't auto-overwrite slug when editing
    }));
  };

  const handleOpenCreate = () => {
    setFormData({
      title: "",
      slug: "",
      type: activeTab,
      excerpt: "",
      content: "",
      status: "draft",
      featuredImage: "",
      tagsRaw: "",
      metaTitle: "",
      metaDescription: "",
      keywordsRaw: "",
    });
    setIsEditing(false);
    setEditingId(null);
    setFormOpen(true);
    setError(null);
  };

  const handleOpenEdit = (c: ContentItem) => {
    setFormData({
      title: c.title,
      slug: c.slug,
      type: c.type,
      excerpt: c.excerpt || "",
      content: c.content || "",
      status: c.status,
      featuredImage: c.featuredImage || "",
      tagsRaw: c.tags ? c.tags.join(", ") : "",
      metaTitle: c.seo?.metaTitle || "",
      metaDescription: c.seo?.metaDescription || "",
      keywordsRaw: c.seo?.keywords ? c.seo.keywords.join(", ") : "",
    });
    setIsEditing(true);
    setEditingId(c._id);
    setFormOpen(true);
    setError(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setError(null);
      const res = await ImsApiService.uploadContent(file);
      if (res?.data?.fileUrl) {
        setFormData((prev) => ({ ...prev, featuredImage: res.data.fileUrl }));
        setSuccess("Thumbnail banner berhasil diunggah.");
      }
    } catch (err: unknown) {
      console.error("Upload error:", err);
      setError((err as Error)?.message || "Gagal mengunggah banner.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const tags = formData.tagsRaw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const keywords = formData.keywordsRaw
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    const payload = {
      title: formData.title,
      slug: formData.slug,
      type: formData.type,
      excerpt: formData.excerpt,
      content: formData.content,
      status: formData.status,
      featuredImage: formData.featuredImage || undefined,
      tags,
      seo: {
        metaTitle: formData.metaTitle || undefined,
        metaDescription: formData.metaDescription || undefined,
        keywords,
      },
    };

    try {
      if (isEditing && editingId) {
        await ImsApiService.updateContent(editingId, payload);
        setSuccess("Konten berhasil diperbarui.");
      } else {
        await ImsApiService.createContent(payload);
        setSuccess("Konten baru berhasil dipublikasikan.");
      }
      setFormOpen(false);
      loadContents();
    } catch (err: unknown) {
      console.error("Submit error:", err);
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || (err as Error)?.message || "Gagal menyimpan konten.");
    }
  };

  const handleDelete = async (id: string, title: string) => {
    const confirmed = await confirm({
      title: "Hapus Konten",
      message: `Apakah Anda yakin ingin menghapus konten "${title}"?`,
      type: "danger",
      confirmLabel: "Ya, Hapus"
    });
    if (!confirmed) return;
    setError(null);
    setSuccess(null);

    try {
      await ImsApiService.deleteContent(id);
      setSuccess(`Konten "${title}" berhasil dihapus.`);
      loadContents();
    } catch (err: unknown) {
      console.error("Delete error:", err);
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || (err as Error)?.message || "Gagal menghapus konten.");
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: "published" | "archived" | "draft") => {
    try {
      setError(null);
      setSuccess(null);
      await ImsApiService.updateContentStatus(id, newStatus);
      setSuccess(`Status konten berhasil diperbarui menjadi ${newStatus.toUpperCase()}.`);
      loadContents();
    } catch (err: unknown) {
      console.error("Update status error:", err);
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || (err as Error)?.message || "Gagal memperbarui status.");
    }
  };

  return (
    <DashboardShell>
      <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-hairline pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-ink tracking-tight">Berita & Konten (CMS)</h1>
            <p className="text-sm text-ink-muted mt-1">
              Publikasikan pers rilis, berita kegiatan departemen, dan pengumuman resmi ke website publik BEM FT.
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-ink font-semibold px-4 py-2.5 rounded-xl transition-all active:scale-95 text-sm"
          >
            <Plus size={16} />
            Tulis Artikel
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-hairline gap-2">
          <button
            onClick={() => setActiveTab("news")}
            className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 ${
              activeTab === "news"
                ? "border-hairline text-primary"
                : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            Berita / Artikel
          </button>
          <button
            onClick={() => setActiveTab("announcement")}
            className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 ${
              activeTab === "announcement"
                ? "border-hairline text-primary"
                : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            Pengumuman Resmi
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="flex items-start gap-3 p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-sm">
            <Info size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-start gap-3 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-sm">
            <CheckCircle size={16} className="mt-0.5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 bg-surface-2 p-4 rounded-xl border border-hairline">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-3.5 text-ink-muted" size={16} />
            <input
              type="text"
              placeholder="Cari berdasarkan judul atau tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-2 border border-hairline rounded-xl pl-10 pr-4 py-2.5 text-sm text-ink placeholder-foreground/40 focus:outline-none focus:border-hairline focus:ring-1 focus:ring-sage"
            />
          </div>

          <div className="w-36 relative z-20">
            <CustomSelect
              value={selectedStatus}
              onChange={setSelectedStatus}
              options={[
                { value: "", label: "Semua Status" },
                { value: "draft", label: "Draft" },
                { value: "review", label: "Review" },
                { value: "published", label: "Published" },
                { value: "archived", label: "Archived" },
              ]}
              className="bg-surface-2 border border-hairline rounded-xl py-2.5 text-sm text-ink focus:border-hairline"
            />
          </div>
        </div>

        {/* Content Table */}
        {loading && contents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-8 h-8 animate-spin rounded-full border-4 border-hairline border-t-sage" />
            <span className="text-sm text-ink-muted">Memuat artikel...</span>
          </div>
        ) : contents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-hairline rounded-xl bg-surface-2 text-ink-muted text-sm gap-2">
            <Newspaper size={32} className="text-primary/40" />
            <span>Belum ada konten publikasi terbit untuk kategori ini.</span>
          </div>
        ) : (
          <div className="bg-surface-1 border border-hairline rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-2 text-xs font-bold text-ink-muted uppercase tracking-wider border-b border-hairline">
                    <th className="px-6 py-4">Judul Artikel</th>
                    <th className="px-6 py-4">Slug / Tautan</th>
                    <th className="px-6 py-4">Penulis</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline text-sm text-ink-muted">
                  {contents.map((c) => (
                    <tr key={c._id} className="hover:bg-surface-2 transition-all">
                      <td className="px-6 py-4">
                        <div className="flex gap-4 items-center">
                          {c.featuredImage && (
                            <img
                              src={c.featuredImage}
                              alt={c.title}
                              className="w-14 h-10 object-cover rounded-lg border border-hairline shrink-0"
                            />
                          )}
                          <div className="flex flex-col">
                            <span className="font-semibold text-ink leading-snug">{c.title}</span>
                            <span className="text-xs text-ink-muted flex items-center gap-1 mt-1">
                              <Calendar size={12} /> {c.publishedAt ? new Date(c.publishedAt).toLocaleDateString("id-ID", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }) : "Belum Diterbitkan"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-ink-muted">
                        /{c.type}/{c.slug}
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1 text-xs text-ink-muted font-medium">
                          <User size={12} className="text-ink-muted" />
                          {c.author?.name || "Fungsionaris"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                            c.status === "published"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : c.status === "archived"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : c.status === "review"
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                              : "bg-surface-2 text-ink-muted border-foreground/10"
                          }`}
                        >
                          {c.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          {c.status !== "published" && (
                            <button
                              onClick={() => handleUpdateStatus(c._id, "published")}
                              className="p-2 hover:bg-emerald-500/10 rounded-lg text-emerald-450 hover:text-emerald-400 transition-all active:scale-90"
                              title="Terbitkan (Publish)"
                            >
                              <Send size={14} />
                            </button>
                          )}
                          {c.status === "published" && (
                            <button
                              onClick={() => handleUpdateStatus(c._id, "archived")}
                              className="p-2 hover:bg-amber-500/10 rounded-lg text-amber-400 hover:text-amber-300 transition-all active:scale-90"
                              title="Arsipkan"
                            >
                              <Archive size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEdit(c)}
                            className="p-2 hover:bg-primary/10 rounded-lg text-primary hover:text-ink transition-all active:scale-90"
                            title="Edit Artikel"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(c._id, c.title)}
                            className="p-2 hover:bg-red-500/10 rounded-lg text-red-400 hover:text-red-300 transition-all active:scale-90"
                            title="Hapus Artikel"
                          >
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

        {/* Modal Form */}
        {formOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-surface-1 border border-hairline rounded-xl w-full max-w-2xl overflow-hidden animate-fade-in bg-surface-1-dark bg-opacity-95 max-h-[90vh] flex flex-col">
              <div className="px-6 py-4 border-b border-hairline flex justify-between items-center bg-surface-2">
                <h2 className="text-lg font-bold text-ink">
                  {isEditing ? "Edit Artikel / Konten" : "Tulis Artikel Baru"}
                </h2>
                <button
                  onClick={() => setFormOpen(false)}
                  className="text-ink-muted hover:text-ink text-sm font-semibold p-1"
                >
                  Batal
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Title */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-ink-muted uppercase tracking-wider">
                      Judul Artikel
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={handleTitleChange}
                      placeholder="Contoh: Rilis Pers Hasil Rapat Paripurna"
                      className="bg-surface-2 border border-hairline rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-hairline focus:ring-1 focus:ring-sage transition-all w-full"
                    />
                  </div>

                  {/* Slug */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-ink-muted uppercase tracking-wider">
                      Slug URL Tautan
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.slug}
                      onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                      placeholder="contoh-rilis-pers-rapat"
                      className="bg-surface-2 border border-hairline rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-hairline focus:ring-1 focus:ring-sage transition-all w-full font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Type */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-ink-muted uppercase tracking-wider">
                      Jenis Publikasi
                    </label>
                    <div className="relative w-full z-20">
                      <CustomSelect
                        value={formData.type}
                        onChange={(val) =>
                          setFormData((prev) => ({
                            ...prev,
                            type: val as "news" | "announcement" | "page" | "service",
                          }))
                        }
                        options={[
                          { value: "news", label: "Berita / Artikel Umum" },
                          { value: "announcement", label: "Pengumuman Resmi" },
                        ]}
                        className="bg-surface-2 border border-hairline rounded-xl py-2.5 text-sm text-ink focus:border-hairline w-full"
                      />
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-ink-muted uppercase tracking-wider">
                      Status Terbit
                    </label>
                    <div className="relative w-full z-10">
                      <CustomSelect
                        value={formData.status}
                        onChange={(val) =>
                          setFormData((prev) => ({
                            ...prev,
                            status: val as "draft" | "review" | "published" | "archived",
                          }))
                        }
                        options={[
                          { value: "draft", label: "Draft (Simpan Internal)" },
                          { value: "review", label: "Review Pengurus" },
                          { value: "published", label: "Published (Terbit Website)" },
                          { value: "archived", label: "Archived (Diarsipkan)" },
                        ]}
                        className="bg-surface-2 border border-hairline rounded-xl py-2.5 text-sm text-ink focus:border-hairline w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Excerpt */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-ink-muted uppercase tracking-wider">
                    Kutipan Ringkas (Excerpt)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.excerpt}
                    onChange={(e) => setFormData((prev) => ({ ...prev, excerpt: e.target.value }))}
                    placeholder="Tulis ringkasan satu kalimat untuk card list berita..."
                    className="bg-surface-2 border border-hairline rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-hairline w-full resize-none"
                  />
                </div>

                {/* Content */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-ink-muted uppercase tracking-wider">
                    Isi Artikel Lengkap
                  </label>
                  <textarea
                    rows={6}
                    required
                    value={formData.content}
                    onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                    placeholder="Tulis detail lengkap berita di sini..."
                    className="bg-surface-2 border border-hairline rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-hairline w-full resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Banner Image Upload */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-ink-muted uppercase tracking-wider">
                      Banner Image (Thumbnail)
                    </label>
                    <label className="flex items-center justify-center w-full h-24 border-2 border-hairline border-dashed rounded-xl cursor-pointer bg-surface-2 hover:bg-surface-2 transition-all relative overflow-hidden group">
                      {uploading ? (
                        <div className="w-5 h-5 animate-spin rounded-full border-2 border-hairline border-t-sage" />
                      ) : formData.featuredImage ? (
                        <img
                          src={formData.featuredImage}
                          alt="Banner Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-ink-muted text-[11px] gap-1">
                          <UploadCloud size={18} />
                          <span>Pilih file banner</span>
                        </div>
                      )}
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={uploading}
                      />
                    </label>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-ink-muted uppercase tracking-wider">
                      Tags (Pisahkan dengan koma)
                    </label>
                    <textarea
                      rows={3}
                      value={formData.tagsRaw}
                      onChange={(e) => setFormData((prev) => ({ ...prev, tagsRaw: e.target.value }))}
                      placeholder="kegiatan, kominfo, unesa"
                      className="bg-surface-2 border border-hairline rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-hairline w-full resize-none"
                    />
                  </div>
                </div>

                {/* SEO Optimization Section */}
                <div className="border-t border-hairline pt-4 space-y-4">
                  <h3 className="text-xs font-bold text-emerald-400 tracking-wider flex items-center gap-1">
                    <Globe size={12} /> SEO OPTIMIZATION
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">
                        Meta Title
                      </label>
                      <input
                        type="text"
                        value={formData.metaTitle}
                        onChange={(e) => setFormData((prev) => ({ ...prev, metaTitle: e.target.value }))}
                        placeholder="Contoh: Berita Unesa Terbaru..."
                        className="bg-surface-2 border border-hairline rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-hairline w-full"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">
                        Keywords (SEO)
                      </label>
                      <input
                        type="text"
                        value={formData.keywordsRaw}
                        onChange={(e) => setFormData((prev) => ({ ...prev, keywordsRaw: e.target.value }))}
                        placeholder="bem, ft, unesa"
                        className="bg-surface-2 border border-hairline rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-hairline w-full text-xs"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">
                      Meta Description
                    </label>
                    <textarea
                      rows={2}
                      value={formData.metaDescription}
                      onChange={(e) => setFormData((prev) => ({ ...prev, metaDescription: e.target.value }))}
                      placeholder="Deskripsi penelusuran hasil pencarian Google..."
                      className="bg-surface-2 border border-hairline rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-hairline w-full resize-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={uploading}
                  className="bg-primary hover:bg-primary-hover text-ink font-bold py-3 rounded-xl transition-all active:scale-98 text-sm mt-2 shrink-0"
                >
                  {isEditing ? "Simpan Perubahan" : "Terbitkan Artikel"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
