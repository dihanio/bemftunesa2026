"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashboardShell from "@/components/DashboardShell";
import { ImsApiService, type ContentItem } from "@/lib/api";
import { FileText, Plus, Search, ChevronRight, Globe, Lock, Eye } from "lucide-react";

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  draft: { label: "Draft", color: "bg-white/5 text-foreground/50 border-white/10", icon: Lock },
  review: { label: "Review", color: "bg-accent-gold/10 text-accent-gold border-accent-gold/20", icon: Eye },
  published: { label: "Dipublikasi", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: Globe },
  archived: { label: "Diarsipkan", color: "bg-white/5 text-foreground/50 border-white/10", icon: Lock },
};

const TYPE_MAP: Record<string, string> = {
  news: "Berita",
  announcement: "Pengumuman",
  page: "Halaman",
  service: "Layanan"
};

export default function BeritaListPage() {
  const router = useRouter();
  const [contentList, setContentList] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchContents = async () => {
      try {
        const res = await ImsApiService.getContentList();
        if (res?.data) {
          setContentList(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch content list:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchContents();
  }, []);

  const filters = ["all", "draft", "review", "published"];
  const filterLabels: Record<string, string> = {
    all: "Semua",
    draft: "Draft",
    review: "Review",
    published: "Dipublikasi"
  };

  const filteredList = contentList.filter((c) => {
    const matchFilter = activeFilter === "all" || c.status === activeFilter;
    const matchSearch = searchQuery === "" || c.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <DashboardShell>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Berita & Artikel</h1>
            <p className="text-sm text-foreground/40 mt-1">Kelola konten berita, pengumuman, dan halaman publik</p>
          </div>
          <button
            onClick={() => router.push("/berita/new")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sage hover:bg-emerald-500 text-white text-sm font-semibold transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:shadow-sage/20"
          >
            <Plus className="w-4 h-4" />
            Tulis Konten
          </button>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
            <input
              type="text"
              placeholder="Cari judul konten..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-subtle border border-sage/10 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-sage/40 focus:bg-sage/5 shadow-sm transition-all duration-200"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  activeFilter === f
                    ? "bg-sage/10 text-sage border border-sage/20"
                    : "text-foreground/40 hover:text-foreground/60 border border-transparent hover:border-sage/10"
                }`}
              >
                {filterLabels[f]}
              </button>
            ))}
          </div>
        </div>

        {/* Content List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <span className="text-sm text-foreground/40">Memuat data konten...</span>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <FileText className="w-10 h-10 text-foreground/15" />
            <span className="text-sm text-foreground/30">Belum ada konten</span>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredList.map((content) => {
              const statusInfo = STATUS_MAP[content.status] || STATUS_MAP.draft;
              return (
                <Link
                  key={content._id}
                  href={`/berita/${content._id}`}
                  className="flex items-center justify-between p-4 rounded-xl glass-subtle border border-sage/10 hover:border-sage/30 hover:glass-active hover:-translate-y-0.5 shadow-sm transition-all duration-300 group"
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-sage/5 border border-sage/20 flex items-center justify-center shrink-0 shadow-sm">
                      <FileText className="w-4 h-4 text-sage" />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-sm font-medium text-foreground truncate">{content.title}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-foreground/35">{TYPE_MAP[content.type] || "Berita"}</span>
                        <span className="text-xs text-foreground/25">•</span>
                        <span className="text-xs text-foreground/35">Oleh: {content.authorId?.name || "BEM FT"}</span>
                        <span className="text-xs text-foreground/25">•</span>
                        <span className="text-xs text-foreground/35">{new Date(content.createdAt).toLocaleDateString('id-ID')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium ${statusInfo.color}`}>
                      <statusInfo.icon className="w-3 h-3" />
                      {statusInfo.label}
                    </span>
                    <ChevronRight className="w-4 h-4 text-foreground/20 group-hover:text-sage transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
