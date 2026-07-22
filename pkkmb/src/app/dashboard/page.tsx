"use client";

import React from 'react';
import { redirect } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { MabaDashboard } from '@/features/dashboard/components/MabaDashboard';
import { PanitiaDashboard } from '@/features/dashboard/components/PanitiaDashboard';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuthStore();

  if (!user) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sage" />
      </div>
    );
  }

  // Dynamic dashboard rendering based on role
  if (user.role === 'MABA') {
    return <MabaDashboard />;
  }

  if (user.role === 'PANITIA') {
    return <PanitiaDashboard />;
  }

  if (user.role === 'ADMIN') {
    redirect('/admin');
  }

  // Fallback
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">Selamat datang di PKKMB FT!</h1>
      <p>Role Anda tidak dikenali.</p>
    </div>
  );
}
