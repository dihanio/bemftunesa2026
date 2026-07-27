"use client";

import { motion, AnimatePresence, useScroll, useTransform, useSpring, useReducedMotion, type MotionValue } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import AmbiencePlayer from "./AmbiencePlayer";

/**
 * HERMES AGENT (NOUS RESEARCH) INSPIRED INTERACTIVE EDITORIAL EXPERIENCE
 * 
 * Key Principles:
 * 1. Changing viewport compositions across scroll scenes.
 * 2. High-contrast Editorial Typography as the primary visual hero.
 * 3. Expansive whitespace, quiet luxury color palette (Obsidian, Warm Gold, Soft White).
 * 4. Rich background atmosphere featuring Gedung FT UNESA, fine gridlines, Aksara Jawa & Gold Glow.
 * 5. Minimal text (70% reduction) with high narrative impact.
 * 6. Dual mascot poses integrated organically: Pose 2 in Viewport 1, Pose 1 in Viewport 3.
 */

export default function HermesEditorialExperience() {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [isNavigatingToLogin, setIsNavigatingToLogin] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handlePortalClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setIsNavigatingToLogin(true);
    router.push("/login");
  };

  // Disable heavy sticky scroll animations on mobile or reduced motion preference
  const enableAnimations = !isMobile && !prefersReducedMotion;

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <div ref={containerRef} className={`relative ${enableAnimations ? "h-[900vh]" : "min-h-screen pb-16"} bg-[#040507] text-[#FAFAFA] font-sans`}>
      
      {/* Top Fixed Scroll Progress Bar (Warm Gold Glow Indicator - Guaranteed z-[60] Above Navbar) */}
      <div className="fixed top-0 left-0 right-0 h-[3.5px] bg-[#040507]/80 z-[60] pointer-events-none">
        <motion.div
          className="h-full bg-gradient-to-r from-[#D4AF37] via-amber-300 to-amber-500 shadow-[0_0_14px_rgba(212,175,55,1)] origin-left"
          style={{ scaleX: smoothProgress }}
        />
      </div>

      {/* Floating Centered Header */}
      <header className="fixed top-0 left-0 right-0 z-50 p-6 sm:p-8 flex items-center justify-between pointer-events-auto">
        {/* Left Slot (Spacer for Centering Alignment) */}
        <div className="flex-1 hidden md:block" />

        {/* Center Slot: Centered & Enlarged Logo Trio */}
        <div className="flex-1 flex justify-start md:justify-center items-center">
          <Link href="/" className="flex items-center gap-4 sm:gap-6 bg-[#040507]/60 px-5 sm:px-6 py-2 rounded-full border border-[#D4AF37]/20 backdrop-blur-md shadow-lg shadow-[#D4AF37]/5 hover:border-[#D4AF37]/40 transition-all">
            <Image src="/logobemft.png" alt="BEM FT" width={48} height={48} className="object-contain h-9 sm:h-12 w-auto drop-shadow-[0_0_12px_rgba(212,175,55,0.2)]" style={{ width: "auto" }} />
            <Image src="/logo_kabinet.png" alt="Kabinet BEM FT" width={48} height={48} className="object-contain h-9 sm:h-12 w-auto drop-shadow-[0_0_12px_rgba(212,175,55,0.2)]" style={{ width: "auto" }} />
            <Image src="/logo_adrata.png" alt="PKKMB Adrata" width={52} height={52} className="object-contain h-10 sm:h-13 w-auto drop-shadow-[0_0_12px_rgba(212,175,55,0.2)]" style={{ width: "auto" }} />
          </Link>
        </div>
        
        {/* Right Slot: Ambience + Portal */}
        <div className="flex-1 flex items-center justify-end gap-3 sm:gap-4">
          <AmbiencePlayer />
          <Link
            href="/login"
            onClick={handlePortalClick}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 h-10 text-xs font-mono tracking-[0.15em] text-[#D4AF37] border border-[#D4AF37]/35 bg-[#040507]/40 hover:bg-[#D4AF37]/15 hover:border-[#D4AF37] transition-all uppercase rounded-sm shadow-md cursor-pointer"
          >
            <span>PORTAL</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {enableAnimations ? (
        /* Sticky Fullscreen Viewport Canvas for Desktop */
        <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
          {/* Ambient Background Image & Texture */}
          <BackgroundTexture progress={smoothProgress} enabled={true} />

          {/* VIEWPORT 1: The Monumental Entry featuring Mascot Pose 2 (0.00 - 0.20) */}
          <Viewport1Monument progress={smoothProgress} enabled={true} />

          {/* VIEWPORT 2: The Transformation Manifesto (0.20 - 0.45) */}
          <Viewport2Manifesto progress={smoothProgress} enabled={true} />

          {/* VIEWPORT 3: The Mascot Companions featuring Mascot Pose 1 (0.45 - 0.70) */}
          <Viewport3Companions progress={smoothProgress} enabled={true} />

          {/* VIEWPORT 4: The Three Editorial Pillars (0.70 - 0.88) */}
          <Viewport4Pillars progress={smoothProgress} enabled={true} />

          {/* VIEWPORT 5: The Activation Finale (0.88 - 1.00) */}
          <Viewport5Finale progress={smoothProgress} enabled={true} />
        </div>
      ) : (
        /* Normal Flow Layout for Mobile / Reduced Motion */
        <div className="relative z-10 space-y-12 pt-28">
          <BackgroundTexture progress={smoothProgress} enabled={false} />
          <Viewport1Monument progress={smoothProgress} enabled={false} />
          <Viewport2Manifesto progress={smoothProgress} enabled={false} />
          <Viewport3Companions progress={smoothProgress} enabled={false} />
          <Viewport4Pillars progress={smoothProgress} enabled={false} />
          <Viewport5Finale progress={smoothProgress} enabled={false} />
        </div>
      )}

      {/* Cinematic Page Transition Overlay to Login */}
      <AnimatePresence>
        {isNavigatingToLogin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#040507]/95 backdrop-blur-xl text-[#FAFAFA] pointer-events-auto"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="text-center space-y-4"
            >
              <div className="w-14 h-14 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center mx-auto text-[#D4AF37]">
                <Loader2 className="w-7 h-7 animate-spin" />
              </div>
              <span className="text-xs font-mono tracking-[0.3em] text-[#D4AF37] uppercase block">
                MEMBUKA PORTAL MAHASISWA...
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   BACKGROUND TEXTURE (Gedung FT Image, Grid & Gold Glow)
   ═══════════════════════════════════════════════════ */
function BackgroundTexture({ progress, enabled = true }: { progress: MotionValue<number>; enabled?: boolean }) {
  const bgOpacity = useTransform(progress, [0, 0.5, 1], [0.15, 0.28, 0.18]);
  const glowOpacity = useTransform(progress, [0, 0.5, 1], [0.15, 0.30, 0.20]);
  const glowY = useTransform(progress, [0, 1], [-100, 100]);
  const bgScale = useTransform(progress, [0, 1], [1, 1.15]);

  if (!enabled) {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/gedung_ft_new.jpeg"
            alt="Gedung FT UNESA Background"
            fill
            className="object-cover grayscale opacity-60 filter contrast-125"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#040507] via-[#040507]/80 to-[#040507]" />
        </div>
        <div className="absolute inset-0 opacity-40 bg-[linear-gradient(rgba(212,175,55,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(212,175,55,0.04)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[850px] bg-[#D4AF37]/20 rounded-full blur-[180px]" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <motion.div className="absolute inset-0" style={{ scale: bgScale, opacity: bgOpacity }}>
        <Image
          src="/gedung_ft_new.jpeg"
          alt="Gedung FT UNESA Background"
          fill
          className="object-cover grayscale filter contrast-125"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#040507] via-[#040507]/80 to-[#040507]" />
      </motion.div>
      <div className="absolute inset-0 opacity-40 bg-[linear-gradient(rgba(212,175,55,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(212,175,55,0.04)_1px,transparent_1px)] bg-[size:64px_64px]" />
      <motion.div style={{ opacity: glowOpacity, y: glowY }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[850px] bg-[#D4AF37]/20 rounded-full blur-[180px]" />
      <div className="absolute bottom-12 right-12 text-[18rem] font-serif text-[#D4AF37]/[0.03] select-none pointer-events-none leading-none hidden lg:block">
        ꦥꦏꦏꦩꦧ
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   VIEWPORT 1: THE MONUMENTAL ENTRY (0.00 - 0.20)
   Centered editorial composition with massive typography and Mascot Pose 2.
   ═══════════════════════════════════════════════════ */
function Viewport1Monument({ progress, enabled = true }: { progress: MotionValue<number>; enabled?: boolean }) {
  const animatedOpacity = useTransform(progress, [0, 0.15, 0.22], [1, 1, 0]);
  const animatedScale = useTransform(progress, [0, 0.18], [1, 0.95]);
  const lineDraw = useTransform(progress, [0.02, 0.16], [1, 0]);
  const mascotLeftX = useTransform(progress, [0, 0.18], [-40, 0]);
  const mascotRightX = useTransform(progress, [0, 0.18], [40, 0]);

  if (!enabled) {
    return (
      <div className="relative pt-12 pb-8 px-6 text-center max-w-6xl mx-auto z-20">
        {/* Mascot Pose 2 Integration */}
        <div className="flex justify-between items-end pointer-events-none px-2 mb-6">
          <div className="w-28 sm:w-40 h-auto">
            <Image
              src="/prisha2.png"
              alt="Prisha Pose 2"
              width={240}
              height={240}
              className="w-full h-auto object-contain drop-shadow-[0_0_20px_rgba(212,175,55,0.2)]"
              style={{ height: "auto" }}
              priority
            />
          </div>
          <div className="w-28 sm:w-40 h-auto">
            <Image
              src="/smaya2.png"
              alt="Smaya Pose 2"
              width={240}
              height={240}
              className="w-full h-auto object-contain drop-shadow-[0_0_20px_rgba(212,175,55,0.2)]"
              style={{ height: "auto" }}
              priority
            />
          </div>
        </div>

        <div className="space-y-4 relative z-10 max-w-4xl bg-[#040507]/60 p-6 rounded-2xl backdrop-blur-[2px] mx-auto">
          <span className="text-[#D4AF37]/80 font-mono text-xs tracking-[0.4em] uppercase block">
            FAKULTAS TEKNIK UNESA &middot; KABINET DANADYAKSA 2026
          </span>
          
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.05] text-[#FAFAFA]">
            GERBANG <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-amber-100 to-[#C5A059] font-serif italic">
              TRANSFORMASI
            </span>
          </h1>

          <p className="text-[#8E8E93] text-sm sm:text-base font-light max-w-2xl mx-auto leading-relaxed pt-2">
            Awal dari perjalanan barumu di Fakultas Teknik <span className="inline-block whitespace-nowrap font-medium text-[#FAFAFA]/90">Universitas Negeri Surabaya</span>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      style={{ opacity: animatedOpacity }}
      className="absolute inset-0 flex flex-col items-center justify-center pt-28 sm:pt-36 pb-12 px-6 text-center z-20 pointer-events-none max-w-6xl mx-auto"
    >
      {/* Mascot Pose 2 Integration Flanking Viewport 1 */}
      <div className="absolute inset-0 flex justify-between items-end pointer-events-none px-4 sm:px-12 bottom-12 opacity-60 sm:opacity-90">
        <motion.div style={{ x: mascotLeftX }} className="w-32 sm:w-48 lg:w-56 h-auto">
          <Image
            src="/prisha2.png"
            alt="Prisha Pose 2"
            width={240}
            height={240}
            className="w-full h-auto object-contain drop-shadow-[0_0_20px_rgba(212,175,55,0.2)]"
            style={{ height: "auto" }}
            priority
          />
        </motion.div>
        <motion.div style={{ x: mascotRightX }} className="w-32 sm:w-48 lg:w-56 h-auto">
          <Image
            src="/smaya2.png"
            alt="Smaya Pose 2"
            width={240}
            height={240}
            className="w-full h-auto object-contain drop-shadow-[0_0_20px_rgba(212,175,55,0.2)]"
            style={{ height: "auto" }}
            priority
          />
        </motion.div>
      </div>

      <motion.div style={{ scale: animatedScale }} className="space-y-6 relative z-10 max-w-4xl bg-[#040507]/60 p-6 rounded-2xl backdrop-blur-[2px]">
        <span className="text-[#D4AF37]/80 font-mono text-xs tracking-[0.4em] uppercase block">
          FAKULTAS TEKNIK UNESA &middot; KABINET DANADYAKSA 2026
        </span>
        
        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.05] text-[#FAFAFA]">
          GERBANG <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-amber-100 to-[#C5A059] font-serif italic">
            TRANSFORMASI
          </span>
        </h1>

        <p className="text-[#8E8E93] text-base sm:text-xl font-light max-w-2xl mx-auto leading-relaxed pt-2">
          Awal dari perjalanan barumu di Fakultas Teknik <span className="inline-block whitespace-nowrap font-medium text-[#FAFAFA]/90">Universitas Negeri Surabaya</span>.
        </p>
      </motion.div>

      {/* Editorial Vertical Line Guide */}
      <div className="absolute bottom-8 flex flex-col items-center gap-2 z-10">
        <motion.div className="w-px h-10 bg-[#D4AF37]/40 origin-top" style={{ scaleY: lineDraw }} />
        <span className="text-[10px] font-mono text-[#D4AF37]/50 tracking-[0.3em] uppercase">SCROLL</span>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   VIEWPORT 2: THE TRANSFORMATION MANIFESTO (0.20 - 0.45)
   Asymmetric 70/30 split layout: Left big typography, Right expanding campus image.
   ═══════════════════════════════════════════════════ */
function Viewport2Manifesto({ progress, enabled = true }: { progress: MotionValue<number>; enabled?: boolean }) {
  const animatedOpacity = useTransform(progress, [0.18, 0.23, 0.40, 0.45], [0, 1, 1, 0]);
  const textX = useTransform(progress, [0.18, 0.28], [-60, 0]);
  const imageClip = useTransform(progress, [0.20, 0.35], ["inset(15% 15% 15% 15%)", "inset(0% 0% 0% 0%)"]);
  const imageScale = useTransform(progress, [0.20, 0.35], [1.15, 1]);

  if (!enabled) {
    return (
      <div className="relative py-12 px-6 max-w-7xl mx-auto z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center w-full">
          <div className="lg:col-span-7 space-y-4">
            <span className="text-[#D4AF37]/70 font-mono text-xs tracking-[0.3em] uppercase block">
              01 &mdash; NARRATIVE
            </span>
            
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-[1.1] text-white">
              Hari ini, <br />
              bukan sekadar registrasi. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-amber-200 font-serif italic">
                Ini adalah awal sejarahmu.
              </span>
            </h2>

            <p className="text-[#8E8E93] text-sm sm:text-base font-light leading-relaxed max-w-lg">
              Menjadi mahasiswa berarti mengambil kendali penuh atas masa depanmu. Di sini, kamu mempersiapkan segala kebutuhan sebelum melangkah di Kampus Ketintang.
            </p>
          </div>

          <div className="lg:col-span-5 relative h-60 sm:h-80 border border-[#D4AF37]/20 overflow-hidden rounded-lg">
            <Image
              src="/gedung_ft_new.jpeg"
              alt="Gedung FT UNESA"
              fill
              className="object-cover grayscale opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#040507] via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 font-mono text-[10px] text-[#D4AF37]/80 tracking-widest uppercase">
              FAKULTAS TEKNIK UNESA &middot; SURABAYA
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      style={{ opacity: animatedOpacity }}
      className="absolute inset-0 flex items-center justify-center pt-28 sm:pt-36 pb-12 px-8 z-20 pointer-events-none max-w-7xl mx-auto"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">
        {/* Left Column: Asymmetric Bold Serif Statement (7 Cols) */}
        <motion.div style={{ x: textX }} className="lg:col-span-7 space-y-6">
          <span className="text-[#D4AF37]/70 font-mono text-xs tracking-[0.3em] uppercase block">
            01 &mdash; NARRATIVE
          </span>
          
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-white">
            Hari ini, <br />
            bukan sekadar registrasi. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-amber-200 font-serif italic">
              Ini adalah awal sejarahmu.
            </span>
          </h2>

          <p className="text-[#8E8E93] text-base sm:text-lg font-light leading-relaxed max-w-lg">
            Menjadi mahasiswa berarti mengambil kendali penuh atas masa depanmu. Di sini, kamu mempersiapkan segala kebutuhan sebelum melangkah di Kampus Ketintang.
          </p>
        </motion.div>

        {/* Right Column: Monochrome Expanding Campus Photo (5 Cols) */}
        <motion.div
          style={{ clipPath: imageClip, scale: imageScale }}
          className="lg:col-span-5 relative h-72 sm:h-96 border border-[#D4AF37]/20 overflow-hidden"
        >
          <Image
            src="/gedung_ft_new.jpeg"
            alt="Gedung FT UNESA"
            fill
            className="object-cover grayscale opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#040507] via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 font-mono text-[10px] text-[#D4AF37]/80 tracking-widest uppercase">
            FAKULTAS TEKNIK UNESA &middot; SURABAYA
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   VIEWPORT 3: THE MASCOT COMPANIONS - POSE 1 (0.45 - 0.70)
   Full-bleed artistic mascot unveiling in 3D parallax space featuring Pose 1.
   ═══════════════════════════════════════════════════ */
function Viewport3Companions({ progress, enabled = true }: { progress: MotionValue<number>; enabled?: boolean }) {
  const animatedOpacity = useTransform(progress, [0.45, 0.50, 0.65, 0.70], [0, 1, 1, 0]);
  const prishaX = useTransform(progress, [0.46, 0.58], [-100, 0]);
  const smayaX = useTransform(progress, [0.46, 0.58], [100, 0]);
  const textY = useTransform(progress, [0.46, 0.56], [10, 0]);

  if (!enabled) {
    return (
      <div className="relative py-12 px-6 max-w-7xl mx-auto z-20 space-y-8 text-center">
        <div className="space-y-2">
          <span className="text-[#D4AF37]/80 font-mono text-xs tracking-[0.3em] uppercase block">
            02 &mdash; MASKOT RESMI
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Terhubung dengan Pendamping Perjalananmu
          </h2>
        </div>

        <div className="w-full flex items-end justify-center gap-6 sm:gap-12 my-auto">
          <div className="w-36 sm:w-56 relative">
            <Image
              src="/prisha1.png"
              alt="Prisha Pose 1"
              width={340}
              height={340}
              className="w-full h-auto object-contain drop-shadow-[0_0_25px_rgba(212,175,55,0.25)]"
              style={{ height: "auto" }}
            />
            <div className="mt-2 font-mono text-[10px] sm:text-[11px] text-center text-[#D4AF37]/80 tracking-widest uppercase">
              PRISHA &middot; MASKOT FT
            </div>
          </div>

          <div className="w-36 sm:w-56 relative">
            <Image
              src="/smaya1.png"
              alt="Smaya Pose 1"
              width={340}
              height={340}
              className="w-full h-auto object-contain drop-shadow-[0_0_25px_rgba(212,175,55,0.25)]"
              style={{ height: "auto" }}
            />
            <div className="mt-2 font-mono text-[10px] sm:text-[11px] text-center text-[#D4AF37]/80 tracking-widest uppercase">
              SMAYA &middot; MASKOT FT
            </div>
          </div>
        </div>

        <p className="text-[#8E8E93] text-xs sm:text-sm font-light text-center max-w-md mx-auto">
          Prisha dan Smaya hadir mendampingimu di setiap tahap pengisian berkas hingga pelaksanaan PKKMB.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      style={{ opacity: animatedOpacity }}
      className="absolute inset-0 flex flex-col items-center justify-between pt-36 sm:pt-44 pb-10 px-8 z-20 pointer-events-none max-w-7xl mx-auto"
    >
      {/* Top Statement */}
      <motion.div style={{ y: textY }} className="text-center space-y-3">
        <span className="text-[#D4AF37]/80 font-mono text-xs tracking-[0.3em] uppercase block">
          02 &mdash; MASKOT RESMI
        </span>
        <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
          Terhubung dengan Pendamping Perjalananmu
        </h2>
      </motion.div>

      {/* Parallax Mascot Duo - Pose 1 */}
      <div className="w-full flex items-end justify-between px-4 sm:px-12 my-auto">
        {/* Prisha Pose 1 */}
        <motion.div style={{ x: prishaX }} className="w-40 sm:w-64 md:w-80 relative">
          <Image
            src="/prisha1.png"
            alt="Prisha Pose 1"
            width={340}
            height={340}
            className="w-full h-auto object-contain drop-shadow-[0_0_25px_rgba(212,175,55,0.25)]"
            style={{ height: "auto" }}
          />
          <div className="mt-3 font-mono text-[11px] text-center text-[#D4AF37]/80 tracking-widest uppercase">
            PRISHA &middot; MASKOT FT
          </div>
        </motion.div>

        {/* Smaya Pose 1 */}
        <motion.div style={{ x: smayaX }} className="w-40 sm:w-64 md:w-80 relative">
          <Image
            src="/smaya1.png"
            alt="Smaya Pose 1"
            width={340}
            height={340}
            className="w-full h-auto object-contain drop-shadow-[0_0_25px_rgba(212,175,55,0.25)]"
            style={{ height: "auto" }}
          />
          <div className="mt-3 font-mono text-[11px] text-center text-[#D4AF37]/80 tracking-widest uppercase">
            SMAYA &middot; MASKOT FT
          </div>
        </motion.div>
      </div>

      {/* Bottom Editorial Caption */}
      <p className="text-[#8E8E93] text-sm font-light text-center max-w-md mb-4">
        Prisha dan Smaya hadir mendampingimu di setiap tahap pengisian berkas hingga pelaksanaan PKKMB.
      </p>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   VIEWPORT 4: THE THREE EDITORIAL PILLARS (0.70 - 0.88)
   Clean 3-column editorial typography layout (No cards!).
   ═══════════════════════════════════════════════════ */
function Viewport4Pillars({ progress, enabled = true }: { progress: MotionValue<number>; enabled?: boolean }) {
  const animatedOpacity = useTransform(progress, [0.70, 0.74, 0.84, 0.88], [0, 1, 1, 0]);

  // Column Highlight Multipliers
  const col1Opacity = useTransform(progress, [0.71, 0.76], [0.3, 1]);
  const col2Opacity = useTransform(progress, [0.75, 0.80], [0.3, 1]);
  const col3Opacity = useTransform(progress, [0.79, 0.84], [0.3, 1]);

  if (!enabled) {
    return (
      <div className="relative py-12 px-6 max-w-7xl mx-auto z-20">
        <div className="mb-8">
          <span className="text-[#D4AF37]/70 font-mono text-xs tracking-[0.3em] uppercase block mb-2">
            03 &mdash; TAHAPAN ORIENTASI
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Tiga Langkah Utama
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-[#D4AF37]/20 pt-8">
          <div className="space-y-3">
            <span className="font-mono text-lg text-[#D4AF37] font-bold block">01 &mdash; BERKAS</span>
            <h3 className="text-lg font-bold text-white">Mempersiapkan Dirimu</h3>
            <p className="text-[#8E8E93] text-sm leading-relaxed font-light">
              Pengisian formulir biodata maba, verifikasi data administrasi, dan pengunggahan berkas awal PKKMB FT secara terstruktur.
            </p>
          </div>

          <div className="space-y-3">
            <span className="font-mono text-lg text-[#D4AF37] font-bold block">02 &mdash; KELOMPOK</span>
            <h3 className="text-lg font-bold text-white">Menemukan Mentormu</h3>
            <p className="text-[#8E8E93] text-sm leading-relaxed font-light">
              Mendapatkan nomor kelompok serta terhubung langsung dengan mentor pendamping senior dari Fakultas Teknik.
            </p>
          </div>

          <div className="space-y-3">
            <span className="font-mono text-lg text-[#D4AF37] font-bold block">03 &mdash; EXPEDITION</span>
            <h3 className="text-lg font-bold text-white">Melangkah ke Kampus</h3>
            <p className="text-[#8E8E93] text-sm leading-relaxed font-light">
              Pelaksanaan orientasi fisik di Gedung Fakultas Teknik UNESA Kampus Ketintang, Surabaya pada 18 Agustus 2026.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      style={{ opacity: animatedOpacity }}
      className="absolute inset-0 flex flex-col justify-center pt-28 sm:pt-36 pb-12 px-8 z-20 pointer-events-none max-w-7xl mx-auto"
    >
      <div className="mb-12">
        <span className="text-[#D4AF37]/70 font-mono text-xs tracking-[0.3em] uppercase block mb-2">
          03 &mdash; TAHAPAN ORIENTASI
        </span>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Tiga Langkah Utama
        </h2>
      </div>

      {/* Wide 3-Column Pure Editorial Typography Spread (No Cards!) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-[#D4AF37]/20 pt-8">
        
        {/* Column 1 */}
        <motion.div style={{ opacity: col1Opacity }} className="space-y-4">
          <span className="font-mono text-xl text-[#D4AF37] font-bold block">01 &mdash; BERKAS</span>
          <h3 className="text-xl font-bold text-white">Mempersiapkan Dirimu</h3>
          <p className="text-[#8E8E93] text-sm leading-relaxed font-light">
            Pengisian formulir biodata maba, verifikasi data administrasi, dan pengunggahan berkas awal PKKMB FT secara terstruktur.
          </p>
        </motion.div>

        {/* Column 2 */}
        <motion.div style={{ opacity: col2Opacity }} className="space-y-4">
          <span className="font-mono text-xl text-[#D4AF37] font-bold block">02 &mdash; KELOMPOK</span>
          <h3 className="text-xl font-bold text-white">Menemukan Mentormu</h3>
          <p className="text-[#8E8E93] text-sm leading-relaxed font-light">
            Mendapatkan nomor kelompok serta terhubung langsung dengan mentor pendamping senior dari Fakultas Teknik.
          </p>
        </motion.div>

        {/* Column 3 */}
        <motion.div style={{ opacity: col3Opacity }} className="space-y-4">
          <span className="font-mono text-xl text-[#D4AF37] font-bold block">03 &mdash; EXPEDITION</span>
          <h3 className="text-xl font-bold text-white">Melangkah ke Kampus</h3>
          <p className="text-[#8E8E93] text-sm leading-relaxed font-light">
            Pelaksanaan orientasi fisik di Gedung Fakultas Teknik UNESA Kampus Ketintang, Surabaya pada 18 Agustus 2026.
          </p>
        </motion.div>

      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   VIEWPORT 5: THE ACTIVATION FINALE (0.88 - 1.00)
   Centered minimal activation statement with countdown & CTA.
   ═══════════════════════════════════════════════════ */
function Viewport5Finale({ progress, enabled = true }: { progress: MotionValue<number>; enabled?: boolean }) {
  const animatedOpacity = useTransform(progress, [0.87, 0.92], [0, 1]);
  const animatedScale = useTransform(progress, [0.87, 0.95], [0.95, 1]);

  const [countdownTime, setCountdownTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const target = new Date("2026-08-18T07:00:00").getTime();
    function tick() {
      const d = target - Date.now();
      if (d <= 0) return;
      setCountdownTime({
        days: Math.floor(d / 86400000),
        hours: Math.floor((d % 86400000) / 3600000),
        minutes: Math.floor((d % 3600000) / 60000),
        seconds: Math.floor((d % 60000) / 1000),
      });
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (!enabled) {
    return (
      <div className="relative py-12 px-6 text-center z-30 max-w-4xl mx-auto">
        <div className="relative z-10 space-y-6 max-w-2xl bg-[#040507]/80 p-6 sm:p-8 rounded-2xl backdrop-blur-sm border border-[#D4AF37]/15 mx-auto">
          <span className="text-[#D4AF37]/80 font-mono text-xs tracking-[0.4em] uppercase block">
            04 &mdash; AKTIVASI AKUN PORTAL
          </span>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Siap Memulai Perjalananmu?
          </h2>

          <p className="text-[#8E8E93] text-sm font-light max-w-md mx-auto leading-relaxed">
            Aktivasi akun portalmu sekarang untuk membuka akses informasi penugasan, kelompok, dan mentor resmi PKKMB FT UNESA 2026.
          </p>

          <div className="py-2 font-mono text-sm sm:text-lg text-[#D4AF37] tracking-widest font-bold">
            {String(countdownTime.days).padStart(2, "0")} HARI &middot; {String(countdownTime.hours).padStart(2, "0")} JAM &middot; {String(countdownTime.minutes).padStart(2, "0")} MENIT &middot; {String(countdownTime.seconds).padStart(2, "0")} DETIK
          </div>

          <div className="pt-2">
            <Link
              href="/login"
              className="group inline-flex items-center gap-3 px-8 py-3.5 bg-[#D4AF37] hover:bg-amber-400 text-black font-bold font-mono text-xs uppercase tracking-widest transition-all shadow-xl shadow-[#D4AF37]/10"
            >
              <span>AKTIVASI AKUN SEKARANG</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="pt-6 font-mono text-[10px] text-[#8E8E93]/60 tracking-widest uppercase">
            &copy; 2026 BEM FT UNESA &middot; KABINET DANADYAKSA &middot; SURABAYA
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      style={{ opacity: animatedOpacity, scale: animatedScale }}
      className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center z-30 pointer-events-auto max-w-4xl mx-auto"
    >
      <div className="relative z-10 space-y-6 max-w-2xl bg-[#040507]/80 p-8 rounded-2xl backdrop-blur-sm border border-[#D4AF37]/15">
        <span className="text-[#D4AF37]/80 font-mono text-xs tracking-[0.4em] uppercase block">
          04 &mdash; AKTIVASI AKUN PORTAL
        </span>

        <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Siap Memulai Perjalananmu?
        </h2>

        <p className="text-[#8E8E93] text-sm sm:text-base font-light max-w-md mx-auto leading-relaxed">
          Aktivasi akun portalmu sekarang untuk membuka akses informasi penugasan, kelompok, dan mentor resmi PKKMB FT UNESA 2026.
        </p>

        {/* Live Countdown Clock */}
        <div className="py-2 font-mono text-base sm:text-xl text-[#D4AF37] tracking-widest font-bold">
          {String(countdownTime.days).padStart(2, "0")} HARI &middot; {String(countdownTime.hours).padStart(2, "0")} JAM &middot; {String(countdownTime.minutes).padStart(2, "0")} MENIT &middot; {String(countdownTime.seconds).padStart(2, "0")} DETIK
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <Link
            href="/login"
            className="group inline-flex items-center gap-3 px-10 py-4 bg-[#D4AF37] hover:bg-amber-400 text-black font-bold font-mono text-xs uppercase tracking-widest transition-all shadow-xl shadow-[#D4AF37]/10"
          >
            <span>AKTIVASI AKUN SEKARANG</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Minimal Footer */}
        <div className="pt-8 font-mono text-[10px] text-[#8E8E93]/60 tracking-widest uppercase">
          &copy; 2026 BEM FT UNESA &middot; KABINET DANADYAKSA &middot; SURABAYA
        </div>
      </div>
    </motion.div>
  );
}
