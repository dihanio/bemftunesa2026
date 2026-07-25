"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { getNavItems } from './navigation';
import Image from 'next/image';
import { ChevronDown, ChevronRight, PanelLeftClose, PanelLeftOpen, LogOut } from 'lucide-react';

export function AppSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const navItems = getNavItems(user);

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const isActive = (href: string) => {
    if (href.includes('?')) {
      const path = href.split('?')[0];
      return pathname === path;
    }
    return href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);
  };

  const toggleExpand = (href: string) => {
    if (isCollapsed) setIsCollapsed(false);
    setExpanded((prev) => ({ ...prev, [href]: !(prev[href] ?? isActive(href)) }));
  };

  return (
    <aside
      className={`hidden md:flex flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-surface)]/90 backdrop-blur-md h-screen sticky top-0 left-0 z-40 transition-all duration-300 shrink-0 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header + Perkecil Toggle at the TOP */}
      <div
        className={`flex items-center justify-between transition-all duration-300 border-b border-[var(--border-subtle)] ${
          isCollapsed ? 'p-3 flex-col gap-3' : 'p-4 sm:p-5'
        }`}
      >
        <div
          className={`flex items-center gap-3 overflow-hidden ${
            isCollapsed ? 'w-full justify-center' : 'w-auto'
          } transition-all duration-300`}
        >
          <div className="h-8 w-8 relative shrink-0">
            <Image
              src="/logo_adrata.png"
              alt="PKKMB Adrata"
              fill
              sizes="32px"
              className="object-contain drop-shadow-[0_0_10px_rgba(212,175,55,0.3)]"
            />
          </div>
          {!isCollapsed && (
            <div className="whitespace-nowrap">
              <h1 className="text-sm font-bold tracking-tight text-[var(--text-primary)]">
                PKKMB Adrata
              </h1>
              <p className="text-[9px] font-mono text-[var(--accent)] tracking-wider uppercase mt-0.5">
                KABINET DANADYAKSA
              </p>
            </div>
          )}
        </div>

        {/* Perkecil Button at the TOP */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Perbesar Sidebar' : 'Perkecil Sidebar'}
          className="p-1.5 rounded text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-white/5 transition-all outline-none"
          aria-label={isCollapsed ? 'Perbesar Navigation' : 'Perkecil Navigation'}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="h-4 w-4 text-[var(--accent)]" />
          ) : (
            <PanelLeftClose className="h-4 w-4 text-[var(--text-secondary)]" />
          )}
        </button>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expanded[item.href] ?? active;

          return (
            <div key={item.href} className="space-y-1 overflow-hidden">
              {hasChildren ? (
                <button
                  onClick={() => toggleExpand(item.href)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center ${
                    isCollapsed ? 'justify-center px-0' : 'justify-between px-3'
                  } py-2.5 rounded text-xs font-mono tracking-wider transition-all outline-none focus:ring-1 focus:ring-[var(--accent)] ${
                    active
                      ? 'bg-[var(--accent-muted)] text-[var(--accent)] border-l-2 border-[var(--accent)] font-bold'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 shrink-0 text-[var(--accent)]" />
                    {!isCollapsed && <span className="whitespace-nowrap uppercase">{item.label}</span>}
                  </div>
                  {!isCollapsed &&
                    (isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                    ))}
                </button>
              ) : (
                <Link
                  href={item.href}
                  title={isCollapsed ? item.label : undefined}
                  className={`flex items-center ${
                    isCollapsed ? 'justify-center px-0' : 'px-3'
                  } py-2.5 gap-3 rounded text-xs font-mono tracking-wider transition-all outline-none focus:ring-1 focus:ring-[var(--accent)] ${
                    active
                      ? 'bg-[var(--accent-muted)] text-[var(--accent)] border-l-2 border-[var(--accent)] font-bold'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0 text-[var(--accent)]" />
                  {!isCollapsed && <span className="whitespace-nowrap uppercase">{item.label}</span>}
                </Link>
              )}

              {hasChildren && isExpanded && !isCollapsed && (
                <div className="pl-8 space-y-1 mt-1 border-l border-[var(--border-subtle)] ml-4">
                  {item.children!.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className="flex items-center gap-2.5 px-3 py-1.5 rounded text-[11px] font-mono transition-all text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-white/5 whitespace-nowrap"
                    >
                      <child.icon className="h-3.5 w-3.5 shrink-0" />
                      <span>{child.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Tombol Keluar (Logout) at the BOTTOM */}
      <div className="p-3 border-t border-[var(--border-subtle)] mt-auto shrink-0">
        <button
          onClick={logout}
          title="Keluar"
          className={`w-full flex items-center ${
            isCollapsed ? 'justify-center' : 'justify-start px-3'
          } py-2.5 gap-3 rounded text-xs font-mono transition-all text-[var(--semantic-danger)]/80 hover:text-[var(--semantic-danger)] bg-red-500/5 hover:bg-red-500/15 border border-red-500/20 hover:border-red-500/40 cursor-pointer outline-none focus:ring-1 focus:ring-red-500`}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!isCollapsed && <span className="whitespace-nowrap tracking-wider uppercase font-bold">KELUAR</span>}
        </button>
      </div>
    </aside>
  );
}
