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
          ? "py-3 bg-[#08090C]/90 backdrop-blur-md border-b border-amber-500/20"
          : "py-5 bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logobemft.png" alt="BEM FT" width={28} height={28} className="object-contain h-6 sm:h-7 w-auto" style={{ width: "auto" }} />
          <Image src="/logo_kabinet.png" alt="Kabinet" width={28} height={28} className="object-contain h-6 sm:h-7 w-auto" style={{ width: "auto" }} />
          <Image src="/logo_adrata.png" alt="Adrata" width={36} height={36} className="object-contain h-8 sm:h-9 w-auto" style={{ width: "auto" }} />
        </Link>

        <div className="flex items-center gap-3">
          <AmbiencePlayer />
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 rounded-none transition-colors border border-amber-500/30 uppercase tracking-wider"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>KONSOL PORTAL</span>
          </Link>
        </div>
      </div>
    </motion.header>
  );
}
