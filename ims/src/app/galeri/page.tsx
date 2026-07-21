"use client";

import React from "react";
import DashboardShell from "@/components/DashboardShell";
import { FeatureUnavailableState } from "@/components/ui/states/FeatureUnavailableState";

export default function GaleriPage() {
  return (
    <DashboardShell>
      <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto py-6 px-4 h-[calc(100vh-100px)]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-hairline pb-6 shrink-0">
          <div>
            <h1 className="text-3xl font-extrabold text-ink tracking-tight">Galeri Kegiatan (CMS)</h1>
            <p className="text-sm text-ink-muted mt-1">
              Kelola album foto dan dokumentasi kegiatan untuk ditampilkan pada website publik.
            </p>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <FeatureUnavailableState 
            title="Fitur Galeri CMS Sedang Dalam Pengembangan" 
            message="Modul manajemen galeri saat ini sedang dalam proses pengembangan oleh tim developer. Fitur ini akan segera hadir untuk memudahkan pengelolaan dokumentasi." 
          />
        </div>
      </div>
    </DashboardShell>
  );
}
