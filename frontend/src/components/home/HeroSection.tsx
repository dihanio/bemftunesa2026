"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles, MessageCircle } from "lucide-react";
import PublicApiService from "@/lib/api";

type MascotType = "prisha" | "smaya";

export function HeroSection() {
  const [stats, setStats] = useState({
    departments: 7,
    proker: 20,
    konstituen: "10k+"
  });

  const [activeMascot, setActiveMascot] = useState<MascotType>("prisha");
  const [showSpeechBubble, setShowSpeechBubble] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await PublicApiService.getStats();
        const rawData: unknown = res?.data;
        let data: Partial<typeof stats> | undefined;
        if (rawData && typeof rawData === "object") {
          if ("departments" in rawData || "proker" in rawData) {
            data = rawData as Partial<typeof stats>;
          } else if ("data" in rawData) {
            const nested = (rawData as Record<string, unknown>).data;
            if (nested && typeof nested === "object") {
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

  const mascotData = {
    prisha: {
      name: "Prisha",
      role: "Maskot Advokasi & Pelayanan",
      greeting: "Halo Rek! Ada aspirasi kampus? Kami siap kawal! 💙",
      image: "/images/prisha_waving.webp",
      alt: "Maskot Prisha BEM FT UNESA"
    },
    smaya: {
      name: "Smaya",
      role: "Maskot Inovasi & Karya Teknik",
      greeting: "Salam Teknik! Mari bersinergi dan berinovasi bersama! ⚡",
      image: "/images/smaya_cheering.webp",
      alt: "Maskot Smaya BEM FT UNESA"
    }
  };

  const currentMascot = mascotData[activeMascot];

  return (
    <section className="relative w-full min-h-[70vh] flex flex-col items-center justify-center pt-28 pb-6 px-6 overflow-hidden bg-background">
      {/* Simplified ambient glow */}
      <div 
        className="absolute top-[10%] left-[-10%] w-[40vw] h-[40vw] max-w-[400px] max-h-[400px] rounded-full bg-accent-blue/10 blur-[80px] pointer-events-none -z-10" 
      />
      <div 
        className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] max-w-[400px] max-h-[400px] rounded-full bg-accent-blue/10 blur-[80px] pointer-events-none -z-10" 
      />

      {/* Grid Overlay */}
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

            {/* Right Column: FT Building Image & Interactive Mascot */}
            <div className="lg:col-span-7 relative w-full h-[320px] sm:h-[380px] lg:h-auto min-h-[320px] lg:min-h-[420px] overflow-hidden bg-slate-200/30 dark:bg-slate-800/15 group/rightCol">
              <Image
                src="/images/gedung-ft.webp"
                alt="Gedung Fakultas Teknik UNESA"
                fill
                priority={false}
                sizes="(max-width: 768px) 95vw, (max-width: 1200px) 90vw, 1200px"
                style={{ objectFit: "cover", objectPosition: "center" }}
                className="transition-transform duration-500 ease-out group-hover/card:scale-[1.02] brightness-[0.85] contrast-[1.05]"
              />
              
              {/* Ambient vignette gradient overlays */}
              <div className="absolute inset-0 bg-gradient-to-r from-background/50 via-transparent to-background/20 z-10" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent z-10" />
              
              {/* Single corner glow */}
              <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-accent-blue/20 blur-[60px] z-20 rounded-full" />

              {/* Floating Mascot Widget */}
              <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-20 flex flex-col items-end gap-2 max-w-[280px] sm:max-w-[320px]">
                
                {/* Speech Bubble */}
                {showSpeechBubble && (
                  <div className="relative glass-active p-3 rounded-2xl border border-accent-blue/30 shadow-2xl backdrop-blur-md animate-enter transition-all duration-300">
                    <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-accent-gold animate-pulse" />
                        <span className="text-[11px] font-bold text-accent-gold font-mono tracking-wide">
                          {currentMascot.name}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-accent-blue/20 text-accent-blue font-semibold">
                          {currentMascot.role}
                        </span>
                      </div>
                      <button 
                        onClick={() => setShowSpeechBubble(false)}
                        className="text-foreground/40 hover:text-foreground text-xs px-1"
                        title="Tutup percakapan"
                      >
                        ✕
                      </button>
                    </div>
                    
                    <p className="text-xs text-foreground/90 font-medium leading-snug">
                      {currentMascot.greeting}
                    </p>

                    {/* Speech pointer */}
                    <div className="absolute -bottom-2 right-8 w-3 h-3 bg-slate-900 border-r border-b border-accent-blue/30 rotate-45" />
                  </div>
                )}

                {/* Mascot Image & Selector Bar */}
                <div className="flex items-end gap-2">
                  {/* Selector Pills */}
                  <div className="glass-subtle p-1 rounded-full flex flex-col gap-1 border border-white/10 backdrop-blur-md shadow-lg">
                    <button
                      onClick={() => {
                        setActiveMascot("prisha");
                        setShowSpeechBubble(true);
                      }}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-full transition-all ${
                        activeMascot === "prisha"
                          ? "bg-accent-blue text-white shadow-md"
                          : "text-foreground/70 hover:text-foreground hover:bg-white/10"
                      }`}
                      title="Tampilkan Prisha"
                    >
                      Prisha
                    </button>
                    <button
                      onClick={() => {
                        setActiveMascot("smaya");
                        setShowSpeechBubble(true);
                      }}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-full transition-all ${
                        activeMascot === "smaya"
                          ? "bg-accent-blue text-white shadow-md"
                          : "text-foreground/70 hover:text-foreground hover:bg-white/10"
                      }`}
                      title="Tampilkan Smaya"
                    >
                      Smaya
                    </button>
                  </div>

                  {/* Mascot Avatar */}
                  <div 
                    className="relative cursor-pointer group/mascot transition-transform hover:scale-105 active:scale-95"
                    onClick={() => setShowSpeechBubble(prev => !prev)}
                    title={`Klik untuk berinteraksi dengan ${currentMascot.name}`}
                  >
                    <div className="relative w-28 h-36 sm:w-36 sm:h-44 drop-shadow-[0_10px_20px_rgba(0,0,0,0.4)] transition-all duration-300">
                      <Image
                        src={currentMascot.image}
                        alt={currentMascot.alt}
                        fill
                        sizes="180px"
                        style={{ objectFit: "contain", objectPosition: "bottom" }}
                        className="transition-all duration-300 group-hover/mascot:brightness-110"
                      />
                    </div>

                    {/* Interactive hint icon */}
                    <div className="absolute top-0 right-0 p-1 rounded-full bg-accent-blue text-white shadow-md group-hover/mascot:scale-110 transition-transform">
                      <MessageCircle className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>

              </div>

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