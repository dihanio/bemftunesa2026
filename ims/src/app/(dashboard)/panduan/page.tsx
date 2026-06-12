"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { wikiService, WikiArticle } from "@/lib/api/wiki";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  Search,
  Plus,
  ArrowRight,
  User,
  Calendar,
  Tag,
  CheckCircle,
  FileText,
} from "lucide-react";
import { WikiFormDialog } from "@/components/wiki/wiki-form-dialog";
import { useAuth } from "@/hooks/useAuth";

export default function WikiPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Fetch all wiki articles
  const { data: wikiResponse, isLoading } = useQuery({
    queryKey: ["ims-wiki-articles"],
    queryFn: () => wikiService.list(),
  });

  const articles = wikiResponse?.data || [];

  // Create wiki mutation
  const createMutation = useMutation({
    mutationFn: (data: Partial<WikiArticle>) => {
      return wikiService.create({
        ...data,
        authorId: user?.id as any,
      });
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["ims-wiki-articles"] });
      setDialogOpen(false);
      setSuccessMsg(res.message || "Artikel Wiki berhasil diterbitkan!");
      setTimeout(() => setSuccessMsg(""), 4000);
    },
  });

  const handleCreateWiki = (data: Partial<WikiArticle>) => {
    createMutation.mutate(data);
  };

  const filteredArticles = articles.filter(
    (art) =>
      art.title.toLowerCase().includes(search.toLowerCase()) ||
      art.content.toLowerCase().includes(search.toLowerCase()) ||
      (art.tags &&
        art.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))),
  );

  const isSecretaryOrAdmin =
    user?.role === "Super Admin" || user?.role === "Sekretaris";

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 ease-out">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Pusat SOP & Wiki Knowledge Base
          </h1>
          <p className="mt-2 text-muted-foreground">
            Standar Operasional Prosedur (SOP), lembar panduan kerja, dan berkas
            template resmi organisasi BEM FT UNESA.
          </p>
        </div>
        {isSecretaryOrAdmin && (
          <Button
            onClick={() => setDialogOpen(true)}
            className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2 shrink-0 shadow-lg shadow-accent/15"
          >
            <Plus className="w-4 h-4" />
            Tulis SOP / Wiki Baru
          </Button>
        )}
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          {successMsg}
        </div>
      )}

      {/* Search and Metrics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari SOP, regulasi, kata kunci..."
            className="pl-10 bg-background/40 border-border/50 focus:border-accent"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="text-xs font-semibold text-muted-foreground">
          Menampilkan{" "}
          <span className="text-foreground font-bold">
            {filteredArticles.length}
          </span>{" "}
          dokumen terbit
        </div>
      </div>

      {/* Wiki Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-48 w-full bg-card/40 border border-border/50 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : filteredArticles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredArticles.map((article) => (
            <Card
              key={article._id}
              onClick={() => router.push(`/wiki/${article.slug}`)}
              className="border-border/50 bg-card/30 backdrop-blur-sm hover:border-accent/40 hover:bg-card/40 transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden group shadow-xs hover:shadow-lg"
            >
              <CardHeader className="pb-3">
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {article.tags &&
                    article.tags.map((tag, idx) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className="bg-accent/5 text-accent border-accent/15 text-[9px] font-mono px-2 py-0.5"
                      >
                        <Tag className="w-2.5 h-2.5 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                </div>
                <CardTitle className="text-lg font-bold text-foreground group-hover:text-accent transition-colors tracking-tight leading-snug">
                  {article.title}
                </CardTitle>
                <CardDescription className="line-clamp-2 text-xs leading-relaxed mt-1">
                  {article.content.replace(/[#*`_\[\]]/g, "")}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 pb-4 flex items-center justify-between border-t border-border/20 bg-background/10 px-5 text-xs text-muted-foreground mt-4">
                <div className="flex items-center gap-4 mt-2">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-[#10b981]" />
                    {article.authorId?.name || "BPI BEM"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(article.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <span className="flex items-center gap-0.5 text-accent font-bold group-hover:translate-x-1 transition-transform mt-2">
                  Buka <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="py-24 text-center rounded-2xl border border-dashed border-border/50 bg-card/10">
          <BookOpen className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-muted-foreground italic text-sm">
            {search
              ? "Tidak ada artikel Wiki/SOP yang sesuai dengan pencarian."
              : "Belum ada dokumen/SOP yang diterbitkan."}
          </p>
        </div>
      )}

      <WikiFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreateWiki}
        isLoading={createMutation.isPending}
      />
    </div>
  );
}
