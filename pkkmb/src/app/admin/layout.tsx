"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldAlert, Users, Settings, Database, LogOut } from 'lucide-react';
import Image from 'next/image';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const menu = [
    { href: '/admin', label: 'Dashboard', icon: ShieldAlert },
    { href: '/admin/users', label: 'User Management', icon: Users },
    { href: '/admin/roles', label: 'Roles & Permission', icon: Settings },
    { href: '/admin/audit', label: 'Audit Logs', icon: Database },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Admin Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-white/5 bg-black/40 h-screen sticky top-0 left-0 z-40">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 relative shrink-0">
              <Image src="/logo_adrata.png" alt="Admin" fill className="object-contain" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-red-500">ADMIN PKKMB</h1>
            </div>
          </div>
        </div>

        <div className="flex-1 py-4 px-4 space-y-1">
          {menu.map(item => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active 
                    ? 'bg-red-500/10 text-red-500' 
                    : 'text-foreground/60 hover:text-foreground/90 hover:bg-white/5'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
        
        <div className="p-4 border-t border-white/5">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-foreground/60 hover:text-foreground/90 hover:bg-white/5">
            <LogOut className="h-5 w-5" />
            Kembali ke Dashboard
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen">
        <div className="flex-1 p-6 md:p-10 max-w-[1200px] w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
