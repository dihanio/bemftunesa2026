"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const VALUES = [
  {
    id: "P",
    title: "Pikir Kritis",
    description: "Mampu menganalisis masalah secara mandiri dan kritis untuk menghadapi tantangan akademik serta transformasi digital dengan literasi yang kuat dan etis.",
  },
  {
    id: "R",
    title: "Riset & Kreativitas",
    description: "Berani bereksplorasi dan berinovasi untuk menghasilkan solusi nyata berbasis ilmu terapan guna pengembangan kualitas hidup.",
  },
  {
    id: "I",
    title: "Inovatif",
    description: "Menghadirkan solusi melalui transformasi digital dan perkembangan teknologi secara etis dan bertanggung jawab.",
  },
  {
    id: "S",
    title: "Sinergi",
    description: "Mampu berkolaborasi, berkomunikasi, memimpin, dan menyelesaikan masalah bersama di dunia kerja multidisiplin.",
  },
  {
    id: "M",
    title: "Mandiri",
    description: "Memiliki tanggung jawab penuh atas proses belajar di perguruan tinggi serta tangguh dalam menghadapi tantangan akademik.",
  },
  {
    id: "A",
    title: "Adaptif",
    description: "Berintegritas, beretika, dan fleksibel dalam menyesuaikan diri terhadap perubahan dunia kerja maupun masyarakat luas.",
  },
];

const LOGO_COLORS = [
  {
    color: "Hijau",
    dept: "Fakultas Teknik",
    desc: "Melambangkan identitas FT UNESA, sebagai naungan yang menyatukan seluruh mahasiswa dalam satu keluarga besar.",
    bgClass: "bg-emerald-700",
    textClass: "text-emerald-700",
    borderClass: "border-emerald-700/30",
  },
  {
    color: "Merah",
    dept: "Rumpun Teknik Elektro",
    desc: "Mencerminkan semangat, keberanian berinovasi, serta kemampuan menghadirkan solusi melalui perkembangan teknologi.",
    bgClass: "bg-red-700",
    textClass: "text-red-700",
    borderClass: "border-red-700/30",
  },
  {
    color: "Kuning",
    dept: "Rumpun PKK",
    desc: "Mencerminkan kreativitas, kepedulian, serta pengembangan kualitas hidup melalui ilmu terapan.",
    bgClass: "bg-yellow-600",
    textClass: "text-yellow-600",
    borderClass: "border-yellow-600/30",
  },
  {
    color: "Biru",
    dept: "Rumpun Teknik Mesin",
    desc: "Merepresentasikan ketangguhan, ketelitian, dan kemampuan beradaptasi dalam menghadapi perkembangan teknologi industri.",
    bgClass: "bg-blue-700",
    textClass: "text-blue-700",
    borderClass: "border-blue-700/30",
  },
  {
    color: "Cokelat",
    dept: "Rumpun Teknik Sipil",
    desc: "Menggambarkan kekuatan, keteguhan, serta kontribusi dalam pembangunan yang berkelanjutan.",
    bgClass: "bg-[#654321]",
    textClass: "text-[#654321]",
    borderClass: "border-[#654321]/30",
  },
  {
    color: "Oranye",
    dept: "Rumpun Teknik Informatika",
    desc: "Mencerminkan kreativitas, inovasi digital, serta kemampuan menghasilkan solusi berbasis teknologi informasi.",
    bgClass: "bg-orange-700",
    textClass: "text-orange-700",
    borderClass: "border-orange-700/30",
  },
];

interface TimelineEvent {
  phase: string;
  title: string;
  period: string;
  description: string;
  comingSoon?: boolean;
  completed?: boolean;
}

const TIMELINE: TimelineEvent[] = [
  {
    phase: "Pra-PKKMB FT",
    title: "Technical Meeting",
    period: "12 Agustus 2026",
    description:
      "Pengarahan teknis, pembagian kelompok, persiapan atribut tingkat Fakultas, serta aktivasi portal mahasiswa.",
    completed: false,
  },
  {
    phase: "Pra-PKKMB Univ",
    title: "Persiapan Universitas",
    period: "14 Agustus 2026",
    description: "Persiapan teknis, gladi, dan administrasi menyambut PKKMB tingkat Universitas.",
  },
  {
    phase: "PKKMB Univ",
    title: "Orientasi Kampus",
    period: "17 Agustus 2026",
    description: "Upacara pembukaan, materi kebangsaan, dan orientasi tingkat universitas secara terpusat.",
  },
  {
    phase: "Hari ke-1 FT",
    title: "Pembukaan &\nMateri Umum",
    period: "18 Agustus 2026",
    description: "Upacara pembukaan PKKMB Fakultas Teknik, dilanjutkan pengenalan visi misi, fasilitas kampus, dan materi dasar kemahasiswaan.",
  },
  {
    phase: "Hari ke-2 FT",
    title: "Materi Kefakultasan",
    period: "19 Agustus 2026",
    description: "Pendalaman materi akademik, sistem perkuliahan, dan penguatan karakter insinyur.",
  },
  {
    phase: "Hari ke-3 FT",
    title: "KRS &\nPengenalan Ormawa",
    period: "20 Agustus 2026",
    description: "Bimbingan pengisian Kartu Rencana Studi (KRS) dan eksplorasi minat bakat melalui Ormawa selingkung FT.",
  },
  {
    phase: "Hari ke-4 FT",
    title: "Inaugurasi &\nSafari FT",
    period: "21 Agustus 2026",
    description: "Pengukuhan Insinyur Muda, penutupan rangkaian acara, dan tur keliling fasilitas unggulan Fakultas Teknik.",
  },
  {
    phase: "Pasca-PKKMB",
    title: "Pekan Raya Mahasiswa",
    period: "Akhir Agustus 2026",
    description: "Pameran karya, UKM Expo (pengenalan UKM Universitas), serta selebrasi puncak mahasiswa baru.",
  }
];

export default function StorySection() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const massiveTextY = useTransform(scrollYProgress, [0, 1], ["0%", "60%"]);
  const massiveTextOpacity = useTransform(scrollYProgress, [0, 0.1, 0.8, 1], [0, 0.4, 0.4, 0]);

  return (
      <section ref={containerRef} id="tentang" className="relative py-20 md:py-32 px-4 md:px-6 overflow-hidden">
      
      {/* ── AMBIENT GLOW ── */}

      <div className="absolute top-[45%] left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[800px] bg-[radial-gradient(circle_at_center,rgba(234,179,8,0.06)_0%,transparent_60%)] pointer-events-none z-0" />
      <div className="absolute bottom-[5%] left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[800px] bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.06)_0%,transparent_60%)] pointer-events-none z-0" />

      {/* ── MASSIVE BACKGROUND TEXT ── */}
      <motion.div
        style={{ y: massiveTextY, opacity: massiveTextOpacity }}
        className="absolute top-0 left-0 w-full flex justify-center pointer-events-none select-none z-0"
      >
        <span className="font-display font-black text-[25vw] leading-none text-gold-500 whitespace-nowrap opacity-50 drop-shadow-[0_0_30px_rgba(234,179,8,0.3)]">
          ADRATA
        </span>
      </motion.div>

      <div className="relative max-w-6xl mx-auto z-10">
        
        {/* ── EDITORIAL PHILOSOPHY ── */}
        <div className="flex flex-col md:flex-row gap-8 md:gap-16 mb-24 md:mb-32 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="md:w-1/3"
          >
            <span className="text-gold-500 font-body text-xs uppercase tracking-[0.3em] font-bold block mb-4">
              Filosofi Tema PKKMB
            </span>
            <h2 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] italic tracking-widest drop-shadow-2xl">
              <span className="text-emerald-700">P</span>
              <span className="text-red-700">R</span>
              <span className="text-yellow-600">I</span>
              <span className="text-blue-700">S</span>
              <span className="text-[#654321]">M</span>
              <span className="text-orange-700">A</span>
            </h2>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="md:w-2/3 border-l-2 border-white/10 pl-6 md:pl-10"
          >
            <p className="text-xl md:text-2xl text-white/90 font-body leading-relaxed mb-6 font-light mt-2">
              Layaknya sebuah <span className="font-bold">prisma</span> yang membiaskan satu cahaya menjadi berbagai warna, mahasiswa baru datang dari beragam daerah, latar belakang, dan kemampuan.
            </p>
            <p className="text-white/60 font-body leading-relaxed max-w-xl">
              Melalui <span className="font-bold text-white/80">PKKMB ADRATA FT UNESA 2026</span>, keragaman tersebut disatukan dan dikembangkan untuk melahirkan insan teknik yang unggul, berkarakter, dan berdaya saing dalam menghadapi tantangan akademik, kolaborasi, dan transformasi teknologi modern.
            </p>
          </motion.div>
        </div>

        {/* ── INTERACTIVE VALUES LIST ── */}
        <div className="mb-24 md:mb-32">
          <div className="mb-10 border-b border-white/10 pb-4">
             <span className="text-gold-500 font-body text-xs uppercase tracking-[0.3em] font-bold block">
              Nilai Kepanjangan PRISMA
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {VALUES.map((val, idx) => (
              <motion.div
                key={val.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: "easeOut", delay: idx * 0.1 }}
                className="relative group pt-10 pb-2 border-t border-white/10 hover:border-gold-500/40 transition-colors duration-700 overflow-hidden"
              >
                {/* Massive Watermark Letter */}
                <span className="absolute top-6 -right-2 font-display font-black text-[120px] leading-none text-white/[0.04] group-hover:text-gold-500/10 transition-colors duration-700 z-0">
                  {val.id}
                </span>

                {/* Content */}
                <div className="relative z-10">
                  <span className="font-display font-black text-4xl md:text-5xl text-white/25 group-hover:text-gold-400 transition-colors duration-500">
                    {val.id}
                  </span>

                  <h3 className="font-display text-2xl text-white font-bold tracking-wide mt-5 mb-4 group-hover:text-gold-400 transition-colors duration-500">
                    {val.title}
                  </h3>

                  <p className="text-white/60 font-body text-sm leading-relaxed group-hover:text-white/90 transition-colors duration-500">
                    {val.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── FILOSOFI LOGO ADRATA ── */}
        <div className="mb-32 md:mb-48">
          <div className="mb-12 border-b border-white/10 pb-4 text-center md:text-left">
             <span className="text-gold-500 font-body text-xs uppercase tracking-[0.3em] font-bold block">
              Identitas Visual
            </span>
             <h3 className="font-display text-3xl md:text-4xl text-white font-bold mt-2">
              Filosofi Logo <span className="text-gold-500 italic">ADRATA</span>
            </h3>
          </div>

          <div className="flex flex-col lg:flex-row gap-12 items-center lg:items-stretch">
            {/* Logo Image */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="w-full lg:w-1/3 flex justify-center items-center"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="/logo_adrata.webp" 
                alt="Logo ADRATA FT UNESA 2026" 
                className="w-full max-w-[300px] h-auto object-contain drop-shadow-[0_0_45px_rgba(234,179,8,0.35)]"
              />
            </motion.div>

            {/* Colors Grid */}
            <div className="w-full lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-4">
              {LOGO_COLORS.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  className="flex flex-col h-full pb-5 pt-1 border-b border-white/10 group-hover:border-transparent"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-4 h-4 rounded-full ${item.bgClass} shadow-[0_0_10px_currentColor] ${item.textClass}`} />
                    <h4 className={`font-display font-bold text-lg ${item.textClass}`}>
                      {item.dept}
                    </h4>
                  </div>
                  <p className="text-gray-400 font-body text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* ── EDITORIAL TIMELINE ── */}
        <div>
          <div className="mb-12 md:mb-16">
             <span className="text-gold-500 font-body text-xs uppercase tracking-[0.3em] font-bold block mb-4">
              Agenda Pelaksanaan
            </span>
            <h2 className="font-display text-3xl md:text-5xl text-white font-bold">Rangkaian Acara</h2>
          </div>

          {/* ── TIMELINE DESKTOP (S-CURVE MELINGKAR / SINE WAVE) ── */}
          <div className="hidden md:block relative max-w-5xl mx-auto h-[1600px] mt-24">
            
            {/* SVG S-Curve Path (Garis melingkar berurutan dari atas ke bawah) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path
                d="M 40 10 
                   C 40 15.7, 60 15.7, 60 21.43 
                   C 60 27.1, 40 27.1, 40 32.86 
                   C 40 38.6, 60 38.6, 60 44.29 
                   C 60 50.0, 40 50.0, 40 55.71 
                   C 40 61.4, 60 61.4, 60 67.14 
                   C 60 72.8, 40 72.8, 40 78.57 
                   C 40 84.3, 60 84.3, 60 90"
                fill="none"
                stroke="rgba(234, 179, 8, 0.4)"
                strokeWidth="3"
                strokeDasharray="12 12"
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
              />
            </svg>

            {[
              "10%",
              "21.43%",
              "32.86%",
              "44.29%",
              "55.71%",
              "67.14%",
              "78.57%",
              "90%"
            ].map((top, idx) => {
              const event = TIMELINE[idx];
              const isEven = idx % 2 === 0;
              
              // Posisi Dot (Titik)
              const dotLeft = isEven ? "40%" : "60%";

              return (
                <motion.div
                  key={event.phase}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.7, delay: 0.1 }}
                  className="absolute left-0 z-10 hover:z-50 w-full group"
                  style={{ top }}
                >
                  {/* Titik Node Emas */}
                  <div 
                    className="absolute top-0 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black border-4 border-gold-500 shadow-[0_0_25px_5px_rgba(234,179,8,0.5)] transition-transform duration-500 group-hover:scale-150 group-hover:bg-gold-500 z-20" 
                    style={{ left: dotLeft }}
                  />
                  
                  {/* Kartu Konten */}
                  <div 
                    className="absolute top-0 -translate-y-1/2 w-[35%] bg-black/60 backdrop-blur-xl border border-white/10 p-6 xl:p-8 rounded-3xl z-30 group-hover:bg-black/90 group-hover:border-gold-500/60 transition-all duration-500 shadow-2xl text-left"
                    style={{
                      ...(isEven ? { right: "63%" } : { left: "63%" })
                    }}
                  >
                    <span className="text-gold-400 font-display text-sm font-bold tracking-widest uppercase mb-1 block">
                      {event.phase}
                    </span>
                    <span className="flex items-center gap-2 mb-2 transition-all duration-500">
                      <span className="text-[#9ca3af] font-body text-xs uppercase tracking-widest block">
                        {event.period}
                      </span>
                      {event.comingSoon && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-[10px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Coming Soon
                        </span>
                      )}
                      {event.completed && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-white/15 bg-white/5 text-white/50 text-[10px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
                          Selesai
                        </span>
                      )}
                    </span>
                    <h4 className="font-display text-xl xl:text-3xl text-white font-bold group-hover:text-gold-300 transition-colors whitespace-pre-line">
                      {event.title}
                    </h4>
                    
                    {/* Deskripsi: Muncul perlahan saat di-hover */}
                    <p 
                      className="font-body leading-relaxed text-sm xl:text-base max-h-0 opacity-0 overflow-hidden group-hover:max-h-[250px] group-hover:opacity-100 group-hover:mt-4 transition-all duration-700 ease-in-out"
                      style={{ color: "#e5e7eb" }}
                    >
                      {event.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* ── TIMELINE MOBILE (VERTICAL) ── */}
          <div className="md:hidden relative mt-16 pl-6">
            <div className="absolute left-6 top-4 bottom-4 w-px bg-dashed border-l-2 border-dashed border-gold-500/40" />
            
            {TIMELINE.map((event) => (
              <motion.div
                key={event.phase}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="relative mb-12 last:mb-0 pl-8 group"
              >
                <div className="absolute left-[17px] top-2 w-4 h-4 rounded-full bg-black border-2 border-gold-500 z-10 group-hover:bg-gold-500 transition-colors" />
                <div className="border-l border-gold-500/25 pl-5">
                  <span className="text-gold-400 font-display text-xs font-bold tracking-widest uppercase mb-1 block">
                    {event.phase}
                  </span>
                  <span className="flex items-center gap-2 mb-3">
                    <span className="text-[#9ca3af] font-body text-[10px] uppercase tracking-widest block">
                      {event.period}
                    </span>
                    {event.comingSoon && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-[9px] font-bold">
                        <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                        Coming Soon
                      </span>
                    )}
                    {event.completed && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-white/15 bg-white/5 text-white/50 text-[9px] font-bold">
                        <span className="w-1 h-1 rounded-full bg-white/30" />
                        Selesai
                      </span>
                    )}
                  </span>
                  <h4 className="font-display text-xl text-white font-bold mb-2">
                    {event.title}
                  </h4>
                  <p 
                    className="font-body text-xs leading-relaxed"
                    style={{ color: "#e5e7eb" }}
                  >
                    {event.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
