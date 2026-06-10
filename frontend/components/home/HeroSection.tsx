"use client";

import Link from "next/link";
import Image from "next/image";
import { useStats } from "@/hooks/useStats";

export function HeroSection() {
  const { data: statsData } = useStats();
  const membersCount = statsData?.data?.members || "00";
  return (
    <section className="hero-section" id="hero">
      {/* Ambient background glow */}
      <div className="hero-ambient" />

      {/* Architectural details (reduced on small screens to reduce noise) */}
      <div className="absolute inset-0 z-1 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/[0.05]" />
        <div className="absolute top-0 left-[15%] w-[1px] h-full bg-white/[0.05] hidden md:block" />
        <div className="absolute top-0 right-[15%] w-[1px] h-full bg-white/[0.05] hidden md:block" />

        {/* Corner Coordinates */}
        <div className="absolute top-24 left-10 flex-col gap-1 hidden lg:flex">
          <span className="text-[10px] font-mono text-white/20 tracking-tighter">
            REF_ID: BEMFT_v2.0
          </span>
          <span className="text-[10px] font-mono text-white/20 tracking-tighter">
            COORD: 07.23S / 112.72E
          </span>
          <span className="text-[10px] font-mono text-[#10b981]/40 tracking-tighter mt-2 flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-[#10b981] animate-pulse" />
            PULSE: {membersCount}_ACTV_PSNL
          </span>
        </div>

        {/* Blueprint Crosshairs */}
        <div className="absolute top-1/2 left-[15%] -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-white/20 hidden lg:block">
          <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/20" />
          <div className="absolute top-0 left-1/2 w-[1px] h-full bg-white/20" />
        </div>
      </div>

      {/* The main card container — image sits INSIDE this */}
      <div className="hero-card">
        {/* The building image — inside a rounded container */}
        <div className="hero-card-img-wrapper">
          <Image
            src="/gedung ft.png"
            alt="Gedung Fakultas Teknik UNESA"
            fill
            priority
            sizes="(max-width: 768px) 95vw, (max-width: 1200px) 90vw, 1200px"
            style={{ objectFit: "cover", objectPosition: "center 35%" }}
          />
          {/* Subtle gradient for text readability near bottom-left */}
          <div className="hero-card-gradient" />
        </div>

        {/* Title that breaks out of the card boundary */}
        <div className="hero-title-block">
          <div className="hero-title-frame">
            <h1 className="hero-title">
              <span className="line-1">BEM</span>
              <span className="line-2">FAKULTAS</span>
              <span className="line-2">TEKNIK</span>
            </h1>
            <p className="text-sm text-white/80 mt-3 max-w-sm leading-relaxed">
              Ruang kolaborasi mahasiswa teknik untuk informasi, advokasi, dan
              gerakan berdampak.
            </p>
            <Link href="/aspirasi" className="hero-cta-pill mt-5 inline-block">
              Kirim Aspirasi Sekarang
            </Link>
          </div>
        </div>
      </div>

      {/* Tagline under the card */}
      <div className="hero-tagline">
        <p>Universitas Negeri Surabaya</p>
        <span className="hero-tagline-sep">—</span>
        <p>Sinergi Nyata, Teknik Berdaya</p>
      </div>
    </section>
  );
}
