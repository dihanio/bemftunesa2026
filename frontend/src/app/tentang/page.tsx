"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Shield, Target, Award, Compass, Eye, Heart } from "lucide-react";

export default function TentangPage() {
  const [activeTab, setActiveTab] = useState<"visi" | "misi" | "tujuan">("visi");
  const [hoveredPhilo, setHoveredPhilo] = useState<number | null>(null);

  const logoPhilosophy = [
    {
      title: "Perisai Ketahanan",
      desc: "Melambangkan soliditas internal dan ketahanan organisasi dalam menghadapi tantangan, serta simpul koordinasi yang tak terpisahkan.",
      color: "border-sage"
    },
    {
      title: "Pentalogi Rumpun",
      desc: "5 Bintang berwarna melambangkan 5 rumpun keilmuan di FT UNESA (Elektro, PKK, Mesin, Sipil, Informatika) dengan identitas warnanya masing-masing.",
      color: "border-accent-gold"
    },
    {
      title: "Biru Profesional",
      desc: "Latar belakang biru menyimbolkan profesionalisme, kecerdasan, rasa percaya diri, dan orientasi pada kekuatan kolektif.",
      color: "border-foliage"
    }
  ];

  return (
    <main className="pt-28 pb-16 px-6 max-w-6xl mx-auto w-full relative">
      {/* Background radial accent glow */}
      <div className="absolute top-[20%] right-0 w-[500px] h-[500px] rounded-full bg-accent-blue/5 blur-[120px] pointer-events-none -z-10" />

      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: "Tentang Kami", isCurrent: true }]} />

      {/* Header Area */}
      <div className="mb-12 mt-6">
        <span className="text-xs font-semibold text-sage uppercase tracking-wide block mb-3">Profil Organisasi</span>
        <h1 className="text-4xl md:text-6xl font-extrabold text-foreground leading-none tracking-tight">
          Tentang <span className="text-accent-gold">BEM FT UNESA</span>
        </h1>
        <p className="text-sm text-foreground/75 mt-4 max-w-2xl leading-relaxed">
          <strong className="text-foreground">"Sinergi Nyata, Teknik Berdaya"</strong> &mdash; Official Tagline 2026
        </p>
      </div>

      {/* Vision & Mission Interactive Area */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-16 items-stretch">
        
        {/* Navigation Selector */}
        <div className="lg:col-span-1 flex flex-col gap-3">
          <span className="text-xs font-medium text-foreground/50 uppercase tracking-wide mb-1">Daftar Haluan</span>
          <button
            onClick={() => setActiveTab("visi")}
            className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 flex items-center gap-4 cursor-pointer ${
              activeTab === "visi"
                ? "border-accent-gold/40 bg-slate-green/80 dark:bg-slate-green/10 text-foreground font-bold shadow-sm"
                : "border-sage/15 bg-slate-green/10 text-foreground/70 hover:text-foreground hover:bg-slate-green/30"
            }`}
          >
            <Eye className="w-5 h-5 text-accent-gold" />
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-wide text-accent-gold font-semibold">01. Visi Utama</span>
              <span className="text-sm mt-0.5">Arah Gerak Kabinet</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("misi")}
            className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 flex items-center gap-4 cursor-pointer ${
              activeTab === "misi"
                ? "border-accent-gold/40 bg-slate-green/80 dark:bg-slate-green/10 text-foreground font-bold shadow-sm"
                : "border-sage/15 bg-slate-green/10 text-foreground/70 hover:text-foreground hover:bg-slate-green/30"
            }`}
          >
            <Target className="w-5 h-5 text-accent-gold" />
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-wide text-accent-gold font-semibold">02. Misi Taktis</span>
              <span className="text-sm mt-0.5">Langkah Kerja Nyata</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("tujuan")}
            className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 flex items-center gap-4 cursor-pointer ${
              activeTab === "tujuan"
                ? "border-accent-gold/40 bg-slate-green/80 dark:bg-slate-green/10 text-foreground font-bold shadow-sm"
                : "border-sage/15 bg-slate-green/10 text-foreground/70 hover:text-foreground hover:bg-slate-green/30"
            }`}
          >
            <Award className="w-5 h-5 text-accent-gold" />
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-wide text-accent-gold font-semibold">03. Makna Nama</span>
              <span className="text-sm mt-0.5">Filosofi Kabinet</span>
            </div>
          </button>
        </div>

        {/* Dynamic Details Box */}
        <div className="lg:col-span-2 glass-subtle border border-sage/15 rounded-3xl p-8 md:p-10 flex flex-col justify-center min-h-[380px] overflow-hidden">
          {activeTab === "visi" && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col gap-4">
              <span className="text-xs font-semibold text-sage uppercase tracking-wide">Visi Organisasi</span>
              <h2 className="text-2xl font-extrabold text-foreground tracking-tight">Sinergi Nyata, Teknik Berdaya</h2>
              <p className="text-sm text-foreground/75 leading-relaxed mt-2 whitespace-pre-line">
                Menjadikan BEM FT sebagai rumah bersama mahasiswa Teknik yang inklusif, responsif dan berdampak nyata bagi kemajuan Fakultas Teknik UNESA
              </p>
            </div>
          )}

          {activeTab === "misi" && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col gap-4">
              <span className="text-xs font-semibold text-sage uppercase tracking-wide">Misi Organisasi</span>
              <h2 className="text-2xl font-extrabold text-foreground tracking-tight">Misi Strategis</h2>
              <ol className="list-decimal pl-5 text-sm text-foreground/75 leading-relaxed space-y-3 mt-2">
                <li><strong className="text-foreground">Komunikasi & Aspirasi:</strong> Membangun sistem komunikasi dan aspirasi yang terbuka, responsif dan menjangkau seluruh mahasiswa Teknik lintas prodi.</li>
                <li><strong className="text-foreground">Kapasitas & Akuntabilitas:</strong> Memperkuat kapasitas dan akuntabilitas BEM FT melalui tata kelola yang profesional, transparan dan berkelanjutan.</li>
                <li><strong className="text-foreground">Pengembangan Berdampak:</strong> Menciptakan program pengembangan mahasiswa yang berdampak di bidang kompetensi, kewirausahaan dan kesejahteraan.</li>
              </ol>
            </div>
          )}

          {activeTab === "tujuan" && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col gap-4">
              <span className="text-xs font-semibold text-sage uppercase tracking-wide">Makna Nama</span>
              <h2 className="text-2xl font-extrabold text-foreground tracking-tight">Danadyaksa</h2>
              <p className="text-sm text-foreground/75 leading-relaxed mt-2 whitespace-pre-line">
                <strong className="text-foreground block mb-1">Penjaga Amanah</strong>
                Danadyaksa mencerminkan pengelolaan kekuatan kolektif secara bertanggung jawab. &quot;Dana&quot; berarti bekal dan sumber daya perjuangan, sementara &quot;Dyaksa&quot; berarti pemimpin dan penjaga amanah.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Symbol Philosophy Section */}
      <section className="mb-16">
        <h2 className="text-xs font-bold text-foreground uppercase tracking-widest mb-8 text-center lg:text-left">
          Filosofi Lambang BEM FT UNESA
        </h2>
        <div className="flex flex-col lg:flex-row gap-10 items-center relative">
          
          <div className="w-full lg:w-1/3 flex justify-center mb-6 lg:mb-0 relative">
            <div className={`relative w-64 h-64 md:w-80 md:h-80 drop-shadow-2xl transition-transform duration-500 ${hoveredPhilo !== null ? 'scale-110' : 'hover:scale-105'}`}>
              <Image src="/logobemft.png" alt="Logo BEM FT UNESA" fill className="object-contain" priority />
            </div>

            {/* Interactive Arrow Indicator (Desktop Only) */}
            <div className="hidden lg:block absolute right-[-2rem] top-0 bottom-0 w-16 pointer-events-none">
              <div 
                className="absolute right-0 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] flex items-center justify-end"
                style={{ 
                  top: hoveredPhilo === 0 ? '16%' : hoveredPhilo === 1 ? '50%' : hoveredPhilo === 2 ? '84%' : '50%',
                  opacity: hoveredPhilo !== null ? 1 : 0,
                  transform: 'translateY(-50%)'
                }}
              >
                <svg width="60" height="24" viewBox="0 0 60 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-accent-gold drop-shadow-md">
                  <path d="M0 12H56M56 12L46 2M56 12L46 22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-2/3 flex flex-col gap-4 relative z-10">
            {logoPhilosophy.map((philo: any, idx: number) => (
              <div
                key={idx}
                onMouseEnter={() => setHoveredPhilo(idx)}
                onMouseLeave={() => setHoveredPhilo(null)}
                className={`p-6 rounded-2xl bg-slate-green/10 border-l-4 ${philo.color || 'border-sage'} border-y border-r border-sage/15 transition-all duration-300 cursor-default
                  ${hoveredPhilo === idx ? 'border-accent-gold/60 bg-slate-green/20 scale-[1.02] shadow-[0_0_20px_rgba(234,179,8,0.15)]' : 'hover:border-accent-gold/30 hover:bg-slate-green/20'}
                  ${hoveredPhilo !== null && hoveredPhilo !== idx ? 'opacity-60 scale-[0.98]' : 'opacity-100'}
                `}
              >
                <div className="flex items-center gap-4 mb-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${hoveredPhilo === idx ? 'bg-accent-gold text-slate-900 shadow-md' : 'bg-slate-green/30 text-foreground'}`}>
                    0{idx + 1}
                  </div>
                  <h3 className={`font-bold text-sm tracking-tight transition-colors duration-300 ${hoveredPhilo === idx ? 'text-accent-gold' : 'text-foreground'}`}>
                    {philo.title}
                  </h3>
                </div>
                <p className="text-xs text-foreground/75 leading-relaxed ml-12">
                  {philo.desc}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Mars FT Section */}
      <section className="max-w-2xl mx-auto text-center">
        <div className="glass-active border border-sage/20 hover:border-accent-gold/30 rounded-3xl p-8 md:p-10 relative overflow-hidden group transition-all duration-300">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-accent-gold/20" />
          
          <h2 className="text-xl font-extrabold text-foreground mb-6">Lirik Mars Fakultas Teknik UNESA</h2>
          <div className="text-xs text-foreground/75 leading-loose italic space-y-4">
            <p>
              Fakultas Teknik Universitas Negeri Surabaya <br />
              Wadah generasi cerdas, mandiri, berbudaya <br />
              Berlandaskan iman dan ketakwaan <br />
              Maju melangkah menuju kejayaan
            </p>
            <p>
              Dengan semangat membara kita berkarya <br />
              Membangun bangsa dengan teknologi mulia <br />
              Satu tekad, satu cita, satu keluarga <br />
              Fakultas Teknik UNESA jaya selamanya!
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
