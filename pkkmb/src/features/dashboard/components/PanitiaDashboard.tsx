"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { apiClient } from '@/shared/api/axios';
import { AlertTriangle, Users, ChevronRight, CheckSquare, ClipboardList, Shield } from 'lucide-react';
import Link from 'next/link';
import { MonitoringSummaryCard } from './cards/MonitoringSummaryCard';
import { ActivityTimeline } from './cards/ActivityTimeline';
import { LoadingState } from '@/components/ui/loading-state';

interface PanitiaData {
  statistics?: {
    totalPeserta: number;
    attendanceTodayPercent: number;
  };
  attendance?: {
    today: number;
  };
  activities?: Array<{
    type: 'task' | 'attendance';
    message: string;
    time: string;
  }>;
  announcements?: Array<{
    _id: string;
    title: string;
    content: string;
    isPriority: boolean;
    createdAt: string;
  }>;
  schedules?: {
    _id?: string;
    name: string;
    startTime: string;
    endTime?: string;
    location?: string;
    pic?: string;
  }[];
  tasks?: {
    totalSubmissions: number;
    pendingGrading: number;
    graded: number;
  };
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
    return <LoadingState message="MEMUAT KONSOL PANITIA..." />;
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[var(--semantic-danger)] space-y-3">
        <AlertTriangle className="h-8 w-8 mb-1" />
        <p className="text-xs font-mono tracking-wider uppercase">Gagal memuat data dashboard panitia.</p>
        <button
          type="button"
          onClick={fetchData}
          className="btn-accent px-4 py-2 font-mono text-xs uppercase tracking-wider cursor-pointer"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  // Calculate monitoring stats dynamically from backend response
  const totalMaba = data.statistics?.totalPeserta ?? 0;
  const present = data.attendance?.today ?? 0;
  const absent = Math.max(0, totalMaba - present);

  const stats = {
    totalMaba,
    present,
    late: 0,
    absent,
  };

  const schedules = data.schedules || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Banner Panitia */}
      <div className="surface-card p-6 md:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 h-full w-1/2 bg-gradient-to-l from-[var(--accent-muted)] to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 relative z-10">
          <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-[var(--bg-surface-elevated)] border-2 border-[var(--accent)] flex items-center justify-center text-[var(--accent)] text-2xl font-mono font-bold shrink-0 shadow-lg shadow-[var(--accent-glow)] overflow-hidden">
            {user.avatar && user.avatar !== '/pasfoto_default.png' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar} alt="Avatar Panitia" className="h-full w-full object-cover" />
            ) : user.name ? (
              user.name.charAt(0).toUpperCase()
            ) : (
              'P'
            )}
          </div>
          <div className="text-center md:text-left space-y-1.5 flex-1">
            <div className="text-[10px] font-mono text-[var(--accent)] tracking-widest uppercase font-bold flex items-center justify-center md:justify-start gap-1.5">
              <Shield className="h-3.5 w-3.5" /> KEPANITIAAN PKKMB FT UNESA 2026
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--text-primary)] font-mono">
              Halo, {user.name?.split(' ')[0]}!
            </h2>
            <p className="text-xs font-mono text-[var(--text-muted)]">Dashboard Monitoring & Manajemen Pendampingan Maba</p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-2">
              <span className="px-3 py-1 bg-[var(--accent-muted)] border border-[var(--accent-glow)] text-[var(--accent)] text-[10px] font-mono font-bold uppercase tracking-wider rounded">
                ROLE: {user.role}
              </span>
              <span className="px-3 py-1 bg-white/5 border border-[var(--border-default)] text-[var(--text-primary)] text-[10px] font-mono font-bold uppercase tracking-wider rounded">
                KELOMPOK BINAAN: {user.pkkmbGroup?.name || 'BELUM DI-ASSIGN'}
              </span>
            </div>
          </div>
          <div className="shrink-0 mt-4 md:mt-0 flex gap-3">
            <Link href="/dashboard/attendance" className="btn-accent text-xs font-mono px-4 py-2.5 uppercase tracking-wider flex items-center gap-1.5">
              <CheckSquare className="h-3.5 w-3.5" /> Presensi
            </Link>
            <Link href="/dashboard/evaluator" className="btn-secondary-custom text-xs font-mono px-4 py-2.5 uppercase tracking-wider flex items-center gap-1.5">
              <ClipboardList className="h-3.5 w-3.5" /> Penilaian
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Monitoring) */}
        <div className="lg:col-span-2 space-y-6">
          <MonitoringSummaryCard stats={stats} />

          {/* Quick Access to Maba Binaan */}
          <div className="surface-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <h3 className="text-xs font-mono font-bold text-[var(--accent)] uppercase tracking-wider flex items-center gap-2">
                <Users className="h-4 w-4 text-[var(--accent)]" />
                MAHASISWA BINAAN
              </h3>
              <Link href="/dashboard/group" className="text-[10px] font-mono text-[var(--accent)] hover:underline flex items-center uppercase tracking-wider font-bold">
                KELOLA GRUP <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="text-xs font-mono text-[var(--text-muted)] border border-dashed border-[var(--border-subtle)] rounded-lg p-6 text-center bg-[var(--bg-surface)]">
              Manajemen dan monitoring daftar mahasiswa binaan dapat dikelola dari menu Mentoring Kelompok.
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
