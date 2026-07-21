"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PublicApiService, type NewsItem } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, Tag } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function BeritaDetailPage({ params }: PageProps) {
  const { slug } = React.use(params);
  const [article, setArticle] = useState<NewsItem | null>(null);
  const [recommendations, setRecommendations] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [recLoading, setRecLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);

    PublicApiService.getNewsBySlug(slug)
      .then((res) => {
        if (res?.data) {
          setArticle(res.data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading article details:", err);
        setLoading(false);
      });
  }, [slug]);

  useEffect(() => {
    setRecLoading(true);
    PublicApiService.getNews({ page: 1, limit: 4 })
      .then((res) => {
        const rawData: unknown = res?.data;
        let data: typeof recommendations = [];
        if (Array.isArray(rawData)) {
          data = rawData;
        } else if (rawData && typeof rawData === 'object' && 'data' in rawData) {
          const nested = (rawData as Record<string, unknown>).data;
          if (Array.isArray(nested)) data = nested;
          else if (nested && typeof nested === 'object' && 'data' in nested) {
            const doubleNested = (nested as Record<string, unknown>).data;
            if (Array.isArray(doubleNested)) data = doubleNested;
          }
        }
        if (Array.isArray(data)) {
          // Filter out current article
          setRecommendations(data.filter((item) => item.slug !== slug).slice(0, 3));
        }
        setRecLoading(false);
      })
      .catch((err) => {
        console.error("Error loading news recommendations:", err);
        setRecLoading(false);
      });
  }, [slug]);


  if (loading) {
    return (
      <div className="pt-32 pb-24 px-6 max-w-6xl mx-auto w-full animate-pulse">
        <div className="h-4 bg-slate-800/40 rounded w-1/4 mb-8" />
        <div className="h-10 bg-slate-800/50 rounded w-3/4 mb-4" />
        <div className="h-4 bg-slate-800/40 rounded w-1/3 mb-12" />
        <div className="space-y-4">
          <div className="h-4 bg-slate-800/40 rounded w-full" />
          <div className="h-4 bg-slate-800/40 rounded w-full" />
          <div className="h-4 bg-slate-800/40 rounded w-5/6" />
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="pt-32 pb-24 px-6 max-w-3xl mx-auto w-full text-center flex flex-col items-center gap-6">
        <h1 className="text-2xl font-extrabold text-foreground">Artikel Tidak Ditemukan</h1>
        <p className="text-xs text-foreground/50">
          Maaf, artikel berita yang Anda cari tidak tersedia atau telah dihapus oleh admin sistem.
        </p>
        <Link href="/berita" className="btn-strategic text-xs">
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke Portal Berita
        </Link>
      </div>
    );
  }

  return (
    <main className="pt-32 pb-24 px-6 max-w-6xl mx-auto w-full relative">
      {/* Background Ambience */}
      <div className="absolute top-[20%] left-0 w-[500px] h-[500px] bg-accent-blue/5 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Berita", path: "/berita" },
          { label: article.title.substring(0, 25) + "...", isCurrent: true }
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-6">
        {/* Main Content Article */}
        <section className="lg:col-span-2">
          {/* Article Header */}
          <div className="mb-8">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-accent-gold/10 border border-accent-gold/20 text-[10px] font-semibold text-accent-gold tracking-widest uppercase mb-4 shadow-sm">
              <Tag className="w-3 h-3 text-accent-gold" />
              Kategori: {article.category}
            </span>
            
            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight leading-snug mb-6">
              {article.title}
            </h1>

            {/* Metadata bar */}
            <div className="flex flex-wrap items-center gap-4 text-[11px] font-semibold text-foreground/70 border-y border-accent-blue/10 py-3.5 uppercase tracking-widest">
              <span>{formatDate(article.date)}</span>
              <span className="w-1 h-1 rounded-full bg-accent-blue/40"></span>
              <span>{typeof article.author === 'object' && article.author !== null ? article.author.name : article.author}</span>
            </div>
          </div>

          {/* Article Body */}
          <div className="glass-subtle border border-accent-blue/15 hover:border-accent-gold/35 rounded-3xl p-6 md:p-10 relative overflow-hidden group">
            {/* Top scanline accent */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-accent-gold/20" />
            


            {/* Article Content Paragraphs */}
            <div 
              className="text-sm text-foreground/85 leading-loose space-y-6 whitespace-pre-wrap prose prose-sm dark:prose-invert max-w-none prose-p:mb-4 prose-a:text-accent-gold hover:prose-a:text-accent-blue prose-headings:text-foreground prose-strong:text-foreground"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          </div>
        </section>

        {/* Sidebar Recommendations */}
        <aside className="lg:col-span-1 flex flex-col gap-8">
          <div className="glass-active border border-accent-blue/15 rounded-3xl p-6 relative overflow-hidden">
            {/* Top scanline accent */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-accent-gold/20" />
            
            <h3 className="text-xs font-semibold text-accent-gold uppercase tracking-wide border-b border-accent-blue/15 pb-3 mb-6">
              Rekomendasi Berita
            </h3>

            {recLoading ? (
              <div className="space-y-4 animate-pulse">
                {[1, 2].map((i) => (
                  <div key={i} className="h-16 bg-slate-800/50 rounded-xl w-full" />
                ))}
              </div>
            ) : recommendations.length > 0 ? (
              <div className="flex flex-col gap-6">
                {recommendations.map((rec) => (
                  <Link
                    key={rec._id}
                    href={`/berita/${rec.slug}`}
                    className="flex flex-col gap-2 group border-b border-accent-blue/10 pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3 text-xs text-foreground/60">
                      <span className="px-2 py-0.5 rounded bg-slate-800/50 text-accent-blue border border-accent-blue/10">
                        {rec.category}
                      </span>
                      <span>{formatDate(rec.date)}</span>
                    </div>
                    <h4 className="text-xs text-foreground font-bold leading-snug group-hover:text-accent-gold transition-colors line-clamp-2">
                      {rec.title}
                    </h4>
                  </Link>
                ))}
              </div>
            ) : (
              <span className="text-[10px] text-foreground/50">Tidak ada berita lain tersedia.</span>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
