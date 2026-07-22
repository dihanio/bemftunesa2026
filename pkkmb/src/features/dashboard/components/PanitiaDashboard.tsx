"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { apiClient } from '@/shared/api/axios';
import {
  Users,
  ClipboardList,
  CalendarPlus,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Award,
  Calendar,
  CheckSquare,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export function PanitiaDashboard() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'presensi' | 'penilaian'>('presensi');
  
  // Data State
  const [sessions, setSessions] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  
  const [isFetching, setIsFetching] = useState(true);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [newSession, setNewSession] = useState({
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    qrCodeToken: '',
  });
  const [isSubmittingSession, setIsSubmittingSession] = useState(false);

  // Grading State
  const [gradingModal, setGradingModal] = useState<any | null>(null);
  const [gradeScore, setGradeScore] = useState<number | ''>('');
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [isGrading, setIsGrading] = useState(false);

  const fetchData = useCallback(async () => {
    setIsFetching(true);
    try {
      // API endpoints for Kakak Pendamping / Pemateri
      const [sessionsRes, tasksRes] = await Promise.all([
        apiClient.get('/pkkmb/mentor/attendance/sessions').catch(() => ({ data: { data: [] } })),
        apiClient.get('/pkkmb/tasks').catch(() => ({ data: { data: [] } })),
      ]);
      setSessions(sessionsRes.data?.data || []);
      setTasks(tasksRes.data?.data || []);
      
      // If we have a group, we might want to fetch submissions for this group specifically
      // but the API `/pkkmb/tasks/my-submissions` is for Maba. 
      // Pemateri grading typically needs all submissions or submissions by task.
      // Wait, there is no GET /pkkmb/pemateri/submissions endpoint in the backend?
      // Actually, we'll just mock submissions array if endpoint doesn't exist or use what we have.
      
    } catch (err) {
      console.error(err);
    }
    setIsFetching(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingSession(true);
    setFeedbackMsg(null);
    try {
      await apiClient.post('/pkkmb/mentor/attendance/sessions', newSession);
      setFeedbackMsg({ type: 'success', text: 'Sesi presensi berhasil dibuat!' });
      setShowCreateSession(false);
      fetchData();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.response?.data?.message || 'Gagal membuat sesi' });
    }
    setIsSubmittingSession(false);
  };

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingModal) return;
    setIsGrading(true);
    setFeedbackMsg(null);
    try {
      await apiClient.patch(`/pkkmb/pemateri/submissions/${gradingModal._id}/grade`, {
        score: Number(gradeScore),
        feedback: gradeFeedback
      });
      setFeedbackMsg({ type: 'success', text: 'Nilai berhasil disimpan!' });
      setGradingModal(null);
      fetchData();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.response?.data?.message || 'Gagal menyimpan nilai' });
    }
    setIsGrading(false);
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-lg bg-gradient-to-tr from-primary to-blue-500 flex items-center justify-center text-white text-2xl font-bold border border-primary/20">
            {user.name ? user.name.charAt(0).toUpperCase() : 'P'}
          </div>
          <div>
            <h2 className="text-xl font-bold">Dashboard Panitia</h2>
            <p className="text-sm text-foreground/60 mt-1">Kelola presensi kelompok dan penilaian tugas.</p>
          </div>
        </div>
      </div>

      {feedbackMsg && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-semibold border ${
          feedbackMsg.type === 'success' ? 'bg-sage/10 text-sage border-sage/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
        }`}>
          {feedbackMsg.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
          {feedbackMsg.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-white/5 mb-6">
        <button
          onClick={() => setActiveTab('presensi')}
          className={`px-5 py-3 text-sm font-bold border-b-2 flex items-center gap-2 ${
            activeTab === 'presensi' ? 'border-sage text-sage' : 'border-transparent text-foreground/40'
          }`}
        >
          <Calendar className="h-4 w-4" />
          Manajemen Presensi
        </button>
        <button
          onClick={() => setActiveTab('penilaian')}
          className={`px-5 py-3 text-sm font-bold border-b-2 flex items-center gap-2 ${
            activeTab === 'penilaian' ? 'border-sage text-sage' : 'border-transparent text-foreground/40'
          }`}
        >
          <CheckSquare className="h-4 w-4" />
          Penilaian Tugas
        </button>
      </div>

      {isFetching ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-sage mb-2" />
          <p className="text-sm text-foreground/50">Memuat data...</p>
        </div>
      ) : (
        <>
          {/* PRESENSI TAB */}
          {activeTab === 'presensi' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold">Sesi Presensi Kelompok</h3>
                  <p className="text-sm text-foreground/50">Kelola kehadiran maba di kelompok Anda.</p>
                </div>
                <button 
                  onClick={() => setShowCreateSession(true)}
                  className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
                >
                  <CalendarPlus className="h-4 w-4" />
                  Buat Sesi Baru
                </button>
              </div>

              {sessions.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-white/10 rounded-xl bg-secondary/30">
                  <p className="text-foreground/50">Belum ada sesi presensi yang dibuat.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sessions.map((s) => (
                    <Card key={s._id} className="bg-white/5 border-white/10 rounded-lg shadow-none">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">{s.title}</CardTitle>
                        <CardDescription>
                          {new Date(s.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2 text-sm text-foreground/60 mb-4">
                          <Badge variant="outline">{s.qrToken ? 'QR Code' : 'Tanpa QR'}</Badge>
                          {s.coordinates && <Badge variant="outline">Geofence</Badge>}
                        </div>
                        <button className="btn-secondary w-full text-xs py-2">
                          Lihat Log Kehadiran (Segera)
                        </button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PENILAIAN TAB */}
          {activeTab === 'penilaian' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold">Penilaian Tugas</h3>
                <p className="text-sm text-foreground/50">Beri nilai pada pengumpulan tugas maba.</p>
              </div>

              <div className="text-center py-12 border border-dashed border-white/10 rounded-xl bg-secondary/30">
                <ClipboardList className="h-10 w-10 text-foreground/20 mx-auto mb-3" />
                <p className="text-foreground/50">Modul penilaian sedang disinkronisasi dengan backend.</p>
                <p className="text-xs text-foreground/40 mt-1">Endpoint untuk mengambil daftar submission panitia belum tersedia di API.</p>
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL: CREATE SESSION */}
      {showCreateSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-background rounded-xl border border-white/10 p-6 space-y-4 shadow-2xl animate-scale-in">
            <h3 className="text-lg font-bold">Buat Sesi Presensi Baru</h3>
            <form onSubmit={handleCreateSession} className="space-y-4">
              <div>
                <label className="field-label">Judul Sesi</label>
                <input required type="text" value={newSession.title} onChange={e => setNewSession({...newSession, title: e.target.value})} className="input-field" placeholder="Cth: Hari 1 - Sesi Pagi" />
              </div>
              <div>
                <label className="field-label">Tanggal</label>
                <input required type="date" value={newSession.date} onChange={e => setNewSession({...newSession, date: e.target.value})} className="input-field" />
              </div>
              <div>
                <label className="field-label">Token QR Code (Opsional)</label>
                <input type="text" value={newSession.qrCodeToken} onChange={e => setNewSession({...newSession, qrCodeToken: e.target.value})} className="input-field" placeholder="Biarkan kosong jika tanpa QR" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateSession(false)} className="btn-secondary w-full py-2">Batal</button>
                <button type="submit" disabled={isSubmittingSession} className="btn-primary w-full py-2">
                  {isSubmittingSession ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
