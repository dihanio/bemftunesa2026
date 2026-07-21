"use client";

import React from 'react';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { LogOut, Bell, GraduationCap } from 'lucide-react';

export function AppTopbar() {
  const { user, logout } = useAuthStore();

  return (
    <header className="sticky top-0 z-30 glass-subtle border-b border-white/5 py-3 px-4 sm:px-8 flex items-center justify-between">
      {/* Mobile Title (Since sidebar is hidden on mobile) */}
      <div className="flex md:hidden items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center font-bold text-white text-xs shadow-lg shadow-primary/20">
          <GraduationCap className="h-5 w-5" />
        </div>
        <h1 className="text-sm font-extrabold tracking-tight">PKKMB FT</h1>
      </div>

      {/* Desktop empty space or Breadcrumb placeholder */}
      <div className="hidden md:block">
        <div className="text-sm font-medium text-foreground/60">
          Halo, <span className="font-bold text-foreground">{user?.name}</span>!
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button className="p-2 rounded-xl text-foreground/50 hover:bg-white/5 hover:text-foreground transition-all">
          <Bell className="h-5 w-5" />
        </button>
        <button
          onClick={logout}
          className="flex items-center gap-2 rounded-xl bg-white/5 hover:bg-red-500/10 hover:text-red-400 border border-white/10 hover:border-red-500/20 py-2 px-3 text-xs sm:text-sm font-semibold transition-all cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Keluar</span>
        </button>
      </div>
    </header>
  );
}
