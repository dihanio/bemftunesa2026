"use client";

import React, { useState, useEffect } from "react";
import { PublicApiService, type NewsItem } from "@/lib/api";
import Link from "next/link";
import { Calendar, User, ArrowRight, BookOpen, ShieldAlert } from "lucide-react";

export function NewsSection() {
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    PublicApiService.getNews({ page: 1, limit: 3 })
      .then((res) => {
        if (res?.data) {
          setNewsList(res.data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading news in preview:", err);
        setLoading(false);
      });
  }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  const stripHtml = (html: string) => {
    if (!html) return "";
    return html.replace(/<[^>]*>?/gm, '');
  };

  return (
    <section className="w-full max-w-6xl mx-auto py-12 px-6 relative z-10 bg-transparent">


      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 border-b border-sage/15 pb-6">
        <div>
          <span className="text-xs font-semibold text-sage uppercase tracking-wide block mb-2">
            Publikasi Terbaru
          </span>
          <h2 className="text-2xl md:text-4xl font-extrabold text-foreground tracking-tight">
            Berita & Pengumuman Terbaru
          </h2>
        </div>
        <Link
          href="/berita"
          className="text-xs font-bold uppercase tracking-widest text-accent-gold hover:text-sage flex items-center gap-2 transition-colors duration-300 group"
        >
          <span className="text-[10px] font-bold uppercase tracking-wider group-hover:pr-1 transition-all">Seluruh Publikasi</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col h-full rounded-2xl overflow-hidden glass-subtle border border-sage/15 animate-pulse min-h-[350px] p-2">
              <div className="w-full aspect-[16/10] bg-slate-green/50 rounded-xl mb-4" />
              <div className="p-4 flex flex-col gap-3">
                <div className="h-4 bg-slate-green/40 rounded w-1/3" />
                <div className="h-6 bg-slate-green/50 rounded w-3/4" />
                <div className="h-4 bg-slate-green/40 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : newsList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {newsList.map((article) => (
            <article
              key={article._id}
              className="flex flex-col h-full rounded-2xl overflow-hidden glass-subtle border border-sage/15 transition-all duration-500 hover:border-accent-gold/40 hover:bg-slate-green/80 dark:hover:bg-slate-green/10 hover:shadow-md hover:-translate-y-1.5 group relative"
            >


              {/* Thumbnail Header Mockup */}
              <div className="w-full aspect-[16/10] bg-forest/40 border-b border-sage/10 relative overflow-hidden flex items-center justify-center">
                {/* Overlay with category details */}
                <div className="absolute top-4 left-4 z-10">
                  <span className="px-3 py-1.5 rounded-lg bg-background/95 border border-sage/20 text-[10px] font-semibold uppercase tracking-wider text-sage shadow-sm">
                    {article.category}
                  </span>
                </div>
                

                <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-transparent to-transparent z-1" />
                <BookOpen className="w-10 h-10 text-sage/45 group-hover:scale-110 group-hover:text-accent-gold transition-all duration-500" />
                
              </div>

              {/* Card Body */}
              <div className="p-6 flex flex-col justify-between flex-grow gap-5">
                <div className="flex flex-col gap-3">
                  {/* Meta details */}
                  <div className="flex items-center gap-4 text-xs text-foreground/60">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-sage/60" />
                      {formatDate(article.date)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-sage/60" />
                      {typeof article.author === 'object' && article.author !== null ? (article.author as any).name : article.author}
                    </span>
                  </div>

                  <h3 className="text-foreground font-extrabold text-base tracking-tight leading-snug line-clamp-2 group-hover:text-accent-gold transition-colors duration-300">
                    <Link href={`/berita/${article.slug}`}>
                      {article.title}
                    </Link>
                  </h3>

                  <p className="text-xs text-foreground/75 leading-relaxed line-clamp-3">
                    {article.summary || stripHtml(article.content).substring(0, 120) + "..."}
                  </p>
                </div>

                <div className="border-t border-sage/10 pt-4">
                  <Link
                    href={`/berita/${article.slug}`}
                    className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-accent-gold hover:text-sage transition-all group/btn"
                  >
                    Baca Selengkapnya
                    <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1.5 transition-transform" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center glass-subtle border border-sage/20 border-dashed rounded-3xl flex flex-col items-center justify-center gap-4 max-w-3xl mx-auto shadow-inner relative overflow-hidden group">

          
          <div className="w-12 h-12 rounded-full bg-slate-green/50 border border-sage/10 flex items-center justify-center text-foreground/50">
            <ShieldAlert className="w-5 h-5 text-sage/60" />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-sage uppercase tracking-wide">
              Belum Ada Publikasi
            </span>
            <p className="text-xs text-foreground/60">
              Belum ada publikasi berita saat ini.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

export default NewsSection;
