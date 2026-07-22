"use client";

import React, { useState } from 'react';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import {
  Users,
  Database,
  DownloadCloud,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export function AdminDashboard() {
  const { user } = useAuthStore();
  const [exportSessionId, setExportSessionId] = useState('');

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-red-500/5 rounded-xl p-6 border border-red-500/10">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-lg bg-gradient-to-tr from-red-500 to-amber-500 flex items-center justify-center text-white text-2xl font-bold border border-red-500/20">
            {user.name ? user.name.charAt(0).toUpperCase() : 'A'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-red-500">Super Admin Panel</h2>
            <p className="text-sm text-foreground/60 mt-1">Kelola master data, pengguna, dan laporan.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Quick Stats */}
        <Card className="bg-white/5 border-white/10 rounded-lg shadow-none">
          <CardHeader className="pb-3 flex flex-row justify-between items-center">
            <div>
              <CardTitle className="text-base">Total Peserta</CardTitle>
            </div>
            <Users className="h-4 w-4 text-foreground/40" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-foreground/40 mt-1">Data dari IMS</p>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10 rounded-lg shadow-none">
          <CardHeader className="pb-3 flex flex-row justify-between items-center">
            <div>
              <CardTitle className="text-base">Jumlah Kelompok</CardTitle>
            </div>
            <Database className="h-4 w-4 text-foreground/40" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-foreground/40 mt-1">Sinkron dengan Database</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white/5 border-white/10 rounded-lg shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DownloadCloud className="h-5 w-5 text-red-500" />
              Ekspor Laporan Presensi
            </CardTitle>
            <CardDescription>Unduh rekap presensi dalam format CSV berdasarkan ID Sesi.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="field-label">ID Sesi Presensi</label>
              <input 
                type="text" 
                value={exportSessionId}
                onChange={(e) => setExportSessionId(e.target.value)}
                className="input-field" 
                placeholder="Masukkan Object ID sesi (contoh: 64b8a...)" 
              />
            </div>
            <a
              href={exportSessionId ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/pkkmb/admin/attendance/export/${exportSessionId}` : '#'}
              className={`btn-primary w-full py-2.5 flex items-center justify-center gap-2 ${!exportSessionId ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
              target="_blank"
              rel="noreferrer"
            >
              <FileText className="h-4 w-4" />
              Unduh CSV
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
