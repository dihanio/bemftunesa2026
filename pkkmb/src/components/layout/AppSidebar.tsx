"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { getNavItems } from './navigation';
import Image from 'next/image';
import { ChevronDown, ChevronRight } from 'lucide-react';

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const navItems = getNavItems(user);
  
  // Track expanded parent menus
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpand = (href: string) => {
    setExpanded(prev => ({ ...prev, [href]: !prev[href] }));
  };

  const isActive = (href: string) => {
    if (href.includes('?')) {
      const path = href.split('?')[0];
      return pathname === path;
    }
    return href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);
  };

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
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expanded[item.href] || active;

          return (
            <div key={item.href} className="space-y-1">
              {hasChildren ? (
                <button
                  onClick={() => toggleExpand(item.href)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active 
                      ? 'bg-sage/10 text-sage' 
                      : 'text-foreground/60 hover:text-foreground/90 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </div>
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
              ) : (
                <Link
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
              )}

              {hasChildren && isExpanded && (
                <div className="pl-9 space-y-1 mt-1">
                  {item.children!.map(child => {
                    // For children that might use query params, check exact matching
                    // But in this simple app, we can just rely on the parent path being active
                    // To do it properly, we could check searchParams, but a simple style is fine.
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all text-foreground/50 hover:text-foreground/90 hover:bg-white/5`}
                      >
                        <child.icon className="h-4 w-4" />
                        {child.label}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
