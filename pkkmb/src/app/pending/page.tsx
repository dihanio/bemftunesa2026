"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Hourglass, LogOut } from "lucide-react";
import Link from "next/link";

export default function PendingPage() {
  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/gedung_ft_new.jpeg"
          alt="Gedung Fakultas Teknik UNESA"
          fill
          priority
          className="object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-black" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gold-500/10 blur-[120px] rounded-full pointer-events-none" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md px-6"
      >
        <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 p-8 md:p-12 rounded-3xl shadow-2xl relative overflow-hidden text-center">
          <div className="absolute inset-0 bg-gradient-to-br from-gold-500/5 to-transparent" />

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-20 h-20 relative mb-6">
              <Image src="/logo_adrata.png" alt="Logo Adrata" fill sizes="160px" priority className="object-contain drop-shadow-[0_0_15px_rgba(234,179,8,0.3)]" />
            </div>

            <div className="p-4 bg-gold-500/10 rounded-2xl text-gold-400 mb-6">
              <Hourglass className="w-10 h-10" />
            </div>

            <h1 className="font-display text-2xl font-bold text-white mb-3">
              Akun Menunggu <span className="text-gold-500">Persetujuan</span>
            </h1>
            <p className="text-white/60 font-body text-sm leading-relaxed mb-8">
              Akun Anda telah terdaftar dan sedang menunggu verifikasi oleh admin PKKMB.
              Silakan kembali lagi beberapa saat kemudian setelah akun disetujui.
            </p>

            <Link
              href="/login"
              className="w-full flex items-center justify-center gap-3 bg-white/10 hover:bg-white/15 text-white px-6 py-3 rounded-xl font-bold font-body transition-all duration-300"
            >
              <LogOut className="w-4 h-4" />
              Kembali ke Halaman Login
            </Link>

            <div className="mt-8 pt-8 border-t border-white/10 w-full text-xs text-white/40 font-body">
              Mengalami kendala? Hubungi <a href="#" className="text-gold-500 hover:underline">Tim IT PKKMB</a>
            </div>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
