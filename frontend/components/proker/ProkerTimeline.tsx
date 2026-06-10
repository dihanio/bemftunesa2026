"use client";

import React from "react";
import { motion } from "framer-motion";
import { Calendar, Target } from "lucide-react";
import { useProker, ProkerItem } from "@/hooks/useProker";

export function ProkerTimeline() {
  const { data: prokerData, isLoading } = useProker();

  // Sort and filter proker data for timeline (showing max 8 items)
  const events = prokerData?.data
    ? [...prokerData.data]
        .filter((item) => item.startDate) // Ensure only items with start date are shown in timeline
        .sort(
          (a, b) =>
            new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime(),
        )
        .slice(0, 8)
    : [];

  if (isLoading) {
    return (
      <div className="w-full flex justify-between gap-8 py-20 px-12 animate-pulse overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-4 min-w-[180px]"
          >
            <div className="w-12 h-12 bg-white/5 rounded-xl" />
            <div className="h-4 w-24 bg-white/5 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto pb-16 no-scrollbar relative">
      <div className="min-w-[1200px] relative px-12 pt-16">
        {/* Architectural Timeline Track */}
        <div className="absolute top-[120px] left-0 right-0 h-[1px] bg-white/5" />
        <div className="absolute top-[120px] left-12 right-12 h-[1px] bg-gradient-to-r from-[#10b981]/40 via-[#10b981]/10 to-transparent" />

        <div className="flex justify-between relative z-10 px-4">
          {events.map((event: ProkerItem, idx: number) => {
            const date = new Date(event.startDate!);
            const formattedDate = date.toLocaleDateString("id-ID", {
              month: "short",
              year: "numeric",
            });
            const isActive =
              event.status === "Ongoing" || event.status === "Upcoming";

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="flex flex-col items-center group cursor-pointer relative min-w-[200px]"
              >
                {/* Vertical Support Line */}
                <div className="absolute top-[30px] w-px h-[40px] bg-white/10 group-hover:bg-[#10b981]/30 transition-colors" />

                {/* Date Label */}
                <div className="text-[9px] font-mono text-gray-500 group-hover:text-[#10b981] uppercase tracking-[0.3em] mb-12 transition-all">
                  {formattedDate}
                </div>

                {/* Node Structure */}
                <div className="relative mb-10">
                  {/* Orbit Ring */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 border border-white/5 rounded-full group-hover:border-[#10b981]/20 transition-all duration-700" />

                  <div
                    className={`w-12 h-12 flex items-center justify-center transition-all duration-500 relative z-20
                     ${
                       isActive
                         ? "bg-[#10b981] text-[#091c11] shadow-[0_0_25px_rgba(16, 185, 129,0.3)]"
                         : "bg-white/5 text-gray-400 border border-white/10 group-hover:border-[#10b981]/50 group-hover:bg-[#12331e]/20"
                     }
                     rounded-xl rotate-0 group-hover:rotate-12
                   `}
                  >
                    <Calendar className="w-5 h-5" />
                  </div>

                  {/* Status Indicator Dot */}
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#06130b] rounded-full flex items-center justify-center border border-white/10 z-30">
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-[#10b981] animate-pulse" : "bg-gray-600"}`}
                    />
                  </div>
                </div>

                {/* Info Block */}
                <div className="text-center px-4">
                  <h4 className="text-white font-bold text-xs mb-2 group-hover:text-[#10b981] transition-colors leading-relaxed line-clamp-1 uppercase tracking-tight">
                    {event.title}
                  </h4>
                  <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded bg-white/[0.03] border border-white/5">
                    <Target className="w-3 h-3 text-[#10b981] opacity-50" />
                    <span className="text-[8px] font-mono text-gray-500 uppercase tracking-tighter">
                      {event.status}
                    </span>
                  </div>
                </div>

                {/* Coordinate marker detail */}
                <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[7px] font-mono text-gray-800 opacity-0 group-hover:opacity-100 transition-opacity uppercase">
                  {`Mark_${idx.toString().padStart(2, "0")} // LN_${idx * 12}`}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Global Blueprint Details */}
        <div className="absolute top-0 right-12 flex items-center gap-10">
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-mono text-gray-700 uppercase">
              SYS_LOG: ROADMAP_SYNC_v2.1
            </span>
            <div className="w-32 h-[1px] bg-white/5 mt-1" />
          </div>
        </div>
      </div>
    </div>
  );
}
