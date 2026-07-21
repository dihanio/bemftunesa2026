"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center relative z-10 w-full max-w-2xl mx-auto mt-20">
      
      {/* Decorative Icon */}
      <div className="w-20 h-20 rounded-full bg-slate-800/50 border border-accent-blue/10 flex items-center justify-center text-accent-blue/75 mb-8 shadow-sm">
        <Compass className="w-10 h-10" />
      </div>

      {/* Main 404 Text */}
      <h2 className="text-7xl font-extrabold text-foreground mb-4 tracking-tighter">404</h2>
      
      {/* Subtitle */}
      <p className="text-accent-blue font-bold tracking-[0.2em] uppercase text-xs mb-6">Halaman Tidak Ditemukan</p>
      
      {/* Description */}
      <p className="text-sm text-foreground/70 max-w-md mb-10 leading-relaxed font-sans">
        Maaf, halaman atau tautan yang Anda cari mungkin telah dipindahkan, 
        dihapus, atau memang tidak pernah ada di server kami.
      </p>

      {/* Back to Home Button */}
      <Link 
        href="/" 
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-accent-blue text-background font-bold text-[10px] uppercase tracking-widest hover:bg-accent-blue transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Kembali ke Beranda
      </Link>
    </div>
  );
}
