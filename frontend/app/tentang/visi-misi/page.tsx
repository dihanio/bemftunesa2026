"use client";

import { useState, useMemo } from "react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import {
  Target,
  Flag,
  ShieldCheck,
  Zap,
  HeartHandshake,
  ChevronRight,
  Shield,
  Star,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const STAGES = [
  { id: "visi", title: "Visi Utama", icon: Target },
  { id: "misi", title: "Misi Strategis", icon: Flag },
  { id: "nilai", title: "Nilai Dasar", icon: ShieldCheck },
];

const MISSIONS = [
  {
    title: "Komunikasi & Aspirasi",
    desc: "Membangun sistem komunikasi dan aspirasi yang terbuka, responsif dan menjangkau seluruh mahasiswa Teknik lintas prodi.",
    icon: HeartHandshake,
  },
  {
    title: "Kapasitas & Akuntabilitas",
    desc: "Memperkuat kapasitas dan akuntabilitas BEM FT melalui tata kelola yang profesional, transparan dan berkelanjutan.",
    icon: ShieldCheck,
  },
  {
    title: "Pengembangan Berdampak",
    desc: "Menciptakan program pengembangan mahasiswa yang berdampak di bidang kompetensi, kewirausahaan dan kesejahteraan.",
    icon: Zap,
  },
];

const VALUES = [
  {
    t: "Integrity",
    d: "Bertindak jujur dan selaras antara kata dan perbuatan.",
    icon: Shield,
  },
  {
    t: "Innovation",
    d: "Senantiasa beradaptasi dan menciptakan terobosan baru.",
    icon: Zap,
  },
  {
    t: "Synergy",
    d: "Berkolaborasi aktif lintas rumpun dan organisasi.",
    icon: HeartHandshake,
  },
  {
    t: "Humanity",
    d: "Mengutamakan nilai kemanusiaan dan kebermanfaatan.",
    icon: Star,
  },
];

export default function VisiMisiPage() {
  const [activeTab, setActiveTab] = useState("visi");

  const currentStage = useMemo(
    () => STAGES.find((s) => s.id === activeTab),
    [activeTab],
  );

  return (
    <div className="pt-48 md:pt-56 pb-24 px-6 max-w-7xl mx-auto relative z-10 transition-all duration-700">
      <Breadcrumbs
        items={[
          { label: "Tentang", href: "/tentang" },
          { label: "Visi & Misi Portal", isCurrent: true },
        ]}
      />

      <div className="flex flex-col lg:flex-row gap-12 mt-12 relative items-start">
        {/* Portal Navigator Sidebar */}
        <aside className="lg:w-80 w-full flex flex-col gap-6">
          <div className="sticky top-40 space-y-6">
            <div className="px-4 mb-4">
              <h3 className="text-white font-bold text-xl mb-2 tracking-tight">
                Direction Portal
              </h3>
              <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest italic">
                Kabinet Danadyaksa 2026
              </p>
            </div>

            <div className="space-y-1">
              {STAGES.map((stage) => (
                <button
                  key={stage.id}
                  onClick={() => setActiveTab(stage.id)}
                  className={`
                    w-full text-left px-5 py-4 rounded-2xl transition-all flex items-center justify-between group border
                    ${
                      activeTab === stage.id
                        ? "glass-active border-army-accent/30 text-army-accent shadow-[0_0_20px_-10px_#10b981]"
                        : "bg-transparent border-transparent text-gray-600 hover:text-gray-400 hover:bg-white/5"
                    }
                  `}
                >
                  <div className="flex items-center gap-4">
                    <stage.icon
                      className={`w-4 h-4 ${activeTab === stage.id ? "text-army-accent" : "opacity-30"}`}
                    />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
                      {stage.title}
                    </span>
                  </div>
                  <ChevronRight
                    className={`w-3 h-3 transition-transform ${activeTab === stage.id ? "rotate-90 text-army-accent" : "opacity-0 group-hover:opacity-30 group-hover:translate-x-1"}`}
                  />
                </button>
              ))}
            </div>

            <div className="p-8 rounded-[32px] glass-overlay border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-army-accent/5 rounded-full -mr-8 -mt-8" />
              <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-4 italic">
                Registry Metadata
              </p>
              <div className="space-y-2 opacity-50">
                <p className="text-[8px] font-mono text-white/40 uppercase">
                  DRC_MOD_v1.0
                </p>
                <p className="text-[8px] font-mono text-white/20 uppercase tracking-tighter">
                  Verified Architecture
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Portal Main Stage */}
        <main className="flex-1 min-h-[60vh]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.98 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="w-full"
            >
              <div className="glass-overlay rounded-[48px] p-10 md:p-16 border border-white/5 relative overflow-hidden min-h-[60vh]">
                <div className="absolute top-0 right-0 w-64 h-64 bg-army-accent/5 rounded-full blur-[100px] -mr-32 -mt-32" />

                <div className="relative z-10">
                  <div className="mb-14">
                    <span className="inline-block px-4 py-1.5 glass-subtle border border-army-accent/20 text-army-accent font-mono text-[9px] uppercase tracking-[0.3em] font-bold rounded-full mb-6">
                      {"// Sector " + currentStage?.id.toUpperCase()}
                    </span>
                    <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic leading-none">
                      {currentStage?.title}
                    </h2>
                  </div>

                  {activeTab === "visi" && (
                    <div className="space-y-12 py-10">
                      <div className="relative">
                        <Target className="w-16 h-16 text-army-accent mb-12 opacity-30 animate-pulse" />
                        <p className="text-3xl md:text-5xl font-black text-white leading-[1.1] italic uppercase tracking-tighter max-w-4xl">
                          &quot;Menjadikan BEM FT sebagai rumah bersama
                          mahasiswa Teknik yang inklusif, responsif dan
                          berdampak nyata bagi kemajuan Fakultas Teknik
                          UNESA&quot;
                        </p>
                      </div>
                      <div className="h-px w-24 bg-army-accent/30" />
                      <p className="text-gray-500 font-mono text-[10px] uppercase tracking-widest leading-relaxed max-w-xl">
                        Visi ini dirancang untuk mewujudkan transformasi
                        fundamental fungsionaris BEM FT sebagai poros penggerak
                        utama.
                      </p>
                    </div>
                  )}

                  {activeTab === "misi" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {MISSIONS.map((m, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="p-10 rounded-[40px] glass-subtle border border-white/5 hover:border-army-accent/30 transition-all group"
                        >
                          <div className="w-14 h-14 rounded-2xl bg-army-accent/10 flex items-center justify-center text-army-accent mb-8 group-hover:scale-110 transition-transform">
                            <m.icon className="w-6 h-6" />
                          </div>
                          <h4 className="text-xl font-bold text-white mb-4 italic uppercase tracking-tight">
                            {m.title}
                          </h4>
                          <p className="text-[11px] text-gray-500 uppercase font-mono leading-relaxed">
                            {m.desc}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {activeTab === "nilai" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {VALUES.map((n, i) => (
                        <div
                          key={i}
                          className="flex gap-8 p-10 rounded-[40px] glass-subtle border border-white/5 hover:bg-white/[0.02] transition-all group"
                        >
                          <div className="w-16 h-16 shrink-0 rounded-2xl glass-active flex items-center justify-center text-army-accent">
                            <n.icon className="w-7 h-7" />
                          </div>
                          <div>
                            <h4 className="text-2xl font-bold text-white mb-2 italic uppercase">
                              {n.t}
                            </h4>
                            <p className="text-xs text-gray-500 uppercase font-mono leading-relaxed">
                              {n.d}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
