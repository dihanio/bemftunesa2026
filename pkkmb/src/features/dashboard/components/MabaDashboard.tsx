"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { apiClient } from '@/shared/api/axios';
import {
  CheckCircle,
  Clock,
  MapPin,
  QrCode,
  FileText,
  Upload,
  Calendar,
  AlertTriangle,
  Award,
  Loader2,
  RefreshCw,
  ExternalLink,
  Sparkles,
  Trophy,
} from 'lucide-react';
import Link from 'next/link';

export function MabaDashboard() {
  const { user: maba } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'presensi' | 'penugasan'>('presensi');
  const [events, setEvents] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);

  const [isFetchingData, setIsFetchingData] = useState(true);
  const [isSubmittingCheckin, setIsSubmittingCheckin] = useState<string | null>(null);
  const [qrTokens, setQrTokens] = useState<Record<string, string>>({});
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Submission modal state
  const [submitModal, setSubmitModal] = useState<{ assignmentId: string; title: string } | null>(null);
  const [submitFileUrl, setSubmitFileUrl] = useState('');
  const [submitNotes, setSubmitNotes] = useState('');
  const [isUploadingSubmission, setIsUploadingSubmission] = useState(false);

  const fetchData = useCallback(async () => {
    if (!maba) return;
    setIsFetchingData(true);
    setFeedbackMsg(null);

    try {
      const [eventsRes, logsRes, assignmentsRes, submissionsRes] = await Promise.all([
        apiClient.get('/pkkmb/attendance/sessions'),
        apiClient.get('/pkkmb/attendance/my-logs'),
        apiClient.get('/pkkmb/tasks'),
        apiClient.get('/pkkmb/tasks/my-submissions'),
      ]);

      setEvents(eventsRes.data?.data || []);
      setLogs(logsRes.data?.data || []);
      setAssignments(assignmentsRes.data?.data || []);
      setSubmissions(submissionsRes.data?.data || []);
    } catch (err) {
      console.error(err);
    }

    setIsFetchingData(false);
  }, [maba]);

  useEffect(() => {
    if (maba) fetchData();
  }, [maba, fetchData]);

  if (!maba) return null;

  const handleCheckin = async (eventId: string, requiresQr: boolean, requiresGps: boolean) => {
    setFeedbackMsg(null);
    setIsSubmittingCheckin(eventId);

    let latitude: number | undefined;
    let longitude: number | undefined;
    const qrToken = qrTokens[eventId] || '';

    if (requiresQr && !qrToken) {
      setFeedbackMsg({ type: 'error', text: 'Token QR Code wajib diisi untuk sesi presensi ini' });
      setIsSubmittingCheckin(null);
      return;
    }

    if (requiresGps) {
      if (!navigator.geolocation) {
        setFeedbackMsg({ type: 'error', text: 'Browser Anda tidak mendukung GPS Geolocation' });
        setIsSubmittingCheckin(null);
        return;
      }

      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 8000,
          });
        });
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      } catch {
        setFeedbackMsg({
          type: 'error',
          text: 'Gagal mengambil lokasi GPS. Pastikan izin lokasi aktif dan sinyal GPS memadai.',
        });
        setIsSubmittingCheckin(null);
        return;
      }
    }

    try {
      const res = await apiClient.post('/pkkmb/attendance/checkin', {
        eventId, qrToken, latitude, longitude
      });
      setIsSubmittingCheckin(null);
      setFeedbackMsg({ type: 'success', text: 'Presensi berhasil dicatat! Status: ' + (res.data?.data?.status === 'present' ? 'Hadir' : 'Terlambat') });
      fetchData();
    } catch (err: any) {
      setIsSubmittingCheckin(null);
      setFeedbackMsg({ type: 'error', text: err.response?.data?.message || 'Presensi gagal dicatat' });
    }
  };

  const handleOpenSubmit = (assignmentId: string, title: string) => {
    const existing = submissions.find((s) => s.assignmentId?._id === assignmentId);
    setSubmitModal({ assignmentId, title });
    setSubmitFileUrl(existing?.fileUrl || '');
    setSubmitNotes(existing?.notes || '');
  };

  const handleCloseSubmit = () => {
    setSubmitModal(null);
    setSubmitFileUrl('');
    setSubmitNotes('');
  };

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitModal) return;
    if (!submitFileUrl) {
      setFeedbackMsg({ type: 'error', text: 'URL Link Tugas wajib diisi' });
      return;
    }

    setIsUploadingSubmission(true);
    try {
      const res = await apiClient.post(`/pkkmb/tasks/${submitModal.assignmentId}/submit`, {
        fileUrl: submitFileUrl, notes: submitNotes
      });
      setIsUploadingSubmission(false);
      handleCloseSubmit();
      setFeedbackMsg({ type: 'success', text: 'Tugas berhasil dikumpulkan!' });
      fetchData();
    } catch (err: any) {
      setIsUploadingSubmission(false);
      handleCloseSubmit();
      setFeedbackMsg({ type: 'error', text: err.response?.data?.message || 'Gagal mengumpulkan tugas' });
    }
  };

  const formatDateTime = (dateStr: string, timeStr?: string) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const d = new Date(dateStr);
    const formattedDate = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    return timeStr ? `${formattedDate} pukul ${timeStr}` : formattedDate;
  };

  const formatDueDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  // Stats
  const attendedCount = logs.length;
  const totalEvents = events.length + logs.filter(l => !events.find(e => e._id === l.eventId?._id)).length;
  const submittedCount = submissions.length;
  const totalAssignments = assignments.length;
  const gradedCount = submissions.filter(s => s.status === 'graded').length;

  // Calculate grading percentage
  const gradedSubmissions = submissions.filter(s => s.status === 'graded');
  const totalScore = gradedSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0);
  const maxPossibleScore = assignments.length > 0 ? assignments.length * 100 : 0;
  const percentage = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;
  const isLulus = percentage >= 70 && gradedCount === assignments.length && assignments.length > 0;

  return (
    <>
      {/* Welcome Banner */}
      <div className="bg-white/5 rounded-xl p-5 sm:p-6 border border-white/10 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 h-full w-40 bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5">
          <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-lg bg-gradient-to-tr from-primary to-blue-500 flex items-center justify-center text-white text-xl sm:text-2xl font-bold border border-primary/20 shrink-0">
            {maba.name ? maba.name.charAt(0).toUpperCase() : 'M'}
          </div>
          <div className="text-center sm:text-left space-y-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-bold truncate">
              Selamat datang, {maba.name?.split(' ')[0]}!
            </h2>
            <div className="text-xs text-foreground/50 font-mono">NIM: {maba.nim}</div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1.5">
              <span className="badge-emerald">{maba.role}</span>
              <span className="badge-amber">Grup: {maba.pkkmbGroupId || 'Belum Masuk Grup'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white/5 rounded-lg p-3 sm:p-4 border border-white/10 text-center">
          <div className="text-xl sm:text-2xl font-bold text-sage">{attendedCount}</div>
          <div className="text-[11px] sm:text-xs text-foreground/40 mt-0.5">Kehadiran</div>
        </div>
        <div className="bg-white/5 rounded-lg p-3 sm:p-4 border border-white/10 text-center">
          <div className="text-xl sm:text-2xl font-bold text-accent-gold">{submittedCount}<span className="text-foreground/30">/{totalAssignments}</span></div>
          <div className="text-[11px] sm:text-xs text-foreground/40 mt-0.5">Tugas Dikumpul</div>
        </div>
        <div className="bg-white/5 rounded-lg p-3 sm:p-4 border border-white/10 text-center">
          <div className="text-xl sm:text-2xl font-bold text-teal-400">{gradedCount}</div>
          <div className="text-[11px] sm:text-xs text-foreground/40 mt-0.5">Tugas Dinilai</div>
        </div>
      </div>

      {/* Graduation Banner */}
      {isLulus && (
        <div className="bg-amber-500/5 rounded-xl p-5 sm:p-6 border border-amber-500/30 mb-6 relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 border border-amber-500/30 shrink-0">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-amber-500">Selamat! Anda LULUS PKKMB</h3>
              <p className="text-xs text-foreground/70 mt-1">
                Anda telah menyelesaikan seluruh tugas dengan nilai total {percentage}% (Skor: {totalScore}/{maxPossibleScore}). Status kelulusan ini akan diteruskan ke Universitas.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Non-graduated active indicator */}
      {!isLulus && assignments.length > 0 && (
        <div className="mb-6 rounded-xl border border-white/10 p-4 flex items-center justify-between bg-foreground/2">
          <div className="text-xs font-semibold text-foreground/60">Progres Nilai Penugasan (Minimal Kelulusan: 70%)</div>
          <div className="text-sm font-bold text-teal-400">{percentage}%</div>
        </div>
      )}

      {/* Feedback Message */}
      {feedbackMsg && (
        <div className={`mb-6 flex items-center gap-3 rounded-xl p-4 text-sm font-medium border animate-fade-in ${
          feedbackMsg.type === 'success'
            ? 'bg-sage/10 text-sage border-sage/20'
            : 'bg-red-500/10 text-red-400 border-red-500/20'
        }`}>
          {feedbackMsg.type === 'success' ? <CheckCircle className="h-5 w-5 shrink-0" /> : <AlertTriangle className="h-5 w-5 shrink-0" />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-white/5 mb-6">
        <button
          onClick={() => setActiveTab('presensi')}
          className={`flex-1 sm:flex-initial py-3 px-5 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'presensi'
              ? 'border-sage text-sage'
              : 'border-transparent text-foreground/35 hover:text-foreground/60'
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>Presensi</span>
        </button>
        <button
          onClick={() => setActiveTab('penugasan')}
          className={`flex-1 sm:flex-initial py-3 px-5 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'penugasan'
              ? 'border-sage text-sage'
              : 'border-transparent text-foreground/35 hover:text-foreground/60'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Penugasan</span>
        </button>
        <button
          onClick={fetchData}
          disabled={isFetchingData}
          className="p-3 text-foreground/35 hover:text-foreground/60 ml-auto shrink-0 transition-all cursor-pointer"
          title="Refresh Data"
        >
          <RefreshCw className={`h-4 w-4 ${isFetchingData ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Content */}
      {isFetchingData ? (
        <div className="w-full py-16 flex flex-col items-center justify-center text-foreground/35">
          <Loader2 className="h-8 w-8 animate-spin text-sage mb-3" />
          <p className="text-sm">Memuat data terbaru...</p>
        </div>
      ) : (
        <div className="space-y-5">

          {/* PRESENSI TAB */}
          {activeTab === 'presensi' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

              {/* Active Sessions */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Sparkles className="h-4.5 w-4.5 text-sage" />
                  <span>Sesi Presensi Aktif</span>
                </h3>

                {events.length === 0 ? (
                  <div className="bg-white/5 rounded-xl p-10 border border-white/5 text-center text-foreground/35 text-sm">
                    <Clock className="h-8 w-8 mx-auto mb-3 text-foreground/20" />
                    Tidak ada sesi presensi aktif saat ini.
                  </div>
                ) : (
                  events.map((event) => {
                    const hasLogged = logs.find((l) => l.eventId?._id === event._id);
                    const requiresQr = !!event.qrCodeToken;
                    const requiresGps = !!(event.coordinates?.latitude && event.coordinates?.longitude);

                    return (
                      <div key={event._id} className="bg-white/5 rounded-lg p-5 border border-white/10 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-sage/15 transition-all">
                        <div className="space-y-2 min-w-0">
                          <div className="text-base font-bold truncate">{event.title}</div>
                          <div className="text-xs text-foreground/50 flex flex-wrap gap-x-4 gap-y-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {formatDateTime(event.date, `${event.startTime} - ${event.endTime}`)}
                            </span>
                            {requiresGps && (
                              <span className="flex items-center gap-1 text-sage">
                                <MapPin className="h-3.5 w-3.5" />
                                Geofence ({event.coordinates.radiusMeter}m)
                              </span>
                            )}
                            {requiresQr && (
                              <span className="flex items-center gap-1 text-accent-gold">
                                <QrCode className="h-3.5 w-3.5" />
                                QR Code
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0 flex flex-col gap-2 min-w-[180px] sm:min-w-[200px]">
                          {hasLogged ? (
                            <div className="flex items-center justify-center gap-2 rounded-xl bg-sage/10 border border-sage/20 py-3 text-sage font-bold text-sm">
                              <CheckCircle className="h-5 w-5" />
                              <span>Sudah Hadir ({hasLogged.status === 'present' ? 'Tepat Waktu' : 'Terlambat'})</span>
                            </div>
                          ) : (
                            <>
                              {requiresQr && (
                                <input
                                  type="text"
                                  placeholder="Masukkan Token QR"
                                  value={qrTokens[event._id] || ''}
                                  onChange={(e) => setQrTokens({ ...qrTokens, [event._id]: e.target.value })}
                                  className="input-field text-xs text-center"
                                />
                              )}
                              <button
                                onClick={() => handleCheckin(event._id, requiresQr, requiresGps)}
                                disabled={isSubmittingCheckin === event._id}
                                className="btn-primary w-full text-sm py-3"
                              >
                                {isSubmittingCheckin === event._id ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    {requiresGps ? 'Memproses Lokasi...' : 'Mengirim...'}
                                  </>
                                ) : (
                                  'Kirim Presensi'
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* History */}
              <div className="space-y-4">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <CheckCircle className="h-4.5 w-4.5 text-sage" />
                  <span>Riwayat Kehadiran</span>
                </h3>

                <div className="bg-white/5 rounded-xl p-5 border border-white/10 space-y-3">
                  {logs.length === 0 ? (
                    <p className="text-sm text-foreground/35 text-center py-4">Belum ada riwayat presensi.</p>
                  ) : (
                    logs.map((log) => (
                      <div key={log._id} className="flex justify-between items-center border-b border-white/5 pb-3 last:border-b-0 last:pb-0">
                        <div className="space-y-0.5 min-w-0">
                          <div className="text-sm font-bold truncate">{log.eventId?.title || 'Sesi Presensi'}</div>
                          <div className="text-xs text-foreground/40">{log.createdAt ? formatDateTime(log.createdAt) : ''}</div>
                        </div>
                        <span className={`shrink-0 ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          log.status === 'present'
                            ? 'bg-sage/10 text-sage border border-sage/20'
                            : log.status === 'late'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {log.status === 'present' ? 'Hadir' : log.status === 'late' ? 'Terlambat' : 'Izin'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

          {/* PENUGASAN TAB */}
          {activeTab === 'penugasan' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-sage" />
                <span>Daftar Penugasan</span>
              </h3>

              {assignments.length === 0 ? (
                <div className="bg-white/5 rounded-xl p-10 border border-white/5 text-center text-foreground/35 text-sm">
                  <FileText className="h-8 w-8 mx-auto mb-3 text-foreground/20" />
                  Tidak ada penugasan aktif saat ini.
                </div>
              ) : (
                assignments.map((assignment) => {
                  const submission = submissions.find((s) => s.assignmentId?._id === assignment._id);
                  const isPastDue = new Date() > new Date(assignment.dueDate);

                  return (
                    <div key={assignment._id} className="bg-white/5 rounded-lg p-5 border border-white/10 relative overflow-hidden space-y-4 hover:border-sage/15 transition-all">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <div className="text-base font-bold">{assignment.title}</div>
                          <p className="text-sm text-foreground/60 whitespace-pre-line leading-relaxed max-w-3xl">
                            {assignment.description}
                          </p>
                        </div>

                        <div className={`flex items-center gap-1.5 text-xs font-semibold rounded-full px-3 py-1 shrink-0 h-fit self-start ${
                          isPastDue
                            ? 'text-foreground/40 bg-white/5 border border-white/10'
                            : 'text-red-400 bg-red-500/10 border border-red-500/20'
                        }`}>
                          <Calendar className="h-3.5 w-3.5" />
                          <span>Batas: {formatDueDate(assignment.dueDate)}</span>
                        </div>
                      </div>

                      {/* Submission status */}
                      <div className="border-t border-white/5 pt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <div className="text-xs text-foreground/35 mb-1">Status Pengumpulan</div>
                          {!submission ? (
                            <span className="badge-red">Belum Mengumpulkan</span>
                          ) : submission.status === 'graded' ? (
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="badge-emerald">Sudah Dinilai</span>
                              <span className="badge-amber inline-flex items-center gap-1">
                                <Award className="h-3.5 w-3.5" />
                                Nilai: {submission.grade}
                              </span>
                            </div>
                          ) : (
                            <span className="badge-amber">Menunggu Penilaian</span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          {submission && (
                            <a
                              href={submission.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1.5 text-xs text-sage hover:text-sage/80 font-semibold bg-sage/5 hover:bg-sage/10 border border-sage/10 py-2.5 px-4 rounded-xl transition-all"
                            >
                              Lihat Tugas
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                          <button
                            onClick={() => handleOpenSubmit(assignment._id, assignment.title)}
                            disabled={isPastDue}
                            className="btn-secondary text-xs py-2.5 px-4"
                          >
                            <Upload className="h-4 w-4" />
                            <span>{submission ? 'Perbarui Pengumpulan' : 'Kumpulkan Tugas'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Grading Feedback */}
                      {submission?.status === 'graded' && submission.feedback && (
                        <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4 mt-2">
                          <div className="text-xs font-bold text-accent-gold mb-1">Catatan Penilai:</div>
                          <p className="text-xs sm:text-sm text-foreground/60 whitespace-pre-line leading-relaxed">
                            {submission.feedback}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

        </div>
      )}

      {/* SUBMIT MODAL */}
      {submitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={handleCloseSubmit}>
          <div className="w-full max-w-lg bg-background rounded-xl border border-white/10 p-6 sm:p-8 space-y-6 shadow-2xl relative animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="space-y-1">
              <h4 className="text-lg sm:text-xl font-bold">Kumpulkan Penugasan</h4>
              <p className="text-xs text-foreground/40">{submitModal.title}</p>
            </div>

            <form onSubmit={handleSubmitAssignment} className="space-y-4">
              <div>
                <label className="field-label">URL Link Penugasan (Google Drive, Cloud, dll.)</label>
                <input
                  type="url"
                  required
                  placeholder="https://drive.google.com/..."
                  value={submitFileUrl}
                  onChange={(e) => setSubmitFileUrl(e.target.value)}
                  className="input-field"
                />
                <p className="mt-1.5 text-[11px] text-foreground/35 leading-normal">
                  Pastikan link yang Anda bagikan bersifat publik (siapa saja yang memiliki link dapat melihat).
                </p>
              </div>

              <div>
                <label className="field-label">Catatan untuk Penilai (Opsional)</label>
                <textarea
                  placeholder="Tulis pesan atau catatan tambahan di sini..."
                  value={submitNotes}
                  onChange={(e) => setSubmitNotes(e.target.value)}
                  rows={4}
                  className="input-field resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={handleCloseSubmit} className="btn-secondary text-xs py-2.5 px-4">
                  Batal
                </button>
                <button type="submit" disabled={isUploadingSubmission} className="btn-primary text-xs py-2.5 px-5">
                  {isUploadingSubmission ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    'Kumpulkan'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
