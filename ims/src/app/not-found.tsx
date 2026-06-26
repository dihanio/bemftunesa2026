"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldAlert, Activity } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#040914] relative overflow-hidden">
      {/* Background Grid & Glow */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-sage/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="relative z-10 flex flex-col items-center justify-center text-center p-6 w-full max-w-lg mx-auto">
        {/* Animated Icon */}
        <div className="relative mb-8 group">
          <div className="absolute inset-0 bg-sage/20 blur-xl rounded-full scale-110 group-hover:scale-125 transition-transform duration-500"></div>
          <div className="w-24 h-24 rounded-2xl bg-[#0a1120] border border-sage/20 flex items-center justify-center text-sage relative z-10 shadow-[0_0_40px_rgba(45,212,191,0.1)]">
            <ShieldAlert className="w-12 h-12" />
          </div>
        </div>

        {/* 404 Typography */}
        <div className="relative">
          <h1 className="text-[120px] md:text-[150px] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white/80 to-white/10 drop-shadow-2xl">
            404
          </h1>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sage/10 font-black text-[120px] md:text-[180px] pointer-events-none blur-sm -z-10">
            404
          </div>
        </div>

        <div className="h-px w-16 bg-gradient-to-r from-transparent via-sage/50 to-transparent my-6"></div>
        
        {/* Description */}
        <h2 className="text-xl font-bold text-white mb-3 tracking-wide">Akses Tidak Ditemukan</h2>
        <p className="text-foreground/50 text-sm mb-10 leading-relaxed max-w-md">
          Sistem tidak dapat menemukan rute yang Anda minta. Mungkin halaman telah dipindahkan, dihapus, atau Anda tidak memiliki akses ke direktori ini.
        </p>

        {/* Back to Home Button */}
        <Link 
          href="/" 
          className="relative inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-sage/10 text-sage hover:bg-sage hover:text-[#040914] border border-sage/20 hover:border-sage transition-all duration-300 group overflow-hidden"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform relative z-10" />
          <span className="relative z-10 font-semibold">Kembali ke Dashboard Utama</span>
        </Link>
        
        {/* Footer info */}
        <div className="mt-16 flex items-center gap-2 text-foreground/30 text-xs font-mono">
          <Activity className="w-3 h-3" />
          <span>ERR_NOT_FOUND • BEM FT UNESA IMS PORTAL</span>
        </div>
      </div>
    </div>
  );
}
