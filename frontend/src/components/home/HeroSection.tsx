"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import PublicApiService from "@/lib/api";

export function HeroSection() {
  const [stats, setStats] = useState({
    departments: 7,
    proker: 20,
    konstituen: "10k+"
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await PublicApiService.getStats();
        if (res && res.data) {
          setStats(prev => ({
            ...prev,
            departments: res.data.departments ?? prev.departments,
            proker: res.data.proker ?? prev.proker,
            // Konstiteun is kept static/formatted as there is no specific API for it, 
            // but the structure is now dynamic and ready.
          }));
        }
      } catch (error) {
        console.error("Failed to fetch stats for hero section:", error);
      }
    }
    fetchStats();
  }, []);

  return (
    <section className="relative w-full min-h-[75vh] flex flex-col items-center justify-center pt-24 pb-8 px-6 overflow-hidden bg-background">
      {/* Dynamic ambient background glow orbs */}
      <div className="absolute top-[10%] left-[15%] w-[350px] h-[350px] rounded-full bg-sage/5 blur-[130px] pointer-events-none -z-10" />
      <div className="absolute bottom-[20%] right-[10%] w-[450px] h-[450px] rounded-full bg-accent-blue/5 blur-[160px] pointer-events-none -z-10" />

      <div className="relative z-10 w-full max-w-6xl flex flex-col items-center">
        {/* Main split grid container */}
        <div className="w-full relative rounded-3xl overflow-hidden bg-forest/5 border border-sage/25 shadow-xl group/card backdrop-blur-sm p-2 md:p-3">

          {/* Inner Content Split Layout Grid */}
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 rounded-2xl overflow-hidden relative">
            
            {/* Left Column: Copy & Buttons (42% Width on Desktop) */}
            <div className="lg:col-span-5 flex flex-col justify-between p-6 md:p-8 lg:p-10 relative z-10 bg-slate-green/35 dark:bg-slate-green/5 border-b lg:border-b-0 lg:border-r border-sage/15 backdrop-blur-md">
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-4 mb-2">
                  <div className="flex items-center gap-3">
                    <Image src="/images/logo-bemft.png" alt="Logo BEM FT" width={56} height={56} className="object-contain drop-shadow-md" />
                    <Image src="/images/logo-kabinet.png" alt="Logo Danadyaksa" width={64} height={64} className="object-contain drop-shadow-md" />
                  </div>
                  <div className="h-10 w-px bg-sage/20 hidden sm:block" />
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sage/10 border border-sage/20 text-[11px] font-semibold text-sage tracking-wider uppercase w-fit">Kabinet Danadyaksa 2026</span>
                </div>
                <h1 className="text-foreground font-extrabold tracking-tighter leading-tight text-3xl md:text-5xl flex flex-col gap-1">
                  <span className="text-sage">BEM FT</span>
                  <span className="tracking-tight text-xl md:text-2xl font-bold text-foreground/80">UNIVERSITAS NEGERI SURABAYA</span>
                </h1>
                
                <p className="text-xs text-foreground/75 leading-relaxed font-sans">
                  Wadah aspirasi, penggerak advokasi, dan kolaborasi bagi seluruh keluarga mahasiswa teknik Universitas Negeri Surabaya.
                </p>

                {/* Micro highlights to populate empty space cleanly */}
                <div className="grid grid-cols-3 gap-3 border-t border-sage/10 pt-5 mt-2">
                  <div className="flex flex-col">
                    <span className="text-base md:text-lg font-extrabold text-sage font-mono tracking-tight">{stats.departments}</span>
                    <span className="text-[8px] font-bold text-foreground/50 tracking-wider uppercase">Departemen</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-base md:text-lg font-extrabold text-sage font-mono tracking-tight">{stats.proker}{stats.proker > 0 ? '+' : ''}</span>
                    <span className="text-[8px] font-bold text-foreground/50 tracking-wider uppercase">Program Kerja</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-base md:text-lg font-extrabold text-sage font-mono tracking-tight">{stats.konstituen}</span>
                    <span className="text-[8px] font-bold text-foreground/50 tracking-wider uppercase">Mahasiswa</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-stretch sm:items-center lg:items-stretch xl:items-center gap-3 mt-6">
                <Link href="/aspirasi" className="btn-strategic text-xs px-4 py-2.5 flex items-center justify-center gap-2 group/btn text-center">
                  Aspirasi Mahasiswa
                  <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1.5 transition-transform" />
                </Link>
                <Link href="/tentang" className="btn-tactical text-xs px-4 py-2.5 text-center">
                  Profil Kabinet
                </Link>
              </div>
            </div>

            {/* Right Column: FT Building Image (58% Width on Desktop) */}
            <div className="lg:col-span-7 relative w-full h-[240px] sm:h-[320px] lg:h-auto min-h-[240px] lg:min-h-[440px] overflow-hidden bg-slate-green">
              <Image
                src="/images/gedung-ft.png"
                alt="Gedung Fakultas Teknik UNESA"
                fill
                priority
                sizes="(max-width: 768px) 95vw, (max-width: 1200px) 90vw, 1200px"
                style={{ objectFit: "cover", objectPosition: "center 38%" }}
                className="transition-transform duration-1000 ease-out group-hover/card:scale-[1.03] filter brightness-[0.8] contrast-[1.05]"
              />
              
              {/* Ambient vignette gradient overlays to smooth boundaries */}
              <div className="absolute inset-0 bg-gradient-to-r from-background/20 via-transparent to-background/20 z-10" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/30 via-transparent to-transparent z-10" />
            </div>

          </div>
        </div>

        {/* Tagline footer details */}
        <div className="mt-8 md:mt-10 flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-[9px] text-foreground/60 uppercase tracking-widest bg-slate-green/50 dark:bg-slate-green/5 backdrop-blur-sm px-5 py-2 rounded-full border border-sage/15 shadow-sm">
          <span>Universitas Negeri Surabaya</span>
          <span className="hidden sm:block text-accent-gold/40">—</span>
          <span className="text-sage font-bold tracking-[0.25em]">Sinergi Nyata, Teknik Berdaya</span>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
