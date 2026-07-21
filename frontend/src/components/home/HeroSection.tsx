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
    <section className="relative w-full min-h-[75vh] flex flex-col items-center justify-center pt-32 pb-8 px-6 overflow-hidden bg-background">
      {/* Dynamic ambient background glow orbs */}
      <div 
        className="ambient-glow bg-accent-blue/30" 
        style={{ width: '50vw', height: '50vw', top: '-10%', left: '-10%' }} 
      />
      <div 
        className="ambient-glow bg-accent-blue/40" 
        style={{ width: '60vw', height: '60vw', bottom: '-20%', right: '-5%', animationDelay: '-9s' }} 
      />

      {/* Grid Overlay */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-50"
        style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)`,
          backgroundSize: '64px 64px'
        }}
      />

      <div className="relative z-10 w-full max-w-6xl flex flex-col items-center">
        {/* Main split grid container (Dark Glassmorphism) */}
        <div className="w-full relative rounded-3xl overflow-hidden glass-subtle p-2 md:p-3 shadow-2xl group/card">

          {/* Inner Content Split Layout Grid */}
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 rounded-2xl overflow-hidden relative">
            
            {/* Left Column: Copy & Buttons */}
            <div className="lg:col-span-5 flex flex-col justify-center p-6 md:p-8 lg:p-10 relative z-10 glass-active border-b lg:border-b-0 lg:border-r border-white dark:border-accent-blue/10 backdrop-blur-md">
              <div className="flex flex-col gap-5 animate-enter delay-1">
                
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-blue/10 border border-white dark:border-accent-blue/20 text-[11px] font-semibold text-accent-gold tracking-wider uppercase w-fit mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent-blue shadow-[0_0_8px_#60a5fa] animate-pulse" />
                  Kabinet Danadyaksa 2026
                </div>

                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter leading-[1.1] text-foreground flex flex-col gap-2">
                  <span className="text-foreground">BEM FT UNESA</span>
                  <span 
                    className="bg-clip-text text-transparent bg-[length:200%_auto] filter drop-shadow-[0_4px_15px_rgba(59,130,246,0.3)] text-3xl md:text-4xl"
                    style={{
                      backgroundImage: "linear-gradient(to right, #bfdbfe, #3b82f6, #bfdbfe)",
                      animation: "shineGradient 5s linear infinite"
                    }}
                  >
                    Sinergi Nyata, Teknik Berdaya
                  </span>
                </h1>
                
                <p className="text-sm md:text-base text-foreground/80 leading-relaxed font-sans">
                  Wadah aspirasi, penggerak advokasi, dan kolaborasi bagi seluruh keluarga mahasiswa teknik Universitas Negeri Surabaya.
                </p>

                {/* Micro highlights */}
                <div className="grid grid-cols-2 gap-3 border-t border-white dark:border-accent-blue/10 pt-5 mt-2">
                  <div className="flex flex-col">
                    <span className="text-lg md:text-xl font-extrabold text-accent-gold font-mono tracking-tight drop-shadow-[0_0_10px_rgba(59,130,246,0.2)]">{stats.departments}</span>
                    <span className="text-[9px] font-bold text-foreground/50 tracking-wider uppercase">Departemen</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-lg md:text-xl font-extrabold text-accent-gold font-mono tracking-tight drop-shadow-[0_0_10px_rgba(59,130,246,0.2)]">{stats.konstituen}</span>
                    <span className="text-[9px] font-bold text-foreground/50 tracking-wider uppercase">Mahasiswa</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-stretch sm:items-center lg:items-stretch xl:items-center gap-3 mt-8 animate-enter delay-2">
                <Link href="/aspirasi" className="btn-strategic text-xs px-4 py-3 flex items-center justify-center gap-2 group/btn text-center">
                  Suarakan Aspirasi
                  <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1.5 transition-transform" />
                </Link>
                <Link href="/tentang" className="btn-tactical text-xs px-4 py-3 text-center">
                  Profil Kabinet
                </Link>
              </div>
            </div>

            {/* Right Column: FT Building Image Inside Box */}
            <div className="lg:col-span-7 relative w-full h-[240px] sm:h-[320px] lg:h-auto min-h-[240px] lg:min-h-[440px] overflow-hidden bg-slate-200/50 dark:bg-slate-800/20 animate-enter delay-3">
              <Image
                src="/images/gedung-ft.png"
                alt="Gedung Fakultas Teknik UNESA"
                fill
                priority
                sizes="(max-width: 768px) 95vw, (max-width: 1200px) 90vw, 1200px"
                style={{ objectFit: "cover", objectPosition: "center" }}
                className="transition-transform duration-1000 ease-out group-hover/card:scale-[1.03] filter brightness-[0.8] contrast-[1.1]"
              />
              
              {/* Ambient vignette gradient overlays to smooth boundaries */}
              <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-background/20 z-10" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent z-10" />
              
              {/* Glow overlay from bottom corner */}
              <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-accent-blue/30 blur-[80px] z-20 rounded-full" />
            </div>

          </div>
        </div>

        {/* Tagline footer details */}
        <div className="mt-8 md:mt-10 flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-[10px] text-foreground/60 uppercase tracking-widest glass-subtle px-6 py-2.5 rounded-full border border-white dark:border-accent-blue/10 shadow-sm animate-enter delay-4">
          <span>Universitas Negeri Surabaya</span>
          <span className="hidden sm:block text-foreground/40">—</span>
          <span className="text-accent-gold font-bold tracking-[0.25em]">Portal BEM FT</span>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes shineGradient {
            to { background-position: 200% center; }
          }
        `
      }} />
    </section>
  );
}

export default HeroSection;
