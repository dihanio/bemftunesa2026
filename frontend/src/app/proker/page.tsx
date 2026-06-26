"use client";

import React, { useState, useEffect } from "react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PublicApiService, type ProkerItem } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import { Calendar, User, DollarSign, Filter, RotateCcw, Search } from "lucide-react";

export default function ProkerPage() {
  const [prokers, setProkers] = useState<ProkerItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [deptFilter, setDeptFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [depts, setDepts] = useState<string[]>(["All"]);

  const statuses = ["All", "Upcoming", "Ongoing", "Completed"];

  // Fetch real departments list for filter
  useEffect(() => {
    PublicApiService.getStructure()
      .then((res) => {
        if (res?.data?.departments) {
          // Extract unique department codes from real database
          const deptCodes = res.data.departments
            .map((d) => d.code || d.name)
            .filter((code): code is string => !!code);
          
          setDepts(["All", ...deptCodes]);
        }
      })
      .catch((err) => console.error("Error loading structure departments for filter:", err));
  }, []);

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch prokers based on selected filters
  useEffect(() => {
    setLoading(true);
    PublicApiService.getProkers({
      department: deptFilter !== "All" ? deptFilter : undefined,
      search: debouncedSearch ? debouncedSearch : undefined
    })
      .then((res) => {
        if (res?.data) {
          setProkers(res.data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading prokers:", err);
        setLoading(false);
      });
  }, [deptFilter, debouncedSearch]);

  const filteredProkers = prokers.filter((proker) => {
    if (statusFilter === "All") return true;
    return proker.status === statusFilter;
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-sage/10 text-sage border-sage/30";
      case "Ongoing":
        return "bg-amber-500/10 text-amber-700 border-amber-500/20";
      case "Cancelled":
        return "bg-rose-500/10 text-rose-700 border-rose-500/20";
      default:
        return "bg-blue-500/10 text-blue-700 border-blue-500/20";
    }
  };


  const resetFilters = () => {
    setStatusFilter("All");
    setDeptFilter("All");
    setSearchQuery("");
  };

  return (
    <main className="pt-28 pb-16 px-6 max-w-6xl mx-auto w-full relative">
      {/* Background Ambience */}
      <div className="absolute top-[30%] left-0 w-[500px] h-[500px] bg-accent-blue/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: "Program Kerja", isCurrent: true }]} />

      {/* Header */}
      <div className="mb-12 mt-6 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div>
          <span className="text-xs font-semibold text-sage uppercase tracking-wide block mb-3">Program Kerja</span>
          <h1 className="text-4xl md:text-6xl font-extrabold text-foreground leading-none tracking-tight">
            Program <span className="text-accent-gold">Kerja BEM</span>
          </h1>
          <p className="text-sm text-foreground/75 mt-4 max-w-xl leading-relaxed">
            Daftar rencana kerja taktis BEM FT UNESA Kabinet Danadyaksa 2026. Kami menyajikan transparansi progres kegiatan serta anggaran secara terbuka bagi seluruh mahasiswa.
          </p>
        </div>
      </div>

      {/* Filtering Section */}
      <section className="glass-subtle border border-sage/15 rounded-2xl p-6 mb-10 flex flex-col gap-6 relative z-10 shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-sage/10 pb-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-accent-gold uppercase tracking-widest">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter Operasional Proker</span>
          </div>
  
          {/* Search box inside filter */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sage/50" />
            <input
              type="text"
              placeholder="Cari program kerja..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-green/60 border border-sage/10 text-[11px] text-foreground placeholder-foreground/50 focus:outline-none focus:border-accent-gold transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Departemen Filter */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-foreground/60 uppercase tracking-wider">Berdasarkan Departemen</span>
            <div className="flex flex-wrap gap-2">
              {depts.map((dept) => (
                <button
                  key={dept}
                  onClick={() => setDeptFilter(dept)}
                  className={`px-3 py-1.5 rounded-lg border text-[10px] font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                    deptFilter === dept
                      ? "bg-foliage text-white border-accent-gold/45"
                      : "bg-slate-green/80 text-foreground/70 border-sage/10 hover:text-foreground hover:border-sage/30 hover:shadow-sm"
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-foreground/60 uppercase tracking-wider">Berdasarkan Progres</span>
            <div className="flex flex-wrap gap-2">
              {statuses.map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg border text-[10px] font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                    statusFilter === status
                      ? "bg-foliage text-white border-accent-gold/45"
                      : "bg-slate-green/80 text-foreground/70 border-sage/10 hover:text-foreground hover:border-sage/30 hover:shadow-sm"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filters status indicator & reset */}
        {(deptFilter !== "All" || statusFilter !== "All" || searchQuery) && (
          <div className="flex items-center justify-between border-t border-sage/10 pt-4">
            <span className="text-xs text-foreground/60">
              Menampilkan {filteredProkers.length} program kerja terpilih
            </span>
            <button
              onClick={resetFilters}
              className="text-xs font-semibold uppercase tracking-wider text-sage hover:text-accent-gold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Filter
            </button>
          </div>
        )}
      </section>

      {/* Prokers Grid Layout */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl border border-sage/10 bg-slate-green/10 animate-pulse h-48" />
          ))}
        </div>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredProkers.length > 0 ? (
            filteredProkers.map((proker) => (
              <div
                key={proker._id}
                className="rounded-2xl border border-sage/15 bg-slate-green/80 dark:bg-slate-green/5 hover:border-accent-gold/40 p-6 shadow-md hover:shadow-lg transition-all duration-300 flex flex-col justify-between gap-6 hover:-translate-y-1 group"
              >
                <div className="flex flex-col gap-3">
                  {/* Tag & Status Row */}
                  <div className="flex items-center justify-between gap-4">
                    <span className="px-2.5 py-1 rounded-lg bg-forest/50 border border-accent-gold/20 text-[10px] font-semibold text-accent-gold uppercase tracking-widest shadow-sm">
                      {proker.departmentId?.code || proker.departmentId?.name || "BEM FT"}
                    </span>
                    
                    <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-semibold uppercase tracking-widest ${getStatusStyle(proker.status)}`}>
                      {proker.status}
                    </span>
                  </div>
 
                  <h3 className="text-foreground font-extrabold text-lg tracking-tight leading-snug mt-1 hover:text-accent-gold transition-colors">
                    {proker.title}
                  </h3>
                  
                  <p className="text-xs text-foreground/75 leading-relaxed">
                    {proker.description || "Deskripsi program kerja operasional fungsionaris BEM FT UNESA."}
                  </p>
                </div>

                {/* Progress & Transparency Panel */}
                <div className="flex flex-col gap-4 border-t border-sage/10 pt-4">
                  {/* Progress bar */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs text-foreground/60">
                      <span>STATUS PROGRES</span>
                      <span className="font-bold text-foreground">{proker.progress || 0}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-forest/50 rounded-full overflow-hidden border border-sage/10 p-[0.5px]">
                      <div
                        className="h-full bg-sage rounded-full transition-all duration-500"
                        style={{ width: `${proker.progress || 0}%` }}
                      />
                    </div>
                  </div>
 
                  {/* Operations & Finance metadata */}
                  <div className="grid grid-cols-2 gap-4 text-xs text-foreground/65">
                    <div className="flex flex-col gap-0.5 border-r border-sage/10 pr-4">
                      <span className="text-foreground/50 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-accent-gold" />
                        JADWAL
                      </span>
                      <span className="text-foreground font-bold truncate">{proker.startDate ? formatDate(proker.startDate) : "-"}</span>
                    </div>
                    <div className="flex flex-col gap-0.5 pl-2">
                      <span className="text-foreground/50 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-accent-gold" />
                        P. JAWAB
                      </span>
                      <span className="text-foreground font-bold truncate">{proker.pjId?.name || "BEM FT"}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-16 text-center glass-subtle border border-dashed border-sage/20 rounded-2xl flex flex-col items-center gap-3">
              <span className="text-xs font-semibold text-sage tracking-widest uppercase">No Program Kerja Found</span>
              <p className="text-xs text-foreground/50">Tidak ada program kerja yang cocok dengan filter yang dipilih.</p>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
