"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function MascotSection() {
  return (
    <section id="maskot" className="relative py-24 md:py-32 px-6 overflow-hidden bg-black">
      {/* ── MASSIVE BACKGROUND TEXT ── */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full flex justify-center pointer-events-none select-none z-0">
        <span className="font-display font-black text-[25vw] leading-none text-white whitespace-nowrap opacity-[0.03]">
          MASKOT
        </span>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-16 md:mb-24">
          <span className="text-gold-500 font-body text-xs uppercase tracking-[0.3em] font-bold block mb-4">
            Maskot Resmi
          </span>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-white font-bold">
            Kenali Prisha & Smaya
          </h2>
          <p className="text-white/60 font-body max-w-2xl mx-auto mt-6">
            Dua karakter yang merepresentasikan semangat, kreativitas, dan ketangguhan para Insinyur Muda selama PKKMB Fakultas Teknik UNESA 2026.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-16 md:gap-32 items-center justify-center relative z-10">
          {/* Prisha */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-center group"
          >
            <div className="relative w-64 h-64 md:w-80 md:h-80 mb-8">
              {/* Glow Behind Image */}
              <div className="absolute inset-4 bg-[#10b981]/20 rounded-full blur-3xl group-hover:bg-[#10b981]/40 transition-colors duration-700" />
              
              <Image
                src="/prisha1.png"
                alt="Prisha - Maskot PKKMB FT UNESA"
                fill
                className="object-contain relative z-10 drop-shadow-2xl transition-all duration-500 group-hover:opacity-0"
              />
              <Image
                src="/prisha2.png"
                alt="Prisha Alt - Maskot PKKMB FT UNESA"
                fill
                className="object-contain absolute inset-0 z-20 drop-shadow-2xl opacity-0 group-hover:opacity-100 group-hover:-translate-y-4 transition-all duration-500 ease-out"
              />
            </div>
            <h3 className="font-display text-3xl text-white font-bold mb-3 tracking-wide">Prisha</h3>
            <p className="text-white/50 font-body text-center max-w-[280px] leading-relaxed">
              Simbol kecerdasan, ketelitian, dan logika berpikir terstruktur dari seorang Insinyur.
            </p>
          </motion.div>

          {/* Smaya */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="flex flex-col items-center group"
          >
            <div className="relative w-64 h-64 md:w-80 md:h-80 mb-8">
              {/* Glow Behind Image */}
              <div className="absolute inset-4 bg-[#eab308]/20 rounded-full blur-3xl group-hover:bg-[#eab308]/40 transition-colors duration-700" />
              
              <Image
                src="/smaya1.png"
                alt="Smaya - Maskot PKKMB FT UNESA"
                fill
                className="object-contain relative z-10 drop-shadow-2xl transition-all duration-500 group-hover:opacity-0"
              />
              <Image
                src="/smaya2.png"
                alt="Smaya Alt - Maskot PKKMB FT UNESA"
                fill
                className="object-contain absolute inset-0 z-20 drop-shadow-2xl opacity-0 group-hover:opacity-100 group-hover:-translate-y-4 transition-all duration-500 ease-out"
              />
            </div>
            <h3 className="font-display text-3xl text-white font-bold mb-3 tracking-wide">Smaya</h3>
            <p className="text-white/50 font-body text-center max-w-[280px] leading-relaxed">
              Mewakili daya juang tak terkalahkan, kreativitas, dan inovasi Fakultas Teknik.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
