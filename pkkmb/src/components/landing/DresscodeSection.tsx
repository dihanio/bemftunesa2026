"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── CUSTOM SVGS ──
const IconShirt = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.47a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.47a2 2 0 00-1.34-2.23z" />
  </svg>
);

const IconPants = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16v2H4z" />
    <path d="M5 6l2 15h4l1-10 1 10h4l2-15" />
    <path d="M12 6v10" />
  </svg>
);

const IconHead = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 14c0-4.418 3.582-8 8-8s8 3.582 8 8" />
    <path d="M2 14h20v4a1 1 0 01-1 1H3a1 1 0 01-1-1v-4z" />
  </svg>
);

const IconPen = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    <path d="M15 5l4 4" />
  </svg>
);

const IconBook = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    <path d="M8 2v20" />
  </svg>
);

const IconNameTag = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="14" rx="2" ry="2" />
    <path d="M7 15h0" />
    <path d="M11 15h6" />
    <path d="M11 11h6" />
    <rect x="7" y="9" width="2" height="2" />
  </svg>
);

const IconBagTag = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 7v12a2 2 0 002 2h10a2 2 0 002-2V7" />
    <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
    <path d="M5 10h14" />
    <circle cx="12" cy="15" r="2" />
  </svg>
);

const DRESSCODE_TABS = [
  {
    id: "day12",
    label: "Day 1 & 2 (18-19 Ags)",
    content: {
      atasan: [
        "Kemeja putih polos (tidak transparan).",
        "Memakai dasi berlogo UNESA.",
        "Mengenakan ikat pinggang hitam.",
        "Menggunakan tas punggung hitam.",
        "Memakai Name Tag & Bag Tag resmi."
      ],
      bawahan: [
        "Putra: Celana kain hitam (bukan jeans/denim).",
        "Putri: Rok kain hitam panjang hingga mata kaki (bukan rok span).",
        "Kaos kaki putih (minimal sepanjang betis).",
        "Sepatu pantofel hitam polos (hak putri maksimal 3 cm)."
      ],
      kepala: [
        "Putra: Peci bludru hitam.",
        "Putri (Hijab): Hijab persegi hitam (bukan rawis) dilengkapi peci bludru hitam.",
        "Putri (Non-Hijab): Rambut diikat rapi dengan hairnet hitam, dilengkapi peci bludru hitam."
      ]
    }
  },
  {
    id: "day3",
    label: "Day 3 (20 Ags)",
    content: {
      atasan: [
        "Kemeja batik (warna dan motif bebas).",
        "Putra: Lengan pendek atau panjang.",
        "Putri: Wajib lengan panjang.",
        "Tidak mengenakan dasi.",
        "Ikat pinggang hitam & tas punggung hitam.",
        "Memakai Name Tag & Bag Tag resmi."
      ],
      bawahan: [
        "Putra: Celana kain hitam (bukan jeans/denim).",
        "Putri: Rok kain hitam panjang hingga mata kaki (bukan rok span).",
        "Kaos kaki putih (minimal sepanjang betis).",
        "Sepatu pantofel hitam polos (hak putri maksimal 3 cm)."
      ],
      kepala: [
        "Putra: Peci bludru hitam.",
        "Putri (Hijab): Hijab persegi hitam (bukan rawis) dilengkapi peci bludru hitam.",
        "Putri (Non-Hijab): Rambut diikat rapi dengan hairnet hitam, dilengkapi peci bludru hitam."
      ]
    }
  },
  {
    id: "day4",
    label: "Day 4 (21 Ags)",
    content: {
      atasan: [
        "Kaos warna army polos (diperbolehkan memakai merchandise resmi FT).",
        "Putra: Lengan pendek atau panjang.",
        "Putri (Hijab): Wajib lengan panjang.",
        "Ikat pinggang hitam & tas punggung hitam.",
        "Memakai Name Tag & Bag Tag resmi."
      ],
      bawahan: [
        "Putra: Celana kain hitam (bukan jeans/denim).",
        "Putri: Rok kain hitam panjang hingga mata kaki (bukan rok span).",
        "Kaos kaki putih (minimal sepanjang betis).",
        "Sepatu pantofel hitam polos (hak putri maksimal 3 cm)."
      ],
      kepala: [
        "Putra: Peci bludru hitam.",
        "Putri (Hijab): Hijab persegi hitam (bukan rawis) dilengkapi peci bludru hitam.",
        "Putri (Non-Hijab): Rambut diikat rapi dengan hairnet hitam, dilengkapi peci bludru hitam."
      ]
    }
  }
];

const ATRIBUT = [
  {
    title: "Peci Bludru",
    icon: IconHead,
    details: [
      "Peci bludru berwarna hitam polos.",
      "Pin Garuda timbul (Ø 2,5 cm) disematkan di kanan atas.",
      "Dilengkapi pita hijau tua selebar 1 cm yang mengelilingi peci (berjarak 2 cm dari tepi bawah peci)."
    ]
  },
  {
    title: "Bolpoin Standar",
    icon: IconPen,
    details: [
      "Menggunakan tinta berwarna hitam.",
      "Casing luar bolpoin wajib berwarna hijau penuh.",
      "Tidak diperbolehkan menggunakan bolpoin cetek (mekanik)."
    ]
  },
  {
    title: "Notebook A5",
    icon: IconBook,
    details: [
      "Menggunakan cover buffalo hijau tua (dilaminating) dengan jilid spiral kawat putih.",
      "Isi berupa 30 lembar kertas HVS hijau ukuran A5.",
      "Logo UNESA dan Logo PKKMB (Ø 4 cm) ditempel pada cover depan.",
      "Penulisan isi wajib menggunakan spidol hitam sesuai panduan margin panitia."
    ]
  },
  {
    title: "Name Tag Resmi",
    icon: IconNameTag,
    details: [
      "Desain, ukuran, dan tata letak Name Tag wajib mengikuti format resmi yang telah didistribusikan oleh panitia."
    ]
  },
  {
    title: "Bag Tag Identitas",
    icon: IconBagTag,
    details: [
      "Bagian Depan: Pas foto 3×4 (latar merah, kemeja putih tanpa dasi), Nama, Gugus, Prodi, dan Logo UNESA (Ø 4 cm).",
      "Bagian Belakang: Logo BEM FT, Logo Kabinet, Logo PKKMB, serta tulisan 'PKKMB FT 2026 Universitas Negeri Surabaya'."
    ]
  }
];

export default function DresscodeSection() {
  const [activeTab, setActiveTab] = useState(DRESSCODE_TABS[0].id);

  const activeContent = DRESSCODE_TABS.find(t => t.id === activeTab)?.content;

  return (
    <section id="ketentuan" className="py-24 px-4 md:px-6 max-w-6xl mx-auto">
      
      {/* ── HEADER ── */}
      <div className="text-center mb-16">
        <span className="text-gold-500 font-body text-xs uppercase tracking-[0.3em] font-bold block mb-4">
          Panduan Kedisiplinan
        </span>
        <h2 className="font-display text-4xl md:text-5xl text-white font-bold mb-6">
          Ketentuan Dresscode & <span className="text-gold-500 italic">Atribut</span>
        </h2>
        <p className="text-white/60 font-body max-w-2xl mx-auto leading-relaxed">
          Keseragaman adalah wujud sinergi dan ketertiban. Pastikan Anda mematuhi seluruh ketentuan pakaian serta kelengkapan atribut PKKMB FT UNESA 2026.
        </p>
      </div>

      {/* ── DRESSCODE TABS ── */}
      <div className="mb-24">
        {/* Tab Buttons */}
        <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-8">
          {DRESSCODE_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-6 py-3 rounded-full font-body text-sm tracking-wide transition-all duration-300 ${
                  isActive 
                    ? "text-black bg-gold-500 font-bold shadow-[0_0_20px_rgba(234,179,8,0.3)]" 
                    : "text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="bg-black/40 border border-white/10 rounded-3xl p-6 md:p-10 min-h-[600px] md:min-h-[400px] lg:min-h-[380px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12"
            >
              {/* Atasan */}
              <div>
                <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                  <IconShirt className="text-gold-500 w-6 h-6" />
                  <h3 className="font-display font-bold text-xl text-white">Bagian Atasan</h3>
                </div>
                <ul className="space-y-3">
                  {activeContent?.atasan.map((item, i) => (
                    <li key={i} className="flex gap-3 text-white/70 font-body text-sm leading-relaxed">
                      <span className="text-gold-500 mt-1 font-bold">›</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Bawahan */}
              <div>
                <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                  <IconPants className="text-gold-500 w-6 h-6" />
                  <h3 className="font-display font-bold text-xl text-white">Bagian Bawahan</h3>
                </div>
                <ul className="space-y-3">
                  {activeContent?.bawahan.map((item, i) => (
                    <li key={i} className="flex gap-3 text-white/70 font-body text-sm leading-relaxed">
                      <span className="text-gold-500 mt-1 font-bold">›</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Kepala */}
              <div>
                <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                  <IconHead className="text-gold-500 w-6 h-6" />
                  <h3 className="font-display font-bold text-xl text-white">Area Kepala</h3>
                </div>
                <ul className="space-y-3">
                  {activeContent?.kepala.map((item, i) => (
                    <li key={i} className="flex gap-3 text-white/70 font-body text-sm leading-relaxed">
                      <span className="text-gold-500 mt-1 font-bold">›</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── ATRIBUT WAJIB ── */}
      <div>
        <div className="mb-12 border-b border-white/10 pb-4 text-center">
          <span className="text-gold-500 font-body text-xs uppercase tracking-[0.3em] font-bold block">
            Perlengkapan Peserta
          </span>
          <h3 className="font-display text-3xl md:text-4xl text-white font-bold mt-2">
            Spesifikasi <span className="text-gold-500 italic">Atribut Wajib</span>
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
          {ATRIBUT.map((attr, idx) => {
            // Grid logic to balance 5 cards beautifully:
            // Desktop (lg): First 3 take 2 cols each (3 items/row). Last 2 take 3 cols each (2 items/row).
            const lgColSpan = idx < 3 ? "lg:col-span-2" : "lg:col-span-3";
            // Tablet (md): 2 items/row. The 5th item spans full width to center it.
            const mdColSpan = idx === 4 ? "md:col-span-2" : "md:col-span-1";
            
            return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className={`bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-gold-500/50 hover:bg-white/10 transition-colors group relative overflow-hidden ${lgColSpan} ${mdColSpan}`}
            >
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <attr.icon className="w-24 h-24 text-gold-500" />
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-black/50 flex items-center justify-center border border-white/10 group-hover:border-gold-500/50 group-hover:text-gold-500 transition-colors">
                    <attr.icon className="w-6 h-6 text-white/50 group-hover:text-gold-500 transition-colors" />
                  </div>
                  <h4 className="font-display font-bold text-xl text-white">{attr.title}</h4>
                </div>
                <ul className="space-y-2">
                  {attr.details.map((detail, i) => (
                    <li key={i} className="flex gap-3 text-white/60 font-body text-sm">
                      <span className="text-white/20">-</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )})}
        </div>
      </div>

    </section>
  );
}
