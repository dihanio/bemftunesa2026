"use client";

import { motion, AnimatePresence, useScroll, useTransform, type MotionValue } from "framer-motion";
import { useRef, useState, useEffect, memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import AmbiencePlayer from "./AmbiencePlayer";


/**
 * HERMES AGENT (NOUS RESEARCH) INSPIRED INTERACTIVE EDITORIAL EXPERIENCE
 * 
 * UNIVERSAL SCROLL-DRIVEN STORYTELLING (MOBILE & DESKTOP):
 * 1. 900vh Sticky Scroll Container: Viewport pins to screen (sticky top-0 h-screen).
 * 2. Pure Scroll Timeline: User scroll controls 5-scene transitions in-place.
 * 3. 100% Mobile & Desktop Responsive: Typography, mascot sizes, and grid layouts scale down gracefully on mobile screens.
 * 4. Display-None Optimization: Inactive viewports set display: "none" via useTransform for zero GPU overhead.
 */

export default function HermesEditorialExperience() {
  const router = useRouter();
  const [isNavigatingToLogin, setIsNavigatingToLogin] = useState(false);

  const handlePortalClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setIsNavigatingToLogin(true);
    router.push("/login");
  };

  return (
    <main className="bg-[#040507] text-[#FAFAFA] font-sans selection:bg-[#D4AF37]/30 min-h-screen relative overflow-x-clip">
      
      {/* Floating Centered Responsive Header (Universal) */}
      <header className="fixed top-0 left-0 right-0 z-50 p-3 sm:p-6 md:p-8 flex items-center justify-between pointer-events-auto gap-2">
        {/* Left Spacer for Alignment */}
        <div className="flex-1 hidden md:block" />

        {/* Center Logo Trio */}
        <div className="flex-1 flex justify-start md:justify-center items-center">
          <Link href="/" className="flex items-center gap-2.5 sm:gap-5 bg-[#040507]/75 px-3 sm:px-6 py-1.5 sm:py-2 rounded-full border border-[#D4AF37]/20 backdrop-blur-md shadow-lg shadow-[#D4AF37]/5 hover:border-[#D4AF37]/40 transition-all">
            <Image src="/logobemft.png" alt="BEM FT" width={48} height={48} className="object-contain h-6 sm:h-10 w-auto drop-shadow-[0_0_12px_rgba(212,175,55,0.2)]" style={{ width: "auto" }} />
            <Image src="/logo_kabinet.png" alt="Kabinet BEM FT" width={48} height={48} className="object-contain h-6 sm:h-10 w-auto drop-shadow-[0_0_12px_rgba(212,175,55,0.2)]" style={{ width: "auto" }} />
            <Image src="/logo_adrata.png" alt="PKKMB Adrata" width={52} height={52} className="object-contain h-7 sm:h-11 w-auto drop-shadow-[0_0_12px_rgba(212,175,55,0.2)]" style={{ width: "auto" }} />
          </Link>
        </div>
        
        {/* Right Actions: Ambience + Portal Button */}
        <div className="flex-1 flex items-center justify-end gap-2 sm:gap-4 shrink-0">
          <AmbiencePlayer />
          <Link
            href="/login"
            onClick={handlePortalClick}
            className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-5 py-2 sm:py-2.5 h-9 sm:h-10 text-[10px] sm:text-xs font-mono tracking-[0.1em] sm:tracking-[0.15em] text-[#D4AF37] border border-[#D4AF37]/35 bg-[#040507]/60 hover:bg-[#D4AF37]/15 hover:border-[#D4AF37] transition-all uppercase rounded-sm shadow-md cursor-pointer shrink-0"
          >
            <span>PORTAL</span>
            <ArrowRight className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
          </Link>
        </div>
      </header>

      {/* Universal Scroll-Driven Storytelling (Mobile & Desktop) */}
      <UniversalStickyExperience />

      {/* Page Transition Loading Overlay */}
      <AnimatePresence>
        {isNavigatingToLogin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#040507]/95 backdrop-blur-xl text-[#FAFAFA] pointer-events-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="text-center space-y-4"
            >
              <div className="w-12 h-12 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center mx-auto text-[#D4AF37]">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
              <span className="text-xs font-mono tracking-[0.3em] text-[#D4AF37] uppercase block">
                MEMBUKA PORTAL MAHASISWA...
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

/* ═══════════════════════════════════════════════════
   UNIVERSAL STICKY SCROLL EXPERIENCE (MOBILE & DESKTOP)
   900vh scroll container + pinned sticky viewport canvas
   ═══════════════════════════════════════════════════ */
function UniversalStickyExperience() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  return (
    <div ref={containerRef} className="relative h-[900vh] bg-[#040507] text-[#FAFAFA] font-sans">
      {/* Top Fixed Scroll Progress Bar (Warm Gold Glow Indicator) */}
      <div className="fixed top-0 left-0 right-0 h-[3.5px] bg-[#040507]/80 z-[60] pointer-events-none">
        <motion.div
          className="h-full bg-gradient-to-r from-[#D4AF37] via-amber-300 to-amber-500 shadow-[0_0_14px_rgba(212,175,55,1)] origin-left transform-gpu"
          style={{ scaleX: scrollYProgress }}
        />
      </div>

      {/* Sticky Fullscreen Viewport Canvas */}
      <div className="sticky top-0 h-screen w-full overflow-hidden relative">
        <BackgroundTexture progress={scrollYProgress} />
        <Viewport1 progress={scrollYProgress} />
        <Viewport2 progress={scrollYProgress} />
        <Viewport3 progress={scrollYProgress} />
        <Viewport4 progress={scrollYProgress} />
        <Viewport5 progress={scrollYProgress} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SCENE 0: BACKGROUND TEXTURE
   ═══════════════════════════════════════════════════ */
const BackgroundTexture = memo(function BackgroundTexture({ progress }: { progress: MotionValue<number> }) {
  const bgOpacity = useTransform(progress, [0, 0.5, 1], [0.15, 0.28, 0.18]);
  const glowOpacity = useTransform(progress, [0, 0.5, 1], [0.15, 0.30, 0.20]);
  const glowY = useTransform(progress, [0, 1], [-100, 100]);
  const bgScale = useTransform(progress, [0, 1], [1, 1.15]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <motion.div className="absolute inset-0 transform-gpu" style={{ scale: bgScale, opacity: bgOpacity }}>
        <Image
          src="/gedung_ft_new.jpeg"
          alt="Gedung FT UNESA Background"
          fill
          sizes="100vw"
          className="object-cover grayscale filter contrast-125"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#040507] via-[#040507]/80 to-[#040507]" />
      </motion.div>
      <div className="absolute inset-0 opacity-40 bg-[linear-gradient(rgba(212,175,55,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(212,175,55,0.04)_1px,transparent_1px)] bg-[size:32px_32px] sm:bg-[size:64px_64px]" />
      <motion.div style={{ opacity: glowOpacity, y: glowY }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[850px] h-[350px] sm:h-[850px] bg-[#D4AF37]/20 rounded-full blur-[100px] sm:blur-[180px] transform-gpu" />
      <div className="absolute bottom-12 right-12 text-[18rem] font-serif text-[#D4AF37]/[0.03] select-none pointer-events-none leading-none hidden lg:block">
        ꦥꦏꦏꦩꦧ
      </div>
    </div>
  );
});

/* ═══════════════════════════════════════════════════
   SCENE 1: GERBANG TRANSFORMASI (0.00 - 0.22)
   ═══════════════════════════════════════════════════ */
const Viewport1 = memo(function Viewport1({ progress }: { progress: MotionValue<number> }) {
  const opacity = useTransform(progress, [0, 0.12, 0.20], [1, 1, 0]);
  const display = useTransform(progress, (p) => (p > 0.22 ? "none" : "flex"));
  const scale = useTransform(progress, [0, 0.18], [1, 0.95]);
  const lineDraw = useTransform(progress, [0.02, 0.16], [1, 0]);
  const mascotLeftX = useTransform(progress, [0, 0.18], [-40, 0]);
  const mascotRightX = useTransform(progress, [0, 0.18], [40, 0]);

  return (
    <motion.div
      style={{ opacity, display }}
      className="absolute inset-0 flex-col items-center justify-center pt-20 sm:pt-36 pb-10 px-4 sm:px-6 text-center z-20 pointer-events-none max-w-6xl mx-auto transform-gpu"
    >
      <div className="absolute inset-0 flex justify-between items-end pointer-events-none px-2 sm:px-12 bottom-8 sm:bottom-12 opacity-70 sm:opacity-90">
        <motion.div style={{ x: mascotLeftX }} className="w-24 sm:w-48 lg:w-56 h-auto transform-gpu">
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
        <motion.div style={{ x: mascotRightX }} className="w-24 sm:w-48 lg:w-56 h-auto transform-gpu">
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

      <motion.div style={{ scale }} className="space-y-4 sm:space-y-6 relative z-10 max-w-4xl bg-[#040507]/70 p-4 sm:p-6 rounded-2xl border border-[#D4AF37]/20 backdrop-blur-sm transform-gpu">
        <span className="text-[#D4AF37]/90 font-mono text-[10px] sm:text-xs tracking-[0.25em] sm:tracking-[0.4em] uppercase block">
          FAKULTAS TEKNIK UNESA &middot; KABINET DANADYAKSA 2026
        </span>
        
        <h1 className="text-4xl sm:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.05] text-[#FAFAFA]">
          GERBANG <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-amber-100 to-[#C5A059] font-serif italic">
            TRANSFORMASI
          </span>
        </h1>

        <p className="text-[#8E8E93] text-xs sm:text-xl font-light max-w-2xl mx-auto leading-relaxed pt-1 sm:pt-2">
          Awal dari perjalanan barumu di Fakultas Teknik <span className="inline-block font-medium text-[#FAFAFA]/90">Universitas Negeri Surabaya</span>.
        </p>
      </motion.div>

      <div className="absolute bottom-6 sm:bottom-8 flex flex-col items-center gap-1.5 z-10">
        <motion.div className="w-px h-8 sm:h-10 bg-[#D4AF37]/40 origin-top transform-gpu" style={{ scaleY: lineDraw }} />
        <span className="text-[9px] sm:text-[10px] font-mono text-[#D4AF37]/60 tracking-[0.3em] uppercase">SCROLL</span>
      </div>
    </motion.div>
  );
});

/* ═══════════════════════════════════════════════════
   SCENE 2: NARRATIVE MANIFESTO (0.18 - 0.45)
   ═══════════════════════════════════════════════════ */
const Viewport2 = memo(function Viewport2({ progress }: { progress: MotionValue<number> }) {
  const opacity = useTransform(progress, [0.18, 0.23, 0.40, 0.45], [0, 1, 1, 0]);
  const display = useTransform(progress, (p) => (p < 0.16 || p > 0.47 ? "none" : "flex"));
  const textX = useTransform(progress, [0.18, 0.28], [-60, 0]);
  const imageClip = useTransform(progress, [0.20, 0.35], ["inset(15% 15% 15% 15%)", "inset(0% 0% 0% 0%)"]);
  const imageScale = useTransform(progress, [0.20, 0.35], [1.15, 1]);

  return (
    <motion.div
      style={{ opacity, display }}
      className="absolute inset-0 items-center justify-center pt-20 sm:pt-36 pb-8 px-4 sm:px-8 z-20 pointer-events-none max-w-7xl mx-auto transform-gpu"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-12 items-center w-full">
        <motion.div style={{ x: textX }} className="lg:col-span-7 space-y-4 sm:space-y-6 transform-gpu">
          <span className="text-[#D4AF37]/80 font-mono text-[10px] sm:text-xs tracking-[0.25em] sm:tracking-[0.3em] uppercase block">
            01 &mdash; NARRATIVE
          </span>
          
          <h2 className="text-2xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] text-white">
            Hari ini, <br />
            bukan sekadar registrasi. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-amber-200 font-serif italic">
              Ini adalah awal sejarahmu.
            </span>
          </h2>

          <p className="text-[#8E8E93] text-xs sm:text-lg font-light leading-relaxed max-w-lg">
            Menjadi mahasiswa berarti mengambil kendali penuh atas masa depanmu. Di sini, kamu mempersiapkan segala kebutuhan sebelum melangkah di Kampus Ketintang.
          </p>
        </motion.div>

        <motion.div
          style={{ clipPath: imageClip, scale: imageScale }}
          className="lg:col-span-5 relative h-48 sm:h-96 border border-[#D4AF37]/20 rounded-xl overflow-hidden transform-gpu"
        >
          <Image
            src="/gedung_ft_new.jpeg"
            alt="Gedung FT UNESA"
            fill
            sizes="(max-width: 1024px) 100vw, 40vw"
            className="object-cover grayscale opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#040507] via-transparent to-transparent" />
          <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 font-mono text-[9px] sm:text-[10px] text-[#D4AF37]/80 tracking-widest uppercase">
            FAKULTAS TEKNIK UNESA &middot; SURABAYA
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
});

/* ═══════════════════════════════════════════════════
   SCENE 3: OFFICIAL MASCOT UNVEILING (0.45 - 0.70)
   ═══════════════════════════════════════════════════ */
const Viewport3 = memo(function Viewport3({ progress }: { progress: MotionValue<number> }) {
  const opacity = useTransform(progress, [0.45, 0.50, 0.65, 0.70], [0, 1, 1, 0]);
  const display = useTransform(progress, (p) => (p < 0.43 || p > 0.72 ? "none" : "flex"));
  const prishaX = useTransform(progress, [0.46, 0.58], [-60, 0]);
  const smayaX = useTransform(progress, [0.46, 0.58], [60, 0]);
  const textY = useTransform(progress, [0.46, 0.56], [10, 0]);

  return (
    <motion.div
      style={{ opacity, display }}
      className="absolute inset-0 flex-col items-center justify-between pt-24 sm:pt-44 pb-8 px-4 sm:px-8 z-20 pointer-events-none max-w-7xl mx-auto transform-gpu"
    >
      <motion.div style={{ y: textY }} className="text-center space-y-2 sm:space-y-3 transform-gpu">
        <span className="text-[#D4AF37]/80 font-mono text-[10px] sm:text-xs tracking-[0.25em] sm:tracking-[0.3em] uppercase block">
          02 &mdash; MASKOT RESMI
        </span>
        <h2 className="text-xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
          Terhubung dengan Pendamping Perjalananmu
        </h2>
      </motion.div>

      <div className="w-full flex items-end justify-center sm:justify-between gap-4 px-2 sm:px-12 my-auto">
        <motion.div style={{ x: prishaX }} className="w-28 sm:w-64 md:w-80 relative transform-gpu">
          <Image
            src="/prisha1.png"
            alt="Prisha Pose 1"
            width={340}
            height={340}
            className="w-full h-auto object-contain drop-shadow-[0_0_25px_rgba(212,175,55,0.25)]"
            style={{ height: "auto" }}
          />
          <div className="mt-2 font-mono text-[9px] sm:text-[11px] text-center text-[#D4AF37]/90 tracking-widest uppercase">
            PRISHA &middot; MASKOT FT
          </div>
        </motion.div>

        <motion.div style={{ x: smayaX }} className="w-28 sm:w-64 md:w-80 relative transform-gpu">
          <Image
            src="/smaya1.png"
            alt="Smaya Pose 1"
            width={340}
            height={340}
            className="w-full h-auto object-contain drop-shadow-[0_0_25px_rgba(212,175,55,0.25)]"
            style={{ height: "auto" }}
          />
          <div className="mt-2 font-mono text-[9px] sm:text-[11px] text-center text-[#D4AF37]/90 tracking-widest uppercase">
            SMAYA &middot; MASKOT FT
          </div>
        </motion.div>
      </div>

      <p className="text-[#8E8E93] text-xs sm:text-sm font-light text-center max-w-md mb-2 sm:mb-4">
        Prisha dan Smaya hadir mendampingimu di setiap tahap pengisian berkas hingga pelaksanaan PKKMB.
      </p>
    </motion.div>
  );
});

/* ═══════════════════════════════════════════════════
   SCENE 4: THREE EDITORIAL PILLARS (0.70 - 0.88)
   ═══════════════════════════════════════════════════ */
const Viewport4 = memo(function Viewport4({ progress }: { progress: MotionValue<number> }) {
  const opacity = useTransform(progress, [0.70, 0.74, 0.84, 0.88], [0, 1, 1, 0]);
  const display = useTransform(progress, (p) => (p < 0.68 || p > 0.90 ? "none" : "flex"));
  const col1Opacity = useTransform(progress, [0.71, 0.76], [0.3, 1]);
  const col2Opacity = useTransform(progress, [0.75, 0.80], [0.3, 1]);
  const col3Opacity = useTransform(progress, [0.79, 0.84], [0.3, 1]);

  return (
    <motion.div
      style={{ opacity, display }}
      className="absolute inset-0 flex-col justify-center pt-20 sm:pt-36 pb-8 px-4 sm:px-8 z-20 pointer-events-none max-w-7xl mx-auto transform-gpu"
    >
      <div className="mb-6 sm:mb-12">
        <span className="text-[#D4AF37]/80 font-mono text-[10px] sm:text-xs tracking-[0.25em] sm:tracking-[0.3em] uppercase block mb-1 sm:mb-2">
          03 &mdash; TAHAPAN ORIENTASI
        </span>
        <h2 className="text-2xl sm:text-5xl font-extrabold text-white tracking-tight">
          Tiga Langkah Utama
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-12 border-t border-[#D4AF37]/20 pt-4 sm:pt-8">
        <motion.div style={{ opacity: col1Opacity }} className="space-y-2 sm:space-y-4 transform-gpu">
          <span className="font-mono text-xs sm:text-xl text-[#D4AF37] font-bold block">01 &mdash; BERKAS</span>
          <h3 className="text-sm sm:text-xl font-bold text-white">Mempersiapkan Dirimu</h3>
          <p className="text-[#8E8E93] text-xs sm:text-sm leading-relaxed font-light">
            Pengisian formulir biodata maba, verifikasi data administrasi, dan pengunggahan berkas awal PKKMB FT secara terstruktur.
          </p>
        </motion.div>

        <motion.div style={{ opacity: col2Opacity }} className="space-y-2 sm:space-y-4 transform-gpu">
          <span className="font-mono text-xs sm:text-xl text-[#D4AF37] font-bold block">02 &mdash; KELOMPOK</span>
          <h3 className="text-sm sm:text-xl font-bold text-white">Menemukan Mentormu</h3>
          <p className="text-[#8E8E93] text-xs sm:text-sm leading-relaxed font-light">
            Mendapatkan nomor kelompok serta terhubung langsung dengan mentor pendamping senior dari Fakultas Teknik.
          </p>
        </motion.div>

        <motion.div style={{ opacity: col3Opacity }} className="space-y-2 sm:space-y-4 transform-gpu">
          <span className="font-mono text-xs sm:text-xl text-[#D4AF37] font-bold block">03 &mdash; EXPEDITION</span>
          <h3 className="text-sm sm:text-xl font-bold text-white">Melangkah ke Kampus</h3>
          <p className="text-[#8E8E93] text-xs sm:text-sm leading-relaxed font-light">
            Pelaksanaan orientasi fisik di Gedung Fakultas Teknik UNESA Kampus Ketintang, Surabaya pada 18 Agustus 2026.
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
});

/* ═══════════════════════════════════════════════════
   SCENE 5: ACTIVATION FINALE (0.87 - 1.00)
   ═══════════════════════════════════════════════════ */
const Viewport5 = memo(function Viewport5({ progress }: { progress: MotionValue<number> }) {
  const opacity = useTransform(progress, [0.87, 0.92], [0, 1]);
  const display = useTransform(progress, (p) => (p < 0.85 ? "none" : "flex"));
  const scale = useTransform(progress, [0.87, 0.95], [0.95, 1]);

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

  return (
    <motion.div
      style={{ opacity, scale, display }}
      className="absolute inset-0 flex-col items-center justify-center p-4 sm:p-8 text-center z-30 pointer-events-auto max-w-4xl mx-auto transform-gpu"
    >
      <div className="relative z-10 space-y-4 sm:space-y-6 max-w-2xl bg-[#040507]/90 p-5 sm:p-8 rounded-2xl backdrop-blur-sm border border-[#D4AF37]/20">
        <span className="text-[#D4AF37]/90 font-mono text-[10px] sm:text-xs tracking-[0.25em] sm:tracking-[0.4em] uppercase block">
          04 &mdash; AKTIVASI AKUN PORTAL
        </span>

        <h2 className="text-2xl sm:text-5xl font-extrabold text-white tracking-tight">
          Siap Memulai Perjalananmu?
        </h2>

        <p className="text-[#8E8E93] text-xs sm:text-base font-light max-w-md mx-auto leading-relaxed">
          Aktivasi akun portalmu sekarang untuk membuka akses informasi penugasan, kelompok, dan mentor resmi PKKMB FT UNESA 2026.
        </p>

        {/* Live Countdown Clock */}
        <div className="py-2 font-mono text-xs sm:text-xl text-[#D4AF37] tracking-widest font-bold bg-[#D4AF37]/10 rounded-lg border border-[#D4AF37]/20">
          {String(countdownTime.days).padStart(2, "0")} HARI &middot; {String(countdownTime.hours).padStart(2, "0")} JAM &middot; {String(countdownTime.minutes).padStart(2, "0")} MENIT &middot; {String(countdownTime.seconds).padStart(2, "0")} DETIK
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <Link
            href="/login"
            className="group inline-flex items-center justify-center gap-2.5 px-6 sm:px-10 py-3.5 sm:py-4 bg-[#D4AF37] hover:bg-amber-400 text-black font-bold font-mono text-xs uppercase tracking-widest transition-all rounded-md shadow-xl shadow-[#D4AF37]/10"
          >
            <span>AKTIVASI AKUN SEKARANG</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Minimal Footer */}
        <div className="pt-4 sm:pt-8 font-mono text-[9px] sm:text-[10px] text-[#8E8E93]/60 tracking-widest uppercase">
          &copy; 2026 BEM FT UNESA &middot; KABINET DANADYAKSA &middot; SURABAYA
        </div>
      </div>
    </motion.div>
  );
});
