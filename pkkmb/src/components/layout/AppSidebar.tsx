/* eslint-disable */
"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { getNavItems } from './navigation';
import { GraduationCap } from 'lucide-react';
import Image from 'next/image';

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const navItems = getNavItems(user);

  const isActive = (href: string) => 
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-white/5 glass-subtle h-screen sticky top-0 left-0 z-40">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 relative shrink-0">
            <Image src="/logo_adrata.png" alt="PKKMB Adrata" fill className="object-contain" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight">PKKMB FT</h1>
            <p className="text-xs text-foreground/40">Universitas Negeri Surabaya</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-4 space-y-1">
        <div className="text-xs font-semibold text-foreground/40 mb-3 px-2 uppercase tracking-wider">
          Menu Utama
        </div>
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active 
                  ? 'bg-sage/10 text-sage' 
                  : 'text-foreground/60 hover:text-foreground/90 hover:bg-white/5'
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
