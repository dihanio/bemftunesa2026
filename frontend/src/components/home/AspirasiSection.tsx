"use client";

import React, { useState, useEffect } from "react";
import { PublicApiService, type StatsData } from "@/lib/api";
import Link from "next/link";
import { FileSpreadsheet, Eye } from "lucide-react";

export function AspirasiSection() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    PublicApiService.getStats()
      .then((res) => {
        if (res?.data) {
          setStats(res.data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading stats in aspirations:", err);
        setLoading(false);
      });
  }, []);

  // Calculate resolution percentage for progress bar
  const totalAspirasi = stats?.aspirations?.total ?? 0;
  const resolvedAspirasi = stats?.aspirations?.resolved ?? 0;
  const pendingAspirasi = stats?.aspirations?.pending ?? 0;
  const resolutionPercentage = totalAspirasi > 0 ? Math.round((resolvedAspirasi / totalAspirasi) * 100) : 0;

  return (
    <section className="w-full max-w-6xl mx-auto py-12 px-6 relative z-10 bg-transparent">
      <div className="relative rounded-3xl overflow-hidden bg-forest/80 border border-sage/25 shadow-md p-8 md:p-14">
        

        <div className="absolute -right-32 -top-32 w-64 h-64 bg-sage/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-stretch justify-between gap-12">
          {/* Text & CTA */}
          <div className="w-full lg:w-7/12 text-center lg:text-left flex flex-col justify-center">
            <span className="inline-flex items-center gap-1.5 w-fit mx-auto lg:mx-0 px-3.5 py-1.5 rounded-full bg-sage/10 border border-sage/20 text-[10px] font-semibold text-sage tracking-wide uppercase mb-6 shadow-sm">Kanal Advokasi Mahasiswa</span>
            <h2 className="text-3xl md:text-5xl font-extrabold text-foreground mb-5 leading-tight tracking-tight">
              Suaramu <br className="hidden md:block" />
              <span className="text-sage">Menentukan Arah</span>
            </h2>
            <p className="text-sm text-foreground/75 mb-8 max-w-md mx-auto lg:mx-0 leading-relaxed font-sans">
              BEM FT UNESA berkomitmen untuk mendengar, mengawal, dan memperjuangkan setiap aspirasi serta keluhan mahasiswa demi perbaikan fasilitas dan akademik.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/aspirasi" className="btn-strategic flex items-center justify-center gap-2 text-xs">
                <FileSpreadsheet className="w-4 h-4 text-accent-gold" />
                Sampaikan Aspirasi
              </Link>
              <Link href="/aspirasi" className="btn-tactical flex items-center justify-center gap-2 text-xs">
                <Eye className="w-4 h-4" />
                Lacak Status Aspirasi
              </Link>
            </div>
          </div>

          {/* Stats Box */}
          <div className="w-full lg:w-5/12 max-w-md flex items-center">
            <div className="w-full glass-active rounded-2xl p-6 md:p-8 border border-sage/25 shadow-md relative">
              <h3 className="text-xs font-bold text-foreground mb-6 uppercase tracking-wider border-b border-sage/20 pb-3 flex items-center justify-between">
                <span>Statistik Pengaduan</span>
              </h3>
              
              <div className="space-y-5">
                {/* Stats Item: Total */}
                <div className="flex justify-between items-center">
                  <span className="text-xs text-foreground/60">Total Aspirasi</span>
                  <span className="text-xl font-extrabold text-foreground font-mono tracking-tight">
                    {loading ? "0" : totalAspirasi}
                  </span>
                </div>
                
                {/* Stats Item: Pending */}
                <div className="flex justify-between items-center">
                  <span className="text-xs text-foreground/60">Sedang Diproses</span>
                  <span className="text-xl font-extrabold text-amber-600 dark:text-amber-500 font-mono tracking-tight">
                    {loading ? "0" : pendingAspirasi}
                  </span>
                </div>
                
                {/* Stats Item: Resolved */}
                <div className="flex justify-between items-center">
                  <span className="text-xs text-foreground/60">Telah Diselesaikan</span>
                  <span className="text-xl font-extrabold text-sage font-mono tracking-tight">
                    {loading ? "0" : resolvedAspirasi}
                  </span>
                </div>

                {/* Progress bar representing resolution rate */}
                <div className="pt-4 border-t border-sage/10 flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs text-foreground/60">
                    <span>Rate Penyelesaian</span>
                    <span className="text-accent-gold font-bold font-mono">{loading ? "0%" : `${resolutionPercentage}%`}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-green dark:bg-slate-green/20 overflow-hidden border border-sage/10 p-[1px]">
                    <div
                      className="h-full rounded-full bg-sage transition-all duration-1000 ease-out"
                      style={{ width: `${resolutionPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AspirasiSection;
