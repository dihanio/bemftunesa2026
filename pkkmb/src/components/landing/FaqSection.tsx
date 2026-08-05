"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Plus, Minus } from "lucide-react";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FAQ_DATA: FaqItem[] = [
  {
    id: "faq-1",
    question: "Bagaimana cara login ke Portal Mahasiswa Baru?",
    answer:
      "Gunakan fitur Single Sign-On (SSO) dengan email institusi UNESA Anda (@mhs.unesa.ac.id). Jika email belum aktif, Anda sementara waktu dapat login menggunakan Nomor Pendaftaran Mahasiswa (NPM) melalui opsi yang tersedia.",
  },
  {
    id: "faq-2",
    question: "Bagaimana sistem presensi harian bekerja?",
    answer:
      "Presensi dilakukan secara mandiri (self-check-in) melalui Portal Maba menggunakan sistem validasi lokasi (GPS Geofencing). Anda hanya perlu menekan tombol 'Absen' saat berada di dalam radius 50 meter dari titik kumpul yang ditentukan panitia, tanpa perlu melakukan scan QR Code.",
  },
  {
    id: "faq-3",
    question: "Bagaimana pembagian Kelompok (Gugus) dilakukan?",
    answer:
      "Pembagian Gugus dikalkulasi secara otomatis oleh Auto-Grouping Engine kami untuk memastikan pemerataan rasio asal prodi dan gender. Keputusan sistem bersifat final dan mahasiswa tidak dapat mengajukan perpindahan gugus.",
  },
  {
    id: "faq-4",
    question: "Di mana saya bisa mendapatkan informasi dari Kakak Pendamping?",
    answer:
      "Setelah Anda berhasil login ke Portal Maba, buka menu 'Adrista Hub'. Di sana Anda akan menemukan profil lengkap Kakak Pendamping beserta tautan (link) grup WhatsApp gugus Anda untuk berkoordinasi.",
  },
  {
    id: "faq-5",
    question: "Apa sanksinya jika tidak lulus atau tidak mengikuti PKKMB?",
    answer:
      "PKKMB Fakultas Teknik bersifat WAJIB bagi seluruh mahasiswa baru. Sertifikat kelulusan PKKMB merupakan syarat mutlak (mandatory) untuk pendaftaran yudisium dan kelulusan sarjana Anda di masa depan.",
  },
];

interface FaqItemRowProps {
  item: FaqItem;
  isOpen: boolean;
  onToggle: () => void;
  index: number;
}

function FaqItemRow({ item, isOpen, onToggle, index }: FaqItemRowProps) {
  return (
    <div className="border-b border-white/15">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-6 md:py-10 text-left group"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-4 md:gap-12 w-full pr-4 md:pr-8">
          <span className="text-white/20 font-display font-light text-xl md:text-2xl w-8 shrink-0 transition-colors group-hover:text-gold-500">
            {String(index + 1).padStart(2, '0')}
          </span>
          <h3 className="font-display font-medium text-lg md:text-3xl text-white/90 group-hover:text-white transition-colors">
            {item.question}
          </h3>
        </div>
        <div className="shrink-0 text-white/40 group-hover:text-gold-400 transition-colors">
          {isOpen ? <Minus size={24} strokeWidth={1} /> : <Plus size={24} strokeWidth={1} />}
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="pb-8 md:pb-10 pl-12 md:pl-20 pr-4 md:pr-24">
              <p className="text-white/60 font-body text-base md:text-xl leading-relaxed font-light">
                {item.answer}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FaqSection() {
  const [openId, setOpenId] = useState<string | null>(null);

  function toggle(id: string) {
    setOpenId((prev) => (prev === id ? null : id));
  }

  return (
    <section id="faq" className="relative py-20 md:py-32 px-4 md:px-6 bg-black overflow-hidden">
      {/* ── MASSIVE BACKGROUND TEXT ── */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full flex justify-center pointer-events-none select-none z-0">
        <span className="font-display font-black text-[25vw] leading-none text-white whitespace-nowrap opacity-[0.02]">
          BANTUAN
        </span>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row justify-between md:items-end mb-16 gap-6">
          <div>
            <span className="text-gold-500 font-body text-xs uppercase tracking-[0.3em] font-bold block mb-4">
              Informasi Umum
            </span>
            <h2 className="font-display text-4xl md:text-6xl text-white font-bold leading-tight">
              Pertanyaan<br />Sering Diajukan
            </h2>
          </div>
          <p className="text-white/50 font-body text-lg max-w-sm font-light">
            Segala hal yang perlu kamu ketahui tentang teknis dan persiapan PKKMB FT UNESA 2026.
          </p>
        </div>

        <div className="border-t border-white/15">
          {FAQ_DATA.map((item, idx) => (
            <FaqItemRow
              key={item.id}
              item={item}
              index={idx}
              isOpen={openId === item.id}
              onToggle={() => toggle(item.id)}
            />
          ))}
        </div>

        <div className="mt-24 text-center">
          <p className="text-white/40 font-body">
            Belum menemukan jawaban?{" "}
            <a 
              href="https://instagram.com/bemftunesa" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-gold-400 hover:text-gold-300 underline underline-offset-4 transition-colors"
            >
              Hubungi Panitia
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
