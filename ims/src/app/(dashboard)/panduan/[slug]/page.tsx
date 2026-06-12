"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { wikiService, WikiArticle } from "@/lib/api/wiki";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Calendar,
  User,
  Clock,
  Edit3,
  Trash2,
  Tag,
  CheckCircle,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { useState } from "react";
import { WikiFormDialog } from "@/components/wiki/wiki-form-dialog";
import { useAuth } from "@/hooks/useAuth";

export default function WikiDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const slug = params.slug as string;
  const { user } = useAuth();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Queries
  const { data: detailResponse, isLoading } = useQuery({
    queryKey: ["ims-wiki-detail", slug],
    queryFn: () => wikiService.getDetail(slug),
  });

  const article = detailResponse?.data;

  // Mutations
  const updateMutation = useMutation({
    mutationFn: (data: Partial<WikiArticle>) => {
      if (!article) throw new Error("Article not loaded");
      return wikiService.update(article._id, data);
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["ims-wiki-detail", slug] });
      queryClient.invalidateQueries({ queryKey: ["ims-wiki-articles"] });
      setEditDialogOpen(false);
      setSuccessMsg(res.message || "Artikel Wiki berhasil diperbarui!");
      setTimeout(() => setSuccessMsg(""), 4000);

      // If title changed, slug might change, redirect to new slug if backend returned it
      if (res.data?.slug && res.data.slug !== slug) {
        router.replace(`/wiki/${res.data.slug}`);
      }
    },
    onError: (err: any) => {
      setErrorMsg(err.message || "Gagal memperbarui artikel.");
      setTimeout(() => setErrorMsg(""), 4000);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!article) throw new Error("Article not loaded");
      return wikiService.delete(article._id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ims-wiki-articles"] });
      router.push("/wiki");
    },
    onError: (err: any) => {
      setErrorMsg(err.message || "Gagal menghapus artikel.");
      setTimeout(() => setErrorMsg(""), 4000);
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Clock className="w-8 h-8 text-accent animate-spin" />
        <p className="text-muted-foreground text-sm">Memuat dokumen...</p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground italic">
          Dokumen Wiki/SOP tidak ditemukan.
        </p>
        <Button
          variant="ghost"
          onClick={() => router.push("/wiki")}
          className="mt-4 gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali
        </Button>
      </div>
    );
  }

  const handleUpdate = (data: Partial<WikiArticle>) => {
    updateMutation.mutate(data);
  };

  const handleDelete = () => {
    if (
      confirm(
        "Apakah Anda yakin ingin menghapus artikel Wiki/SOP ini secara permanen?",
      )
    ) {
      deleteMutation.mutate();
    }
  };

  const isSecretaryOrAdmin =
    user?.role === "Super Admin" || user?.role === "Sekretaris";

  // Simple parser to make raw markdown look clean and beautiful in premium view
  const renderFormattedContent = (rawText: string) => {
    return rawText.split("\n").map((line, idx) => {
      if (line.startsWith("### ")) {
        return (
          <h4
            key={idx}
            className="text-base font-bold text-foreground mt-4 mb-2 tracking-tight"
          >
            {line.replace("### ", "")}
          </h4>
        );
      }
      if (line.startsWith("## ")) {
        return (
          <h3
            key={idx}
            className="text-xl font-extrabold text-foreground mt-6 mb-3 tracking-tight border-b border-border/20 pb-1"
          >
            {line.replace("## ", "")}
          </h3>
        );
      }
      if (line.startsWith("# ")) {
        return (
          <h2
            key={idx}
            className="text-2xl font-black text-foreground mt-8 mb-4 tracking-tight"
          >
            {line.replace("# ", "")}
          </h2>
        );
      }
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return (
          <ul
            key={idx}
            className="list-disc pl-5 space-y-1 my-1 text-sm text-foreground/90 leading-relaxed"
          >
            <li>{line.substring(2)}</li>
          </ul>
        );
      }
      if (line.trim() === "") {
        return <div key={idx} className="h-2" />;
      }
      return (
        <p
          key={idx}
          className="text-sm leading-relaxed text-foreground/80 mb-2 font-sans"
        >
          {line}
        </p>
      );
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 ease-out">
      {/* Top Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/30 pb-5">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/wiki")}
            className="border-border/50 bg-background/50 hover:bg-muted/20 h-9 w-9 shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </Button>
          <div>
            <span className="text-[10px] font-bold text-accent uppercase tracking-widest font-mono">
              BEM FT UNESA Knowledge Base
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight leading-tight mt-0.5">
              {article.title}
            </h1>
          </div>
        </div>

        {isSecretaryOrAdmin && (
          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditDialogOpen(true)}
              className="border-border/50 bg-background/50 hover:bg-muted/20 gap-1.5 h-8 text-xs font-semibold"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Sunting
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="gap-1.5 h-8 text-xs font-semibold"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Hapus
            </Button>
          </div>
        )}
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {errorMsg}
        </div>
      )}

      {/* Metadata Panel */}
      <div className="flex flex-wrap items-center gap-6 text-xs text-muted-foreground p-4 rounded-2xl bg-card/20 border border-border/30">
        <span className="flex items-center gap-1.5 font-medium">
          <User className="w-4 h-4 text-[#10b981]" />
          Penulis:{" "}
          <strong className="text-foreground">
            {article.authorId?.name || "BPI BEM"}
          </strong>
        </span>
        <span className="flex items-center gap-1.5 font-medium">
          <Calendar className="w-4 h-4 text-accent" />
          Diterbitkan:{" "}
          <strong className="text-foreground">
            {new Date(article.createdAt).toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </strong>
        </span>
        <span className="flex items-center gap-1.5 font-medium">
          <Clock className="w-4 h-4" />
          Perubahan Terakhir:{" "}
          <strong className="text-foreground">
            {new Date(article.updatedAt).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            WIB
          </strong>
        </span>
      </div>

      {/* Article Content Display */}
      <Card className="border-border/50 bg-card/40 backdrop-blur-sm shadow-md overflow-hidden">
        <div className="p-6 md:p-8 space-y-6">
          {/* Format Render Box */}
          <div className="prose prose-invert max-w-none text-foreground/90 font-sans">
            {renderFormattedContent(article.content)}
          </div>

          {/* Tags Footer inside Card */}
          {article.tags && article.tags.length > 0 && (
            <div className="pt-6 border-t border-border/20 flex flex-wrap gap-2 items-center">
              <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" /> Label Terkait:
              </span>
              {article.tags.map((tag, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className="bg-accent/5 text-accent border-accent/15 text-[10px] font-mono px-2.5 py-0.5"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </Card>

      <WikiFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSubmit={handleUpdate}
        initialData={article}
        isLoading={updateMutation.isPending}
      />
    </div>
  );
}
