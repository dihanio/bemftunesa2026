"use client";

import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Megaphone, Calendar, Info, Clock } from 'lucide-react';
import { apiClient } from '@/shared/api/axios';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';

interface Announcement {
  _id: string;
  title: string;
  content: string;
  isPriority: boolean;
  createdAt: string;
}

interface Schedule {
  _id: string;
  name: string;
  startTime: string;
  endTime: string;
  location?: string;
}

function InformasiContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = searchParams.get('tab') || 'pengumuman';

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [annRes, schedRes] = await Promise.all([
          apiClient.get('/pkkmb/announcements'),
          apiClient.get('/pkkmb/schedules'),
        ]);
        setAnnouncements(annRes.data?.data || []);
        setSchedules(schedRes.data?.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setTab = (newTab: string) => {
    router.push(`/dashboard/informasi?tab=${newTab}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="surface-card p-6 flex items-center gap-4">
        <div className="p-3 bg-[var(--accent-muted)] border border-[var(--accent-glow)] rounded-lg text-[var(--accent)] shrink-0">
          <Info className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-mono font-bold text-[var(--text-primary)] uppercase tracking-wider">
            PUSAT INFORMASI PKKMB
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
            Pengumuman resmi dan jadwal kegiatan Mahasiswa Baru PKKMB Adrata 2026.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--border-subtle)]">
        <button
          onClick={() => setTab('pengumuman')}
          className={`py-3 px-5 text-xs font-mono font-bold flex items-center justify-center gap-2 border-b-2 transition-all uppercase tracking-wider cursor-pointer outline-none ${
            tab === 'pengumuman'
              ? 'border-[var(--accent)] text-[var(--accent)]'
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Megaphone className="h-4 w-4" />
          <span>Pengumuman ({announcements.length})</span>
        </button>
        <button
          onClick={() => setTab('jadwal')}
          className={`py-3 px-5 text-xs font-mono font-bold flex items-center justify-center gap-2 border-b-2 transition-all uppercase tracking-wider cursor-pointer outline-none ${
            tab === 'jadwal'
              ? 'border-[var(--accent)] text-[var(--accent)]'
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>Jadwal Kegiatan ({schedules.length})</span>
        </button>
      </div>

      {/* Tab Content */}
      {isLoading ? (
        <LoadingState message="Memuat informasi terbaru..." />
      ) : tab === 'pengumuman' ? (
        <div className="space-y-4">
          {announcements.length === 0 ? (
            <EmptyState
              icon={Megaphone}
              title="BELUM ADA PENGUMUMAN"
              description="Pengumuman penting PKKMB Adrata 2026 akan ditampilkan di sini."
            />
          ) : (
            announcements.map((ann) => (
              <div key={ann._id} className="surface-card p-5 space-y-2">
                <div className="flex items-center justify-between">
                  {ann.isPriority && (
                    <span className="px-2 py-0.5 text-[9px] font-mono font-bold text-[var(--semantic-warning)] bg-[var(--semantic-warning)]/10 border border-[var(--semantic-warning)]/30 rounded uppercase tracking-wider">
                      PENTING
                    </span>
                  )}
                  <span className="text-[10px] font-mono text-[var(--text-muted)] ml-auto">
                    {new Date(ann.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">{ann.title}</h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
                  {ann.content}
                </p>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {schedules.length === 0 ? (
            <div className="col-span-full">
              <EmptyState
                icon={Calendar}
                title="BELUM ADA JADWAL"
                description="Jadwal rangkaian kegiatan PKKMB akan dipublikasikan secara bertahap."
              />
            </div>
          ) : (
            schedules.map((sched) => (
              <div key={sched._id} className="surface-card p-5 flex gap-4 items-center">
                <div className="flex flex-col items-center justify-center p-3 bg-[var(--accent-muted)] text-[var(--accent)] border border-[var(--accent-glow)] rounded-md min-w-[64px]">
                  <span className="text-xl font-mono font-bold leading-none">
                    {new Date(sched.startTime).getDate()}
                  </span>
                  <span className="text-[10px] uppercase font-mono font-bold mt-1">
                    {new Date(sched.startTime).toLocaleString('id-ID', { month: 'short' })}
                  </span>
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <h4 className="text-xs font-bold text-[var(--text-primary)] truncate">{sched.name}</h4>
                  <div className="text-[10px] font-mono text-[var(--text-muted)] flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-[var(--accent)]" />
                    {new Date(sched.startTime).toLocaleString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    -{' '}
                    {new Date(sched.endTime).toLocaleString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function InformasiPage() {
  return (
    <Suspense fallback={<LoadingState message="Memuat halaman..." />}>
      <InformasiContent />
    </Suspense>
  );
}
