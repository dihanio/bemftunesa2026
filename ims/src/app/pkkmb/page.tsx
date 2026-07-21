"use client";

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from "react";
import DashboardShell from "@/components/DashboardShell";
import ImsApiService from "@/lib/api";
import { BookOpen, Users, Clock, FileText, Award, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function PkkmbDashboard() {
  const [stats, setStats] = useState({
    mabaCount: 0,
    eventCount: 0,
    assignmentCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const [mabaRes, eventsRes, assignmentsRes] = await Promise.all([
          ImsApiService.getMabaList(),
          ImsApiService.getPkkmbAttendanceEvents(),
          ImsApiService.getPkkmbAssignments(),
        ]);

        setStats({
          mabaCount: mabaRes.data?.length || 0,
          eventCount: eventsRes.data?.length || 0,
          assignmentCount: assignmentsRes.data?.length || 0,
        });
      } catch (err) {
        console.error("Failed to load PKKMB overview statistics:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <DashboardShell requirePkkmbAccess>
      <div className="flex flex-col gap-6 p-6">
        
        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            Overview PKKMB FT 2026
          </h1>
          <p className="text-sm text-ink-muted">
            Sistem ERP pemantauan presensi dan pengerjaan penugasan mahasiswa baru Fakultas Teknik.
          </p>
        </div>

        {/* Stats Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-32 bg-surface-2 rounded-xl border border-hairline" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1: Maba */}
            <div className="bg-surface-1 border border-hairline rounded-xl p-6 relative overflow-hidden flex flex-col justify-between h-36">
              <div className="absolute top-0 right-0 h-full w-24 bg-gradient-to-l from-emerald-500/5 to-transparent pointer-events-none" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">Total Mahasiswa Baru</span>
                <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-500">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-ink">{stats.mabaCount}</span>
                <span className="text-xs text-emerald-500 font-bold">Terdaftar</span>
              </div>
            </div>

            {/* Card 2: Attendance */}
            <div className="bg-surface-1 border border-hairline rounded-xl p-6 relative overflow-hidden flex flex-col justify-between h-36">
              <div className="absolute top-0 right-0 h-full w-24 bg-gradient-to-l from-amber-500/5 to-transparent pointer-events-none" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">Sesi Presensi</span>
                <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-500">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-ink">{stats.eventCount}</span>
                <span className="text-xs text-amber-500 font-bold">Hari PKKMB</span>
              </div>
            </div>

            {/* Card 3: Assignments */}
            <div className="bg-surface-1 border border-hairline rounded-xl p-6 relative overflow-hidden flex flex-col justify-between h-36">
              <div className="absolute top-0 right-0 h-full w-24 bg-gradient-to-l from-blue-500/5 to-transparent pointer-events-none" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">Penugasan Aktif</span>
                <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-500">
                  <FileText className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-ink">{stats.assignmentCount}</span>
                <span className="text-xs text-blue-500 font-bold">Tugas</span>
              </div>
            </div>

          </div>
        )}

        {/* Shortcuts Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          
          <Link href="/pkkmb/maba" className="group bg-surface-1 border border-hairline hover:border-emerald-500/20 rounded-xl p-6 transition-all hover:bg-emerald-500/[0.02]">
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-1.5">
                <h3 className="font-extrabold text-ink group-hover:text-emerald-500 transition-colors">
                  Kelola Data Maba
                </h3>
                <p className="text-xs text-ink-muted leading-normal">
                  Import data mahasiswa baru, reset password, dan filter kelompok/prodi.
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-ink-muted group-hover:translate-x-1 group-hover:text-emerald-500 transition-all shrink-0 mt-1" />
            </div>
          </Link>

          <Link href="/pkkmb/presensi" className="group bg-surface-1 border border-hairline hover:border-amber-500/20 rounded-xl p-6 transition-all hover:bg-amber-500/[0.02]">
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-1.5">
                <h3 className="font-extrabold text-ink group-hover:text-amber-500 transition-colors">
                  Kelola Presensi
                </h3>
                <p className="text-xs text-ink-muted leading-normal">
                  Buat sesi presensi harian dengan geofencing GPS radius dan token QR code, serta rekapitulasi kehadiran.
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-ink-muted group-hover:translate-x-1 group-hover:text-amber-500 transition-all shrink-0 mt-1" />
            </div>
          </Link>

          <Link href="/pkkmb/tugas" className="group bg-surface-1 border border-hairline hover:border-blue-500/20 rounded-xl p-6 transition-all hover:bg-blue-500/[0.02]">
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-1.5">
                <h3 className="font-extrabold text-ink group-hover:text-blue-500 transition-colors">
                  Penilaian & Tugas
                </h3>
                <p className="text-xs text-ink-muted leading-normal">
                  Buat daftar tugas, periksa link pengumpulan maba, dan berikan penilaian serta catatan feedback secara terpadu.
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-ink-muted group-hover:translate-x-1 group-hover:text-blue-500 transition-all shrink-0 mt-1" />
            </div>
          </Link>

        </div>

      </div>
    </DashboardShell>
  );
}
