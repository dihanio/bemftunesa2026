"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { usePermission } from '@/features/auth/hooks/usePermission';
import { LoadingState } from '@/components/ui/loading-state';

const MabaDashboard = dynamic(
  () => import('@/features/dashboard/components/MabaDashboard').then(mod => ({ default: mod.MabaDashboard })),
  { loading: () => <LoadingState message="Memuat dashboard MABA..." /> }
);

const PanitiaDashboard = dynamic(
  () => import('@/features/dashboard/components/PanitiaDashboard').then(mod => ({ default: mod.PanitiaDashboard })),
  { loading: () => <LoadingState message="Memuat dashboard Panitia..." /> }
);

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { hasPermission } = usePermission();

  if (!user) {
    return <LoadingState message="Memuat dashboard..." />;
  }

  // Permission-driven dashboard selection
  if (hasPermission('pkkmb.monitoring.read') || hasPermission('manage:all')) {
    return <PanitiaDashboard />;
  }

  if (hasPermission('pkkmb.task.submit')) {
    return <MabaDashboard />;
  }

  // Fallback for custom operator roles or other permissions
  return <PanitiaDashboard />;
}
