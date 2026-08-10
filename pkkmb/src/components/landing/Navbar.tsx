"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useState } from "react";

export default function Navbar() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 50);
  });

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b ${
        scrolled
          ? "bg-black/60 backdrop-blur-xl border-white/10 py-3"
          : "bg-transparent border-transparent py-5"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
        {/* Logo Area */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 md:w-12 md:h-12 shrink-0 transition-transform duration-500 group-hover:scale-110">
            <Image
              src="/icon-adrata.webp"
              alt="Logo PKKMB Adrata"
              fill
              className="object-contain"
              sizes="36px"
            />
          </div>
          <div className="flex flex-col">
            <span style={{ color: '#166534' }} className="font-display font-bold text-sm md:text-base leading-none tracking-wide">
              PKKMB FT UNESA
            </span>
            <span className="font-body text-[10px] md:text-xs text-gold-500 font-semibold uppercase tracking-[0.2em] mt-0.5">
              Adrata 2026
            </span>
          </div>
        </Link>

        {/* Desktop Nav (Opsional, minimal) */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="#tentang" className="text-white/60 hover:text-white font-body text-xs uppercase tracking-widest transition-colors">
            Filosofi
          </Link>
          <Link href="#faq" className="text-white/60 hover:text-white font-body text-xs uppercase tracking-widest transition-colors">
            FAQ
          </Link>
          <Link
            href="/login"
            className="px-6 py-2.5 rounded-lg bg-white text-black hover:bg-gold-400 font-body text-xs font-bold uppercase tracking-widest transition-all duration-300 shadow-[0_0_20px_rgba(234,179,8,0.15)]"
          >
            Masuk Portal
          </Link>
        </nav>
      </div>
    </motion.header>
  );
}
