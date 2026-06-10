"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Users,
  ShieldCheck,
  Network,
  ArrowRight,
  Fingerprint,
} from "lucide-react";
import { OrgChart } from "@/components/struktur/OrgChart";
import { useStructure } from "@/hooks/useStructure";
import { useStats } from "@/hooks/useStats";

export default function StrukturClient() {
  const { data: structureData, isLoading: isStructureLoading } = useStructure();
  const { data: statsData } = useStats();
  const [expandedDept, setExpandedDept] = useState<string | null>(null);

  const departments = structureData?.data?.departments || [];
  const bpiData = structureData?.data?.bpi || [];
  const members = structureData?.data?.members || [];

  const isLoading = isStructureLoading;

  return (
    <div className="w-full mt-12 relative">
      {/* Background Ambience */}
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#10b981]/5 rounded-full blur-[160px]" />
        <div className="absolute bottom-[30%] left-[10%] w-[400px] h-[400px] bg-emerald-950/20 rounded-full blur-[120px]" />
      </div>

      {/* Page Header */}
      <div className="text-center mb-28 relative">
        <div className="inline-flex items-center gap-2.5 px-4.5 py-2 rounded-full border border-[#10b981]/20 bg-[#12331e]/20 text-[10px] font-bold font-mono text-[#10b981] uppercase tracking-[0.2em] mb-8 animate-fade-in shadow-[0_0_15px_rgba(16,185,129,0.1)]">
          <img
            src="/logo/bpi.png"
            alt="BPI Logo"
            className="w-3.5 h-3.5 object-contain"
            style={{ display: "none" }}
            onLoad={(e) => {
              e.currentTarget.style.display = "block";
              const fallback = e.currentTarget
                .nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = "none";
            }}
            onError={(e) => {
              e.currentTarget.style.display = "none";
              const fallback = e.currentTarget
                .nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = "block";
            }}
          />
          <Fingerprint className="w-3.5 h-3.5 text-[#10b981]" />
          <span>Cabinet Authentication Protocol</span>
        </div>
        <h1 className="text-4xl md:text-7xl font-extrabold text-white mb-6 font-sans tracking-tight leading-none">
          Struktur{" "}
          <span className="bg-linear-to-r from-white via-white to-[#10b981] bg-clip-text text-transparent">
            Organisasi
          </span>
        </h1>
        <div className="flex flex-col items-center gap-4">
          <p className="text-gray-400 font-mono tracking-[0.4em] uppercase text-xs">
            {"//"} Kabinet Danadyaksa{" "}
            <span className="text-[#10b981]">2026</span>
          </p>
          <div className="w-24 h-0.5 bg-linear-to-r from-transparent via-[#10b981]/40 to-transparent" />
        </div>

        <div className="flex flex-wrap justify-center gap-4 mt-12">
          <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl border border-white/5 bg-white/2 text-[10px] font-bold font-mono uppercase text-gray-400 backdrop-blur-md">
            <Network className="w-4 h-4 text-[#10b981]/80" /> Hierarchy Protocol
          </div>
          <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl border border-[#10b981]/20 bg-[#12331e]/10 text-[10px] font-bold font-mono uppercase text-[#10b981] backdrop-blur-md shadow-[0_0_15px_rgba(16,185,129,0.05)]">
            <Users className="w-4 h-4 animate-pulse" />{" "}
            {statsData?.data?.members || 0} Active Personnel
          </div>
        </div>
      </div>

      {/* Interactive Chart Section */}
      <div className="mb-44" id="interactive-org-chart">
        <div className="flex items-center gap-6 mb-16">
          <div className="w-full h-px bg-linear-to-l from-white/10 to-transparent" />
          <h2 className="text-xs font-extrabold text-white/35 uppercase tracking-[0.4em] whitespace-nowrap">
            Interactive Org Chart
          </h2>
          <div className="w-full h-px bg-linear-to-r from-white/10 to-transparent" />
        </div>
        <div className="p-4 md:p-10 bg-white/1 rounded-[48px] overflow-hidden border border-white/5 relative shadow-2xl">
          {/* Futuristic scanning detail */}
          <div className="absolute top-0 right-0 p-8 text-[8px] font-bold font-mono text-gray-600 uppercase tracking-widest opacity-40">
            {"Hierarchical Protocol // v3.0"}
          </div>
          <OrgChart
            bpi={bpiData}
            departments={departments}
            members={members}
            expandedDept={expandedDept}
            setExpandedDept={setExpandedDept}
          />
        </div>
      </div>

      {/* Grid Departments Section */}
      <div>
        <div className="flex items-center gap-6 mb-16">
          <h2 className="text-xs font-extrabold text-white/35 uppercase tracking-[0.4em] whitespace-nowrap">
            Departemen & Biro
          </h2>
          <div className="w-full h-px bg-linear-to-r from-white/10 to-transparent" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="p-10 rounded-[40px] bg-white/1 border border-white/5 animate-pulse"
                >
                  <div className="w-14 h-14 bg-white/5 rounded-2xl mb-8" />
                  <div className="h-6 w-3/4 bg-white/10 rounded-lg mb-4" />
                  <div className="h-4 w-full bg-white/5 rounded-md mb-2" />
                  <div className="h-4 w-5/6 bg-white/5 rounded-md" />
                </div>
              ))
            : departments.map((dept, idx) => (
                <div
                  key={idx}
                  className="p-10 rounded-[40px] bg-[#05110a]/40 border border-white/5 hover:border-[#10b981]/30 hover:bg-[#12331e]/10 hover:-translate-y-2.5 transition-premium group overflow-hidden relative shadow-[0_15px_45px_rgba(0,0,0,0.35)] hover:shadow-[0_20px_50px_rgba(16,185,129,0.08)]"
                >
                  {/* Background Glow */}
                  <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-[#10b981] opacity-[0.01] group-hover:opacity-[0.06] transition-all duration-700 rounded-full blur-3xl" />

                  {/* Decorative Corner */}
                  <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-white/5 group-hover:border-[#10b981]/40 transition-premium" />

                  <div className="flex items-start justify-between mb-8">
                    {/* Technical Icon Housing */}
                    <div className="relative p-2 group-hover:scale-110 transition-premium">
                      <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-[#10b981]/40" />
                      <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-[#10b981]/40" />

                      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-[#10b981]/30 group-hover:bg-[#10b981]/5 transition-premium relative overflow-hidden">
                        <img
                          src={`/logo/departemen/${dept.slug}.png`}
                          alt={`${dept.name} Logo`}
                          className="w-[70%] h-[70%] object-contain"
                          style={{ display: "none" }}
                          onLoad={(e) => {
                            e.currentTarget.style.display = "block";
                            const fallback = e.currentTarget
                              .nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = "none";
                          }}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            const fallback = e.currentTarget
                              .nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = "block";
                          }}
                        />
                        <ShieldCheck className="w-7 h-7 text-[#10b981]" />
                        <span className="absolute -bottom-1 -right-1 text-[4px] font-mono text-[#10b981]/10 group-hover:text-[#10b981]/30 tracking-tighter uppercase p-1">
                          UNIT_{idx.toString().padStart(2, "0")}
                        </span>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold font-mono text-gray-500 uppercase tracking-widest group-hover:text-[#10b981]/60 transition-colors pt-2">
                      DEP_{dept.code || dept.slug?.toUpperCase() || "X"}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-[#10b981] transition-colors leading-tight tracking-tight">
                    {dept.name}
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed mb-8 group-hover:text-gray-300 transition-colors min-h-[72px]">
                    {dept.description}
                  </p>
                  <Link
                    href={`/struktur/${dept.slug}`}
                    className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#10b981] hover:text-white transition-all group/btn"
                  >
                    EXPLORE UNIT{" "}
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-2 transition-transform" />
                  </Link>
                </div>
              ))}
        </div>
      </div>
    </div>
  );
}
