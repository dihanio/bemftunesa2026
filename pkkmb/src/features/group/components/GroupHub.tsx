"use client";

import React, { useEffect, useState } from 'react';
import { Users, Calendar, CheckSquare, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/shared/api/axios';
import { Skeleton } from '@/components/ui/skeleton';

export interface Session {
  _id: string;
  title: string;
  date: string;
}

export function GroupHub({ groupId, userRole }: { groupId: string; userRole: string }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!groupId && userRole !== 'PANITIA') {
        setLoading(false);
        return;
      }

      try {
        const endpoint = userRole === 'PANITIA' 
          ? '/pkkmb/mentor/attendance/sessions' 
          : '/pkkmb/attendance/sessions';
        
        const res = await apiClient.get(endpoint);
        setSessions(res.data?.data || []);
      } catch (error) {
        // Quietly handle unassigned group state
        setSessions([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [groupId, userRole]);

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto pb-24 lg:pb-6">
      {/* Header Grup */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-tr from-[var(--accent)] to-amber-600 p-6 rounded-3xl text-black shadow-lg">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 bg-black/10 rounded-2xl flex items-center justify-center border border-black/10">
            <Users className="h-8 w-8 text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-mono">Grup PKKMB</h1>
            <p className="text-black/80 flex items-center gap-2 font-mono text-xs mt-1">
              <Badge variant="outline" className="border-black/30 text-black bg-black/10 font-bold">
                ID: {groupId ? groupId.substring(0, 6).toUpperCase() : 'MENUNGGU'}
              </Badge>
              {userRole === 'PANITIA' ? 'Anda adalah Mentor' : 'Grup Maba Anda'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Kolom Utama: Activity Feed (Sesi & Penugasan) */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase text-[var(--accent)] font-bold">
                <Calendar className="h-5 w-5 text-[var(--accent)]" />
                Aktivitas Grup
              </CardTitle>
              <CardDescription className="text-xs text-[var(--text-muted)]">
                Daftar sesi dan kegiatan terbaru di grup Anda.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-xl" />
                  ))}
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-8 text-xs font-mono text-[var(--text-muted)] bg-[var(--bg-surface)] rounded-xl border border-dashed border-[var(--border-subtle)]">
                  Belum ada sesi presensi atau aktivitas.
                </div>
              ) : (
                <div className="space-y-4">
                  {sessions.map((session) => (
                    <div key={session._id} className="flex items-center justify-between p-4 bg-[var(--bg-surface-elevated)] rounded-xl border border-[var(--border-subtle)]">
                      <div>
                        <h4 className="font-bold text-sm text-[var(--text-primary)]">{session.title}</h4>
                        <p className="text-xs font-mono text-[var(--text-muted)]">
                          {new Date(session.date).toLocaleDateString('id-ID', {
                            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                          })}
                        </p>
                      </div>
                      <Badge variant="default" className="bg-[var(--accent)] text-black font-mono text-[10px] uppercase font-bold">Sesi Presensi</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Kolom Samping: Info & Papan Peringkat */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase text-[var(--accent)] font-bold">
                <CheckSquare className="h-5 w-5 text-[var(--accent)]" />
                Pencapaian
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center p-6 text-center bg-[var(--bg-surface)] rounded-xl border border-dashed border-[var(--border-subtle)]">
                <Award className="h-10 w-10 text-[var(--accent)] mb-2" />
                <h3 className="font-bold font-mono text-xs text-[var(--text-primary)]">Total Poin: --</h3>
                <p className="text-[11px] font-mono text-[var(--text-muted)] mt-1">Papan peringkat grup sedang disiapkan.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
