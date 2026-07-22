"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PublicApiService, type NewsItem } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import { Search, ArrowRight } from "lucide-react";

export default function BeritaPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", "Kegiatan", "Pengumuman", "Opini"];

  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    setTimeout(() => setLoading(true), 0);
    PublicApiService.getNews({
      category: selectedCategory !== "All" ? selectedCategory : undefined,
      search: debouncedSearch ? debouncedSearch : undefined
    })
      .then((res) => {
        if (res?.data) {
          setNews(res.data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading news listing:", err);
        setLoading(false);
      });
  }, [selectedCategory, debouncedSearch]);


  const stripHtml = (html: string) => {
    if (!html) return "";
    return html.replace(/<[^>]*>?/gm, '');
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All");
  };

  return (
    <main className="pt-28 pb-16 px-6 max-w-6xl mx-auto w-full relative">
      {/* Background Ambience */}
      <div className="absolute top-[25%] right-0 w-[500px] h-[500px] bg-accent-blue/5 rounded-full blur-[130px] pointer-events-none -z-10" />

      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: "Berita & Publikasi", isCurrent: true }]} />

      {/* Header */}
      <div className="mb-12 mt-6">
        <span className="text-xs font-semibold text-accent-blue uppercase tracking-wide block mb-3">Publikasi & Berita</span>
        <h1 className="text-4xl md:text-6xl font-extrabold text-foreground leading-tight tracking-tight">
          Portal <span className="text-accent-gold">Publikasi</span>
        </h1>
        <p className="text-sm text-foreground/70 mt-4 max-w-2xl leading-relaxed">
          Kumpulan berita resmi kegiatan BEM, lembar pengumuman departemen, serta tulisan opini ilmiah mahasiswa Fakultas Teknik Universitas Negeri Surabaya.
        </p>
      </div>

      {/* Search & Filtration Bar */}
      <section className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-10 z-10 relative">
        
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 order-2 md:order-1">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-xl text-[10px] font-semibold uppercase tracking-wider transition-all duration-300 border cursor-pointer ${
                selectedCategory === category
                  ? "bg-accent-blue text-white border-accent-gold/50"
                  : "bg-transparent text-foreground/70 border-accent-blue/10 hover:text-foreground hover:bg-foreground/5 hover:border-accent-blue/30 hover:shadow-sm"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative order-1 md:order-2 w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-accent-blue/50" />
          <input
            type="text"
            placeholder="Cari berita atau pengumuman..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-foreground/5 border border-accent-blue/10 text-xs text-foreground placeholder-foreground/50 focus:outline-none focus:border-accent-blue transition-colors"
          />
        </div>
      </section>

      {/* News Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col h-full rounded-2xl overflow-hidden glass-subtle border border-accent-blue/10 animate-pulse min-h-[350px]" />
          ))}
        </div>
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {news.length > 0 ? (
            news.map((article) => (
              <article
                key={article._id}
                className="flex flex-col h-full rounded-2xl overflow-hidden glass-subtle border border-accent-blue/15 hover:border-accent-gold/40 hover:bg-foreground/5 transition-all duration-300 group shadow-md"
              >
                {/* Card Thumbnail Mockup */}
                <div className="w-full aspect-[16/10] bg-foreground/5 border-b border-accent-blue/10 relative overflow-hidden flex items-center justify-center">
                  <div className="absolute top-4 left-4 z-10">
                    <span className="px-3 py-1.5 rounded-lg bg-background/90 border border-accent-gold/25 text-[10px] font-semibold uppercase tracking-wider text-accent-gold shadow-sm">
                      {article.category}
                    </span>
                  </div>
                  
                  {/* Visual patterns */}
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-background/95 to-transparent z-1" />
                </div>
                {/* Card Body */}
                <div className="p-6 flex flex-col justify-between flex-grow gap-5">
                  <div className="flex flex-col gap-3">
                    {/* Metadata info */}
                    <div className="flex items-center gap-2 text-[10px] font-medium text-foreground/60 uppercase tracking-widest">
                      <span>{formatDate(article.date)}</span>
                      <span className="w-1 h-1 rounded-full bg-accent-blue/40"></span>
                      <span>{typeof article.author === 'object' && article.author !== null ? article.author.name : article.author}</span>
                    </div>

                    <h3 className="text-foreground font-extrabold text-base tracking-tight leading-snug line-clamp-2 group-hover:text-accent-gold transition-colors">
                      <Link href={`/berita/${article.slug}`}>
                        {article.title}
                      </Link>
                    </h3>

                    <p className="text-xs text-foreground/75 leading-relaxed line-clamp-3">
                      {article.summary || stripHtml(article.content).substring(0, 120) + "..."}
                    </p>
                  </div>

                  <div className="border-t border-accent-blue/10 pt-4">
                    <Link
                      href={`/berita/${article.slug}`}
                      className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-accent-gold hover:text-accent-blue transition-all group/btn"
                    >
                      Selengkapnya
                      <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="col-span-full py-20 text-center glass-subtle border border-dashed border-accent-blue/20 rounded-2xl flex flex-col items-center justify-center gap-4">
              <span className="text-xs font-semibold text-accent-blue tracking-widest uppercase">No Articles Found</span>
              <p className="text-xs text-foreground/50 max-w-xs leading-normal">
                Tidak ditemukan artikel berita atau pengumuman yang sesuai dengan kata kunci pencarian.
              </p>
              <button
                onClick={resetFilters}
                className="px-5 py-2.5 rounded-full bg-accent-blue text-[10px] font-semibold uppercase tracking-wider text-white hover:bg-accent-blue transition-colors cursor-pointer"
              >
                Reset Pencarian
              </button>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
