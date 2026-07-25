"use client";

import React from 'react';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { usePermission } from '@/features/auth/hooks/usePermission';
import { MabaDashboard } from '@/features/dashboard/components/MabaDashboard';
import { PanitiaDashboard } from '@/features/dashboard/components/PanitiaDashboard';
import { LoadingState } from '@/components/ui/loading-state';

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
