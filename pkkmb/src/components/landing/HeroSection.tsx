"use client";

import Image from "next/image";
import Link from "next/link";
import { API_URL } from "@/lib/api";
import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { Download, ArrowRight } from "lucide-react";
import CountdownWidget from "./CountdownWidget";

export default function HeroSection() {
  const [panduanUrl, setPanduanUrl] = useState("/docs/booklet-pkkmb-ft-unesa-2026.pdf");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/v1/settings/public/links`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data?.pkkmb_buku_panduan_url && data.data.pkkmb_buku_panduan_url !== '#') {
          setPanduanUrl(data.data.pkkmb_buku_panduan_url);
        }
      })
      .catch(err => console.error("Failed to fetch public links:", err));
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  // Parallax transforms
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);

  return (
    <section
      ref={containerRef}
      id="beranda"
      aria-label="Hero: Selamat Datang di PKKMB FT UNESA 2026"
      className="relative min-h-[100svh] flex flex-col items-center justify-center overflow-hidden p-2 md:p-6"
    >
      {/* ── Background Foto Gedung FT UNESA ── */}
      <motion.div
        style={{ y: bgY }}
        className="absolute inset-2 md:inset-6 rounded-[1.5rem] md:rounded-[3rem] overflow-hidden will-change-transform"
        aria-hidden="true"
      >
        <Image
          src="/images/gedung_ft_new.webp"
          alt="Gedung Fakultas Teknik Universitas Negeri Surabaya"
          fill
          priority
          quality={75}
          className="object-cover object-center"
          sizes="100vw"
        />
        {/* Deep pure black overlay */}
        <div className="absolute inset-0 bg-black/50" />
        {/* Gradient fade to pure black at bottom & edges */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent" />
        <div className="absolute inset-0 shadow-[inset_0_0_100px_40px_rgba(0,0,0,0.8)]" />
        
        {/* Subtle gold center bloom */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 
                        w-[800px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(234,179,8,0.12)_0%,transparent_60%)]" />
      </motion.div>

      {/* ── Content ── */}
      <motion.div
        style={{ y: contentY }}
        className="relative z-10 flex flex-col items-center text-center
                   px-6 pt-24 pb-32 max-w-5xl mx-auto w-full"
      >
        {/* Headline Utama */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="font-display font-black text-6xl md:text-7xl lg:text-8xl
                     text-[#ffffff] leading-[1.05] mb-4 md:mb-6 tracking-tight drop-shadow-[0_10px_40px_rgba(0,0,0,0.8)]"
        >
          <span className="block text-[#f5f5f5] text-2xl md:text-4xl lg:text-5xl font-medium tracking-wide mb-2">PKKMB FT UNESA 2026</span>
          <span className="block gradient-gold text-glow-gold">ADRATA</span>
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="text-white font-body text-base md:text-xl max-w-2xl
                     mb-10 md:mb-12 leading-relaxed tracking-wide drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] font-medium"
        >
          Salam Rumah Kita, Insinyur Muda. Persiapkan dirimu untuk menempuh perjalanan yang tak terkalahkan.
        </motion.p>

        {/* Countdown */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-14"
        >
          <CountdownWidget />
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row items-center gap-5"
        >
          <Link
            href="/login"
            id="cta-masuk-portal"
            className="group relative flex items-center gap-3 px-8 py-4 rounded-xl
                       bg-white text-black font-body font-bold text-sm tracking-wide uppercase
                       transition-all duration-300 cursor-pointer hover:bg-gold-400
                       pulse-gold"
          >
            <span>Mulai Perjalanan</span>
            <ArrowRight
              size={18}
              className="group-hover:translate-x-1 transition-transform duration-300"
              aria-hidden="true"
            />
          </Link>

          <a
            href={panduanUrl}
            download={panduanUrl.includes('/docs/booklet') ? true : undefined}
            id="cta-unduh-booklet"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-8 py-4 rounded-xl
                       glass hover:bg-white/5 text-white/80 hover:text-white
                       font-body font-medium text-sm tracking-wide uppercase
                       transition-all duration-300 cursor-pointer"
          >
            <Download size={18} aria-hidden="true" />
            <span>Unduh Panduan</span>
          </a>
        </motion.div>
      </motion.div>

      {/* ── Scroll Indicator ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10"
        aria-hidden="true"
      >
        <div className="flex flex-col items-center gap-3">
          <span className="text-[10px] text-white/60 uppercase tracking-[0.3em] font-body font-medium">
            Gulir
          </span>
          <motion.div 
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-px h-12 bg-gradient-to-b from-white/30 to-transparent" 
          />
        </div>
      </motion.div>
    </section>
  );
}
