"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import ImsApiService, { type ProkerItem, type UserProfile } from "@/lib/api";
import { Briefcase, Plus, Search, Calendar, Building2 } from "lucide-react";
import { formatDate, formatRupiah } from "@/lib/utils";
import { DataTable, StatusBadge } from "@/components/ui";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  planned: { label: "Direncanakan", color: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
  ongoing: { label: "Berjalan", color: "bg-accent-blue/10 text-accent-blue border-accent-blue/20" },
  completed: { label: "Selesai", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  cancelled: { label: "Dibatalkan", color: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
};

export default function ProkerListPage() {
  const router = useRouter();
  const [list, setList] = useState<ProkerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const profileRes = await ImsApiService.getProfile();
        if (profileRes?.data) setProfile(profileRes.data);

        const res = await ImsApiService.getProkerList();
        if (res?.data) setList(res.data);
      } catch (err) {
        console.error("Failed to fetch proker list:", err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const filters = ["all", "planned", "ongoing", "completed", "cancelled"];
  const filterLabels: Record<string, string> = {
    all: "Semua",
    planned: "Direncanakan",
    ongoing: "Berjalan",
    completed: "Selesai",
    cancelled: "Dibatalkan",
  };

  const filteredList = list.filter((p) => {
    const matchFilter = activeFilter === "all" || p.status === activeFilter;
    const matchSearch =
      searchQuery === "" ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.department?.name && p.department.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchFilter && matchSearch;
  });

  // Determine if user can create
  const roleSlug =
    profile?.activeContext?.role?.slug ||
    (typeof profile?.role === "object" ? (profile.role as any)?.slug : profile?.role) ||
    "staf";
  const canCreate = ["super-admin", "kabem", "sekretaris", "kadep"].includes(roleSlug);

  return (
    <DashboardShell>
      <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full pb-12 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
              <Briefcase className="w-6 h-6 text-sage" />
              Program Kerja
            </h1>
            <p className="text-foreground/60 text-sm mt-1">Kelola program kerja departemen & BPI kabinet</p>
          </div>
          {canCreate && (
            <button
              onClick={() => router.push("/proker/new")}
              className="flex items-center justify-center gap-2 bg-sage text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-sage/90 transition-all duration-200 shadow-lg shadow-sage/20 border border-sage/50 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Tambah Proker
            </button>
          )}
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
            <input
              type="text"
              placeholder="Cari judul, kategori, atau departemen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-subtle border border-white/10 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-sage/40 focus:bg-sage/5 shadow-sm transition-all duration-200"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                  activeFilter === f
                    ? "bg-sage/10 text-sage border-sage/20 shadow-sm"
                    : "text-foreground/50 hover:text-foreground/80 border-transparent hover:bg-white/5"
                }`}
              >
                {filterLabels[f]}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <DataTable<ProkerItem>
          data={filteredList}
          columns={[
            {
              header: "Program / Judul",
              accessor: (p) => (
                <>
                  <div className="font-semibold text-white group-hover:text-sage transition-colors leading-snug truncate">
                    {p.title}
                  </div>
                  {p.category && (
                    <div className="text-xs text-foreground/45 mt-1">
                      {p.category}
                    </div>
                  )}
                </>
              ),
              className: "max-w-xs",
            },
            {
              header: "Departemen",
              accessor: (p) => (
                <div className="flex items-center gap-2 text-sm text-foreground/70">
                  <Building2 className="w-3.5 h-3.5 text-foreground/40 shrink-0" />
                  <span className="truncate">{p.department?.name || "BPI / Umum"}</span>
                </div>
              ),
            },
            {
              header: "Progress",
              accessor: (p) => (
                <div className="flex items-center gap-3 min-w-[120px]">
                  <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        p.progress >= 100 ? "bg-emerald-500" : p.progress >= 50 ? "bg-sage" : "bg-accent-blue"
                      }`}
                      style={{ width: `${Math.min(p.progress, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-foreground/60 tabular-nums w-8 text-right">
                    {p.progress}%
                  </span>
                </div>
              ),
            },
            {
              header: "Anggaran",
              accessor: (p) => (
                <span className="text-sm text-foreground/70 tabular-nums">
                  {p.estimatedBudget ? formatRupiah(p.estimatedBudget) : "-"}
                </span>
              ),
            },
            {
              header: "Status",
              accessor: (p) => {
                const s = STATUS_MAP[p.status] || STATUS_MAP.planned;
                return <StatusBadge label={s.label} colorClass={s.color} />;
              },
            },
            {
              header: "Jadwal",
              accessor: (p) => (
                <div className="text-xs text-foreground/45 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {p.startDate ? formatDate(p.startDate) : "-"}
                </div>
              ),
            },
          ]}
          loading={loading}
          onRowClick={(p) => router.push(`/proker/${p._id}`)}
          emptyMessage="Belum ada program kerja yang terdaftar"
          emptyIcon={
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-foreground/35" />
            </div>
          }
        />
      </div>
    </DashboardShell>
  );
}
