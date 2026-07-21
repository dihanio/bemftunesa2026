"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PublicApiService } from "@/lib/api";
import { Users, Calendar, ArrowRight, ExternalLink, ShieldCheck, Clock, MapPin } from "lucide-react";

export default function OprecPage() {
  const [recruitments, setRecruitments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecruitments = async () => {
      try {
        const res = await PublicApiService.getRecruitments();
        // sort: put "open" first, then others
        const data = res?.data?.data?.data || res?.data?.data || res?.data || (Array.isArray(res) ? res : []);
        const sorted = data.sort((a: any, b: any) => {
          if (a.status === "open" && b.status !== "open") return -1;
          if (a.status !== "open" && b.status === "open") return 1;
          return 0;
        });
        setRecruitments(sorted);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecruitments();
  }, []);

  const getStatusBadge = (status: string, closeDate: string) => {
    const isExpired = new Date(closeDate) < new Date();
    
    if (status === "open" && !isExpired) {
      return (
        <span className="bg-blue-500-500/20 text-blue-500-400 border border-blue-500-500/30 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500-400 animate-pulse" />
          Sedang Buka
        </span>
      );
    }
    
    if (status === "announced") {
      return (
        <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
          Pengumuman
        </span>
      );
    }
    
    return (
      <span className="bg-accent-blue/10 text-accent-blue border border-accent-blue/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
        Ditutup
      </span>
    );
  };

  return (
    <main className="pt-28 pb-16 px-6 max-w-6xl mx-auto w-full relative min-h-screen">
      <div className="absolute top-[20%] left-[10%] w-[600px] h-[600px] rounded-full bg-accent-blue/5 blur-[120px] pointer-events-none -z-10" />

      <Breadcrumbs items={[{ label: "Rekrutmen", isCurrent: true }]} />

      <div className="mb-12 mt-6">
        <span className="text-xs font-semibold text-accent-blue uppercase tracking-wide block mb-3">Sistem Rekrutmen Terpadu</span>
        <h1 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight">
          Open <span className="text-accent-gold">Recruitment</span>
        </h1>
        <p className="text-sm text-foreground/75 mt-4 max-w-2xl leading-relaxed">
          Bergabunglah bersama kami dan jadilah bagian dari perubahan di Fakultas Teknik UNESA. Pantau informasi rekrutmen pengurus, kepanitiaan, maupun relawan kegiatan BEM FT.
        </p>
      </div>

      {loading ? (
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse w-full h-48 bg-accent-blue/10 rounded-3xl" />
          ))}
        </div>
      ) : recruitments.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {recruitments.map((rec: any) => {
            const isOpen = rec.status === "open" && new Date(rec.closeDate) >= new Date();
            
            return (
              <div 
                key={rec._id}
                className="glass-active border border-accent-blue/20 hover:border-accent-gold/40 rounded-3xl p-6 md:p-8 transition-all duration-300 flex flex-col md:flex-row gap-8 group"
              >
                {/* Poster Thumbnail */}
                <div className="w-full md:w-64 shrink-0">
                  <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-slate-800/20 relative border border-accent-blue/10">
                    {rec.poster ? (
                      <Image 
                        src={typeof rec.poster === 'string' ? rec.poster : rec.poster.url} 
                        alt={rec.title}
                        fill
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-accent-blue/30 p-6 text-center">
                        <Users className="w-12 h-12 mb-3" />
                        <span className="text-xs font-medium">Tidak ada poster</span>
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      {getStatusBadge(rec.status, rec.closeDate)}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                    <div>
                      {rec.period && (
                        <span className="text-xs font-bold text-accent-gold uppercase tracking-wider mb-2 block">
                          Periode {rec.period}
                        </span>
                      )}
                      <h2 className="text-2xl font-bold text-foreground group-hover:text-accent-gold transition-colors">
                        {rec.title}
                      </h2>
                    </div>
                  </div>

                  <p className="text-sm text-foreground/75 leading-relaxed mb-6 line-clamp-3">
                    {rec.description || "Tidak ada deskripsi."}
                  </p>

                  {/* Info Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    <div className="flex items-center gap-3 text-sm text-foreground/70 bg-slate-800/10 p-3 rounded-xl border border-accent-blue/10">
                      <Calendar className="w-4 h-4 text-accent-blue" />
                      <div>
                        <span className="block text-[10px] uppercase tracking-wider font-bold text-accent-blue mb-0.5">Masa Pendaftaran</span>
                        <span className="font-medium text-foreground">
                          {new Date(rec.openDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" })} - {new Date(rec.closeDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 text-sm text-foreground/70 bg-slate-800/10 p-3 rounded-xl border border-accent-blue/10">
                      <ShieldCheck className="w-4 h-4 text-accent-blue" />
                      <div>
                        <span className="block text-[10px] uppercase tracking-wider font-bold text-accent-blue mb-0.5">Posisi Dibutuhkan</span>
                        <span className="font-medium text-foreground">
                          {rec.positions?.length || 0} Divisi/Posisi
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-auto pt-4 border-t border-accent-blue/10 flex flex-wrap items-center gap-4">
                    {isOpen && rec.formUrl && (
                      <a 
                        href={rec.formUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-accent-gold hover:bg-yellow-400 text-slate-900 px-6 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(250,204,21,0.2)]"
                      >
                        Daftar Sekarang <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <Link 
                      href={`/oprec/${rec.slug}`}
                      className="text-sm font-bold text-foreground/70 hover:text-foreground flex items-center gap-2 px-4 py-2.5 transition-colors"
                    >
                      Lihat Detail <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 glass-subtle border border-accent-blue/15 rounded-3xl">
          <Users className="w-12 h-12 text-accent-blue/30 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground">Belum Ada Rekrutmen</h3>
          <p className="text-sm text-foreground/60 mt-1 max-w-md mx-auto">
            Saat ini belum ada pembukaan pendaftaran kepanitiaan atau pengurus. Silakan pantau terus informasi selanjutnya.
          </p>
        </div>
      )}
    </main>
  );
}
