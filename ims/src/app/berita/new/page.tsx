"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashboardShell from "@/components/DashboardShell";
import { ImsApiService, type ContentItem } from "@/lib/api";
import { ArrowLeft, Save, Globe } from "lucide-react";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { FormSelect } from "@/components/ui/FormSelect";
import { FormInput } from "@/components/ui/FormInput";
import { FormFileUpload } from "@/components/ui/FormFileUpload";

export default function NewBeritaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    type: "news",
    excerpt: "",
    content: "",
    status: "draft",
    tags: "",
    metaTitle: "",
    metaDescription: "",
    featuredImageId: "",
    featuredImageUrl: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === "slug") {
      setIsSlugManuallyEdited(true);
    }

    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      
      // Auto-generate slug from title if user hasn't manually overridden it
      if (name === "title" && !isSlugManuallyEdited) {
        next.slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      }
      return next;
    });
  };

  const handleFileUpload = async (file: File) => {
    try {
      setUploading(true);
      setError(null);
      const res = await ImsApiService.uploadFile(file);
      setFormData((prev) => ({ ...prev, featuredImageId: res.data._id || "", featuredImageUrl: res.data.url }));
    } catch (err: unknown) {
      const e = err as Error;
      setError("Gagal mengunggah gambar: " + e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent, isPublish = false) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const tagsArray = formData.tags ? formData.tags.split(",").map(t => t.trim()).filter(Boolean) : [];
      
      const payload: Partial<ContentItem> = {
        title: formData.title,
        slug: formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
        type: formData.type as 'news' | 'announcement' | 'page' | 'service',
        excerpt: formData.excerpt,
        content: formData.content,
        status: (isPublish ? "published" : formData.status) as 'draft' | 'review' | 'published' | 'archived',
        tags: tagsArray,
        featuredImage: formData.featuredImageId || undefined,
        seo: {
          metaTitle: formData.metaTitle || formData.title,
          metaDescription: formData.metaDescription || formData.excerpt,
        }
      };

      await ImsApiService.createContent(payload);
      router.push("/berita");
    } catch (err: unknown) {
      const e = err as Error;
      console.error(e);
      setError(e.message || "Gagal menyimpan konten");
      setLoading(false);
    }
  };

  return (
    <DashboardShell>
      <div className="flex flex-col gap-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/berita"
              className="w-10 h-10 rounded-xl glass-subtle border border-sage/10 flex items-center justify-center text-foreground/50 hover:text-foreground hover:border-sage/30 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-foreground">Tulis Konten Baru</h1>
              <p className="text-sm text-foreground/40 mt-1">Buat berita, pengumuman, atau artikel</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
            {error}
          </div>
        )}

        <form className="flex flex-col gap-6">
          <div className="glass-subtle border border-sage/10 rounded-2xl p-6 flex flex-col gap-5 relative z-30">
            <h3 className="text-sm font-bold text-foreground border-b border-sage/10 pb-3">Informasi Utama</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormInput
                label="Judul Konten"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Contoh: Pendaftaran PKKMB 2026 Dibuka"
                required
              />
              <FormInput
                label="Slug (URL)"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                placeholder="pendaftaran-pkkmb-2026"
                required
                className="font-mono"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormSelect
                label="Tipe Konten"
                name="type"
                value={formData.type}
                required
                options={[
                  { value: "news", label: "Berita" },
                  { value: "announcement", label: "Pengumuman" },
                  { value: "page", label: "Halaman Statis" },
                  { value: "service", label: "Layanan BEM" }
                ]}
                onChange={(val) => setFormData(prev => ({ ...prev, type: val }))}
              />
              <FormInput
                label="Tags"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="kampus, pkkmb, mahasiswa baru"
                helperText="Pisahkan dengan koma"
              />
            </div>

            <FormFileUpload
              label="Cover / Thumbnail Berita"
              accept="image/*"
              uploading={uploading}
              fileName={formData.featuredImageUrl ? formData.featuredImageUrl.split("/").pop() : undefined}
              onFileSelect={handleFileUpload}
              onClear={() => setFormData(prev => ({ ...prev, featuredImageId: "", featuredImageUrl: "" }))}
            />
          </div>

          <div className="glass-subtle border border-sage/10 rounded-2xl p-6 flex flex-col gap-5 relative z-20">
            <h3 className="text-sm font-bold text-foreground border-b border-sage/10 pb-3">Isi Konten</h3>
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground/70">Ringkasan (Excerpt)</label>
              <textarea
                name="excerpt"
                value={formData.excerpt}
                onChange={handleChange}
                rows={2}
                className="w-full px-4 py-3 rounded-xl glass-subtle border border-sage/10 focus:outline-none focus:border-sage/40 focus:bg-sage/5 text-sm resize-none transition-all duration-200"
                placeholder="Ringkasan singkat yang muncul di halaman depan atau preview..."
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground/70">Konten Lengkap</label>
              <RichTextEditor
                value={formData.content}
                onChange={(value) => setFormData(prev => ({ ...prev, content: value }))}
              />
            </div>
          </div>

          <div className="glass-subtle border border-sage/10 rounded-2xl p-6 flex flex-col gap-5">
            <h3 className="text-sm font-bold text-foreground border-b border-sage/10 pb-3">Optimasi Pencarian (SEO)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormInput
                label="Meta Title"
                name="metaTitle"
                value={formData.metaTitle}
                onChange={handleChange}
                placeholder="Kosongkan untuk menggunakan judul konten"
              />
              <FormInput
                label="Meta Description"
                name="metaDescription"
                value={formData.metaDescription}
                onChange={handleChange}
                placeholder="Kosongkan untuk menggunakan ringkasan"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <Link
              href="/berita"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-foreground/60 hover:bg-foreground/5 transition-colors"
            >
              Batal
            </Link>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, false)}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sage/20 text-sage hover:bg-sage/30 text-sm font-semibold transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              Simpan Draft
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sage text-white hover:bg-emerald-500 text-sm font-semibold transition-colors disabled:opacity-50 shadow-lg shadow-sage/20"
            >
              <Globe className="w-4 h-4" />
              Publikasikan
            </button>
          </div>
        </form>
      </div>
    </DashboardShell>
  );
}
