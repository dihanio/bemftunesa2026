"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useNews } from "@/hooks/useNews";

export function NewsSection() {
  const { data: newsData, isLoading } = useNews({ limit: 3 });
  const news = newsData?.data || [];

  const formatDate = (value?: string) =>
    value
      ? new Date(value).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "Tanggal belum tersedia";

  return (
    <section
      className="w-full max-w-6xl mx-auto py-16 px-6 relative z-10"
      aria-labelledby="news-heading"
    >
      <div className="flex justify-between items-end mb-12">
        <div>
          <h2
            id="news-heading"
            className="text-3xl font-bold text-white mb-2 font-sans tracking-tight"
          >
            Kabar Teknik
          </h2>
          <p className="text-[#10b981] text-xs font-mono uppercase tracking-[0.2em] flex items-center gap-2">
            <span className="w-8 h-px bg-[#10b981]/30"></span>
            Latest Intelligence
          </p>
        </div>
        <Link
          href="/berita"
          className="hidden md:flex items-center gap-2 text-sm font-bold text-white/70 hover:text-[#10b981] transition-all group"
        >
          Lihat Semua{" "}
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-6 -mx-6 px-6 md:grid md:grid-cols-3 md:gap-8 md:overflow-visible md:pb-0 md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="snap-center shrink-0 w-[85vw] md:w-auto h-[400px] rounded-2xl bg-white/5 border border-white/5 animate-pulse"
            />
          ))
        ) : news.length === 0 ? (
          <div className="col-span-full py-20 text-center border border-dashed border-white/10 rounded-3xl">
            <p className="text-gray-400 font-mono text-xs uppercase tracking-widest">
              {"// No Recent Intelligence Found"}
            </p>
          </div>
        ) : (
          news.map((item) => (
            <Link
              href={`/berita/${item.slug}`}
              key={item._id}
              className="snap-center shrink-0 w-[85vw] md:w-auto group flex flex-col glass-subtle rounded-[28px] overflow-hidden hover:bg-white/5 hover:border-white/20 transition-all duration-500 border border-white/5 relative"
              aria-label={`Baca berita: ${item.title}`}
            >
              {/* Image Section */}
              <div className="relative w-full h-52 overflow-hidden">
                <div className="absolute inset-0 bg-linear-to-t from-[#091c11]/80 to-transparent opacity-60 group-hover:opacity-40 transition-opacity z-10" />
                <Image
                  src={
                    item.thumbnailUrl ||
                    "https://images.unsplash.com/photo-1585829365234-781fcdadc46c?q=80&w=2070&auto=format&fit=crop"
                  }
                  alt=""
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute top-5 left-5 z-20">
                  <span className="px-3 py-1.5 text-[10px] font-bold rounded-lg bg-[#f5f2eb] text-[#091c11] uppercase tracking-wider">
                    {item.category}
                  </span>
                </div>
              </div>

              {/* Content Section */}
              <div className="p-7 flex flex-col grow">
                <div className="flex items-center gap-4 mb-4">
                  <p className="text-[10px] font-mono text-[#10b981] uppercase">
                    {formatDate(item.date)}
                  </p>
                  <div className="w-1 h-1 rounded-full bg-white/20" />
                  <p className="text-[10px] font-mono text-gray-400 uppercase">
                    By {item.author || "BEM FT"}
                  </p>
                </div>

                <h3 className="text-xl font-bold text-white leading-tight group-hover:text-[#f5f2eb] transition-colors line-clamp-2 mb-4">
                  {item.title}
                </h3>

                <div className="mt-auto pt-4 flex items-center gap-2 text-[10px] font-bold text-[#10b981] opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all">
                  READ REPORT <ArrowRight className="w-3 h-3" />
                </div>
              </div>

              {/* Decorative Corner Detail */}
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#10b981]/0 group-hover:border-[#10b981]/40 transition-all duration-500 rounded-br-[28px]" />
            </Link>
          ))
        )}
      </div>

      <div className="mt-12 text-center md:hidden">
        <Link href="/berita" className="btn-strategic w-full">
          Lihat Semua Berita <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
