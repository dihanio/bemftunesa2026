"use client";

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { apiClient } from '@/shared/api/axios';
import { Loader2, Calendar, AlertTriangle, ChevronRight, Trophy, Megaphone, Clock } from 'lucide-react';
import Link from 'next/link';
import { PkkmbProgressCard } from './cards/PkkmbProgressCard';
import { NextActionCard } from './cards/NextActionCard';

interface DashboardData {
  progress: { percent: number };
  announcements: { _id: string; title: string; content: string; isPriority: boolean }[];
  upcomingSchedules: { _id: string; name: string; startTime: string; endTime: string }[];
  tasks: { graded: number; total: number };
  nextAction: unknown;
}

export function MabaDashboard() {
  const { user: maba } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isFetchingData, setIsFetchingData] = useState(true);

  useEffect(() => {
    if (!maba) return;
    const fetchData = async () => {
      try {
        const res = await apiClient.get('/pkkmb/dashboard/maba');
        setData(res.data?.data);
      } catch (err) {
        console.error(err);
      }
      setIsFetchingData(false);
    };
    fetchData();
  }, [maba]);

  if (!maba) return null;

  if (isFetchingData) {
    return (
      <div className="w-full py-16 flex flex-col items-center justify-center text-foreground/35">
        <Loader2 className="h-8 w-8 animate-spin text-sage mb-3" />
        <p className="text-sm">Memuat dashboard...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-full py-16 flex flex-col items-center justify-center text-red-400">
        <AlertTriangle className="h-8 w-8 mb-3" />
        <p className="text-sm">Gagal memuat data dashboard.</p>
      </div>
    );
  }

  const { progress, announcements, upcomingSchedules, tasks, nextAction } = data;
  const isLulus = progress.percent === 100 && tasks.graded === tasks.total && tasks.total > 0;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white/5 rounded-xl p-5 sm:p-8 border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 h-full w-1/2 bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 relative z-10">
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-tr from-primary to-blue-500 flex items-center justify-center text-white text-3xl font-extrabold border border-primary/20 shrink-0 shadow-xl shadow-primary/20">
            {maba.name ? maba.name.charAt(0).toUpperCase() : 'M'}
          </div>
          <div className="text-center sm:text-left space-y-1.5 min-w-0 flex-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight truncate">
              Halo, {maba.name?.split(' ')[0]}!
            </h2>
            <div className="text-sm text-foreground/60 font-medium">PKKMB FT Universitas Negeri Surabaya</div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
              <span className="badge-emerald px-3 py-1 text-xs">MABA</span>
              <span className="badge-amber px-3 py-1 text-xs">Kelompok: {maba.pkkmbGroup?.name || 'Belum Masuk Kelompok'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Graduation Banner */}
      {isLulus && (
        <div className="bg-amber-500/10 rounded-2xl p-5 sm:p-6 border border-amber-500/30 relative overflow-hidden flex flex-col sm:flex-row items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-amber-500">Selamat! Anda telah Lulus PKKMB</h3>
            <p className="text-sm text-foreground/70 mt-1">
              Anda telah menyelesaikan seluruh tugas dan persyaratan PKKMB BEM FT.
            </p>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Progress & Next Action) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Progress Card */}
          <PkkmbProgressCard progress={progress} />

          {/* Next Action Card */}
          <NextActionCard action={nextAction} />
          
        </div>

        {/* Right Column (Announcements & Schedule) */}
        <div className="space-y-6">
          
          {/* Announcements Summary */}
          <div className="bg-white/5 border border-white/5 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Megaphone className="h-4.5 w-4.5 text-sage" />
                Pengumuman
              </h3>
              <Link href="/dashboard/informasi" className="text-xs font-semibold text-primary hover:underline flex items-center">
                Lihat Semua <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            
            <div className="space-y-3">
              {announcements?.length === 0 ? (
                <p className="text-sm text-foreground/40 text-center py-4">Belum ada pengumuman.</p>
              ) : (
                announcements?.map((ann) => (
                  <div key={ann._id} className="p-3 rounded-xl bg-black/20 border border-white/5">
                    {ann.isPriority && <div className="text-[10px] font-bold text-accent-gold uppercase mb-1">Penting</div>}
                    <div className="text-sm font-semibold mb-1 line-clamp-1">{ann.title}</div>
                    <div className="text-xs text-foreground/60 line-clamp-2">{ann.content}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Upcoming Schedule Summary */}
          <div className="bg-white/5 border border-white/5 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Calendar className="h-4.5 w-4.5 text-blue-400" />
                Jadwal Terdekat
              </h3>
              <Link href="/dashboard/informasi?tab=jadwal" className="text-xs font-semibold text-primary hover:underline flex items-center">
                Jadwal Lengkap <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            
            <div className="space-y-3">
              {upcomingSchedules?.length === 0 ? (
                <p className="text-sm text-foreground/40 text-center py-4">Belum ada jadwal terdekat.</p>
              ) : (
                upcomingSchedules?.map((sched) => (
                  <div key={sched._id} className="p-3 rounded-xl bg-black/20 border border-white/5 flex gap-3">
                    <div className="flex flex-col items-center justify-center p-2 bg-blue-500/10 text-blue-400 rounded-lg min-w-[50px]">
                      <span className="text-lg font-bold leading-none">{new Date(sched.startTime).getDate()}</span>
                      <span className="text-[10px] uppercase font-semibold mt-1">
                        {new Date(sched.startTime).toLocaleString('id-ID', { month: 'short' })}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">{sched.name}</div>
                      <div className="text-xs text-foreground/60 mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(sched.startTime).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit' })} - {new Date(sched.endTime).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
