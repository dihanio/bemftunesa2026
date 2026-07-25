"use client";

import React from 'react';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import AmbiencePlayer from '@/components/landing/AmbiencePlayer';
import { NotificationCenter } from './NotificationCenter';

export function AppTopbar() {
  const { user } = useAuthStore();

  const hasCustomAvatar = user?.avatar && user.avatar !== '/pasfoto_default.png';

  return (
    <header className="sticky top-0 z-30 bg-[var(--bg-surface)]/80 backdrop-blur-md border-b border-[var(--border-subtle)] py-3 px-4 sm:px-8 flex items-center justify-between">
      {/* Left Slot: User Avatar & Name */}
      <div className="flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-full bg-[var(--bg-surface-elevated)] border border-[var(--accent-glow)] flex items-center justify-center font-bold text-[var(--accent)] text-[10px] overflow-hidden relative shrink-0 shadow-md">
          {hasCustomAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
          ) : user?.name ? (
            user.name.charAt(0).toUpperCase()
          ) : (
            'D'
          )}
        </div>
        <span className="hidden sm:inline text-xs font-mono text-[var(--text-primary)] truncate max-w-[160px]">
          {user?.name}
        </span>
      </div>

      {/* Center Spacer */}
      <div className="hidden md:block flex-1" />

      {/* Right Slot: Ambience Player & Notification Center */}
      <div className="flex items-center gap-2.5">
        <AmbiencePlayer />
        <NotificationCenter />
      </div>
    </header>
  );
}
