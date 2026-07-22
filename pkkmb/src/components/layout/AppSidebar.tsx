"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { getNavItems } from './navigation';
import Image from 'next/image';
import { ChevronDown, ChevronRight, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
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

  // Initialize expanded state based on active path
  useEffect(() => {
    const initialExpanded: Record<string, boolean> = {};
    navItems.forEach(item => {
      if (item.children && isActive(item.href)) {
        initialExpanded[item.href] = true;
      }
    });
    setExpanded(prev => ({ ...prev, ...initialExpanded }));
  }, [pathname, navItems]);

  const toggleExpand = (href: string) => {
    if (isCollapsed) setIsCollapsed(false); // Auto expand sidebar if trying to open menu
    setExpanded(prev => ({ ...prev, [href]: !prev[href] }));
  };

  return (
    <aside className={`hidden md:flex flex-col border-r border-white/5 glass-subtle h-screen sticky top-0 left-0 z-40 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className="p-4 sm:p-6 flex items-center justify-between">
        <div className={`flex items-center gap-3 overflow-hidden ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'} transition-all duration-300`}>
          <div className="h-10 w-10 relative shrink-0">
            <Image src="/logo_adrata.png" alt="PKKMB Adrata" fill className="object-contain" />
          </div>
          <div className="whitespace-nowrap">
            <h1 className="text-lg font-extrabold tracking-tight">PKKMB FT</h1>
            <p className="text-[10px] text-foreground/40 leading-none mt-0.5">Universitas Negeri Surabaya</p>
          </div>
        </div>
        
        {/* Only show logo when collapsed */}
        {isCollapsed && (
          <div className="h-10 w-10 relative mx-auto shrink-0 animate-fade-in">
            <Image src="/logo_adrata.png" alt="PKKMB" fill className="object-contain" />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-3 space-y-1">
        <div className={`text-[10px] font-semibold text-foreground/40 mb-3 px-3 uppercase tracking-wider transition-all duration-300 ${isCollapsed ? 'text-center opacity-0 h-0 mb-0' : 'opacity-100'}`}>
          Menu Utama
        </div>
        
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expanded[item.href];

          return (
            <div key={item.href} className="space-y-1">
              {hasChildren ? (
                <button
                  onClick={() => toggleExpand(item.href)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between px-3'} py-3 rounded-xl text-sm font-medium transition-all ${
                    active 
                      ? 'bg-sage/10 text-sage' 
                      : 'text-foreground/60 hover:text-foreground/90 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 shrink-0" />
                    {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
                  </div>
                  {!isCollapsed && (
                    isExpanded ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />
                  )}
                </button>
              ) : (
                <Link
                  href={item.href}
                  title={isCollapsed ? item.label : undefined}
                  className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-3'} py-3 gap-3 rounded-xl text-sm font-medium transition-all ${
                    active 
                      ? 'bg-sage/10 text-sage' 
                      : 'text-foreground/60 hover:text-foreground/90 hover:bg-white/5'
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
                </Link>
              )}

              {hasChildren && isExpanded && !isCollapsed && (
                <div className="pl-9 space-y-1 mt-1">
                  {item.children!.map(child => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all text-foreground/50 hover:text-foreground/90 hover:bg-white/5 whitespace-nowrap"
                    >
                      <child.icon className="h-4 w-4 shrink-0" />
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Collapse Toggle */}
      <div className="p-3 border-t border-white/5">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-start px-4'} py-3 gap-3 rounded-xl text-sm font-medium transition-all text-foreground/40 hover:text-foreground/90 hover:bg-white/5`}
        >
          {isCollapsed ? <PanelLeftOpen className="h-5 w-5 shrink-0" /> : <PanelLeftClose className="h-5 w-5 shrink-0" />}
          {!isCollapsed && <span>Perkecil Sidebar</span>}
        </button>
      </div>
    </aside>
  );
}
