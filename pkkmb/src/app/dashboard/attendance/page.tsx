"use client";

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { apiClient } from '@/shared/api/axios';
import { CheckCircle, Loader2 } from 'lucide-react';

export default function AttendancePage() {
  const { user } = useAuthStore();
  const [isFetchingData, setIsFetchingData] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        await Promise.all([
          apiClient.get('/pkkmb/attendance/sessions'),
          apiClient.get('/pkkmb/attendance/my-logs'),
        ]);
      } catch (err) {
        console.error(err);
      }
      setIsFetchingData(false);
    };
    fetchData();
  }, [user]);

  if (isFetchingData) {
    return (
      <div className="w-full py-16 flex flex-col items-center justify-center text-foreground/35">
        <Loader2 className="h-8 w-8 animate-spin text-sage mb-3" />
        <p className="text-sm">Memuat data absensi...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-sage/20 flex items-center justify-center text-sage">
          <CheckCircle className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Absensi</h1>
          <p className="text-sm text-foreground/60">Lakukan presensi dan lihat riwayat kehadiran Anda.</p>
        </div>
      </div>
      
      {/* Absensi UI (Placeholder for now) */}
      <div className="bg-white/5 rounded-xl p-10 border border-white/5 text-center text-foreground/35 text-sm">
        UI Absensi Maba
      </div>
    </div>
  );
}
