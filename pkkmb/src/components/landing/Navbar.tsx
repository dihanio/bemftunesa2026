"use client";

import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Terminal } from "lucide-react";
import AmbiencePlayer from "./AmbiencePlayer";

export default function Navbar() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 80));

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "py-2 sm:py-3 bg-[#08090C]/90 backdrop-blur-md border-b border-amber-500/20"
          : "py-3 sm:py-5 bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 flex items-center justify-between gap-2">
        <Link href="/" className="flex items-center gap-2 sm:gap-3 bg-[#040507]/60 px-3 sm:px-4 py-1.5 rounded-full border border-[#D4AF37]/20 backdrop-blur-md">
          <Image src="/logobemft.png" alt="BEM FT" width={28} height={28} className="object-contain h-5 sm:h-7 w-auto" style={{ width: "auto" }} />
          <Image src="/logo_kabinet.png" alt="Kabinet" width={28} height={28} className="object-contain h-5 sm:h-7 w-auto" style={{ width: "auto" }} />
          <Image src="/logo_adrata.png" alt="Adrata" width={36} height={36} className="object-contain h-6 sm:h-9 w-auto" style={{ width: "auto" }} />
        </Link>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <AmbiencePlayer />
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-mono font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 rounded-none transition-colors border border-amber-500/30 uppercase tracking-wider shrink-0"
          >
            <Terminal className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
            <span className="hidden sm:inline">KONSOL </span>
            <span>PORTAL</span>
          </Link>
        </div>
      </div>
    </motion.header>
  );
}
