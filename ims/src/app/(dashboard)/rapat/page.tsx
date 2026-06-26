"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import ImsApiService from "@/lib/api";
import { Calendar, MapPin, Users, Plus, Search, Video, CheckCircle, Play, AlertCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface RapatCard {
  _id: string;
  title: string;
  description?: string;
  scheduledAt: string;
  endedAt?: string;
  location: {
    name: string;
    latitude: number;
    longitude: number;
    radiusInMeters: number;
  };
  status: 'scheduled' | 'ongoing' | 'ended';
  attendeeCount: number;
  createdBy?: { name: string; email: string };
}

export default function RapatListPage() {
  const router = useRouter();
  const [rapatList, setRapatList] = useState<RapatCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'scheduled' | 'ongoing' | 'ended'>('ongoing');
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        setLoading(true);
        const profileRes = await ImsApiService.getProfile();
        const cabinetPeriodId = profileRes?.data?.activeContext?.periodId;
        
        if (cabinetPeriodId) {
          const res = await ImsApiService.getRapatList(cabinetPeriodId);
          if (res?.data) {
            setRapatList(res.data);
            
            // Set default active tab based on what's available
            const hasOngoing = res.data.some((r: RapatCard) => r.status === 'ongoing');
            const hasScheduled = res.data.some((r: RapatCard) => r.status === 'scheduled');
            if (hasOngoing) {
              setActiveTab('ongoing');
            } else if (hasScheduled) {
              setActiveTab('scheduled');
            } else {
              setActiveTab('ended');
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch rapat list:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMeetings();
  }, []);

  const tabs: { key: 'scheduled' | 'ongoing' | 'ended'; label: string; count: number }[] = [
    { key: 'ongoing', label: 'Berlangsung', count: rapatList.filter(r => r.status === 'ongoing').length },
    { key: 'scheduled', label: 'Mendatang', count: rapatList.filter(r => r.status === 'scheduled').length },
    { key: 'ended', label: 'Selesai', count: rapatList.filter(r => r.status === 'ended').length },
  ];

  const filteredList = rapatList.filter((r) => {
    const matchStatus = r.status === activeTab;
    const matchSearch =
      searchQuery === "" ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      r.location.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <DashboardShell>
      <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full pb-12 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
              <Calendar className="w-6 h-6 text-sage" />
              Rapat & Absensi
            </h1>
            <p className="text-foreground/60 text-sm mt-1">Kelola agenda pertemuan, generate QR code presensi, dan lacak geofence kehadiran</p>
          </div>
          <button
            onClick={() => router.push("/rapat/new")}
            className="flex items-center justify-center gap-2 bg-sage text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-sage/90 transition-all duration-200 shadow-lg shadow-sage/20 border border-sage/50 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Buat Rapat Baru
          </button>
        </div>

        {/* Filter Tabs & Search */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-1.5 p-1 bg-white/5 border border-white/10 rounded-2xl w-full md:w-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === tab.key
                    ? "bg-sage text-white shadow-md shadow-sage/10"
                    : "text-foreground/60 hover:text-foreground/90 hover:bg-white/5"
                }`}
              >
                {tab.label}
                <span className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded-md text-[9px] font-bold ${
                  activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-white/5 text-foreground/40'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
            <input
              type="text"
              placeholder="Cari judul rapat atau lokasi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-subtle border border-white/10 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-sage/40 shadow-sm"
            />
          </div>
        </div>

        {/* Grid List */}
        {loading ? (
          <div className="py-24 text-center text-foreground/50">
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 animate-spin rounded-full border-4 border-sage/20 border-t-sage" />
              <span className="text-sm font-medium">Memuat agenda rapat...</span>
            </div>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="glass-subtle border border-white/5 rounded-2xl p-20 text-center text-foreground/40">
            <div className="flex flex-col items-center justify-center gap-3 max-w-sm mx-auto">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-1">
                <Calendar className="w-6 h-6 text-foreground/35" />
              </div>
              <span className="text-sm font-semibold text-white">Tidak Ada Rapat</span>
              <p className="text-xs text-foreground/40">
                Saat ini tidak ada agenda rapat yang {activeTab === 'ongoing' ? 'sedang berlangsung' : activeTab === 'scheduled' ? 'akan datang' : 'telah selesai'}.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredList.map((rapat) => (
              <div
                key={rapat._id}
                onClick={() => router.push(`/rapat/${rapat._id}`)}
                className="glass-subtle border border-white/5 hover:border-white/10 rounded-2xl p-5 flex flex-col gap-4 cursor-pointer hover:-translate-y-0.5 transition-all duration-200 group relative overflow-hidden"
              >
                {/* Status indicator glow */}
                {rapat.status === 'ongoing' && (
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                )}

                {/* Title */}
                <div className="flex flex-col gap-1">
                  <h3 className="font-semibold text-white group-hover:text-sage transition-colors line-clamp-1 leading-snug">
                    {rapat.title}
                  </h3>
                  <p className="text-xs text-foreground/50 line-clamp-2 min-h-[2rem]">
                    {rapat.description || "Tidak ada deskripsi rapat."}
                  </p>
                </div>

                <div className="border-t border-white/5 my-1" />

                {/* Info Fields */}
                <div className="flex flex-col gap-2.5 text-xs text-foreground/75">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-foreground/40" />
                    <span>{formatDate(rapat.scheduledAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-foreground/40" />
                    <span className="truncate">{rapat.location.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-foreground/40" />
                    <span>{rapat.attendeeCount} Orang Hadir</span>
                  </div>
                </div>

                {/* Footer Badge & Action */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                  {rapat.status === 'scheduled' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-blue-500/10 text-blue-400 border-blue-500/20">
                      Mendatang
                    </span>
                  )}
                  {rapat.status === 'ongoing' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Berlangsung
                    </span>
                  )}
                  {rapat.status === 'ended' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-slate-500/10 text-slate-400 border-slate-500/20">
                      Selesai
                    </span>
                  )}

                  <span className="text-xs text-sage group-hover:underline font-semibold flex items-center gap-1">
                    Kelola Rapat →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
