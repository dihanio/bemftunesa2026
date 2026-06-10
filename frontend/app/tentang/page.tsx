import Link from "next/link";
import { Crosshair, ChevronRight, Component } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tentang Kami | BEM FT UNESA",
  description:
    "Mengenal lebih dekat Badan Eksekutif Mahasiswa Fakultas Teknik UNESA. Kami adalah wadah aspirasi, kolaborasi, dan transformasi bagi seluruh mahasiswa teknik.",
};

export default function TentangPage() {
  const sections = [
    {
      title: "Visi & Misi",
      desc: "Arah pergerakan dan nilai-nilai dasar Kabinet Danadyaksa 2026.",
      icon: Crosshair,
      href: "/tentang/visi-misi",
      color: "from-[#10b981]/20 to-transparent",
      code: "DRC_01",
      coord: "07.23S / 112.72E",
    },
    {
      title: "Profil Kabinet",
      desc: "Filosofi logo dan semangat juang Kabinet Danadyaksa.",
      icon: Component,
      href: "/tentang/kabinet",
      color: "from-[#12331e]/20 to-transparent",
      code: "IDN_02",
      coord: "AEC_SYS_v2.0",
    },
  ];

  return (
    <div className="pt-48 md:pt-56 pb-24 px-6 max-w-7xl mx-auto relative z-10">
      {/* Page Header */}
      <div className="text-center mb-24">
        <h1 className="text-4xl md:text-7xl font-bold text-white mb-8 font-sans tracking-tighter uppercase italic">
          Tentang <span className="text-[#10b981]">Kami</span>
        </h1>
        <p className="text-gray-400 text-lg leading-relaxed max-w-3xl mx-auto font-medium">
          Mengenal lebih dekat Badan Eksekutif Mahasiswa Fakultas Teknik UNESA.
          Kami adalah wadah aspirasi, kolaborasi, dan transformasi bagi seluruh
          mahasiswa teknik.
        </p>
      </div>

      {/* Portal Grid - Balanced 2-Card Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto mb-32">
        {sections.map((section, idx) => (
          <Link
            key={idx}
            href={section.href}
            className="p-10 md:p-14 rounded-[48px] border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-[#10b981]/30 transition-all group relative overflow-hidden flex flex-col justify-between min-h-[400px]"
          >
            {/* Ambient Background */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${section.color} opacity-0 group-hover:opacity-100 transition-opacity duration-700`}
            />

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-12">
                <div className="relative p-4">
                  <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[#10b981]/40" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-[#10b981]/40" />

                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center relative group-hover:scale-110 transition-transform duration-500">
                    <section.icon className="w-8 h-8 text-[#10b981]" />
                    <span className="absolute -bottom-1 -right-1 text-[6px] font-mono text-white/10 group-hover:text-[#10b981]/40 uppercase tracking-tighter p-2">
                      {section.coord}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-gray-700 group-hover:text-[#10b981] transition-colors pt-4 font-bold tracking-widest">
                  {section.code}
                </span>
              </div>
              <h3 className="text-4xl font-bold text-white mb-6 font-sans tracking-tight italic uppercase">
                {section.title}
              </h3>
              <p className="text-gray-400 leading-relaxed text-sm md:text-base font-medium">
                {section.desc}
              </p>
            </div>

            <div className="relative z-10 mt-12 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-[#10b981] group-hover:text-white transition-colors">
              Selengkapnya
              <ChevronRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
            </div>
          </Link>
        ))}
      </div>

      {/* Featured Quote / Section */}
      <div className="p-16 md:p-24 rounded-[64px] border border-white/5 glass-overlay relative overflow-hidden text-center group">
        <div className="absolute top-0 left-0 w-full h-full bg-army-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        <div className="relative z-10 max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-10 leading-none font-sans italic tracking-tighter uppercase">
            &quot;Sinergi Nyata,{" "}
            <span className="text-[#10b981]">Teknik Berdaya</span>&quot;
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed mb-12 font-medium italic">
            Tagline yang bukan sekadar kata-kata, melainkan janji kami untuk
            bergerak bersama mahasiswa teknik dalam menciptakan dampak nyata
            yang berkelanjutan.
          </p>
          <div className="flex items-center justify-center gap-8">
            <div className="h-px w-24 bg-white/10" />
            <p className="text-[10px] font-mono text-gray-600 uppercase tracking-[0.5em] font-bold italic group-hover:text-army-accent transition-colors">
              Danadyaksa Cabinet // Since 2026
            </p>
            <div className="h-px w-24 bg-white/10" />
          </div>
        </div>
      </div>
    </div>
  );
}
