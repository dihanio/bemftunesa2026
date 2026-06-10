"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { cmsService, Article } from "@/lib/api/cms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import {
  ArrowLeft,
  Save,
  Eye,
  EyeOff,
  Trash2,
  Calendar,
  FileText,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function ArticleEditorPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState<Article["category"]>("Kegiatan");
  const [status, setStatus] = useState<Article["status"]>("Draft");
  const [content, setContent] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Queries
  const { data: articleResponse, isLoading } = useQuery({
    queryKey: ["ims-article-detail", id],
    queryFn: async () => {
      const res = await cmsService.list();
      const found = res.data.find((a) => a._id === id);
      if (!found) throw new Error("Artikel tidak ditemukan");
      return found;
    },
  });

  useEffect(() => {
    if (articleResponse) {
      setTitle(articleResponse.title);
      setSlug(articleResponse.slug);
      setCategory(articleResponse.category);
      setStatus(articleResponse.status);
      setContent(articleResponse.content || "");
      setThumbnailUrl(articleResponse.thumbnailUrl || "");
    }
  }, [articleResponse]);

  // Mutations
  const saveMutation = useMutation({
    mutationFn: (data: Partial<Article>) => cmsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ims-article-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["ims-articles"] });
      alert("Artikel berhasil disimpan!");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => cmsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ims-articles"] });
      router.push("/cms");
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      title,
      slug,
      category,
      status,
      content,
      thumbnailUrl,
    });
  };

  const handleDelete = () => {
    if (
      confirm("Apakah Anda yakin ingin menghapus artikel ini secara permanen?")
    ) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-r-transparent"></div>
      </div>
    );
  }

  if (!articleResponse) {
    return (
      <div className="text-center py-12 space-y-4">
        <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
        <h2 className="text-xl font-bold">Artikel Tidak Ditemukan</h2>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 ease-out">
      {/* Top Header */}
      <div className="flex flex-col gap-4">
        <Link
          href="/cms"
          className="flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Kembali ke Manajemen CMS
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Editor Artikel & Berita
            </h1>
            <p className="mt-2 text-muted-foreground text-sm flex items-center gap-1">
              <FileText className="w-4 h-4 text-accent" /> Sedang menyunting
              draf artikel publikasi.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              className="border-border/50 bg-card"
              onClick={() => setIsPreviewMode(!isPreviewMode)}
            >
              {isPreviewMode ? (
                <>
                  <EyeOff className="w-4 h-4 mr-2" /> Keluar Preview
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2 text-accent" /> Mode Preview
                </>
              )}
            </Button>
            <Button
              variant="outline"
              className="border-danger/30 hover:bg-danger/10 text-danger hover:text-danger"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="w-4 h-4 mr-2" /> Hapus
            </Button>
            <Button
              className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg"
              onClick={handleSave}
              disabled={saveMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" /> Simpan Perubahan
            </Button>
          </div>
        </div>
      </div>

      {/* Editor Content Area */}
      {isPreviewMode ? (
        /* Preview Layout */
        <Card className="border-border/50 bg-card/40 backdrop-blur-sm max-w-3xl mx-auto overflow-hidden">
          {thumbnailUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbnailUrl}
              alt="Thumbnail"
              className="w-full h-[300px] object-cover border-b border-border/50"
            />
          )}
          <CardContent className="p-8 space-y-6">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-accent/5">
                {category}
              </Badge>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />{" "}
                {new Date().toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
            <h1 className="text-4xl font-extrabold text-foreground tracking-tight leading-tight">
              {title}
            </h1>
            <div className="prose prose-invert max-w-none text-muted-foreground whitespace-pre-line leading-relaxed text-sm">
              {content || "Belum ada konten tulisan..."}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Form Editor Layout */
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border/50 bg-card/40 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Konten Utama</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="editor-title">Judul Artikel</Label>
                  <Input
                    id="editor-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-background/50 border-border/50 text-lg font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="editor-content">Tulis Konten Lengkap</Label>
                  <Textarea
                    id="editor-content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="bg-background/50 border-border/50 min-h-[400px] font-mono text-sm leading-relaxed"
                    placeholder="Tulis artikel berita BEM FT disini..."
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Settings */}
          <div className="space-y-6">
            <Card className="border-border/50 bg-card/40 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Setting Publikasi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="editor-slug">Slug URL</Label>
                  <Input
                    id="editor-slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="bg-background/50 border-border/50 font-mono text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="editor-category">Kategori</Label>
                  <Select
                    id="editor-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="bg-background/50 border-border/50"
                  >
                    <option value="Kegiatan">Kegiatan</option>
                    <option value="Prestasi">Prestasi</option>
                    <option value="Pengumuman">Pengumuman</option>
                    <option value="Opini">Opini</option>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="editor-status">Status Rilis</Label>
                  <Select
                    id="editor-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="bg-background/50 border-border/50"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Published">Published</option>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="editor-thumb">
                    URL Gambar Cover (Thumbnail)
                  </Label>
                  <Input
                    id="editor-thumb"
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    placeholder="https://example.com/cover.jpg"
                    className="bg-background/50 border-border/50 text-xs"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
