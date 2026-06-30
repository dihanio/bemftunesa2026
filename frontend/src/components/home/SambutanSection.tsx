"use client";

import React from "react";
import { Quote } from "lucide-react";

export function SambutanSection() {
  return (
    <section className="w-full max-w-6xl mx-auto py-16 px-6 relative z-10 bg-transparent">
      {/* Background Ambience */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-accent-gold/5 blur-[120px] pointer-events-none -z-10" />

      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-sage/15 pb-6">
        <div>
          <span className="text-xs font-semibold text-sage uppercase tracking-wide block mb-2">
            Sambutan Hangat
          </span>
          <h2 className="text-2xl md:text-4xl font-extrabold text-foreground tracking-tight">
            Sambutan Ketua & Wakil Ketua BEM FT
          </h2>
        </div>
      </div>

      {/* Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Photos Grid */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-4">
          {/* Ketua BEM Card */}
          <div className="relative group rounded-2xl overflow-hidden border border-sage/15 bg-slate-green/5 dark:bg-slate-green/5 p-3 flex flex-col items-center text-center backdrop-blur-sm transition-all duration-500 hover:border-accent-gold/40 hover:-translate-y-1">
            <div className="relative w-full aspect-[4/5] rounded-xl overflow-hidden bg-forest/30 border border-sage/10 mb-4 flex items-center justify-center">
              {/* Silhouette with Golden Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-accent-gold to-yellow-500 opacity-20 blur-md" />
              <svg className="w-20 h-20 text-accent-gold/60 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h4 className="text-sm font-extrabold text-foreground tracking-tight">Achmad Yusuf</h4>
            <p className="text-[10px] text-accent-gold uppercase font-bold tracking-widest mt-1">Ketua BEM FT</p>
          </div>

          {/* Wakil Ketua BEM Card */}
          <div className="relative group rounded-2xl overflow-hidden border border-sage/15 bg-slate-green/5 dark:bg-slate-green/5 p-3 flex flex-col items-center text-center backdrop-blur-sm transition-all duration-500 hover:border-accent-gold/40 hover:-translate-y-1">
            <div className="relative w-full aspect-[4/5] rounded-xl overflow-hidden bg-forest/30 border border-sage/10 mb-4 flex items-center justify-center">
              {/* Silhouette with Sage Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-sage to-forest opacity-20 blur-md" />
              <svg className="w-20 h-20 text-sage/60 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h4 className="text-sm font-extrabold text-foreground tracking-tight">Wakil Ketua BEM</h4>
            <p className="text-[10px] text-sage uppercase font-bold tracking-widest mt-1">Wakil Ketua BEM FT</p>
          </div>
        </div>

        {/* Quote & Text */}
        <div className="lg:col-span-7 flex flex-col gap-6 pl-0 lg:pl-6">
          <div className="flex items-start gap-4">
            <Quote className="w-10 h-10 text-accent-gold/40 shrink-0 transform rotate-180" />
            <div className="flex flex-col gap-4">
              <span className="text-xs font-mono font-bold tracking-[0.25em] text-accent-gold uppercase">
                KABINET DANADYAKSA 2026
              </span>
              <p className="text-sm md:text-base text-foreground/80 leading-relaxed italic font-medium">
                &quot;Sinergi Nyata, Teknik Berdaya. Kami percaya bahwa kemajuan Fakultas Teknik Universitas Negeri Surabaya lahir dari kolaborasi yang erat, keterbukaan informasi, dan advokasi yang solutif terhadap setiap aspirasi mahasiswa. Bersama Kabinet Danadyaksa, mari kita jadikan Fakultas Teknik sebagai wadah inovasi yang unggul, inklusif, dan berdampak nyata bagi almamater dan masyarakat.&quot;
              </p>
            </div>
          </div>
          
          <div className="h-[1px] bg-sage/10 my-2" />
          
          <div className="flex flex-col gap-2">
            <p className="text-xs text-foreground/60 leading-relaxed font-sans">
              Selamat datang di portal resmi BEM FT UNESA. Melalui sistem terintegrasi ini, kami berkomitmen untuk mewujudkan transparansi kerja, mempermudah penyampaian aspirasi secara dinamis, serta memberikan layanan informasi terbaik untuk seluruh civitas akademika Fakultas Teknik Universitas Negeri Surabaya.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SambutanSection;
