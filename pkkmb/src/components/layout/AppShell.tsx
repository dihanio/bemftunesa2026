"use client";

import React from 'react';
import { AuthGuard } from '@/features/auth/components/AuthGuard';
import { AppSidebar } from './AppSidebar';
import { AppTopbar } from './AppTopbar';
import { AppBottomNav } from './AppBottomNav';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen w-full bg-background relative overflow-hidden">
        {/* Subtle dot pattern background */}
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#374151_1px,transparent_1px)] [background-size:16px_16px] opacity-30" />
        
        {/* Ambient background glows */}
        <div className="pointer-events-none absolute top-[-20%] right-[-10%] h-[600px] w-[600px] rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-[-20%] left-[-10%] h-[600px] w-[600px] rounded-full bg-amber-500/10 blur-[120px]" />

        <AppSidebar />

        <div className="flex flex-col flex-1 min-w-0">
          <AppTopbar />
          <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 pb-24 md:pb-8 relative z-10">
            <div className="max-w-6xl mx-auto w-full">
              {children}
            </div>
          </main>
        </div>

        <AppBottomNav />
      </div>
    </AuthGuard>
  );
}
