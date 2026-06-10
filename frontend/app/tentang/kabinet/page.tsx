"use client";

import { useState, useMemo } from "react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import {
  Sparkles,
  Hexagon,
  Shield,
  Star,
  Palette,
  ChevronRight,
  Component,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

const STAGES = [
  { id: "nama", title: "Makna Nama", icon: Info },
  { id: "logo", title: "Filosofi Logo", icon: Component },
  { id: "visual", title: "Identitas Visual", icon: Palette },
];

const PHILOSOPHIES = [
  {
    icon: Shield,
    title: "Perisai Ketahanan",
    desc: "Melambangkan soliditas internal dan ketahanan organisasi dalam menghadapi tantangan, serta simpul koordinasi yang tak terpisahkan.",
  },
  {
    icon: Star,
    title: "Pentalogi Rumpun",
    desc: "5 Bintang berwarna melambangkan 5 rumpun keilmuan di FT UNESA (Elektro, PKK, Mesin, Sipil, Informatika) dengan identitas warnanya masing-masing.",
  },
  {
    icon: Palette,
    title: "Biru Profesional",
    desc: "Latar belakang biru menyimbolkan profesionalisme, kecerdasan, rasa percaya diri, dan orientasi pada kekuatan kolektif.",
  },
];

export default function KabinetPage() {
  const [activeTab, setActiveTab] = useState("nama");

  const currentStage = useMemo(
    () => STAGES.find((s) => s.id === activeTab),
    [activeTab],
  );

  return (
    <div className="pt-48 md:pt-56 pb-24 px-6 max-w-7xl mx-auto relative z-10 transition-all duration-700">
      <Breadcrumbs
        items={[
          { label: "Tentang", href: "/tentang" },
          { label: "Identitas Kabinet Portal", isCurrent: true },
        ]}
      />

      <div className="flex flex-col lg:flex-row gap-12 mt-12 relative items-start">
        {/* Portal Navigator Sidebar */}
        <aside className="lg:w-80 w-full flex flex-col gap-6">
          <div className="sticky top-40 space-y-6">
            <div className="px-4 mb-4">
              <h3 className="text-white font-bold text-xl mb-2 tracking-tight">
                Identity Portal
              </h3>
              <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest italic">
                Danadyaksa Cabinet 2026
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

            <div className="p-8 rounded-[32px] glass-overlay border border-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-army-accent/5 rounded-full -mr-8 -mt-8" />
              <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-4 italic">
                Identity Auth
              </p>
              <div className="space-y-2 opacity-50">
                <p className="text-[8px] font-mono text-white/40 uppercase">
                  IDN_MOD_v1.0
                </p>
                <p className="text-[8px] font-mono text-white/20 uppercase tracking-tighter">
                  Approved Branding
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
                      {"// Segment " + currentStage?.id.toUpperCase()}
                    </span>
                    <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic leading-none">
                      {currentStage?.title}
                    </h2>
                  </div>

                  {activeTab === "nama" && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                      <div className="space-y-8">
                        <h3 className="text-4xl md:text-7xl font-bold text-white leading-tight font-sans tracking-tighter italic">
                          Penjaga{" "}
                          <span className="text-army-accent underline underline-offset-8">
                            Amanah
                          </span>
                        </h3>
                        <p className="text-lg text-gray-300 leading-relaxed italic">
                          <span className="text-army-accent font-black">
                            Danadyaksa
                          </span>{" "}
                          mencerminkan pengelolaan kekuatan kolektif secara
                          bertanggung jawab.{" "}
                          <span className="italic font-semibold">
                            &quot;Dana&quot;
                          </span>{" "}
                          berarti bekal dan sumber daya perjuangan, sementara{" "}
                          <span className="italic font-semibold">
                            &quot;Dyaksa&quot;
                          </span>{" "}
                          berarti pemimpin dan penjaga amanah.
                        </p>
                        <div className="flex items-center gap-6 p-8 rounded-[32px] glass-subtle border border-white/5 w-fit">
                          <div className="w-14 h-14 rounded-2xl bg-army-accent flex items-center justify-center text-army-dark">
                            <Sparkles className="w-7 h-7" />
                          </div>
                          <div>
                            <p className="text-base font-bold text-white italic uppercase tracking-tight">
                              &quot;Sinergi Nyata, Teknik Berdaya&quot;
                            </p>
                            <p className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">
                              Official Tagline 2026
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="relative aspect-[4/3] rounded-[48px] overflow-hidden border border-white/10 shadow-3xl group">
                        <Image
                          src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=1200&auto=format&fit=crop"
                          alt="Kabinet Danadyaksa"
                          fill
                          className="object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-army-dark to-transparent opacity-60" />
                      </div>
                    </div>
                  )}

                  {activeTab === "logo" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center pt-10">
                      {PHILOSOPHIES.map((phi, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="p-10 rounded-[40px] glass-subtle border border-white/5 hover:border-army-accent/30 transition-all group flex flex-col items-center"
                        >
                          <div className="w-16 h-16 rounded-2xl glass-active border border-white/10 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:border-army-accent transition-all duration-500">
                            <phi.icon className="w-7 h-7 text-army-accent" />
                          </div>
                          <h4 className="text-xl font-bold text-white mb-4 uppercase italic tracking-tight">
                            {phi.title}
                          </h4>
                          <p className="text-[11px] text-gray-500 uppercase font-mono leading-relaxed">
                            {phi.desc}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {activeTab === "visual" && (
                    <div className="flex flex-col items-center justify-center py-20">
                      <Hexagon className="w-80 h-80 text-army-accent opacity-5 absolute" />
                      <h3 className="text-5xl md:text-9xl font-black text-white/10 uppercase tracking-tighter mb-8 italic animate-pulse">
                        DANADYAKSA
                      </h3>
                      <p className="text-center text-xs font-mono text-gray-600 tracking-[0.8em] uppercase font-bold italic">
                        High Precision Branding // AEC System 2.0
                      </p>
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
