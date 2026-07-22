"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Megaphone, Calendar, Info } from 'lucide-react';

function InformasiContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = searchParams.get('tab') || 'pengumuman';

  const setTab = (newTab: string) => {
    router.push(`/dashboard/informasi?tab=${newTab}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-sage/20 flex items-center justify-center text-sage">
          <Info className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Informasi PKKMB</h1>
          <p className="text-sm text-foreground/60">Pusat informasi dan jadwal kegiatan PKKMB FT.</p>
        </div>
      </div>

      <div className="flex border-b border-white/5 mb-6">
        <button
          onClick={() => setTab('pengumuman')}
          className={`py-3 px-5 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
            tab === 'pengumuman'
              ? 'border-sage text-sage'
              : 'border-transparent text-foreground/35 hover:text-foreground/60'
          }`}
        >
          <Megaphone className="h-4 w-4" />
          <span>Pengumuman</span>
        </button>
        <button
          onClick={() => setTab('jadwal')}
          className={`py-3 px-5 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
            tab === 'jadwal'
              ? 'border-sage text-sage'
              : 'border-transparent text-foreground/35 hover:text-foreground/60'
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>Jadwal Kegiatan</span>
        </button>
      </div>

      <div>
        {tab === 'pengumuman' ? (
          <div>List Pengumuman (Dari API /pkkmb/announcements)</div>
        ) : (
          <div>List Jadwal (Dari API /pkkmb/schedules)</div>
        )}
      </div>
    </div>
  );
}

export default function InformasiPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InformasiContent />
    </Suspense>
  );
}
