"use client";

import React, { useState, useEffect } from "react";
import { PublicApiService, type AgendaItem } from "@/lib/api";
import Link from "next/link";
import { Calendar, Clock, MapPin, ArrowRight, ShieldAlert } from "lucide-react";

export function AgendaSection() {
  const [agendas, setAgendas] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    PublicApiService.getAgenda({ page: 1, limit: 3 })
      .then((res) => {
        if (res?.data) {
          setAgendas(res.data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading agenda:", err);
        setLoading(false);
      });
  }, []);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  return (
    <section className="w-full max-w-6xl mx-auto py-12 px-6 relative z-10 bg-transparent">


      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 border-b border-sage/15 pb-6">
        <div>
          <span className="text-xs font-semibold text-sage uppercase tracking-wide block mb-2">
            Agenda Terjadwal
          </span>
          <h2 className="text-2xl md:text-4xl font-extrabold text-foreground tracking-tight">
            Agenda & Kegiatan Terdekat
          </h2>
        </div>
        <Link
          href="/proker"
          className="text-xs font-bold uppercase tracking-widest text-accent-gold hover:text-sage flex items-center gap-2 transition-colors duration-300 group"
        >
          <span className="text-[10px] font-bold uppercase tracking-wider group-hover:pr-1 transition-all">Lihat Kalender Proker</span>
          <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1.5" />
        </Link>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-subtle border border-sage/10 rounded-2xl p-6 h-52 animate-pulse flex flex-col justify-between">
              <div className="flex flex-col gap-3">
                <div className="h-4 bg-slate-green/40 rounded w-1/3" />
                <div className="h-6 bg-slate-green/50 rounded w-3/4" />
                <div className="h-4 bg-slate-green/40 rounded w-1/2" />
              </div>
              <div className="h-3 bg-slate-green/40 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : agendas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {agendas.map((agenda) => {
            const isDeadline = agenda.type?.toLowerCase() === "deadline";
            return (
              <div
                key={agenda._id}
                className={`glass-subtle border rounded-2xl p-6 relative overflow-hidden transition-all duration-500 hover:scale-[1.01] hover:-translate-y-1.5 hover:shadow-md ${
                  isDeadline
                    ? "border-accent-gold/40 bg-accent-gold/[0.02] hover:border-accent-gold hover:bg-accent-gold/[0.05]"
                    : "border-sage/15 hover:border-accent-gold/40 hover:bg-slate-green/80 dark:hover:bg-slate-green/10"
                }`}
              >


                {/* Event Type Ribbon Overlay */}
                <div
                  className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest rounded-bl-xl border-l border-b ${
                    isDeadline
                      ? "bg-accent-gold/15 text-accent-gold border-accent-gold/30"
                      : "bg-foliage/10 text-sage border-sage/20"
                  }`}
                >
                  {agenda.type}
                </div>

                <div className="flex flex-col h-full justify-between gap-6">
                  <div className="flex flex-col gap-3">
                    {/* Time badge */}
                    <span
                      className={`inline-flex items-center gap-1.5 w-fit px-2.5 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider ${
                        isDeadline
                          ? "bg-accent-gold/10 text-accent-gold border border-accent-gold/25"
                          : "bg-forest/60 text-sage border border-sage/20"
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(agenda.date)}
                    </span>
                    
                    <h3 className="text-foreground font-extrabold text-lg tracking-tight line-clamp-2 mt-1 hover:text-sage transition-colors leading-snug">
                      {agenda.title}
                    </h3>
                    
                    <p className="text-xs text-foreground/75 leading-relaxed line-clamp-3">
                      {agenda.description}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 text-xs text-foreground/60 border-t border-sage/10 pt-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-sage/60 shrink-0" />
                      <span>{agenda.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-sage/60 shrink-0" />
                      <span className="truncate">{agenda.location || "Fakultas Teknik UNESA"}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center glass-subtle border border-sage/20 border-dashed rounded-3xl flex flex-col items-center justify-center gap-4 max-w-3xl mx-auto shadow-inner relative overflow-hidden group">

          
          <div className="w-12 h-12 rounded-full bg-slate-green/50 border border-sage/10 flex items-center justify-center text-foreground/50">
            <ShieldAlert className="w-5 h-5 text-sage/60" />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-sage uppercase tracking-wide">
              Tidak Ada Agenda
            </span>
            <p className="text-xs text-foreground/60">
              Tidak ada agenda kegiatan terjadwal saat ini.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

export default AgendaSection;
