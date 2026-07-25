"use client";

import React from 'react';
import Image from 'next/image';
import { AuthGuard } from '@/features/auth/components/AuthGuard';
import { ToastProvider } from '@/components/ui/toast';
import { AppSidebar } from './AppSidebar';
import { AppTopbar } from './AppTopbar';
import { AppBottomNav } from './AppBottomNav';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <ToastProvider>
        <div className="flex min-h-screen w-full bg-[var(--bg-canvas)] text-[var(--text-primary)] font-sans relative overflow-hidden">
          {/* Full-Bleed Background Architectural Atmosphere */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
            <Image
              src="/gedung_ft_new.jpeg"
              alt="Gedung FT UNESA Background"
              fill
              className="object-cover grayscale opacity-15 filter contrast-125"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-canvas)] via-[var(--bg-canvas)]/90 to-[var(--bg-canvas)]" />
            <div className="absolute inset-0 opacity-30 bg-[linear-gradient(rgba(212,175,55,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(212,175,55,0.04)_1px,transparent_1px)] bg-[size:64px_64px]" />
            <div className="absolute top-1/3 right-[-10%] w-[700px] h-[700px] bg-[var(--accent-muted)] rounded-full blur-[180px]" />
            <div className="absolute bottom-6 right-6 text-[18rem] font-serif text-[#D4AF37]/[0.02] select-none pointer-events-none leading-none hidden lg:block">
              ꦥꦏꦏꦩꦧ
            </div>
          </div>

          {/* Sidebar Navigation */}
          <AppSidebar />

          {/* Main Content Area */}
          <div className="flex flex-col flex-1 min-w-0 relative z-10">
            <AppTopbar />
            <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 pb-24 md:pb-8 relative z-10">
              <div className="max-w-6xl mx-auto w-full">{children}</div>
            </main>
          </div>

          {/* Mobile Bottom Navigation */}
          <AppBottomNav />
        </div>
      </ToastProvider>
    </AuthGuard>
  );
}
