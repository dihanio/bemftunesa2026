"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { getNavItems } from './navigation';

export function AppBottomNav() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const navItems = getNavItems(user);

  const isActive = (href: string) => 
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);

  // We should limit mobile nav to 4-5 items maximum.
  const mobileNavItems = navItems.slice(0, 5);

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 glass-subtle border-t border-white/5 safe-area-bottom">
      <div className="flex items-stretch justify-around px-2">
        {mobileNavItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-medium transition-all ${
                active 
                  ? 'text-sage' 
                  : 'text-foreground/50 hover:text-foreground/80'
              }`}
            >
              <div className={`p-1 rounded-full ${active ? 'bg-sage/10' : 'bg-transparent'}`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="truncate w-full text-center px-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
