"use client";

import React, { use, useState } from "react";
import Link from "next/link";
import {
  User,
  ChevronLeft,
  Shield,
  Globe,
  Orbit,
  UserCheck,
  Calendar,
  Layers,
  ArrowUpRight,
  Activity,
  CheckCircle2,
  Target,
  AlertCircle,
} from "lucide-react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { useStructure } from "@/hooks/useStructure";
import { useProker } from "@/hooks/useProker";

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

export default function DepartmentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { data: structureData, isLoading: isStructureLoading } = useStructure();
  const { data: prokerData, isLoading: isProkerLoading } = useProker();
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [groupImageError, setGroupImageError] = useState(false);

  const handleImageError = (id: string) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  const isLoading = isStructureLoading || isProkerLoading;

  const departments = structureData?.data?.departments || [];
  const activeDept = departments.find((d) => d.slug === slug);

  if (isLoading) {
    return (
      <div className="pt-48 pb-24 px-6 max-w-7xl mx-auto relative z-10 animate-pulse">
        {/* Breadcrumb Skeleton */}
        <div className="h-4 w-64 bg-white/5 rounded-md mb-12" />

        {/* Banner Skeleton */}
        <div className="h-64 w-full bg-white/5 rounded-[40px] mb-16" />

        {/* Leadership Section Skeleton */}
        <div className="mb-20">
          <div className="h-4 w-32 bg-white/5 rounded mb-8" />
          <div className="flex flex-col sm:flex-row gap-8 justify-center max-w-4xl mx-auto">
            <div className="h-[420px] w-full sm:w-[280px] bg-white/5 rounded-[36px]" />
            <div className="h-[420px] w-full sm:w-[280px] bg-white/5 rounded-[36px]" />
          </div>
        </div>
      </div>
    );
  }

  if (!activeDept) {
    return (
      <div className="pt-48 pb-24 px-6 max-w-xl mx-auto text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-8">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">
          Unit Tidak Ditemukan
        </h1>
        <p className="text-gray-400 mb-12">
          Departemen atau unit yang Anda cari mungkin telah disesuaikan atau
          dipindahkan dalam kabinet terbaru.
        </p>
        <Link
          href="/struktur"
          className="px-8 py-4 bg-[#10b981] text-[#091c11] font-bold rounded-full hover:bg-white hover:text-black transition-all"
        >
          Kembali ke Sinergi Kabinet
        </Link>
      </div>
    );
  }

  // Members data parsing
  const deptMembers = (structureData?.data?.members || []).filter(
    (m) => m.departmentId === activeDept._id,
  );
  const memberCount = deptMembers.length;

  const wakadep = deptMembers.find(
    (m) =>
      m.role.toLowerCase() === "wakadep" ||
      m.role.toLowerCase().includes("wakil"),
  );

  const staffOnly = deptMembers.filter(
    (m) =>
      m.role !== "Kadep" &&
      m.role.toLowerCase() !== "wakadep" &&
      !m.role.toLowerCase().includes("wakil"),
  );

  // Proker data parsing
  const prokers = prokerData?.data || [];
  const deptProkers = prokers.filter(
    (p) => p.departmentId?._id === activeDept._id,
  );

  return (
    <div className="pt-44 md:pt-52 pb-24 px-6 max-w-7xl mx-auto relative z-10">
      {/* Background Ambience */}
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-[#10b981]/5 rounded-full blur-[180px]" />
        <div className="absolute bottom-[20%] left-[5%] w-[500px] h-[500px] bg-emerald-950/10 rounded-full blur-[140px]" />
      </div>

      <Breadcrumbs
        items={[
          { label: "Sinergi Kabinet", href: "/struktur" },
          { label: activeDept.name, isCurrent: true },
        ]}
        id={`DEPT_${activeDept.code || activeDept.slug?.toUpperCase() || "UNSPECIFIED"}`}
      />

      {/* Dynamic Profile Banner */}
      <div className="relative mb-20 p-8 md:p-12 rounded-[40px] border border-[#10b981]/30 bg-[#12331e]/5 backdrop-blur-xl overflow-hidden shadow-[0_30px_70px_rgba(16,185,129,0.15)]">
        {/* Glow corner decorations */}
        <div className="absolute inset-0 bg-linear-to-b from-[#10b981]/2 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#10b981]/50 rounded-tl-[40px]" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#10b981]/50 rounded-br-[40px]" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Dynamic Logo Housing */}
            <div className="relative p-1.5 shrink-0 mt-1">
              <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-[#10b981]/50" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-[#10b981]/50" />
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-[20px] bg-black/40 border border-[#10b981]/30 flex items-center justify-center overflow-hidden shadow-[0_0_20px_rgba(16,185,129,0.15)] group/logo">
                <img
                  src={`/logo/departemen/${slug}.png`}
                  alt={`${activeDept.name} Logo`}
                  className="w-[75%] h-[75%] object-contain transition-premium group-hover/logo:scale-110 filter brightness-95 group-hover/logo:brightness-100"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    const fallback = e.currentTarget
                      .nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = "block";
                  }}
                />
                <div
                  className="text-[#10b981] font-bold text-xl md:text-2xl font-mono animate-pulse hidden"
                  style={{ display: "none" }}
                >
                  {activeDept.code ||
                    activeDept.name.substring(0, 2).toUpperCase()}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <span className="text-[9px] font-bold font-mono text-[#10b981] tracking-[0.3em] uppercase block">
                {"// DEPARTMENTAL PROFILE // MISSION DIRECTIVE"}
              </span>
              <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-none font-sans">
                {activeDept.name}
              </h1>
              <p className="text-gray-400 text-sm md:text-base leading-relaxed max-w-2xl font-sans">
                {activeDept.description ||
                  "Divisi strategis kepengurusan BEM FT UNESA yang berkomitmen tinggi menjalankan fungsi kementerian dengan dedikasi penuh demi kemajuan Fakultas Teknik."}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap md:flex-col gap-3 shrink-0 w-full sm:w-auto">
            <div className="px-5 py-3 rounded-2xl bg-black/40 border border-white/5 text-[10px] font-mono text-gray-400 uppercase tracking-wider text-center font-bold flex-1 sm:flex-initial">
              {"DEPT_CODE // "}
              {activeDept.code || activeDept.slug?.toUpperCase()}
            </div>
            <div className="px-5 py-3 rounded-2xl bg-[#12331e]/40 border border-[#10b981]/30 text-[10px] font-mono text-[#10b981] uppercase tracking-wider font-bold animate-pulse text-center flex-1 sm:flex-initial">
              {memberCount}
              {" ACTIVE_OPERATIVES"}
            </div>
          </div>
        </div>
      </div>

      {/* Department Group Photo Banner */}
      <div className="relative mb-20 rounded-[40px] border border-[#10b981]/25 bg-black/40 backdrop-blur-xl overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,0.5)] aspect-16/7 md:aspect-21/8 w-full group/banner">
        {/* Subtle decorative grid lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#052e16_1px,transparent_1px),linear-gradient(to_bottom,#052e16_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-35" />

        {/* Scanning lasers / line effect */}
        <div className="absolute inset-x-0 h-0.5 bg-linear-to-r from-transparent via-[#10b981]/40 to-transparent top-0 animate-scanline pointer-events-none" />

        {/* Outer Tech Corner Markers (Camera focus brackets) */}
        <div className="absolute top-6 left-6 w-5 h-5 border-t-2 border-l-2 border-[#10b981]/40" />
        <div className="absolute top-6 right-6 w-5 h-5 border-t-2 border-r-2 border-[#10b981]/40" />
        <div className="absolute bottom-6 left-6 w-5 h-5 border-b-2 border-l-2 border-[#10b981]/40" />
        <div className="absolute bottom-6 right-6 w-5 h-5 border-b-2 border-r-2 border-[#10b981]/40" />

        {!groupImageError ? (
          <img
            src={`/fungsionaris/departemen/${slug}.png`}
            alt={`${activeDept.name} Group Photo`}
            className="w-full h-full object-cover object-center transition-all duration-2000 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/banner:scale-[1.03] select-none filter brightness-95 group-hover/banner:brightness-100"
            onError={() => setGroupImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-linear-to-b from-[#12331e]/10 to-[#05110a]/60 relative min-h-[220px]">
            {/* Focal indicator circle */}
            <div className="w-20 h-20 rounded-full border border-dashed border-[#10b981]/30 flex items-center justify-center mb-6 relative animate-[spin_60s_linear_infinite]">
              <div className="absolute inset-3 rounded-full border border-dashed border-[#10b981]/25" />
            </div>
            {/* Center static globe/users icon */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -mt-10">
              <div className="w-12 h-12 rounded-2xl bg-[#12331e]/40 border border-[#10b981]/30 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                <Globe className="w-6 h-6 text-[#10b981]/80 animate-pulse" />
              </div>
            </div>

            <div className="z-10 mt-2 space-y-1.5 md:space-y-2">
              <span className="text-[8px] font-bold font-mono text-[#10b981]/60 tracking-[0.25em] uppercase block">
                {"// KABINET_DANADYAKSA_2026 // VISUAL_ARCHIVE_SECURE_PORT"}
              </span>
              <h2 className="text-white text-base md:text-xl font-extrabold tracking-wide uppercase">
                {"Awaiting "}
                {activeDept.name}
                {" Group Photo"}
              </h2>
              <p className="text-gray-500 text-[9px] md:text-xs font-mono max-w-lg mx-auto leading-relaxed">
                {"Upload photo as PNG to: "}
                <span className="text-white/60">
                  {"frontend/public/fungsionaris/departemen/"}
                  {slug}
                  {".png"}
                </span>
              </p>
            </div>
          </div>
        )}

        {/* Ambient bottom overlay */}
        <div className="absolute inset-x-0 bottom-0 h-1/4 bg-linear-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

        {/* Cinematic tech labels on bottom corners */}
        <div className="absolute bottom-6 left-10 z-10 hidden sm:flex flex-col gap-0.5 text-left">
          <span className="text-[7.5px] font-mono text-gray-500 uppercase tracking-widest">
            {"ARCHIVE_SOURCE // DIGITAL_MEDIA"}
          </span>
          <span className="text-[8px] font-mono font-bold text-[#10b981] uppercase tracking-wider">
            {activeDept.name}
            {" GROUP_FRAME"}
          </span>
        </div>
        <div className="absolute bottom-6 right-10 z-10 hidden sm:flex flex-col gap-0.5 items-end text-right">
          <span className="text-[7.5px] font-mono text-gray-500 uppercase tracking-widest">
            {"FOCAL_PLANE // 2026"}
          </span>
          <span className="text-[8px] font-mono font-bold text-white uppercase tracking-wider">
            {"STATUS: ONLINE"}
          </span>
        </div>
      </div>

      {/* Leadership Section */}
      <div className="mb-24">
        <div className="flex items-center gap-6 mb-16">
          <h2 className="text-xs font-extrabold text-white/35 uppercase tracking-[0.4em] whitespace-nowrap">
            Pimpinan Unit
          </h2>
          <div className="w-full h-px bg-white/5" />
        </div>

        <div className="flex flex-col sm:flex-row gap-8 md:gap-12 justify-center w-full max-w-4xl mx-auto">
          {/* Kepala Departemen Card */}
          <div className="w-full sm:w-[280px] rounded-[36px] bg-linear-to-b from-[#12331e]/20 to-[#0c1a11]/40 border border-[#10b981]/30 p-6 text-center relative group/member shadow-[0_20px_50px_rgba(0,0,0,0.45)] hover:border-[#10b981]/50 hover:shadow-[0_25px_60px_rgba(16,185,129,0.25)] hover:-translate-y-1.5 transition-premium">
            <div className="w-full h-[300px] relative overflow-hidden mb-4 shrink-0 transition-premium group-hover/member:scale-[1.03] flex items-end justify-center">
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[85%] h-[82%] rounded-t-full bg-linear-to-b from-[#10b981]/20 via-[#10b981]/5 to-transparent border-t border-x border-[#10b981]/20 shadow-[inset_0_2px_12px_rgba(16,185,129,0.15)] group-hover/member:border-[#10b981]/40 transition-premium" />
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
                    activeDept.headId && handleImageError(activeDept.headId._id)
                  }
                />
              ) : (
                <div className="relative z-10 w-[85%] h-[82%] rounded-t-full flex flex-col items-center justify-center text-[#10b981]/30">
                  <UserCheck className="w-12 h-12 mb-2 text-[#10b981]" />
                  <span className="text-[8px] uppercase tracking-widest font-mono text-gray-500">
                    No Image
                  </span>
                </div>
              )}
            </div>
            <div>
              <h5 className="text-base text-white font-extrabold tracking-tight mb-0.5 group-hover/member:text-[#10b981] transition-colors truncate">
                {activeDept.headId?.name || "Kepala Departemen"}
              </h5>
              <p className="text-[10px] text-[#10b981] font-mono tracking-wider uppercase font-bold">
                {getFormattedRole("Kadep", activeDept.name)}
              </p>
            </div>
            <div className="flex justify-between items-center bg-white/1 rounded-xl px-3 py-1.5 border border-white/5 mt-4">
              <span className="text-[8px] text-gray-500 font-mono">
                MANAGEMENT
              </span>
              <span className="text-[8px] text-[#10b981]/80 font-mono uppercase tracking-wider font-bold">
                LEADER
              </span>
            </div>
          </div>

          {/* Wakil Kepala Departemen Card */}
          {wakadep && (
            <div className="w-full sm:w-[280px] rounded-[36px] bg-linear-to-b from-[#12331e]/10 to-[#0c1a11]/20 border border-white/10 p-6 text-center relative group/member shadow-[0_20px_50px_rgba(0,0,0,0.35)] hover:border-[#10b981]/40 hover:shadow-[0_25px_60px_rgba(16,185,129,0.15)] hover:-translate-y-1.5 transition-premium">
              <div className="w-full h-[300px] relative overflow-hidden mb-4 shrink-0 transition-premium group-hover/member:scale-[1.03] flex items-end justify-center">
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[85%] h-[82%] rounded-t-full bg-linear-to-b from-white/10 via-white/5 to-transparent border-t border-x border-white/15 group-hover/member:border-[#10b981]/25 transition-premium" />
                {getAvatarUrl(wakadep.name, wakadep.avatar) &&
                !imageErrors[wakadep._id] ? (
                  <img
                    src={
                      getAvatarUrl(wakadep.name, wakadep.avatar) || undefined
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
                <h5 className="text-base text-white font-extrabold tracking-tight mb-0.5 group-hover/member:text-[#10b981] transition-colors truncate">
                  {wakadep.name}
                </h5>
                <p className="text-[10px] text-gray-400 font-mono tracking-wider uppercase group-hover/member:text-[#10b981]/70 transition-colors font-bold">
                  {getFormattedRole(wakadep.role, activeDept.name)}
                </p>
              </div>
              <div className="flex justify-between items-center bg-white/1 rounded-xl px-3 py-1.5 border border-white/5 mt-4">
                <span className="text-[8px] text-gray-500 font-mono">
                  MANAGEMENT
                </span>
                <span className="text-[8px] text-gray-400 font-mono uppercase tracking-wider font-bold">
                  CO_LEADER
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Staff Members Section */}
      {staffOnly.length > 0 && (
        <div className="mb-24">
          <div className="flex items-center gap-6 mb-16">
            <h2 className="text-xs font-extrabold text-white/35 uppercase tracking-[0.4em] whitespace-nowrap">
              Fungsionaris Aktif
            </h2>
            <div className="w-full h-px bg-white/5" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {staffOnly.map((member) => (
              <div
                key={member._id}
                className="p-5 rounded-[28px] bg-[#05110a]/40 border border-white/5 hover:border-[#10b981]/25 hover:bg-[#12331e]/5 flex flex-col items-center text-center relative group/member transition-premium shadow-[0_8px_30px_rgba(0,0,0,0.25)] hover:-translate-y-1.5"
              >
                <div className="w-full h-[220px] relative overflow-hidden mb-4 shrink-0 transition-premium group-hover/member:scale-[1.03] flex items-end justify-center">
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[88%] h-[82%] rounded-t-full bg-linear-to-b from-[#10b981]/10 to-transparent border-t border-x border-[#10b981]/10 group-hover/member:border-[#10b981]/25 transition-premium" />
                  {getAvatarUrl(member.name, member.avatar) &&
                  !imageErrors[member._id] ? (
                    <img
                      src={
                        getAvatarUrl(member.name, member.avatar) || undefined
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
                  <p className="text-[9px] text-gray-400 font-mono tracking-wider uppercase truncate w-full">
                    {getFormattedRole(member.role, activeDept.name)}
                  </p>
                </div>
                <div className="flex justify-between items-center bg-white/1 rounded-[10px] px-2.5 py-1 border border-white/5 mt-3 w-full">
                  <span className="text-[7px] text-gray-500 font-mono">
                    STAFF
                  </span>
                  <span className="text-[7px] text-gray-400 font-mono uppercase">
                    ACTIVE
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Programs Section */}
      <div className="mb-24">
        <div className="flex items-center gap-6 mb-16">
          <h2 className="text-xs font-extrabold text-white/35 uppercase tracking-[0.4em] whitespace-nowrap">
            Program Kerja Strategis
          </h2>
          <div className="w-full h-px bg-white/5" />
        </div>

        {deptProkers.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-white/10 rounded-[32px] bg-[#05110a]/40 shadow-lg">
            <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">
              {"// Belum Ada Program Kerja Terdaftar untuk Unit Ini"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {deptProkers.map((item, idx) => (
              <Link
                href={`/proker/${item.slug}`}
                key={idx}
                className="flex flex-col rounded-[32px] p-9 bg-[#05110a]/40 hover:bg-[#12331e]/20 hover:border-[#10b981]/30 transition-premium group overflow-hidden relative border border-white/5 shadow-xl"
              >
                <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-[#10b981]/0 group-hover:border-[#10b981]/40 transition-premium rounded-br-[32px]" />

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
                </div>

                <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-[#10b981] transition-colors leading-tight tracking-tight">
                  {item.title}
                </h3>

                <p className="text-sm text-gray-400 leading-relaxed mb-8 grow group-hover:text-gray-300 transition-colors line-clamp-3">
                  {item.description}
                </p>

                <div className="flex items-center justify-between pt-6 border-t border-white/5 mt-auto">
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
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-[#10b981] group-hover:text-[#091c11] transition-premium group-hover:rotate-12">
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Page Footer Navigation */}
      <div className="mt-24 flex justify-between items-center border-t border-white/5 pt-12">
        <Link
          href="/struktur"
          className="inline-flex items-center gap-2 text-xs font-mono text-gray-400 hover:text-[#10b981] transition-all uppercase tracking-widest font-bold group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1.5 transition-transform" />{" "}
          Kembali ke Sinergi Kabinet
        </Link>
        <span className="text-[9px] font-mono text-gray-600 uppercase tracking-widest hidden sm:inline">
          {"DEPT_SECURE_AUTH // v3.0"}
        </span>
      </div>
    </div>
  );
}
