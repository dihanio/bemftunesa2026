"use client";

import React, { useState, useEffect, useRef } from "react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PublicApiService, type StructureData, type StructureLeader, type Department } from "@/lib/api";
import { User, Shield, Network, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export default function StrukturPage() {
  const [expandedDept, setExpandedDept] = useState<string | null>(null);
  const [data, setData] = useState<StructureData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!expandedDept) return;
    const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusable?.[0]?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setExpandedDept(null);
        return;
      }
      if (e.key !== 'Tab' || !focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [expandedDept]);

  useEffect(() => {
    PublicApiService.getStructure()
      .then((res) => {
        if (res?.data) {
          setData(res.data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading structure:", err);
        setLoading(false);
      });
  }, []);

  const bpi = data?.bpi || [];
  const departments = data?.departments || [];
  const members = data?.members || [];

  const ketua = bpi.find((u) => u.roleSlug === "kabem" || u.role === "Super Admin" || u.roleSlug === "super-admin");
  const wakil = bpi.find((u) => u.roleSlug === "wakabem");
  const sekretaris = bpi.find((u) => u.roleSlug === "sekretaris");
  const bendahara = bpi.find((u) => u.roleSlug === "bendahara");

  const toggleDept = (deptId: string) => {
    if (expandedDept === deptId) {
      setExpandedDept(null);
    } else {
      setExpandedDept(deptId);
    }
  };

  const getAvatarUrl = (name: string, avatar?: string) => {
    if (!avatar) return null;
    if (avatar.startsWith("/")) {
      return avatar
        .split("/")
        .map((segment) => encodeURIComponent(segment))
        .join("/");
    }
    return avatar;
  };

  return (
    <main className="pt-28 pb-16 px-6 max-w-6xl mx-auto w-full relative">
      {/* Background Ambience */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-accent-blue/5 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: "Sinergi Kabinet", isCurrent: true }]} />

      {/* Header Section */}
      <div className="text-center mb-16">
        <span className="inline-flex items-center gap-1.5 px-4.5 py-1.5 rounded-full border border-accent-gold/25 bg-forest/20 text-[10px] font-semibold text-accent-gold uppercase tracking-[0.2em] mb-6 shadow-sm">
          <Network className="w-3.5 h-3.5" />
          Struktur Organisasi
        </span>
        <h1 className="text-4xl md:text-6xl font-extrabold text-foreground mb-4 tracking-tight leading-none">
          Struktur <span className="text-accent-gold">Organisasi</span>
        </h1>
        <p className="text-sm text-foreground/75 max-w-lg mx-auto leading-relaxed">
          Kabinet Danadyaksa 2026. Sinergi taktis antar departemen dan biro untuk kemajuan bersama Fakultas Teknik UNESA.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center gap-8 py-12 animate-pulse">
          <div className="w-48 h-48 rounded-full bg-slate-green/50" />
          <div className="h-6 bg-slate-green/80 rounded w-1/4" />
          <div className="h-4 bg-slate-green/50 rounded w-1/3" />
        </div>
      ) : (
        <>
          {/* Interactive Org Chart Area */}
          <section className="mb-16">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-[1px] bg-sage/15 flex-grow" />
              <span className="text-xs font-semibold text-foreground/40 uppercase tracking-widest">Bagan Kepengurusan Inti</span>
              <div className="h-[1px] bg-sage/15 flex-grow" />
            </div>

            {/* Level 1: Ketua & Wakil */}
            <div className="flex flex-col items-center mb-8 relative">
              <div className="flex flex-col md:flex-row gap-12 md:gap-14 justify-center items-center">
                {/* Ketua Card */}
                <div className="w-[260px] rounded-[30px] border border-accent-gold bg-forest/40 p-6 text-center shadow-lg hover:shadow-xl hover:border-accent-gold transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden">
                  
                  <div className="w-20 h-20 rounded-full bg-forest/50 border border-sage/20 flex items-center justify-center text-sage mx-auto mb-4 relative overflow-hidden">
                    {ketua && getAvatarUrl(ketua.name, ketua.avatar) ? (
                      <Image
                        src={getAvatarUrl(ketua.name, ketua.avatar) || ""}
                        alt={ketua.name}
                        fill
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Shield className="w-8 h-8" />
                    )}
                  </div>
                  <h4 className="text-foreground font-extrabold text-base tracking-tight mb-1">{ketua?.name || "Ketua BEM"}</h4>
                  <p className="text-xs text-sage font-medium tracking-wide uppercase mb-4">Ketua BEM FT</p>
                </div>

                {/* Wakil Card */}
                <div className="w-[260px] rounded-[30px] border border-sage/35 hover:border-accent-gold/50 bg-forest/15 p-6 text-center shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
                  <div className="w-20 h-20 rounded-full bg-forest/30 border border-sage/10 flex items-center justify-center text-sage/75 mx-auto mb-4 overflow-hidden relative">
                    {wakil && getAvatarUrl(wakil.name, wakil.avatar) ? (
                      <Image
                        src={getAvatarUrl(wakil.name, wakil.avatar) || ""}
                        alt={wakil.name}
                        fill
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8" />
                    )}
                  </div>
                  <h4 className="text-foreground font-extrabold text-base tracking-tight mb-1">{wakil?.name || "Wakil Ketua BEM"}</h4>
                  <p className="text-xs text-sage font-medium tracking-wide uppercase mb-4">Wakil Ketua BEM</p>
                </div>
              </div>
            </div>

            {/* Connector Line */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-[1.5px] h-12 bg-accent-gold/40" />
            </div>

            {/* Level 2: Sekretaris & Bendahara */}
            <div className="flex flex-col md:flex-row gap-8 md:gap-12 justify-center items-center mb-12">
              {/* Sekretaris */}
              <div className="w-[220px] rounded-[24px] border border-sage/15 hover:border-accent-gold/45 bg-slate-green/80 dark:bg-slate-green/5 p-5 text-center shadow-md transition-all duration-300 group">
                <h5 className="text-foreground font-extrabold text-sm tracking-tight mb-1">{sekretaris?.name || "Sekretaris Utama"}</h5>
                <p className="text-xs text-foreground/50 font-medium tracking-wide uppercase mb-3">Sekretaris Utama</p>
                <span className="inline-block px-2.5 py-1 rounded bg-forest/40 text-accent-gold font-semibold text-[10px] border border-accent-gold/20">
                  SEKRETARIAT
                </span>
              </div>
 
              {/* Bendahara */}
              <div className="w-[220px] rounded-[24px] border border-sage/15 hover:border-accent-gold/45 bg-slate-green/80 dark:bg-slate-green/5 p-5 text-center shadow-md transition-all duration-300 group">
                <h5 className="text-foreground font-extrabold text-sm tracking-tight mb-1">{bendahara?.name || "Bendahara Utama"}</h5>
                <p className="text-xs text-foreground/50 font-medium tracking-wide uppercase mb-3">Bendahara Utama</p>
                <span className="inline-block px-2.5 py-1 rounded bg-forest/40 text-accent-gold font-semibold text-[10px] border border-accent-gold/20">
                  KEBENDAHARAAN
                </span>
              </div>
            </div>
          </section>

          {/* Level 3: Departments Grid & Accordion */}
          <section className="mb-16">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-[1px] bg-sage/15 flex-grow" />
              <span className="text-xs font-semibold text-foreground/40 uppercase tracking-widest">Departemen Pelaksana</span>
              <div className="h-[1px] bg-sage/15 flex-grow" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {departments.map((dept) => {
                const staffMembers = members.filter((m) => m.departmentId === dept._id);
                const head = staffMembers.find((m) => m.role.toLowerCase().includes("kepala") || m.role.toLowerCase().includes("kadep") || m.role.toLowerCase() === "ketua departemen");
                const otherStaff = staffMembers.filter((m) => m._id !== head?._id);
                const staffCount = otherStaff.length;

                return (
                  <div key={dept._id} className="flex flex-col h-full">
                    {/* Department Main Card */}
                    <div
                      onClick={() => toggleDept(dept._id)}
                      className={`p-6 rounded-2xl border transition-all duration-500 cursor-pointer flex flex-col justify-between h-full relative overflow-hidden group border-sage/15 bg-slate-green/20 dark:bg-slate-green/5 hover:bg-forest/20 hover:border-accent-gold/35`}
                    >
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[10px] font-semibold text-accent-gold tracking-wide uppercase">
                            {dept.code || dept.slug.toUpperCase()}
                          </span>
                          <h3 className="text-foreground font-extrabold text-base tracking-tight leading-snug group-hover:text-accent-gold transition-colors">
                            {dept.name}
                          </h3>
                        </div>
                        
                        <div className="w-8 h-8 rounded-lg bg-slate-green/50 border border-sage/10 flex items-center justify-center text-foreground/50 group-hover:text-accent-gold shrink-0">
                          <ChevronDown className="w-4 h-4" />
                        </div>
                      </div>

                      <p className="text-xs text-foreground/75 leading-relaxed mb-6">
                        {dept.description || "Unit departemen operasional fungsionaris BEM FT UNESA."}
                      </p>
 
                      <div className="flex items-center justify-between border-t border-sage/10 pt-4 text-xs text-foreground/60">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-foreground/50">KEPALA DEPT.</span>
                          <span className="text-foreground font-bold">{head?.name || "TBA"}</span>
                        </div>
                        <span>{staffCount} PERSONIL AKTIF</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Department Details Sliding Drawer */}
          <AnimatePresence>
            {expandedDept && (() => {
              const dept = departments.find((d) => d._id === expandedDept);
              if (!dept) return null;
              const staffMembers = members.filter((m) => m.departmentId === dept._id);
              const head = staffMembers.find((m) => m.role.toLowerCase().includes("kepala") || m.role.toLowerCase().includes("kadep") || m.role.toLowerCase() === "ketua departemen");
              const otherStaff = staffMembers.filter((m) => m._id !== head?._id);

              return (
                <>
                  {/* Backdrop */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setExpandedDept(null)}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 cursor-pointer"
                  />
                  {/* Modal Container */}
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                    <motion.div
                      ref={modalRef}
                      role="dialog"
                      aria-modal="true"
                      aria-label="Detail Kementerian"
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      transition={{ type: "spring", damping: 25, stiffness: 250 }}
                      className="w-full max-w-lg bg-white dark:bg-forest border border-slate-200 dark:border-sage/15 p-6 rounded-3xl shadow-2xl flex flex-col gap-5 overflow-y-auto max-h-[85vh] pointer-events-auto text-foreground"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between border-b border-slate-100 dark:border-sage/10 pb-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-semibold text-accent-gold tracking-wide uppercase">
                            {dept.code || dept.slug.toUpperCase()}
                          </span>
                          <h2 className="text-lg font-bold text-foreground leading-snug">
                            {dept.name}
                          </h2>
                        </div>
                        <button
                          onClick={() => setExpandedDept(null)}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-green/50 border border-slate-200 dark:border-sage/10 text-foreground/60 hover:text-foreground cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-green transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      {/* Description */}
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-semibold text-foreground/45 uppercase tracking-wider">
                          Deskripsi Departemen
                        </span>
                        <p className="text-xs text-foreground/75 leading-relaxed">
                          {dept.description || "Unit departemen operasional fungsionaris BEM FT UNESA."}
                        </p>
                      </div>

                      {/* Kepala Departemen */}
                      <div className="flex flex-col gap-3">
                        <span className="text-[10px] font-semibold text-foreground/45 uppercase tracking-wider">
                          Kepala Departemen
                        </span>
                        {head ? (
                          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-green/50 border border-slate-200 dark:border-sage/10 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-forest/60 border border-slate-200 dark:border-sage/20 flex items-center justify-center text-sage overflow-hidden shrink-0 relative">
                              {getAvatarUrl(head.name, head.avatar) ? (
                                <Image src={getAvatarUrl(head.name, head.avatar) || ""} alt={head.name} fill className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-5 h-5" />
                              )}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-bold text-foreground truncate">{head.name}</span>
                              <span className="text-[10px] font-medium text-accent-gold uppercase mt-0.5">Kepala Departemen</span>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-green/20 border border-dashed border-slate-200 dark:border-sage/10 text-center text-xs text-foreground/40">
                            Kepala Departemen Belum Ditentukan
                          </div>
                        )}
                      </div>

                      {/* Staff List */}
                      <div className="flex flex-col gap-3">
                        <span className="text-[10px] font-semibold text-foreground/45 uppercase tracking-wider">
                          Staf Departemen ({otherStaff.length})
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {otherStaff.length > 0 ? (
                            otherStaff
                              .map((staff) => (
                                <div key={staff._id} className="p-3 rounded-lg bg-slate-50/75 dark:bg-slate-green/25 border border-slate-100 dark:border-sage/10 flex items-center gap-3">
                                  <div className="w-7 h-7 rounded bg-slate-100 dark:bg-forest/40 border border-slate-200 dark:border-sage/10 flex items-center justify-center text-foreground/40 overflow-hidden shrink-0 relative">
                                    {getAvatarUrl(staff.name, staff.avatar) ? (
                                      <Image src={getAvatarUrl(staff.name, staff.avatar) || ""} alt={staff.name} fill className="w-full h-full object-cover" />
                                    ) : (
                                      <User className="w-3.5 h-3.5" />
                                    )}
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-semibold text-foreground truncate">{staff.name}</span>
                                    <span className="text-[9px] font-medium text-foreground/40 uppercase mt-0.5">{staff.role}</span>
                                  </div>
                                </div>
                              ))
                          ) : (
                            <div className="col-span-full p-4 rounded-xl bg-slate-50 dark:bg-slate-green/10 border border-dashed border-slate-200 dark:border-sage/10 text-center text-xs text-foreground/40">
                              Belum Ada Staf Terdaftar
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </>
              );
            })()}
          </AnimatePresence>
        </>
      )}
    </main>
  );
}
