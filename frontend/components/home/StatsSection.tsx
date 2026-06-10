"use client";

import { useStats } from "@/hooks/useStats";
import { motion, useInView, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";

function Counter({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const spring = useSpring(0, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const display = useTransform(spring, (current) =>
    Math.round(current).toString().padStart(2, "0"),
  );

  useEffect(() => {
    if (isInView) {
      spring.set(value);
    }
  }, [isInView, spring, value]);

  return <motion.span ref={ref}>{display}</motion.span>;
}

export function StatsSection() {
  const { data: statsData } = useStats();
  const fetchedStats = statsData?.data;

  const stats = [
    {
      label: "Fungsionaris",
      value: fetchedStats?.members || 0,
      unit: "Person",
    },
    {
      label: "Program Kerja",
      value: fetchedStats?.proker || 0,
      unit: "Events",
    },
    {
      label: "Departemen",
      value: fetchedStats?.departments || 0,
      unit: "Units",
    },
    {
      label: "Aspirasi Masuk",
      value: fetchedStats?.aspirations.total || 0,
      unit: "Voice",
    },
  ];

  return (
    <section className="w-full max-w-6xl mx-auto py-20 px-6 relative z-10 overflow-hidden">
      {/* Background Decorative Grid Detail */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full opacity-[0.02] pointer-events-none">
        <div className="absolute top-0 left-0 w-px h-full bg-white" />
        <div className="absolute top-0 right-0 w-px h-full bg-white" />
      </div>

      <div className="border border-white/10 grid grid-cols-2 lg:grid-cols-4 relative">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`py-12 md:py-16 px-4 md:px-6 flex flex-col items-center justify-center group hover:bg-white/3 transition-all duration-500 relative overflow-hidden
            ${index % 2 !== 0 ? "border-l border-white/10" : ""}
            ${index < 2 ? "border-b border-white/10 lg:border-b-0" : ""}
            lg:border-l lg:border-white/10 ${index === 0 ? "lg:border-l-0" : ""}
          `}
          >
            {/* Corner decorator */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#10b981]/40 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#10b981]/40 opacity-0 group-hover:opacity-100 transition-opacity" />

            <motion.span
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="text-[10px] font-mono tracking-[0.4em] text-[#10b981] uppercase mb-6 flex items-center gap-2"
            >
              <span className="w-1 h-1 rounded-full bg-[#10b981] animate-pulse" />
              {stat.label}
            </motion.span>

            <div className="flex items-baseline gap-2">
              <span className="text-4xl md:text-7xl font-bold font-mono text-white group-hover:text-[#f5f2eb] transition-colors leading-none tracking-tighter">
                {fetchedStats ? <Counter value={stat.value} /> : "--"}
              </span>
              <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">
                {stat.unit}
              </span>
            </div>

            {/* Hover bar animaion */}
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-linear-to-r from-transparent via-[#10b981] to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700 ease-out" />
          </div>
        ))}
      </div>

      {/* Decorative Branding / Coordinates */}
      <div className="flex flex-col md:flex-row justify-between items-center mt-8 gap-4 px-2 opacity-40">
        <div className="flex items-center gap-4">
          <span className="text-[8px] font-mono text-white tracking-[0.4em] uppercase">
            Precision Metrics // AEC_DATA_PULSE
          </span>
          <div className="w-8 h-px bg-white/20" />
          <span className="text-[8px] font-mono text-white tracking-widest uppercase">
            BEM FT UNESA 2026
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full border border-white/20 flex items-center justify-center">
            <div className="w-0.5 h-0.5 bg-[#10b981]" />
          </div>
          <span className="text-[8px] font-mono text-white">
            LOC: 07.23S 112.72E // STATUS:{" "}
            <span className="text-[#10b981]">ACTIVE_SYNC</span>
          </span>
        </div>
      </div>
    </section>
  );
}
