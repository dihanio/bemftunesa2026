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
        const rawData: unknown = res?.data;
        let data: Partial<typeof stats> | undefined;
        if (rawData && typeof rawData === 'object') {
          if ('departments' in rawData || 'proker' in rawData) {
            data = rawData as Partial<typeof stats>;
          } else if ('data' in rawData) {
            const nested = (rawData as Record<string, unknown>).data;
            if (nested && typeof nested === 'object') {
              data = nested as Partial<typeof stats>;
            }
          }
        }
        if (data) {
          setStats(prev => ({
            ...prev,
            departments: data.departments ?? prev.departments,
            proker: data.proker ?? prev.proker,
          }));
        }
      } catch (error) {
        console.error("Failed to fetch stats for hero section:", error);
      }
    }
    fetchStats();
  }, []);

  return (
    <section className="relative w-full min-h-[70vh] flex flex-col items-center justify-center pt-28 pb-6 px-6 overflow-hidden bg-background">
      {/* Simplified ambient glow - single, smaller, no animation */}
      <div 
        className="absolute top-[10%] left-[-10%] w-[40vw] h-[40vw] max-w-[400px] max-h-[400px] rounded-full bg-accent-blue/10 blur-[80px] pointer-events-none -z-10" 
      />
      <div 
        className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] max-w-[400px] max-h-[400px] rounded-full bg-accent-blue/10 blur-[80px] pointer-events-none -z-10" 
      />

      {/* Grid Overlay - simplified */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)`,
          backgroundSize: '80px 80px'
        }}
      />

      <div className="relative z-10 w-full max-w-6xl flex flex-col items-center">
        {/* Main split grid container */}
        <div className="w-full relative rounded-2xl overflow-hidden glass-subtle p-2 md:p-3 shadow-xl group/card">

          {/* Inner Content Split Layout Grid */}
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 rounded-xl overflow-hidden relative">
            
            {/* Left Column: Copy & Buttons */}
            <div className="lg:col-span-5 flex flex-col justify-center p-5 md:p-7 lg:p-8 relative z-10 glass-active border-b lg:border-b-0 lg:border-r border-white dark:border-accent-blue/10 backdrop-blur-md">
              <div className="flex flex-col gap-4">
                
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-blue/10 border border-white dark:border-accent-blue/20 text-[11px] font-semibold text-accent-gold tracking-wider uppercase w-fit">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent-blue" />
                  Kabinet Danadyaksa 2026
                </div>

                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tighter leading-[1.1] text-foreground flex flex-col gap-1">
                  <span className="text-foreground">BEM FT UNESA</span>
                  <span className="bg-clip-text text-transparent bg-[length:200%_auto] bg-gradient-to-r from-blue-300 to-blue-500 text-2xl md:text-3xl">
                    Sinergi Nyata, Teknik Berdaya
                  </span>
                </h1>
                
                <p className="text-sm text-foreground/80 leading-relaxed font-sans">
                  Wadah aspirasi, penggerak advokasi, dan kolaborasi bagi seluruh keluarga mahasiswa teknik Universitas Negeri Surabaya.
                </p>

                {/* Micro highlights */}
                <div className="grid grid-cols-2 gap-3 border-t border-white dark:border-accent-blue/10 pt-4 mt-1">
                  <div className="flex flex-col">
                    <span className="text-lg font-extrabold text-accent-gold font-mono tracking-tight">{stats.departments}</span>
                    <span className="text-[9px] font-bold text-foreground/50 tracking-wider uppercase">Departemen</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-lg font-extrabold text-accent-gold font-mono tracking-tight">{stats.konstituen}</span>
                    <span className="text-[9px] font-bold text-foreground/50 tracking-wider uppercase">Mahasiswa</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-stretch sm:items-center lg:items-stretch xl:items-center gap-3 mt-6">
                <Link href="/aspirasi" className="btn-strategic text-xs px-4 py-3 flex items-center justify-center gap-2 group/btn text-center">
                  Suarakan Aspirasi
                  <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                </Link>
                <Link href="/tentang" className="btn-tactical text-xs px-4 py-3 text-center">
                  Profil Kabinet
                </Link>
              </div>
            </div>

            {/* Right Column: FT Building Image */}
            <div className="lg:col-span-7 relative w-full h-[200px] sm:h-[280px] lg:h-auto min-h-[200px] lg:min-h-[400px] overflow-hidden bg-slate-200/30 dark:bg-slate-800/15">
              <Image
                src="/images/gedung-ft.png"
                alt="Gedung Fakultas Teknik UNESA"
                fill
                priority={false}
                sizes="(max-width: 768px) 95vw, (max-width: 1200px) 90vw, 1200px"
                style={{ objectFit: "cover", objectPosition: "center" }}
                className="transition-transform duration-500 ease-out group-hover/card:scale-[1.02] brightness-[0.85] contrast-[1.05]"
              />
              
              {/* Ambient vignette gradient overlays */}
              <div className="absolute inset-0 bg-gradient-to-r from-background/40 via-transparent to-background/10 z-10" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent z-10" />
              
              {/* Single corner glow */}
              <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-accent-blue/20 blur-[60px] z-20 rounded-full" />
            </div>

          </div>
        </div>

        {/* Tagline footer details */}
        <div className="mt-6 md:mt-8 flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-[10px] text-foreground/60 uppercase tracking-widest glass-subtle px-5 py-2 rounded-full border border-white dark:border-accent-blue/10 shadow-sm">
          <span>Universitas Negeri Surabaya</span>
          <span className="hidden sm:block text-foreground/40">—</span>
          <span className="text-accent-gold font-bold tracking-[0.25em]">Portal BEM FT</span>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;