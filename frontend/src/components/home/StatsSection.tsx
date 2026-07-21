"use client";

import React, { useState, useEffect } from "react";

import { PublicApiService, type StatsData } from "@/lib/api";

export function StatsSection() {
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
        console.error("Error loading statistics:", err);
        setLoading(false);
      });
  }, []);

  const statsItems = [
    {
      label: "Departemen & Biro",
      value: loading ? "0" : stats?.departments ?? 0,
      desc: "Unit kerja taktis kabinet"
    },
    {
      label: "Operatif Aktif",
      value: loading ? "0" : stats?.members ?? 0,
      desc: "Fungsionaris BEM FT 2026"
    },
    {
      label: "Aspirasi Terproses",
      value: loading ? "0/0" : `${stats?.aspirations?.resolved ?? 0}/${stats?.aspirations?.total ?? 0}`,
      desc: "Komitmen pelayanan mahasiswa"
    }
  ];

  return (
    <section className="w-full max-w-6xl mx-auto py-12 px-6 relative z-10 bg-transparent">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4/5 h-[80px] rounded-full bg-accent-gold/5 blur-[80px] pointer-events-none -z-10" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {statsItems.map((stat, index) => {


              {/* Text fields */}
          return (
            <div
              key={index}
              className="relative glass-subtle border border-white dark:border-accent-blue/15 rounded-2xl p-6 flex flex-col gap-1.5 transition-all duration-500 hover:border-accent-gold/50 hover:bg-white/60 dark:hover:bg-slate-800/50 hover:-translate-y-1.5 hover:shadow-md group overflow-hidden"
            >
              <span className="text-xs font-semibold text-foreground/60 uppercase tracking-wide leading-none">
                {stat.label}
              </span>
              <span className="text-3xl font-extrabold text-foreground font-mono tracking-tight leading-none my-1 group-hover:text-accent-gold transition-colors duration-300">
                {stat.value}
              </span>
              <span className="text-xs text-foreground/50 leading-none group-hover:text-accent-blue transition-colors">
                {stat.desc}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default StatsSection;
