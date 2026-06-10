"use client";

import Link from "next/link";
import Image from "next/image";
import { Search, Calendar, ArrowRight } from "lucide-react";
import { useNews, NewsItem } from "@/hooks/useNews";

export default function BeritaClient() {
  const { data: articlesData, isLoading, error } = useNews();
  const articles = articlesData?.data || [];

  const formatDate = (value?: string) =>
    value
      ? new Date(value).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "Tanggal belum tersedia";

  // Skeleton Loader for Article Cards
  const SkeletonCard = () => (
    <div className="bg-[#0a2214]/40 border border-white/5 rounded-2xl overflow-hidden animate-pulse">
      <div className="h-48 bg-white/5" />
      <div className="p-6 space-y-4">
        <div className="h-3 w-1/4 bg-white/10 rounded" />
        <div className="h-6 w-full bg-white/5 rounded" />
        <div className="h-6 w-3/4 bg-white/5 rounded" />
      </div>
    </div>
  );

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16">
        <div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 font-sans tracking-tight">
            Kabar Teknik
          </h1>
          <p className="text-[#10b981] font-mono tracking-widest uppercase">
            {"// News & Media Portal"}
          </p>
        </div>

        <div className="relative group w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-[#10b981] transition-colors" />
          <input
            type="text"
            placeholder="Cari berita..."
            className="w-full bg-white/5 border border-white/10 rounded-full pl-12 pr-6 py-3 text-sm text-white focus:outline-none focus:border-[#10b981]/50 transition-all shadow-inner"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-3 mb-12 border-b border-white/5 pb-8 overflow-x-auto no-scrollbar">
        {["Semua Kabar", "Kegiatan", "Prestasi", "Pengumuman", "Opini"].map(
          (cat, idx) => (
            <button
              key={idx}
              className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap
              ${idx === 0 ? "bg-[#10b981] text-[#091c11]" : "border border-white/10 text-gray-400 hover:border-[#10b981] hover:text-white"}
            `}
            >
              {cat}
            </button>
          ),
        )}
      </div>

      {/* News Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
        ) : error ? (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-[40px]">
            <p className="text-gray-500 font-mono uppercase tracking-widest text-sm">
              {"Failed to connect to Neural Network // News API Offline"}
            </p>
          </div>
        ) : (
          articles.map((article: NewsItem) => (
            <Link
              key={article._id}
              href={`/berita/${article.slug}`}
              className="group flex flex-col glass-overlay rounded-2xl overflow-hidden hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(9, 28, 17,0.5)] transition-all duration-500 relative"
            >
              {/* Architectural Corner */}
              <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-white/10 group-hover:border-[#10b981]/30 transition-colors z-20" />

              <div className="relative h-64 overflow-hidden">
                <Image
                  src={
                    article.thumbnailUrl ||
                    "https://images.unsplash.com/photo-1585829365234-781fcdadc46c?q=80&w=2070&auto=format&fit=crop"
                  }
                  alt={article.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-linear-to-t from-[#0a2214] via-[#0a2214]/20 to-transparent" />
                <div className="absolute top-4 left-4 z-20">
                  <span className="px-3 py-1 text-[10px] font-bold font-mono tracking-widest uppercase rounded-full bg-white text-[#091c11]">
                    {article.category}
                  </span>
                </div>
              </div>

              <div className="p-8 flex flex-col grow relative">
                <div className="flex items-center gap-4 mb-4 text-[10px] font-mono text-[#10b981] uppercase tracking-widest">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" /> {formatDate(article.date)}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                  <span className="text-gray-400">
                    By {article.author || "BEM FT"}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white mb-6 group-hover:text-[#f5f2eb] transition-colors leading-tight">
                  {article.title}
                </h3>

                <div className="mt-auto pt-6 border-t border-white/5 flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 group-hover:text-[#10b981] transition-colors">
                    Read Report
                  </span>
                  <ArrowRight className="w-4 h-4 text-gray-700 group-hover:text-white transition-all group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Pagination */}
      <div className="mt-20 flex justify-center items-center gap-4">
        <button className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white opacity-40 cursor-not-allowed">
          <ArrowRight className="w-4 h-4 rotate-180" />
        </button>
        <span className="text-sm font-mono text-gray-300 px-4">01 / 05</span>
        <button className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white hover:border-[#10b981] hover:bg-[#12331e]/30 transition-all">
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </>
  );
}
