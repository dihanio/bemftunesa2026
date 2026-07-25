"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Megaphone, Calendar, AlertTriangle, Check, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { apiClient } from '@/shared/api/axios';

export interface NotificationItem {
  id: string;
  type: 'announcement' | 'schedule' | 'system';
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  link: string;
  priority?: boolean;
}

export function NotificationCenter() {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch announcements & schedules to convert to real notifications
  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      try {
        const [annRes, schedRes] = await Promise.all([
          apiClient.get('/pkkmb/announcements').catch(() => ({ data: { data: [] } })),
          apiClient.get('/pkkmb/schedules').catch(() => ({ data: { data: [] } })),
        ]);

        const items: NotificationItem[] = [];

        // System notification for MABA
        if (user.role === 'MABA') {
          if (!user.studyProgram || !user.avatar || user.avatar === '/pasfoto_default.png') {
            items.push({
              id: 'sys-profile-complete',
              type: 'system',
              title: 'LENGKAPI PRODI & PAS FOTO',
              message: 'Pilih Program Studi dan pas foto 3:4 agar masuk antrean pengacakan kelompok.',
              time: 'Hari ini',
              isRead: false,
              link: '/dashboard',
              priority: true,
            });
          }

          if (user.pkkmbGroup) {
            items.push({
              id: 'sys-group-assigned',
              type: 'system',
              title: 'KELOMPOK PKKMB DITERIMA',
              message: `Anda telah masuk ke dalam ${user.pkkmbGroup.name}.`,
              time: 'Baru saja',
              isRead: false,
              link: '/dashboard',
            });
          }
        }

        // System notification for PANITIA
        if (user.role === 'PANITIA') {
          items.push({
            id: 'sys-panitia-welcome',
            type: 'system',
            title: 'KONSOL PANITIA AKTIF',
            message: 'Selamat bertugas! Kelola presensi, tugas, dan pendampingan Maba binaan Anda.',
            time: 'Hari ini',
            isRead: false,
            link: '/dashboard',
          });
        }

        // Real announcements from API
        const rawAnnouncements = annRes.data?.data || [];
        rawAnnouncements.slice(0, 3).forEach((ann: { _id: string; title: string; content: string; isPriority: boolean; createdAt: string }) => {
          items.push({
            id: `ann-${ann._id}`,
            type: 'announcement',
            title: ann.title,
            message: ann.content,
            time: new Date(ann.createdAt || Date.now()).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
            }),
            isRead: false,
            link: '/dashboard/informasi',
            priority: ann.isPriority,
          });
        });

        // Real schedules from API
        const rawSchedules = schedRes.data?.data || [];
        rawSchedules.slice(0, 2).forEach((sched: { _id: string; name: string; startTime: string }) => {
          items.push({
            id: `sched-${sched._id}`,
            type: 'schedule',
            title: `JADWAL: ${sched.name}`,
            message: `Kegiatan dimulai pada ${new Date(sched.startTime).toLocaleString('id-ID', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}`,
            time: 'Jadwal Terdekat',
            isRead: false,
            link: '/dashboard/informasi?tab=jadwal',
          });
        });

        setNotifications(items);
      } catch (err) {
        console.error('Fetch notifications error:', err);
      }
    };

    fetchNotifications();
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
  };

  const markItemAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isRead: true } : item))
    );
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell Notification Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Pemberitahuan"
        title="Pemberitahuan"
        className={`p-2 rounded text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-white/5 transition-all relative outline-none focus:ring-1 focus:ring-[var(--accent)] cursor-pointer ${
          isOpen ? 'text-[var(--accent)] bg-white/5' : ''
        }`}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-4 w-4 bg-[var(--semantic-danger)] text-white text-[9px] font-mono font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Panel */}
      {isOpen && (
        <div
          data-lenis-prevent="true"
          className="absolute right-0 mt-2 w-80 sm:w-96 bg-[var(--bg-surface-elevated)] border border-[var(--border-emphasis)] rounded-lg shadow-2xl z-50 animate-scale-in overflow-hidden text-[var(--text-primary)] font-mono"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-[var(--accent)]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                PEMBERITAHUAN
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 text-[9px] font-bold bg-[var(--accent-muted)] border border-[var(--accent-glow)] text-[var(--accent)] rounded">
                  {unreadCount} BARU
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[10px] text-[var(--text-muted)] hover:text-[var(--accent)] flex items-center gap-1 uppercase font-bold transition-colors cursor-pointer"
              >
                <Check className="h-3 w-3" /> Tandai Dibaca
              </button>
            )}
          </div>

          {/* List Content */}
          <div className="max-h-80 overflow-y-auto overscroll-contain divide-y divide-[var(--border-subtle)]">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-[var(--text-muted)]">
                Tidak ada pemberitahuan baru saat ini.
              </div>
            ) : (
              notifications.map((item) => (
                <Link
                  key={item.id}
                  href={item.link}
                  onClick={() => {
                    markItemAsRead(item.id);
                    setIsOpen(false);
                  }}
                  className={`flex items-start gap-3 p-3.5 hover:bg-white/5 transition-colors block text-left ${
                    !item.isRead ? 'bg-[var(--accent-muted)]/30' : ''
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {item.type === 'system' ? (
                      <AlertTriangle className="h-4 w-4 text-[var(--semantic-warning)]" />
                    ) : item.type === 'schedule' ? (
                      <Calendar className="h-4 w-4 text-[var(--semantic-info)]" />
                    ) : (
                      <Megaphone className="h-4 w-4 text-[var(--accent)]" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <h4
                        className={`text-xs truncate ${
                          item.priority
                            ? 'font-bold text-[var(--accent)]'
                            : 'font-bold text-[var(--text-primary)]'
                        }`}
                      >
                        {item.title}
                      </h4>
                      <span className="text-[9px] text-[var(--text-muted)] shrink-0 font-normal">
                        {item.time}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                      {item.message}
                    </p>
                  </div>

                  <ChevronRight className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0 self-center" />
                </Link>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] text-center">
            <Link
              href="/dashboard/informasi"
              onClick={() => setIsOpen(false)}
              className="text-[10px] font-bold text-[var(--accent)] hover:underline uppercase tracking-wider inline-flex items-center gap-1"
            >
              <span>Buka Pusat Informasi</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
