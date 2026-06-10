"use client";

import Link from "next/link";
import Image from "next/image";
import { Calendar, User, Share2, ArrowRight, AlertCircle } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { useNewsDetail } from "@/hooks/useNews";
import { use } from "react";
import DOMPurify from "dompurify";

export default function NewsDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { data: articleData, isLoading, error } = useNewsDetail(slug);
  const article = articleData?.data;
  const sanitizedContent =
    typeof window !== "undefined" && article?.content
      ? DOMPurify.sanitize(article.content)
      : article?.content || "";
  const formattedDate = article?.date
    ? new Date(article.date).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Tanggal belum tersedia";

  if (isLoading) {
    return (
      <div className="pt-44 pb-24 px-6 max-w-4xl mx-auto animate-pulse">
        <div className="h-6 w-32 bg-white/5 rounded mb-8" />
        <div className="h-4 w-24 bg-white/5 rounded mb-4" />
        <div className="h-12 w-full bg-white/5 rounded mb-8" />
        <div className="aspect-21/9 bg-white/5 rounded-3xl mb-12" />
        <div className="space-y-4">
          <div className="h-4 w-full bg-white/5 rounded" />
          <div className="h-4 w-5/6 bg-white/5 rounded" />
          <div className="h-4 w-4/6 bg-white/5 rounded" />
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="pt-40 pb-24 px-6 max-w-xl mx-auto text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-8">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">
          Berita Tidak Ditemukan
        </h1>
        <p className="text-gray-400 mb-12">
          Laporan yang Anda cari mungkin telah diarsipkan atau dipindahkan ke
          direktori lain.
        </p>
        <Link
          href="/berita"
          className="px-8 py-4 bg-white text-[#091c11] font-bold rounded-full hover:bg-army-accent transition-all"
        >
          Kembali ke Index Berita
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-48 pb-24 px-6 max-w-4xl mx-auto relative z-10">
      <Breadcrumbs
        items={[
          { label: "Archive", href: "/berita" },
          { label: article.category, isCurrent: true },
        ]}
        id={`ARC_${article._id.slice(-6).toUpperCase()}`}
      />

      {/* Header Meta */}
      <div className="mb-8">
        <span className="px-3 py-1 text-xs font-bold rounded-full bg-[#12331e] text-[#10b981] border border-[#10b981]/30 mb-4 inline-block">
          {article.category}
        </span>
        <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight font-sans mb-6">
          {article.title}
        </h1>

        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400 border-y border-white/10 py-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#10b981]" />
            {formattedDate}
          </div>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-[#10b981]" />
            {article.author || "BEM FT UNESA"}
          </div>
          <div className="ml-auto flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
            <Share2 className="w-4 h-4" />
            Share
          </div>
        </div>
      </div>

      {/* Hero Image */}
      <div className="relative aspect-21/9 rounded-3xl overflow-hidden mb-12 border border-white/10 shadow-2xl">
        <Image
          src={
            article.thumbnailUrl ||
            "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200&auto=format&fit=crop"
          }
          alt={article.title}
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
      </div>

      {/* Content Area */}
      <div className="prose prose-invert prose-emerald max-w-none text-gray-300 leading-relaxed space-y-6">
        <div
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          className="article-content"
        />
      </div>

      {/* Related News CTA */}
      <div className="mt-20 p-8 rounded-3xl bg-linear-to-br from-[#12331e]/40 to-transparent border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-xl font-bold text-white mb-2">
            Lihat Berita Lainnya
          </h3>
          <p className="text-sm text-gray-400">
            Temukan informasi dan prestasi terbaru dari Fakultas Teknik.
          </p>
        </div>
        <Link
          href="/berita"
          className="px-8 py-3 bg-white text-[#091c11] font-bold rounded-full hover:bg-army-accent hover:text-white transition-all whitespace-nowrap flex items-center gap-2"
        >
          Gelar Kabar Teknik <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
