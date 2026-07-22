"use client";

import React, { useEffect, useState } from 'react';
import { Users, Calendar, CheckSquare, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/shared/api/axios';
import { Skeleton } from '@/components/ui/skeleton';

export function GroupHub({ groupId, userRole }: { groupId: string; userRole: string }) {
  const [sessions, setSessions] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const endpoint = userRole === 'PANITIA' 
          ? '/pkkmb/mentor/attendance/sessions' 
          : '/pkkmb/attendance/sessions';
        
        const res = await apiClient.get(endpoint);
        setSessions(res.data?.data || []);
      } catch (error) {
        console.error("Gagal mengambil data sesi grup:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [userRole]);

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto pb-24 lg:pb-6">
      
      {/* Header Grup */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-tr from-primary to-blue-700 p-6 rounded-3xl text-white">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center">
            <Users className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Grup PKKMB</h1>
            <p className="text-white/80 flex items-center gap-2">
              <Badge variant="outline" className="border-white/40 text-white bg-white/10">ID: {groupId.substring(0,6).toUpperCase()}</Badge>
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
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-sage" />
                Aktivitas Grup
              </CardTitle>
              <CardDescription>
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
                <div className="text-center py-8 text-foreground/50 bg-secondary/30 rounded-xl border border-dashed">
                  Belum ada sesi presensi atau aktivitas.
                </div>
              ) : (
                <div className="space-y-4">
                  {sessions.map((session) => (
                    <div key={session._id} className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl border">
                      <div>
                        <h4 className="font-semibold text-lg">{session.title}</h4>
                        <p className="text-sm text-foreground/60">
                          {new Date(session.date).toLocaleDateString('id-ID', {
                            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                          })}
                        </p>
                      </div>
                      <Badge variant="default" className="bg-sage text-white">Sesi Presensi</Badge>
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
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-teal-600" />
                Pencapaian
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center p-6 text-center bg-secondary/30 rounded-xl border border-dashed">
                <Award className="h-10 w-10 text-amber-500 mb-2" />
                <h3 className="font-bold">Total Poin: --</h3>
                <p className="text-sm text-foreground/60 mt-1">Papan peringkat grup sedang dalam pengembangan.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
