"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  ChevronDown,
  ChevronUp,
  Shield,
  Globe,
  Orbit,
  UserCheck,
  ArrowRight,
} from "lucide-react";
import { Department, StructureLeader } from "@/hooks/useStructure";

interface OrgChartProps {
  bpi: StructureLeader[];
  departments: Department[];
  members: StructureLeader[];
  expandedDept: string | null;
  setExpandedDept: (id: string | null) => void;
}

function getFormattedRole(role: string, deptName: string): string {
  const isBiro = deptName.toLowerCase().includes("biro");
  const roleLower = role.toLowerCase();

  if (roleLower === "kadep") {
    return isBiro ? "Kepala Biro" : "Kepala Departemen";
  }
  if (roleLower === "wakadep") {
    return isBiro ? "Wakil Kepala Biro" : "Wakil Kepala Departemen";
  }
  if (roleLower === "staff" || roleLower === "staf") {
    return isBiro ? "Staf Biro" : "Staf Departemen";
  }
  return role;
}

function getAvatarUrl(name: string, avatar?: string): string | null {
  const url =
    avatar ||
    (() => {
      const specialNames: Record<string, string> = {
        "Diha Anfeu Nio Julaynda": "/fungsionaris/Diha Anfeu Nio Julaynda.png",
        "Syahrul Fath": "/fungsionaris/Syahrul Fath.png",
        "Elok Faiqoh": "/fungsionaris/Elok Faiqoh.png",
        "Stefi Febianova": "/fungsionaris/Stefi Febianova.png",
      };
      return specialNames[name] || null;
    })();

  if (!url) return null;

  if (url.startsWith("/")) {
    return url
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/");
  }
  return url;
}

export function OrgChart({
  bpi,
  departments,
  members,
  expandedDept,
  setExpandedDept,
}: OrgChartProps) {
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [logoErrors, setLogoErrors] = useState<Record<string, boolean>>({});

  const handleImageError = (id: string) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  const pimpinan = bpi.filter((u) => u.role === "Super Admin").slice(0, 2);
  const ketua = pimpinan[0];
  const wakil = pimpinan[1];

  // Animation variants
  const listVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  } as const;

  const itemVariants = {
    hidden: { x: -12, opacity: 0 },
    show: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 85,
        damping: 18,
        mass: 0.8,
      },
    },
  } as const;

  return (
    <div className="w-full py-16 px-4">
      {/* Root Node: Ketua & Wakil */}
      <div className="flex flex-col items-center mb-10 relative">
        {/* Core Connection Pillar */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-64 h-64 border border-[#10b981]/5 rounded-full -translate-y-1/2 -z-10 animate-pulse" />

        <div className="flex flex-col md:flex-row gap-8 md:gap-16 relative justify-center items-center">
          {/* Ketua Card */}
          <div className="w-[280px] rounded-[40px] border border-[#10b981]/25 bg-linear-to-b from-[#12331e]/20 to-[#0c1a11]/40 backdrop-blur-xl p-6 text-center shadow-[0_20px_50px_-20px_rgba(16,185,129,0.25)] relative overflow-hidden group transition-premium hover:border-[#10b981]/50 hover:shadow-[0_30px_60px_-15px_rgba(16,185,129,0.4)] hover:-translate-y-1.5">
            {/* Corner Accents */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-[#10b981]/30 opacity-55" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-[#10b981]/30 opacity-55" />

            {/* 3D Pop-Up Photo Frame */}
            <div className="w-full h-[300px] relative overflow-hidden mb-4 shrink-0 transition-premium group-hover:scale-[1.03] flex items-end justify-center">
              {/* Arched gradient backdrop */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[85%] h-[82%] rounded-t-full bg-linear-to-b from-[#10b981]/20 via-[#10b981]/5 to-transparent border-t border-x border-[#10b981]/20 shadow-[inset_0_2px_12px_rgba(16,185,129,0.15)] group-hover:border-[#10b981]/40 group-hover:from-[#10b981]/30 transition-premium" />

              {/* Pop-up avatar */}
              {getAvatarUrl(ketua?.name || "", ketua?.avatar) &&
              !imageErrors[ketua._id] ? (
                <img
                  src={
                    getAvatarUrl(ketua?.name || "", ketua?.avatar) || undefined
                  }
                  alt={ketua.name}
                  className="relative z-10 w-full h-[96%] object-contain object-bottom transition-premium group-hover:scale-105 origin-bottom select-none filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)] group-hover:drop-shadow-[0_12px_24px_rgba(16,185,129,0.25)]"
                  onError={() => handleImageError(ketua._id)}
                />
              ) : (
                <div className="relative z-10 w-[85%] h-[82%] rounded-t-full flex flex-col items-center justify-center gap-2 text-[#10b981]/30">
                  <Shield className="w-10 h-10 text-[#10b981]/80" />
                  <span className="text-[9px] uppercase tracking-widest font-mono text-gray-500">
                    No Image
                  </span>
                </div>
              )}
              {/* Premium bottom glow */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[85%] h-8 bg-linear-to-t from-[#10b981]/20 to-transparent opacity-0 group-hover:opacity-100 transition-premium z-10" />
            </div>

            <h4 className="text-white font-extrabold text-lg mb-0.5 tracking-tight group-hover:text-[#10b981] transition-colors truncate">
              {ketua?.name || "Ketua BEM"}
            </h4>
            <p className="text-[10px] text-[#10b981] font-mono tracking-[0.25em] uppercase mb-4">
              Ketua BEM FT UNESA
            </p>

            <div className="flex justify-between items-center bg-white/2 rounded-2xl px-3 py-2 border border-white/5">
              <div className="flex items-center gap-1.5">
                <img
                  src="/logo/bpi.png"
                  alt="BPI"
                  className="w-3.5 h-3.5 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <span className="text-[9px] text-gray-500 font-mono">
                  CORE_KABINET
                </span>
              </div>
              <span className="text-[9px] text-[#10b981] font-mono font-bold uppercase tracking-wider animate-pulse">
                PRESIDENT
              </span>
            </div>
          </div>

          {/* Wakil Card */}
          <div className="w-[280px] rounded-[40px] border border-white/10 bg-linear-to-b from-white/2 to-white/1 backdrop-blur-xl p-6 text-center shadow-[0_20px_50px_-20px_rgba(255,255,255,0.03)] relative overflow-hidden group transition-premium hover:border-[#10b981]/40 hover:bg-[#12331e]/5 hover:-translate-y-1.5">
            {/* Corner Accents */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-white/15 opacity-40" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-white/15 opacity-40" />

            {/* 3D Pop-Up Photo Frame */}
            <div className="w-full h-[300px] relative overflow-hidden mb-4 shrink-0 transition-premium group-hover:scale-[1.03] flex items-end justify-center">
              {/* Arched gradient backdrop */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[85%] h-[82%] rounded-t-full bg-linear-to-b from-white/10 via-white/5 to-transparent border-t border-x border-white/15 transition-premium group-hover:border-[#10b981]/30 group-hover:from-[#10b981]/15" />

              {/* Pop-up avatar */}
              {getAvatarUrl(wakil?.name || "", wakil?.avatar) &&
              !imageErrors[wakil._id] ? (
                <img
                  src={
                    getAvatarUrl(wakil?.name || "", wakil?.avatar) || undefined
                  }
                  alt={wakil.name}
                  className="relative z-10 w-full h-[96%] object-contain object-bottom transition-premium group-hover:scale-105 origin-bottom select-none filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)] group-hover:drop-shadow-[0_12px_24px_rgba(16,185,129,0.2)]"
                  onError={() => handleImageError(wakil._id)}
                />
              ) : (
                <div className="relative z-10 w-[85%] h-[82%] rounded-t-full flex flex-col items-center justify-center gap-2 text-gray-500">
                  <Orbit className="w-10 h-10 text-gray-500 group-hover:text-[#10b981]/60 transition-colors" />
                  <span className="text-[9px] uppercase tracking-widest font-mono text-gray-500">
                    No Image
                  </span>
                </div>
              )}
              {/* Premium bottom glow */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[85%] h-8 bg-linear-to-t from-[#10b981]/10 to-transparent opacity-0 group-hover:opacity-100 transition-premium z-10" />
            </div>

            <h4 className="text-white font-extrabold text-lg mb-0.5 tracking-tight group-hover:text-[#10b981] transition-colors truncate">
              {wakil?.name || "Wakil Ketua"}
            </h4>
            <p className="text-[10px] text-gray-400 font-mono tracking-[0.25em] uppercase mb-4 group-hover:text-[#10b981]/70 transition-colors">
              Wakil Ketua BEM FT
            </p>

            <div className="flex justify-between items-center bg-white/2 rounded-2xl px-3 py-2 border border-white/5">
              <div className="flex items-center gap-1.5">
                <img
                  src="/logo/bpi.png"
                  alt="BPI"
                  className="w-3.5 h-3.5 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <span className="text-[9px] text-gray-500 font-mono">
                  VICE_KABINET
                </span>
              </div>
              <span className="text-[9px] text-gray-400 font-mono uppercase tracking-wider group-hover:text-[#10b981]/70 transition-colors">
                VICE_PRESIDENT
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Connection Line Tier 1 -> Tier 2 */}
      <div className="flex flex-col items-center mb-10">
        <div className="w-[2px] h-12 bg-linear-to-b from-[#10b981]/40 to-[#10b981]/20 shadow-[0_0_8px_rgba(16,185,129,0.2)]" />
      </div>

      {/* Tier 2: Sekretaris & Bendahara */}
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 justify-center w-full max-w-6xl mx-auto mb-10 relative z-10">
        {/* Sekretaris Column */}
        <div className="flex flex-col items-center gap-3 w-full lg:w-auto">
          <span className="text-[8px] font-bold font-mono text-[#10b981]/50 uppercase tracking-[0.2em] mb-2">
            Sekretariat
          </span>
          <div className="flex flex-wrap gap-6 justify-center w-full max-w-2xl">
            {bpi
              .filter((u) => u.role === "Sekretaris")
              .map((sec) => (
                <div
                  key={sec._id}
                  className="w-[210px] rounded-[32px] border border-white/5 bg-white/1 hover:border-[#10b981]/25 hover:bg-[#12331e]/5 hover:-translate-y-1.5 transition-premium p-5 text-center group relative shadow-lg overflow-hidden"
                >
                  {/* 3D Pop-Up Photo Frame */}
                  <div className="w-full h-[220px] relative overflow-hidden mb-4 shrink-0 transition-premium group-hover:scale-[1.03] flex items-end justify-center">
                    {/* Arched backdrop */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[88%] h-[82%] rounded-t-full bg-linear-to-b from-[#10b981]/15 to-transparent border-t border-x border-[#10b981]/15 transition-premium group-hover:border-[#10b981]/30" />

                    {/* Pop-up avatar */}
                    {getAvatarUrl(sec.name, sec.avatar) &&
                    !imageErrors[sec._id] ? (
                      <img
                        src={getAvatarUrl(sec.name, sec.avatar) || undefined}
                        alt={sec.name}
                        className="relative z-10 w-full h-[96%] object-contain object-bottom transition-premium group-hover:scale-105 origin-bottom select-none filter drop-shadow-[0_6px_12px_rgba(0,0,0,0.45)] group-hover:drop-shadow-[0_8px_16px_rgba(16,185,129,0.15)]"
                        onError={() => handleImageError(sec._id)}
                      />
                    ) : (
                      <div className="relative z-10 w-[88%] h-[82%] rounded-t-full flex items-center justify-center text-[#10b981]/30">
                        <User className="w-10 h-10" />
                      </div>
                    )}
                  </div>
                  <div className="w-full">
                    <h5 className="text-white font-extrabold text-sm truncate group-hover:text-[#10b981] transition-colors">
                      {sec.name}
                    </h5>
                    <p className="text-[9px] text-[#10b981]/80 font-mono tracking-wider mt-0.5 uppercase">
                      Sekretaris BEM
                    </p>
                  </div>

                  <div className="flex justify-between items-center bg-white/1 rounded-xl px-2.5 py-1 border border-white/5 mt-3">
                    <div className="flex items-center gap-1">
                      <img
                        src="/logo/bpi.png"
                        alt="BPI"
                        className="w-3.5 h-3.5 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                      <span className="text-[7.5px] text-gray-500 font-mono">
                        SEKRETARIAT
                      </span>
                    </div>
                    <span className="text-[7.5px] text-gray-400 font-mono uppercase">
                      ACTIVE
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Bendahara Column */}
        <div className="flex flex-col items-center gap-3 w-full lg:w-auto">
          <span className="text-[8px] font-bold font-mono text-[#10b981]/50 uppercase tracking-[0.2em] mb-2">
            Kebendaharaan
          </span>
          <div className="flex flex-wrap gap-6 justify-center w-full max-w-md">
            {bpi
              .filter((u) => u.role === "Bendahara")
              .map((ben) => (
                <div
                  key={ben._id}
                  className="w-[210px] rounded-[32px] border border-white/5 bg-white/1 hover:border-[#10b981]/25 hover:bg-[#12331e]/5 hover:-translate-y-1.5 transition-premium p-5 text-center group relative shadow-lg overflow-hidden"
                >
                  {/* 3D Pop-Up Photo Frame */}
                  <div className="w-full h-[220px] relative overflow-hidden mb-4 shrink-0 transition-premium group-hover:scale-[1.03] flex items-end justify-center">
                    {/* Arched backdrop */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[88%] h-[82%] rounded-t-full bg-linear-to-b from-[#10b981]/15 to-transparent border-t border-x border-[#10b981]/15 transition-premium group-hover:border-[#10b981]/30" />

                    {/* Pop-up avatar */}
                    {getAvatarUrl(ben.name, ben.avatar) &&
                    !imageErrors[ben._id] ? (
                      <img
                        src={getAvatarUrl(ben.name, ben.avatar) || undefined}
                        alt={ben.name}
                        className="relative z-10 w-full h-[96%] object-contain object-bottom transition-premium group-hover:scale-105 origin-bottom select-none filter drop-shadow-[0_6px_12px_rgba(0,0,0,0.45)] group-hover:drop-shadow-[0_8px_16px_rgba(16,185,129,0.15)]"
                        onError={() => handleImageError(ben._id)}
                      />
                    ) : (
                      <div className="relative z-10 w-[88%] h-[82%] rounded-t-full flex items-center justify-center text-[#10b981]/30">
                        <User className="w-10 h-10" />
                      </div>
                    )}
                  </div>
                  <div className="w-full">
                    <h5 className="text-white font-extrabold text-sm truncate group-hover:text-[#10b981] transition-colors">
                      {ben.name}
                    </h5>
                    <p className="text-[9px] text-[#10b981]/80 font-mono tracking-wider mt-0.5 uppercase">
                      Bendahara BEM
                    </p>
                  </div>

                  <div className="flex justify-between items-center bg-white/1 rounded-xl px-2.5 py-1 border border-white/5 mt-3">
                    <div className="flex items-center gap-1">
                      <img
                        src="/logo/bpi.png"
                        alt="BPI"
                        className="w-3.5 h-3.5 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                      <span className="text-[7.5px] text-gray-500 font-mono">
                        KEBENDAHARAAN
                      </span>
                    </div>
                    <span className="text-[7.5px] text-gray-400 font-mono uppercase">
                      ACTIVE
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Connection Line Tier 2 -> Tier 3 */}
      <div className="flex flex-col items-center mb-10">
        <div className="w-[2px] h-12 bg-linear-to-b from-[#10b981]/20 to-[#10b981]/10" />
      </div>

      {/* Connection Architecture Grid */}
      <div className="flex flex-col items-center mb-16 px-12">
        <div className="w-full h-px bg-white/5 relative">
          <div className="absolute left-0 -top-1 h-3 w-px bg-white/10" />
          <div className="absolute right-0 -top-1 h-3 w-px bg-white/10" />
          <div className="absolute left-1/2 -top-1 h-12 w-[2px] bg-linear-to-b from-[#10b981]/30 to-transparent" />
        </div>
      </div>

      {/* Dept Nodes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-10">
        {departments.map((dept) => {
          const isSelected = expandedDept === dept._id;
          const deptMembers = (members || []).filter(
            (m) => m.departmentId === dept._id,
          );
          const memberCount = deptMembers.length;

          return (
            <motion.div
              key={dept._id}
              layout
              onClick={() => setExpandedDept(isSelected ? null : dept._id)}
              className={`p-7 rounded-[32px] border transition-premium cursor-pointer relative overflow-hidden group
                ${
                  isSelected
                    ? "border-[#10b981]/50 bg-[#12331e]/20 shadow-[0_20px_40px_-20px_rgba(16, 185, 129,0.3)]"
                    : "border-white/5 bg-white/1 hover:bg-white/4 hover:border-white/20"
                }
              `}
            >
              {/* Corner Detail */}
              <div className="absolute top-0 right-0 w-6 h-6 border-t border-r border-[#10b981]/0 group-hover:border-[#10b981]/20 transition-premium" />

              <div className="flex items-center gap-5">
                {/* Technical Icon Housing */}
                <div className="relative p-1.5 transition-premium">
                  <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-[#10b981]/40" />
                  <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-[#10b981]/40" />
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-premium overflow-hidden ${isSelected ? "bg-[#10b981] text-[#091c11] rotate-12" : "bg-white/5 text-gray-500 group-hover:text-white"}`}
                  >
                    {!logoErrors[dept._id] ? (
                      <img
                        src={`/logo/departemen/${dept.slug}.png`}
                        alt={`${dept.name} Logo`}
                        className="w-[70%] h-[70%] object-contain"
                        onError={() =>
                          setLogoErrors((prev) => ({
                            ...prev,
                            [dept._id]: true,
                          }))
                        }
                      />
                    ) : (
                      <Globe className="w-6 h-6" />
                    )}
                  </div>
                </div>
                <div className="grow">
                  <h5 className="text-white font-bold text-sm tracking-tight mb-1">
                    {dept.name}
                  </h5>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[9px] text-gray-500 font-mono flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-[#10b981]/40" />
                      {dept.headId?.name || "Kepala Departemen"}
                    </p>
                    <span className="text-[7.5px] text-[#10b981]/60 font-mono tracking-wider">
                      {memberCount > 0
                        ? `${memberCount} PERSONIL AKTIF`
                        : "SYNCING DATA..."}
                    </span>
                  </div>
                </div>
                <div
                  className={`w-8 h-8 rounded-full border border-white/5 flex items-center justify-center transition-premium ${isSelected ? "bg-white/10" : ""}`}
                >
                  {isSelected ? (
                    <ChevronUp className="w-4 h-4 text-[#10b981]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Dedicated Expanded Department Details Panel (Full Width) */}
      <AnimatePresence>
        {(() => {
          const activeDept = departments.find((d) => d._id === expandedDept);
          if (!activeDept) return null;

          const deptMembers = (members || []).filter(
            (m) => m.departmentId === activeDept._id,
          );
          const memberCount = deptMembers.length;

          // Find Wakadep
          const wakadep = (members || []).find(
            (m) =>
              m.departmentId === activeDept._id &&
              (m.role.toLowerCase() === "wakadep" ||
                m.role.toLowerCase().includes("wakil")),
          );

          // Get staff members (excluding Kadep and Wakadep)
          const staffOnly = (members || []).filter(
            (m) =>
              m.departmentId === activeDept._id &&
              m.role !== "Kadep" &&
              m.role.toLowerCase() !== "wakadep" &&
              !m.role.toLowerCase().includes("wakil"),
          );

          return (
            <motion.div
              initial={{ height: 0, opacity: 0, y: 20 }}
              animate={{ height: "auto", opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0, y: 20 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-6xl mx-auto mt-8 border border-[#10b981]/30 bg-[#12331e]/5 backdrop-blur-xl rounded-[40px] p-8 md:p-12 relative overflow-hidden shadow-[0_30px_70px_rgba(16,185,129,0.15)]"
            >
              {/* Tech Scan Line Overlay */}
              <div className="absolute inset-0 bg-linear-to-b from-[#10b981]/2 via-transparent to-[#10b981]/1 pointer-events-none" />
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#10b981]/50 rounded-tl-[40px]" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#10b981]/50 rounded-br-[40px]" />

              {/* Department Metadata Banner */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#10b981]/20 pb-8 mb-10 gap-6">
                <div className="flex items-center gap-4">
                  {/* Dynamic Logo Housing */}
                  <div className="w-14 h-14 rounded-2xl bg-black/40 border border-[#10b981]/30 flex items-center justify-center overflow-hidden shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                    {!logoErrors[activeDept._id] ? (
                      <img
                        src={`/logo/departemen/${activeDept.slug}.png`}
                        alt={`${activeDept.name} Logo`}
                        className="w-[70%] h-[70%] object-contain"
                        onError={() =>
                          setLogoErrors((prev) => ({
                            ...prev,
                            [activeDept._id]: true,
                          }))
                        }
                      />
                    ) : (
                      <Globe className="w-6 h-6 text-[#10b981]" />
                    )}
                  </div>
                  <div>
                    <span className="text-[9px] font-bold font-mono text-[#10b981] tracking-[0.3em] uppercase block mb-1">
                      {"// INTERACTIVE PERSONNEL DATABASE"}
                    </span>
                    <h3 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                      {activeDept.name}
                    </h3>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 items-center">
                  <div className="px-4 py-2 rounded-xl bg-black/40 border border-white/5 text-[9px] font-mono text-gray-400 uppercase tracking-wider">
                    {"DEPT_CODE // "}
                    {activeDept.code ||
                      activeDept.slug?.toUpperCase() ||
                      "UNSPECIFIED"}
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-[#12331e]/40 border border-[#10b981]/30 text-[9px] font-mono text-[#10b981] uppercase tracking-wider font-bold animate-pulse">
                    {memberCount}
                    {" ACTIVE_OPERATIVES"}
                  </div>
                  <Link
                    href={`/struktur/${activeDept.slug}`}
                    className="px-4 py-2.5 rounded-xl bg-[#10b981] hover:bg-[#10b981]/80 text-[9px] font-mono text-[#091c11] font-bold uppercase tracking-wider transition-premium flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:scale-[1.03]"
                  >
                    Detail Page <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              <motion.div
                variants={listVariants}
                initial="hidden"
                animate="show"
                className="w-full flex flex-col items-center"
              >
                {/* Leadership Row (Kadep & Wakadep Parallel) */}
                {wakadep ? (
                  <div className="flex flex-col sm:flex-row gap-8 md:gap-12 justify-center w-full max-w-3xl">
                    {/* Kepala Departemen Card */}
                    <motion.div
                      variants={itemVariants}
                      className="w-full sm:w-[250px] rounded-[36px] bg-linear-to-b from-[#12331e]/20 to-[#0c1a11]/40 border border-[#10b981]/30 p-5 text-center relative group/member shadow-[0_15px_45px_rgba(0,0,0,0.4)] hover:border-[#10b981]/50 hover:shadow-[0_20px_50px_rgba(16,185,129,0.25)] hover:-translate-y-1.5 transition-premium mx-auto"
                    >
                      {/* 3D Pop-Up Photo Frame */}
                      <div className="w-full h-[260px] relative overflow-hidden mb-4 shrink-0 transition-premium group-hover/member:scale-[1.03] flex items-end justify-center">
                        {/* Arched backdrop */}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[85%] h-[82%] rounded-t-full bg-linear-to-b from-[#10b981]/20 via-[#10b981]/5 to-transparent border-t border-x border-[#10b981]/20 shadow-[inset_0_2px_12px_rgba(16,185,129,0.15)] group-hover/member:border-[#10b981]/40 transition-premium" />

                        {/* Pop-up avatar */}
                        {getAvatarUrl(
                          activeDept.headId?.name || "",
                          activeDept.headId?.avatar,
                        ) && !imageErrors[activeDept.headId?._id || ""] ? (
                          <img
                            src={
                              getAvatarUrl(
                                activeDept.headId?.name || "",
                                activeDept.headId?.avatar,
                              ) || undefined
                            }
                            alt={activeDept.headId?.name || ""}
                            className="relative z-10 w-full h-[96%] object-contain object-bottom transition-premium group-hover/member:scale-105 origin-bottom select-none filter drop-shadow-[0_6px_12px_rgba(0,0,0,0.45)] group-hover/member:drop-shadow-[0_10px_20px_rgba(16,185,129,0.25)]"
                            onError={() =>
                              activeDept.headId &&
                              handleImageError(activeDept.headId._id)
                            }
                          />
                        ) : (
                          <div className="relative z-10 w-[85%] h-[82%] rounded-t-full flex flex-col items-center justify-center text-[#10b981]/30">
                            <UserCheck className="w-12 h-12 mb-2" />
                            <span className="text-[8px] uppercase tracking-widest font-mono text-gray-500">
                              No Image
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <h5 className="text-sm text-white font-extrabold tracking-tight mb-0.5 group-hover/member:text-[#10b981] transition-colors truncate">
                          {activeDept.headId?.name || "Kepala Departemen"}
                        </h5>
                        <p className="text-[9px] text-[#10b981] font-mono tracking-wider uppercase font-bold">
                          {getFormattedRole("Kadep", activeDept.name)}
                        </p>
                      </div>

                      <div className="flex justify-between items-center bg-white/1 rounded-xl px-2.5 py-1 border border-white/5 mt-3">
                        <span className="text-[7.5px] text-gray-500 font-mono">
                          MANAGEMENT
                        </span>
                        <span className="text-[7.5px] text-[#10b981]/80 font-mono uppercase tracking-wider font-bold">
                          LEADER
                        </span>
                      </div>
                    </motion.div>

                    {/* Wakil Kepala Departemen Card */}
                    <motion.div
                      variants={itemVariants}
                      className="w-full sm:w-[250px] rounded-[36px] bg-linear-to-b from-[#12331e]/10 to-[#0c1a11]/20 border border-white/10 p-5 text-center relative group/member shadow-[0_15px_45px_rgba(0,0,0,0.3)] hover:border-[#10b981]/40 hover:shadow-[0_20px_50px_rgba(16,185,129,0.15)] hover:-translate-y-1.5 transition-premium mx-auto"
                    >
                      {/* 3D Pop-Up Photo Frame */}
                      <div className="w-full h-[260px] relative overflow-hidden mb-4 shrink-0 transition-premium group-hover/member:scale-[1.03] flex items-end justify-center">
                        {/* Arched backdrop */}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[85%] h-[82%] rounded-t-full bg-linear-to-b from-white/10 via-white/5 to-transparent border-t border-x border-white/15 group-hover/member:border-[#10b981]/25 transition-premium" />

                        {/* Pop-up avatar */}
                        {getAvatarUrl(wakadep.name, wakadep.avatar) &&
                        !imageErrors[wakadep._id] ? (
                          <img
                            src={
                              getAvatarUrl(wakadep.name, wakadep.avatar) ||
                              undefined
                            }
                            alt={wakadep.name}
                            className="relative z-10 w-full h-[96%] object-contain object-bottom transition-premium group-hover/member:scale-105 origin-bottom select-none filter drop-shadow-[0_6px_12px_rgba(0,0,0,0.45)] group-hover/member:drop-shadow-[0_10px_20px_rgba(16,185,129,0.2)]"
                            onError={() => handleImageError(wakadep._id)}
                          />
                        ) : (
                          <div className="relative z-10 w-[85%] h-[82%] rounded-t-full flex flex-col items-center justify-center text-gray-500 group-hover/member:text-[#10b981]/30 transition-colors">
                            <User className="w-12 h-12 mb-2" />
                            <span className="text-[8px] uppercase tracking-widest font-mono text-gray-500">
                              No Image
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <h5 className="text-sm text-white font-extrabold tracking-tight mb-0.5 group-hover/member:text-[#10b981] transition-colors truncate">
                          {wakadep.name}
                        </h5>
                        <p className="text-[9px] text-gray-400 font-mono tracking-wider uppercase group-hover/member:text-[#10b981]/70 transition-colors font-bold">
                          {getFormattedRole(wakadep.role, activeDept.name)}
                        </p>
                      </div>

                      <div className="flex justify-between items-center bg-white/1 rounded-xl px-2.5 py-1 border border-white/5 mt-3">
                        <span className="text-[7.5px] text-gray-500 font-mono">
                          MANAGEMENT
                        </span>
                        <span className="text-[7.5px] text-gray-400 font-mono uppercase tracking-wider font-bold">
                          CO_LEADER
                        </span>
                      </div>
                    </motion.div>
                  </div>
                ) : (
                  /* Only Kepala Departemen centered if no Wakil exists */
                  <motion.div
                    variants={itemVariants}
                    className="w-full sm:w-[250px] rounded-[36px] bg-linear-to-b from-[#12331e]/20 to-[#0c1a11]/40 border border-[#10b981]/30 p-5 text-center relative group/member shadow-[0_15px_45px_rgba(0,0,0,0.4)] hover:border-[#10b981]/50 hover:shadow-[0_20px_50px_rgba(16,185,129,0.25)] hover:-translate-y-1.5 transition-premium mx-auto"
                  >
                    {/* 3D Pop-Up Photo Frame */}
                    <div className="w-full h-[260px] relative overflow-hidden mb-4 shrink-0 transition-premium group-hover/member:scale-[1.03] flex items-end justify-center">
                      {/* Arched backdrop */}
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[85%] h-[82%] rounded-t-full bg-linear-to-b from-[#10b981]/20 via-[#10b981]/5 to-transparent border-t border-x border-[#10b981]/20 shadow-[inset_0_2px_12px_rgba(16,185,129,0.15)] group-hover/member:border-[#10b981]/40 transition-premium" />

                      {/* Pop-up avatar */}
                      {getAvatarUrl(
                        activeDept.headId?.name || "",
                        activeDept.headId?.avatar,
                      ) && !imageErrors[activeDept.headId?._id || ""] ? (
                        <img
                          src={
                            getAvatarUrl(
                              activeDept.headId?.name || "",
                              activeDept.headId?.avatar,
                            ) || undefined
                          }
                          alt={activeDept.headId?.name || ""}
                          className="relative z-10 w-full h-[96%] object-contain object-bottom transition-premium group-hover/member:scale-105 origin-bottom select-none filter drop-shadow-[0_6px_12px_rgba(0,0,0,0.45)] group-hover/member:drop-shadow-[0_10px_20px_rgba(16,185,129,0.25)]"
                          onError={() =>
                            activeDept.headId &&
                            handleImageError(activeDept.headId._id)
                          }
                        />
                      ) : (
                        <div className="relative z-10 w-[85%] h-[82%] rounded-t-full flex flex-col items-center justify-center text-[#10b981]/30">
                          <UserCheck className="w-12 h-12 mb-2" />
                          <span className="text-[8px] uppercase tracking-widest font-mono text-gray-500">
                            No Image
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <h5 className="text-sm text-white font-extrabold tracking-tight mb-0.5 group-hover/member:text-[#10b981] transition-colors truncate">
                        {activeDept.headId?.name || "Kepala Departemen"}
                      </h5>
                      <p className="text-[9px] text-[#10b981] font-mono tracking-wider uppercase font-bold">
                        {getFormattedRole("Kadep", activeDept.name)}
                      </p>
                    </div>

                    <div className="flex justify-between items-center bg-white/1 rounded-xl px-2.5 py-1 border border-white/5 mt-3">
                      <span className="text-[7.5px] text-gray-500 font-mono">
                        MANAGEMENT
                      </span>
                      <span className="text-[7.5px] text-[#10b981]/80 font-mono uppercase tracking-wider font-bold">
                        LEADER
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Central connection line */}
                {staffOnly.length > 0 && (
                  <div className="flex justify-center w-full my-6">
                    <div className="w-[2px] h-10 bg-linear-to-b from-[#10b981]/40 to-[#10b981]/10" />
                  </div>
                )}

                {/* Other Members (Staff Grid) */}
                {staffOnly.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 w-full mt-2">
                    {staffOnly.map((member) => (
                      <motion.div
                        key={member._id}
                        variants={itemVariants}
                        className="p-4 rounded-[28px] bg-white/1 border border-white/5 hover:border-[#10b981]/25 hover:bg-[#12331e]/5 flex flex-col items-center text-center relative group/member transition-premium shadow-[0_8px_30px_rgba(0,0,0,0.2)] hover:-translate-y-1.5"
                      >
                        {/* 3D Pop-Up Photo Frame */}
                        <div className="w-full h-[210px] relative overflow-hidden mb-3.5 shrink-0 transition-premium group-hover/member:scale-[1.03] flex items-end justify-center">
                          {/* Arched backdrop */}
                          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[88%] h-[82%] rounded-t-full bg-linear-to-b from-[#10b981]/10 to-transparent border-t border-x border-[#10b981]/10 group-hover/member:border-[#10b981]/25 transition-premium" />

                          {/* Pop-up avatar */}
                          {getAvatarUrl(member.name, member.avatar) &&
                          !imageErrors[member._id] ? (
                            <img
                              src={
                                getAvatarUrl(member.name, member.avatar) ||
                                undefined
                              }
                              alt={member.name}
                              className="relative z-10 w-full h-[96%] object-contain object-bottom transition-premium group-hover/member:scale-105 origin-bottom select-none filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)] group-hover/member:drop-shadow-[0_6px_12px_rgba(16,185,129,0.1)]"
                              onError={() => handleImageError(member._id)}
                            />
                          ) : (
                            <div className="relative z-10 w-[88%] h-[82%] rounded-t-full flex flex-col items-center justify-center text-gray-500 group-hover/member:text-[#10b981]/30 transition-colors">
                              <User className="w-8 h-8 mb-2" />
                              <span className="text-[8px] uppercase tracking-widest font-mono text-gray-500">
                                No Image
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="w-full">
                          <h6 className="text-xs text-white font-extrabold tracking-tight mb-0.5 group-hover/member:text-[#10b981] transition-colors truncate w-full">
                            {member.name}
                          </h6>
                          <p className="text-[8.5px] text-gray-400 font-mono tracking-wider uppercase truncate w-full">
                            {getFormattedRole(member.role, activeDept.name)}
                          </p>
                        </div>

                        <div className="flex justify-between items-center bg-white/1 rounded-[10px] px-2 py-0.5 border border-white/5 mt-2.5 w-full">
                          <span className="text-[6.5px] text-gray-500 font-mono">
                            STAFF
                          </span>
                          <span className="text-[6.5px] text-gray-400 font-mono uppercase">
                            ACTIVE
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  // If no other members are found yet
                  !wakadep && (
                    <div className="p-8 text-xs font-mono text-gray-500 uppercase tracking-widest italic opacity-50 text-center">
                      {"// NO EXTRA PERSONNEL REGISTERED FOR THIS UNIT"}
                    </div>
                  )
                )}
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
