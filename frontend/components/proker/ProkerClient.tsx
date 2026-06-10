"use client";

import {
  Calendar,
  Layers,
  CheckCircle2,
  Search,
  ArrowUpRight,
  Filter,
} from "lucide-react";
import Link from "next/link";
import { ProkerTimeline } from "@/components/proker/ProkerTimeline";
import { ProkerStatus, useProker, ProkerItem } from "@/hooks/useProker";
import { useState } from "react";

export default function ProkerClient() {
  const { data: prokerData, isLoading, error } = useProker();
  const [activeStatus, setActiveStatus] = useState<ProkerStatus | "Semua">(
    "Semua",
  );
  const [searchTerm, setSearchTerm] = useState("");
  const proker = prokerData?.data || [];

  const statuses: Array<ProkerStatus | "Semua"> = [
    "Semua",
    "Upcoming",
    "Ongoing",
    "Completed",
    "Cancelled",
  ];

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredProker = proker.filter((item) => {
    const matchesStatus =
      activeStatus === "Semua" || item.status === activeStatus;
    const matchesSearch =
      normalizedSearchTerm.length === 0 ||
      item.title.toLowerCase().includes(normalizedSearchTerm) ||
      (item.description || "").toLowerCase().includes(normalizedSearchTerm);

    return matchesStatus && matchesSearch;
  });

  return (
    <>
      {/* Page Title */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-20 relative">
        <div className="absolute -left-6 top-0 w-1 h-full bg-[#10b981]/20" />
        <div>
          <h1 className="text-4xl md:text-7xl font-bold text-white mb-4 font-sans tracking-tight">
            Program Kerja
          </h1>
          <p className="text-[#10b981] font-mono tracking-[0.3em] uppercase flex items-center gap-3">
            <span className="w-12 h-[1px] bg-[#10b981]/30"></span>
            Strategic Initiatives 2026
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative group flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-[#10b981] transition-colors" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={
                activeStatus === "Semua"
                  ? "Cari Proker..."
                  : `Cari ${activeStatus}...`
              }
              className="w-full sm:w-72 bg-white/[0.03] border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-sm text-white focus:outline-none focus:border-[#10b981]/40 focus:bg-white/[0.05] transition-all font-mono"
            />
          </div>
        </div>
      </div>

      {/* Timeline Section */}
      <div className="mb-28">
        <div className="flex items-center gap-4 mb-12">
          <h2 className="text-xs font-bold text-white/40 uppercase tracking-[0.4em] whitespace-nowrap">
            Strategic Roadmap
          </h2>
          <div className="w-full h-px bg-white/5" />
        </div>
        <ProkerTimeline />
      </div>

      {/* Categories Filter */}
      <div className="mb-16">
        <div className="flex items-center gap-3 mb-6 text-[10px] font-mono text-gray-400 uppercase tracking-widest">
          <Filter className="w-3 h-3" /> Filter by Class
        </div>
        <div className="flex flex-wrap gap-3">
          {statuses.map((status, idx) => (
            <button
              key={idx}
              onClick={() => setActiveStatus(status)}
              className={`px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-300 border
                ${
                  activeStatus === status
                    ? "bg-[#10b981] text-[#091c11] border-[#10b981] shadow-[0_10px_20px_-5px_rgba(16, 185, 129,0.3)]"
                    : "bg-white/5 border-white/5 text-gray-400 hover:border-white/20 hover:text-white"
                }
              `}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Proker Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative">
        {/* Decorative Grid Marker */}
        <div className="absolute -left-12 top-0 h-full w-px bg-white/[0.02] hidden xl:block" />

        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-80 rounded-[32px] bg-white/5 animate-pulse"
            />
          ))
        ) : error ? (
          <div className="col-span-full py-24 text-center border border-dashed border-white/10 rounded-[40px] bg-white/[0.01]">
            <p className="text-gray-500 font-mono text-xs uppercase tracking-widest flex items-center justify-center gap-3">
              <span className="w-2 h-2 rounded-full bg-red-500/50 animate-ping" />
              {"// Connection Interrupted // Proker Sync Offline"}
            </p>
          </div>
        ) : filteredProker.length === 0 ? (
          <div className="col-span-full py-24 text-center border border-dashed border-white/10 rounded-[40px]">
            <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">{`// No Strategic Initiatives Found in ${activeStatus}`}</p>
          </div>
        ) : (
          filteredProker.map((item: ProkerItem, idx: number) => (
            <Link
              href={`/proker/${item.slug}`}
              key={idx}
              className="flex flex-col rounded-[32px] glass-subtle p-9 hover:bg-[#12331e]/20 hover:border-white/20 transition-all duration-500 group overflow-hidden relative border border-white/5"
            >
              {/* Architectural Grid Detail - Consistent with NewsSection */}
              <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-[#10b981]/0 group-hover:border-[#10b981]/40 transition-all duration-500 rounded-br-[32px]" />

              <div className="flex justify-between items-start mb-8">
                <span
                  className={`px-3 py-1.5 text-[9px] font-bold rounded-lg uppercase tracking-widest border
                ${
                  item.status === "Ongoing" || item.status === "Upcoming"
                    ? "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30"
                    : "bg-white/5 text-gray-500 border-white/10"
                }
              `}
                >
                  {item.status}
                </span>
                <div className="flex items-center gap-2 text-[10px] font-mono text-gray-600 transition-colors group-hover:text-gray-400">
                  <Layers className="w-3 h-3" />{" "}
                  {item.departmentId?.name || "BEM FT"}
                </div>
              </div>

              <h3 className="text-2xl font-bold text-white mb-5 group-hover:text-[#f5f2eb] transition-colors font-sans leading-tight">
                {item.title}
              </h3>

              <p className="text-sm text-gray-400 leading-relaxed mb-10 flex-grow group-hover:text-gray-300 transition-colors line-clamp-3">
                {item.description}
              </p>

              <div className="flex items-center justify-between pt-8 border-t border-white/5 mt-auto">
                <div className="flex items-center gap-3 text-[10px] font-mono text-gray-400">
                  <Calendar className="w-4 h-4 text-[#10b981] opacity-70" />
                  {item.startDate
                    ? new Date(item.startDate).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "TBA"}
                </div>
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-[#10b981] group-hover:text-[#091c11] transition-all duration-500 group-hover:rotate-12">
                  <ArrowUpRight className="w-6 h-6" />
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Quick Stats CTA */}
      <div className="mt-32 p-12 md:p-20 rounded-[48px] glass-overlay border border-white/5 flex flex-col md:flex-row items-center gap-12 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-2 h-full bg-[#10b981] opacity-60" />
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-[#10b981] opacity-[0.02] rounded-full group-hover:opacity-[0.05] transition-opacity duration-1000" />

        <div className="md:w-2/3 relative z-10">
          <p className="text-[#10b981] text-[10px] font-mono uppercase tracking-[0.4em] mb-4">
            {"Collab_Protocol // PARTNERSHIP"}
          </p>
          <h3 className="text-3xl md:text-5xl font-bold text-white mb-6 font-sans">
            Ingin Berkolaborasi?
          </h3>
          <p className="text-gray-400 text-base leading-relaxed max-w-xl">
            BEM FT UNESA terbuka untuk partnership dan kolaborasi strategis
            dalam setiap pelaksanaan program kerja kami. Sinergikan ide Anda
            dengan energi mahasiswa teknik.
          </p>
        </div>
        <div className="md:w-1/3 flex justify-end w-full relative z-10">
          <Link
            href="/kontak"
            className="btn-strategic flex-1 md:flex-none py-5 px-10 text-base"
          >
            Hubungi Kerjasama <CheckCircle2 className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </>
  );
}
