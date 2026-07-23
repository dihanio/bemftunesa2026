"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { apiClient } from '@/shared/api/axios';
import { Loader2, AlertTriangle, Users, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { MonitoringSummaryCard } from './cards/MonitoringSummaryCard';
import { ActivityTimeline } from './cards/ActivityTimeline';

interface PanitiaData {
  activeGroup?: unknown;
  monitoringStats?: { totalMaba: number; present: number; late: number; absent: number };
  upcomingSchedules?: {
    _id?: string;
    name: string;
    startTime: string;
    location?: string;
  }[];
}

export function PanitiaDashboard() {
  const { user } = useAuthStore();
  const [data, setData] = useState<PanitiaData | null>(null);
  const [isFetching, setIsFetching] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setIsFetching(true);
    try {
      const res = await apiClient.get('/pkkmb/dashboard/panitia');
      setData(res.data?.data);
    } catch (err) {
      console.error(err);
    }
    setIsFetching(false);
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchData]);

  if (!user) return null;

  if (isFetching) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-sage mb-3" />
        <p className="text-sm text-foreground/50">Memuat dashboard...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-red-400">
        <AlertTriangle className="h-8 w-8 mb-3" />
        <p className="text-sm">Gagal memuat data dashboard.</p>
      </div>
    );
  }

  // Assuming data contains: { activeGroup: {...}, monitoringStats: {...}, upcomingSchedules: [...] }
  const stats = data.monitoringStats || { totalMaba: 0, present: 0, late: 0, absent: 0 };
  const schedules = data.upcomingSchedules || [];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white/5 rounded-xl p-6 md:p-8 border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 h-full w-1/2 bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 relative z-10">
          <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-gradient-to-tr from-primary to-blue-500 flex items-center justify-center text-white text-3xl font-extrabold border border-primary/20 shrink-0">
            {user.name ? user.name.charAt(0).toUpperCase() : 'P'}
          </div>
          <div className="text-center md:text-left space-y-1.5 flex-1">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Halo, {user.name?.split(' ')[0]}!</h2>
            <p className="text-sm text-foreground/60 font-medium">Dashboard Monitoring Kepanitiaan PKKMB</p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-2">
              <span className="badge-emerald px-3 py-1 text-xs">{user.role}</span>
              <span className="badge-amber px-3 py-1 text-xs">PIC Kelompok: {user.pkkmbGroup?.name || '-'}</span>
            </div>
          </div>
          <div className="shrink-0 mt-4 md:mt-0 flex gap-3">
            <Link href="/dashboard/attendance" className="btn-primary text-sm px-5 py-2.5">Kelola Presensi</Link>
            <Link href="/dashboard/tasks" className="btn-secondary text-sm px-5 py-2.5">Beri Penilaian</Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Monitoring) */}
        <div className="lg:col-span-2 space-y-6">
          <MonitoringSummaryCard stats={stats} />
          
          {/* Quick Access to Groups */}
          <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Users className="h-5 w-5 text-sage" />
                Maba Binaan Anda
              </h3>
              <Link href="/dashboard/profil" className="text-sm font-semibold text-primary flex items-center gap-1 hover:underline">
                Lihat Detail <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="text-sm text-foreground/50 border border-dashed border-white/10 rounded-xl p-6 text-center">
              Modul manajemen maba akan ditampilkan di sini.
            </div>
          </div>
        </div>

        {/* Right Column (Timeline) */}
        <div className="space-y-6">
          <ActivityTimeline schedules={schedules} />
        </div>
      </div>
    </div>
  );
}
