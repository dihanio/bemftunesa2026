"use client";

import { motion, AnimatePresence, useScroll, useTransform, useReducedMotion, type MotionValue } from "framer-motion";
import { useRef, useState, useEffect, memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import AmbiencePlayer from "./AmbiencePlayer";

/**
 * HERMES AGENT (NOUS RESEARCH) INSPIRED INTERACTIVE EDITORIAL EXPERIENCE
 * 
 * PERFORMANCE OPTIMIZATION ENGINE:
 * 1. Hardware Accelerated Render Pipelines (transform-gpu, opacity, zero layout reflows).
 * 2. Mobile Branching: Bypasses 900vh sticky scroll & real-time Framer Motion transform listeners on mobile (<768px).
 * 3. Mobile Reveal Fallback: GPU-accelerated lightweight viewport reveals (fade + translateY) with viewport once=true.
 * 4. Lightweight Filter Layering: Replaces heavy backdrop-filter & 180px gaussian blurs on mobile with optimized CSS radial gradients.
 * 5. Full Desktop Storytelling Preserved: 900vh spring physics, 5-viewport editorial parallax & countdown finale preserved on >=768px.
 */

export default function HermesEditorialExperience() {
  const router = useRouter();
  const [isNavigatingToLogin, setIsNavigatingToLogin] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
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

  // Determine whether to run heavy desktop sticky scroll pipeline
  const isMobileLayout = isMobile === true || prefersReducedMotion === true;

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

      {/* Render Branch: Desktop Sticky Parallax vs Mobile Lightweight Vertical Flow */}
      {isMobileLayout ? (
        <MobileEditorialLayout handlePortalClick={handlePortalClick} />
      ) : (
        <DesktopStickyExperience />
      )}

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
   DESKTOP STICKY SCROLL EXPERIENCE (>= 768px)
   Full cinematic 900vh spring physics, progress bar, & 5 viewports
   ═══════════════════════════════════════════════════ */
function DesktopStickyExperience() {
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
        <DesktopBackgroundTexture progress={scrollYProgress} />
        <DesktopViewport1 progress={scrollYProgress} />
        <DesktopViewport2 progress={scrollYProgress} />
        <DesktopViewport3 progress={scrollYProgress} />
        <DesktopViewport4 progress={scrollYProgress} />
        <DesktopViewport5 progress={scrollYProgress} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   DESKTOP SUB-COMPONENTS (GPU ACCELERATED)
   ═══════════════════════════════════════════════════ */

const DesktopBackgroundTexture = memo(function DesktopBackgroundTexture({ progress }: { progress: MotionValue<number> }) {
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
      <div className="absolute inset-0 opacity-40 bg-[linear-gradient(rgba(212,175,55,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(212,175,55,0.04)_1px,transparent_1px)] bg-[size:64px_64px]" />
      <motion.div style={{ opacity: glowOpacity, y: glowY }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[850px] bg-[#D4AF37]/20 rounded-full blur-[180px] transform-gpu" />
      <div className="absolute bottom-12 right-12 text-[18rem] font-serif text-[#D4AF37]/[0.03] select-none pointer-events-none leading-none hidden lg:block">
        ꦥꦏꦏꦩꦧ
      </div>
    </div>
  );
});

const DesktopViewport1 = memo(function DesktopViewport1({ progress }: { progress: MotionValue<number> }) {
  const opacity = useTransform(progress, [0, 0.12, 0.20], [1, 1, 0]);
  const display = useTransform(progress, (p) => (p > 0.22 ? "none" : "flex"));
  const scale = useTransform(progress, [0, 0.18], [1, 0.95]);
  const lineDraw = useTransform(progress, [0.02, 0.16], [1, 0]);
  const mascotLeftX = useTransform(progress, [0, 0.18], [-40, 0]);
  const mascotRightX = useTransform(progress, [0, 0.18], [40, 0]);

  return (
    <motion.div
      style={{ opacity, display }}
      className="absolute inset-0 flex-col items-center justify-center pt-28 sm:pt-36 pb-12 px-6 text-center z-20 pointer-events-none max-w-6xl mx-auto transform-gpu"
    >
      <div className="absolute inset-0 flex justify-between items-end pointer-events-none px-4 sm:px-12 bottom-12 opacity-60 sm:opacity-90">
        <motion.div style={{ x: mascotLeftX }} className="w-32 sm:w-48 lg:w-56 h-auto transform-gpu">
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
        <motion.div style={{ x: mascotRightX }} className="w-32 sm:w-48 lg:w-56 h-auto transform-gpu">
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

      <motion.div style={{ scale }} className="space-y-6 relative z-10 max-w-4xl bg-[#040507]/60 p-6 rounded-2xl backdrop-blur-[2px] transform-gpu">
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

      <div className="absolute bottom-8 flex flex-col items-center gap-2 z-10">
        <motion.div className="w-px h-10 bg-[#D4AF37]/40 origin-top transform-gpu" style={{ scaleY: lineDraw }} />
        <span className="text-[10px] font-mono text-[#D4AF37]/50 tracking-[0.3em] uppercase">SCROLL</span>
      </div>
    </motion.div>
  );
});

const DesktopViewport2 = memo(function DesktopViewport2({ progress }: { progress: MotionValue<number> }) {
  const opacity = useTransform(progress, [0.18, 0.23, 0.40, 0.45], [0, 1, 1, 0]);
  const display = useTransform(progress, (p) => (p < 0.16 || p > 0.47 ? "none" : "flex"));
  const textX = useTransform(progress, [0.18, 0.28], [-60, 0]);
  const imageClip = useTransform(progress, [0.20, 0.35], ["inset(15% 15% 15% 15%)", "inset(0% 0% 0% 0%)"]);
  const imageScale = useTransform(progress, [0.20, 0.35], [1.15, 1]);

  return (
    <motion.div
      style={{ opacity, display }}
      className="absolute inset-0 items-center justify-center pt-28 sm:pt-36 pb-12 px-8 z-20 pointer-events-none max-w-7xl mx-auto transform-gpu"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">
        <motion.div style={{ x: textX }} className="lg:col-span-7 space-y-6 transform-gpu">
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

        <motion.div
          style={{ clipPath: imageClip, scale: imageScale }}
          className="lg:col-span-5 relative h-72 sm:h-96 border border-[#D4AF37]/20 overflow-hidden transform-gpu"
        >
          <Image
            src="/gedung_ft_new.jpeg"
            alt="Gedung FT UNESA"
            fill
            sizes="(max-width: 1024px) 100vw, 40vw"
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
});

const DesktopViewport3 = memo(function DesktopViewport3({ progress }: { progress: MotionValue<number> }) {
  const opacity = useTransform(progress, [0.45, 0.50, 0.65, 0.70], [0, 1, 1, 0]);
  const display = useTransform(progress, (p) => (p < 0.43 || p > 0.72 ? "none" : "flex"));
  const prishaX = useTransform(progress, [0.46, 0.58], [-100, 0]);
  const smayaX = useTransform(progress, [0.46, 0.58], [100, 0]);
  const textY = useTransform(progress, [0.46, 0.56], [10, 0]);

  return (
    <motion.div
      style={{ opacity, display }}
      className="absolute inset-0 flex-col items-center justify-between pt-36 sm:pt-44 pb-10 px-8 z-20 pointer-events-none max-w-7xl mx-auto transform-gpu"
    >
      <motion.div style={{ y: textY }} className="text-center space-y-3 transform-gpu">
        <span className="text-[#D4AF37]/80 font-mono text-xs tracking-[0.3em] uppercase block">
          02 &mdash; MASKOT RESMI
        </span>
        <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
          Terhubung dengan Pendamping Perjalananmu
        </h2>
      </motion.div>

      <div className="w-full flex items-end justify-between px-4 sm:px-12 my-auto">
        <motion.div style={{ x: prishaX }} className="w-40 sm:w-64 md:w-80 relative transform-gpu">
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

        <motion.div style={{ x: smayaX }} className="w-40 sm:w-64 md:w-80 relative transform-gpu">
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

      <p className="text-[#8E8E93] text-sm font-light text-center max-w-md mb-4">
        Prisha dan Smaya hadir mendampingimu di setiap tahap pengisian berkas hingga pelaksanaan PKKMB.
      </p>
    </motion.div>
  );
});

const DesktopViewport4 = memo(function DesktopViewport4({ progress }: { progress: MotionValue<number> }) {
  const opacity = useTransform(progress, [0.70, 0.74, 0.84, 0.88], [0, 1, 1, 0]);
  const display = useTransform(progress, (p) => (p < 0.68 || p > 0.90 ? "none" : "flex"));
  const col1Opacity = useTransform(progress, [0.71, 0.76], [0.3, 1]);
  const col2Opacity = useTransform(progress, [0.75, 0.80], [0.3, 1]);
  const col3Opacity = useTransform(progress, [0.79, 0.84], [0.3, 1]);

  return (
    <motion.div
      style={{ opacity, display }}
      className="absolute inset-0 flex-col justify-center pt-28 sm:pt-36 pb-12 px-8 z-20 pointer-events-none max-w-7xl mx-auto transform-gpu"
    >
      <div className="mb-12">
        <span className="text-[#D4AF37]/70 font-mono text-xs tracking-[0.3em] uppercase block mb-2">
          03 &mdash; TAHAPAN ORIENTASI
        </span>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Tiga Langkah Utama
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-[#D4AF37]/20 pt-8">
        <motion.div style={{ opacity: col1Opacity }} className="space-y-4 transform-gpu">
          <span className="font-mono text-xl text-[#D4AF37] font-bold block">01 &mdash; BERKAS</span>
          <h3 className="text-xl font-bold text-white">Mempersiapkan Dirimu</h3>
          <p className="text-[#8E8E93] text-sm leading-relaxed font-light">
            Pengisian formulir biodata maba, verifikasi data administrasi, dan pengunggahan berkas awal PKKMB FT secara terstruktur.
          </p>
        </motion.div>

        <motion.div style={{ opacity: col2Opacity }} className="space-y-4 transform-gpu">
          <span className="font-mono text-xl text-[#D4AF37] font-bold block">02 &mdash; KELOMPOK</span>
          <h3 className="text-xl font-bold text-white">Menemukan Mentormu</h3>
          <p className="text-[#8E8E93] text-sm leading-relaxed font-light">
            Mendapatkan nomor kelompok serta terhubung langsung dengan mentor pendamping senior dari Fakultas Teknik.
          </p>
        </motion.div>

        <motion.div style={{ opacity: col3Opacity }} className="space-y-4 transform-gpu">
          <span className="font-mono text-xl text-[#D4AF37] font-bold block">03 &mdash; EXPEDITION</span>
          <h3 className="text-xl font-bold text-white">Melangkah ke Kampus</h3>
          <p className="text-[#8E8E93] text-sm leading-relaxed font-light">
            Pelaksanaan orientasi fisik di Gedung Fakultas Teknik UNESA Kampus Ketintang, Surabaya pada 18 Agustus 2026.
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
});

const DesktopViewport5 = memo(function DesktopViewport5({ progress }: { progress: MotionValue<number> }) {
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
      className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center z-30 pointer-events-auto max-w-4xl mx-auto transform-gpu"
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

        <div className="py-2 font-mono text-base sm:text-xl text-[#D4AF37] tracking-widest font-bold">
          {String(countdownTime.days).padStart(2, "0")} HARI &middot; {String(countdownTime.hours).padStart(2, "0")} JAM &middot; {String(countdownTime.minutes).padStart(2, "0")} MENIT &middot; {String(countdownTime.seconds).padStart(2, "0")} DETIK
        </div>

        <div className="pt-2">
          <Link
            href="/login"
            className="group inline-flex items-center gap-3 px-10 py-4 bg-[#D4AF37] hover:bg-amber-400 text-black font-bold font-mono text-xs uppercase tracking-widest transition-all shadow-xl shadow-[#D4AF37]/10"
          >
            <span>AKTIVASI AKUN SEKARANG</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="pt-8 font-mono text-[10px] text-[#8E8E93]/60 tracking-widest uppercase">
          &copy; 2026 BEM FT UNESA &middot; KABINET DANADYAKSA &middot; SURABAYA
        </div>
      </div>
    </motion.div>
  );
});

/* ═══════════════════════════════════════════════════
   MOBILE LIGHTWEIGHT VERTICAL LAYOUT (< 768px)
   Zero scroll-linked MotionValues, GPU Accelerated Reveal Animations (fade + translateY)
   ═══════════════════════════════════════════════════ */

const MobileEditorialLayout = memo(function MobileEditorialLayout({ handlePortalClick }: { handlePortalClick: (e: React.MouseEvent<HTMLAnchorElement>) => void }) {
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
    <div className="relative z-10 pt-24 pb-16 px-4 space-y-16 max-w-lg mx-auto">
      
      {/* Optimized Static Ambient Background Texture */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <Image
          src="/gedung_ft_new.jpeg"
          alt="Gedung FT UNESA Background"
          fill
          sizes="100vw"
          className="object-cover grayscale opacity-25 filter contrast-110"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#040507] via-[#040507]/90 to-[#040507]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.12),transparent_70%)]" />
      </div>

      {/* MOBILE SECTION 1: Monumental Entry */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 text-center space-y-6 pt-4 transform-gpu"
      >
        <div className="flex justify-between items-end px-2 mb-2 pointer-events-none">
          <div className="w-24 h-auto">
            <Image
              src="/prisha2.png"
              alt="Prisha Pose 2"
              width={160}
              height={160}
              className="w-full h-auto object-contain"
              style={{ height: "auto" }}
              priority
            />
          </div>
          <div className="w-24 h-auto">
            <Image
              src="/smaya2.png"
              alt="Smaya Pose 2"
              width={160}
              height={160}
              className="w-full h-auto object-contain"
              style={{ height: "auto" }}
              priority
            />
          </div>
        </div>

        <div className="space-y-3 bg-[#040507]/80 p-5 rounded-xl border border-[#D4AF37]/20 backdrop-blur-sm">
          <span className="text-[#D4AF37]/90 font-mono text-[10px] tracking-[0.25em] uppercase block">
            FAKULTAS TEKNIK UNESA &middot; KABINET DANADYAKSA 2026
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight leading-tight text-[#FAFAFA]">
            GERBANG <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-amber-100 to-[#C5A059] font-serif italic">
              TRANSFORMASI
            </span>
          </h1>
          <p className="text-[#8E8E93] text-xs font-light leading-relaxed pt-1">
            Awal dari perjalanan barumu di Fakultas Teknik <span className="font-medium text-white/90">Universitas Negeri Surabaya</span>.
          </p>
        </div>
      </motion.section>

      {/* MOBILE SECTION 2: Narrative Manifesto */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 space-y-4 transform-gpu"
      >
        <div className="bg-[#040507]/80 p-5 rounded-xl border border-[#D4AF37]/20 backdrop-blur-sm space-y-4">
          <span className="text-[#D4AF37]/80 font-mono text-[10px] tracking-[0.2em] uppercase block">
            01 &mdash; NARRATIVE
          </span>
          <h2 className="text-2xl font-extrabold text-white tracking-tight leading-snug">
            Hari ini, bukan sekadar registrasi. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-amber-200 font-serif italic">
              Ini adalah awal sejarahmu.
            </span>
          </h2>
          <p className="text-[#8E8E93] text-xs font-light leading-relaxed">
            Menjadi mahasiswa berarti mengambil kendali penuh atas masa depanmu. Di sini, kamu mempersiapkan segala kebutuhan sebelum melangkah di Kampus Ketintang.
          </p>

          <div className="relative h-48 border border-[#D4AF37]/20 rounded-lg overflow-hidden mt-3">
            <Image
              src="/gedung_ft_new.jpeg"
              alt="Gedung FT UNESA"
              fill
              sizes="100vw"
              className="object-cover grayscale opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#040507] via-transparent to-transparent" />
            <div className="absolute bottom-3 left-3 font-mono text-[9px] text-[#D4AF37]/90 tracking-widest uppercase">
              FAKULTAS TEKNIK UNESA &middot; SURABAYA
            </div>
          </div>
        </div>
      </motion.section>

      {/* MOBILE SECTION 3: Official Mascot Unveiling */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 space-y-6 text-center transform-gpu"
      >
        <div className="bg-[#040507]/80 p-5 rounded-xl border border-[#D4AF37]/20 backdrop-blur-sm space-y-4">
          <span className="text-[#D4AF37]/80 font-mono text-[10px] tracking-[0.2em] uppercase block">
            02 &mdash; MASKOT RESMI
          </span>
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            Terhubung dengan Pendamping Perjalananmu
          </h2>

          <div className="flex items-end justify-center gap-4 py-2">
            <div className="w-32 relative">
              <Image
                src="/prisha1.png"
                alt="Prisha Pose 1"
                width={200}
                height={200}
                className="w-full h-auto object-contain"
                style={{ height: "auto" }}
              />
              <div className="mt-1 font-mono text-[9px] text-[#D4AF37]/90 tracking-widest uppercase">
                PRISHA &middot; MASKOT
              </div>
            </div>
            <div className="w-32 relative">
              <Image
                src="/smaya1.png"
                alt="Smaya Pose 1"
                width={200}
                height={200}
                className="w-full h-auto object-contain"
                style={{ height: "auto" }}
              />
              <div className="mt-1 font-mono text-[9px] text-[#D4AF37]/90 tracking-widest uppercase">
                SMAYA &middot; MASKOT
              </div>
            </div>
          </div>

          <p className="text-[#8E8E93] text-xs font-light leading-relaxed">
            Prisha dan Smaya hadir mendampingimu di setiap tahap pengisian berkas hingga pelaksanaan PKKMB.
          </p>
        </div>
      </motion.section>

      {/* MOBILE SECTION 4: Three Editorial Pillars */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 space-y-4 transform-gpu"
      >
        <div className="bg-[#040507]/80 p-5 rounded-xl border border-[#D4AF37]/20 backdrop-blur-sm space-y-4">
          <span className="text-[#D4AF37]/80 font-mono text-[10px] tracking-[0.2em] uppercase block">
            03 &mdash; TAHAPAN ORIENTASI
          </span>
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            Tiga Langkah Utama
          </h2>

          <div className="space-y-4 pt-2 border-t border-[#D4AF37]/15">
            <div className="space-y-1">
              <span className="font-mono text-xs text-[#D4AF37] font-bold block">01 &mdash; BERKAS</span>
              <h3 className="text-sm font-bold text-white">Mempersiapkan Dirimu</h3>
              <p className="text-[#8E8E93] text-xs font-light leading-relaxed">
                Pengisian formulir biodata maba, verifikasi data administrasi, dan pengunggahan berkas awal PKKMB FT secara terstruktur.
              </p>
            </div>

            <div className="space-y-1 pt-2 border-t border-white/5">
              <span className="font-mono text-xs text-[#D4AF37] font-bold block">02 &mdash; KELOMPOK</span>
              <h3 className="text-sm font-bold text-white">Menemukan Mentormu</h3>
              <p className="text-[#8E8E93] text-xs font-light leading-relaxed">
                Mendapatkan nomor kelompok serta terhubung langsung dengan mentor pendamping senior dari Fakultas Teknik.
              </p>
            </div>

            <div className="space-y-1 pt-2 border-t border-white/5">
              <span className="font-mono text-xs text-[#D4AF37] font-bold block">03 &mdash; EXPEDITION</span>
              <h3 className="text-sm font-bold text-white">Melangkah ke Kampus</h3>
              <p className="text-[#8E8E93] text-xs font-light leading-relaxed">
                Pelaksanaan orientasi fisik di Gedung Fakultas Teknik UNESA Kampus Ketintang, Surabaya pada 18 Agustus 2026.
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* MOBILE SECTION 5: Activation Finale */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 text-center space-y-4 transform-gpu"
      >
        <div className="bg-[#040507]/90 p-5 rounded-xl border border-[#D4AF37]/25 backdrop-blur-sm space-y-4 shadow-xl">
          <span className="text-[#D4AF37]/90 font-mono text-[10px] tracking-[0.25em] uppercase block">
            04 &mdash; AKTIVASI AKUN PORTAL
          </span>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Siap Memulai Perjalananmu?
          </h2>
          <p className="text-[#8E8E93] text-xs font-light leading-relaxed">
            Aktivasi akun portalmu sekarang untuk membuka akses informasi penugasan, kelompok, dan mentor resmi PKKMB FT UNESA 2026.
          </p>

          <div className="py-2 font-mono text-xs text-[#D4AF37] tracking-wider font-bold bg-[#D4AF37]/10 rounded-md border border-[#D4AF37]/20">
            {String(countdownTime.days).padStart(2, "0")} HARI &middot; {String(countdownTime.hours).padStart(2, "0")} JAM &middot; {String(countdownTime.minutes).padStart(2, "0")} MENIT &middot; {String(countdownTime.seconds).padStart(2, "0")} DETIK
          </div>

          <div className="pt-2">
            <Link
              href="/login"
              onClick={handlePortalClick}
              className="group inline-flex items-center justify-center gap-2.5 w-full py-3.5 bg-[#D4AF37] hover:bg-amber-400 text-black font-bold font-mono text-xs uppercase tracking-wider rounded-md transition-all shadow-lg shadow-[#D4AF37]/10"
            >
              <span>AKTIVASI AKUN SEKARANG</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="pt-4 font-mono text-[9px] text-[#8E8E93]/60 tracking-widest uppercase">
            &copy; 2026 BEM FT UNESA &middot; KABINET DANADYAKSA
          </div>
        </div>
      </motion.section>

    </div>
  );
});
