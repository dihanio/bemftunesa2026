import HeroSection from "@/components/landing/HeroSection";
import StorySection from "@/components/landing/StorySection";
import MascotSection from "@/components/landing/MascotSection";
import FaqSection from "@/components/landing/FaqSection";

export default function LandingPage() {
  return (
    <main>
      {/* ── 1. Hero ── */}
      <HeroSection />

      {/* ── Divider ── */}
      <div className="section-divider" />

      {/* ── Unified Content Wrapper for Smooth Background Transition ── */}
      <div className="relative">
        {/* Smooth unified background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-900/30 to-black pointer-events-none -z-10" />

        {/* ── 2. Filosofi Adrata + Nilai + Timeline ── */}
        <StorySection />

        {/* ── Divider ── */}
        <div className="section-divider opacity-50" />

        {/* ── 3. Maskot ── */}
        <MascotSection />

        {/* ── Divider ── */}
        <div className="section-divider opacity-50" />

        {/* ── 4. FAQ ── */}
        <FaqSection />

        {/* ── Footer minimal ── */}
        <footer className="border-t border-emerald-900/30 py-10 px-4 text-center relative z-10">
          <p className="text-white/60 text-sm font-body">
            © 2026 BEM Fakultas Teknik UNESA · Kabinet Danadyaksa ·{" "}
            <span className="text-white/90">Portal PKKMB Adrata</span>
          </p>
          <p className="text-white/40 text-xs mt-1 font-body italic">
            Salam Rumah Kita Insinyur Muda!
          </p>
        </footer>
      </div>
    </main>
  );
}
