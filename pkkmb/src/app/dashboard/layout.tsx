"use client";

import React, { Suspense } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { LoadingState } from '@/components/ui/loading-state';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <Suspense fallback={<LoadingState message="Memuat dashboard..." />}>
        {children}
      </Suspense>
    </AppShell>
  );
}
