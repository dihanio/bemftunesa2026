"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckSquare,
  Clock,
  MapPin,
  QrCode,
  Search,
  Filter,
  Plus,
  RefreshCw,
  UserCheck,
} from 'lucide-react';
import { usePermission } from '@/features/auth/hooks/usePermission';
import { apiClient } from '@/shared/api/axios';
import { useToast } from '@/components/ui/toast';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';

interface AttendanceSession {
  _id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  targetParticipantType: 'ALL' | 'MABA' | 'PANITIA';
  targetDivision?: string;
  qrCode?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
}

interface AttendanceRecordItem {
  _id: string;
  participant: {
    _id: string;
    name: string;
    nim?: string;
    email: string;
    division?: string;
    position?: string;
    avatar?: string;
  };
  participantType: 'MABA' | 'PANITIA';
  division?: string;
  checkInTime: string;
  status: 'Hadir' | 'Telat' | 'Izin' | 'Sakit' | 'Tidak Hadir';
  attendanceMethod: 'QR_CODE' | 'MANUAL_OPERATOR' | 'SEARCH_NIM';
  session: {
    title: string;
    location: string;
  };
  notes?: string;
}

const PANITIA_DIVISIONS = [
  'Ketua',
  'Wakil Ketua',
  'Sekretaris',
  'Bendahara',
  'Sie Acara',
  'Sie Humas',
  'Sie Pendamping',
  'Sie Penilaian',
  'Sie Dokumentasi',
  'Sie Perlengkapan',
  'Sie Konsumsi',
  'Sie Keamanan',
  'Sie Kestari',
];

export default function AttendancePage() {
  const { hasPermission } = usePermission();
  const toast = useToast();

  const canManageSessions = hasPermission('pkkmb.attendance.session_create') || hasPermission('manage:all');
  const canCheckInOperator = hasPermission('pkkmb.attendance.checkin') || hasPermission('manage:all');
  const canViewMonitoring = hasPermission('pkkmb.monitoring.read') || hasPermission('manage:all');

  const [activeTab, setActiveTab] = useState<'SELF' | 'OPERATOR' | 'MONITORING'>('SELF');

  // State Sessions & History
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [myHistory, setMyHistory] = useState<AttendanceRecordItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Monitoring state
  const [monitoringRecords, setMonitoringRecords] = useState<AttendanceRecordItem[]>([]);
  const [monitoringStats, setMonitoringStats] = useState({
    totalRecords: 0,
    totalHadir: 0,
    terlambat: 0,
    sakitIzin: 0,
    tidakHadir: 0,
  });

  // Monitoring filters
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [filterParticipantType, setFilterParticipantType] = useState<string>('');
  const [filterDivision, setFilterDivision] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Operator check-in modal/form
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [selectedSessionForCheckin, setSelectedSessionForCheckin] = useState<AttendanceSession | null>(null);
  const [checkinInput, setCheckinInput] = useState('');
  const [checkinMethod, setCheckinMethod] = useState<'QR_CODE' | 'MANUAL_OPERATOR' | 'SEARCH_NIM'>('SEARCH_NIM');
  const [checkinStatus, setCheckinStatus] = useState<'Hadir' | 'Telat' | 'Izin' | 'Sakit'>('Hadir');
  const [checkinNotes, setCheckinNotes] = useState('');
  const [isSubmittingCheckin, setIsSubmittingCheckin] = useState(false);

  // New Session Modal
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);
  const [newSessionData, setNewSessionData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    startTime: `${new Date().toISOString().split('T')[0]}T07:00`,
    endTime: `${new Date().toISOString().split('T')[0]}T09:00`,
    location: 'Gedung Dekanat FT UNESA',
    targetParticipantType: 'ALL' as 'ALL' | 'MABA' | 'PANITIA',
    targetDivision: '',
  });

  // Fetch Data
  const fetchSessions = useCallback(async () => {
    try {
      const res = await apiClient.get('/pkkmb/attendance/sessions');
      setSessions(res.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchMyHistory = useCallback(async () => {
    try {
      const res = await apiClient.get('/pkkmb/attendance/my-history');
      setMyHistory(res.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchMonitoringData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedSessionId) params.set('sessionId', selectedSessionId);
      if (filterParticipantType) params.set('participantType', filterParticipantType);
      if (filterDivision) params.set('division', filterDivision);
      if (filterStatus) params.set('status', filterStatus);

      const res = await apiClient.get(`/pkkmb/attendance/monitoring?${params.toString()}`);
      setMonitoringRecords(res.data?.data?.records || []);
      setMonitoringStats(res.data?.data?.statistics || {
        totalRecords: 0,
        totalHadir: 0,
        terlambat: 0,
        sakitIzin: 0,
        tidakHadir: 0,
      });
    } catch (err) {
      console.error(err);
    }
  }, [selectedSessionId, filterParticipantType, filterDivision, filterStatus]);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await Promise.all([fetchSessions(), fetchMyHistory()]);
      setIsLoading(false);
    };
    init();
  }, [fetchSessions, fetchMyHistory]);

  useEffect(() => {
    if (activeTab === 'MONITORING') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchMonitoringData();
    }
  }, [activeTab, fetchMonitoringData]);

  // Handle Self Check-in
  const handleSelfCheckin = async (session: AttendanceSession) => {
    try {
      await apiClient.post('/pkkmb/attendance/checkin', {
        sessionId: session._id,
        method: 'QR_CODE',
        qrToken: session.qrCode,
      });
      toast.success('Presensi Anda berhasil dicatat!', 'BERHASIL');
      fetchMyHistory();
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { message?: string } } };
      toast.error(errorResponse.response?.data?.message || 'Gagal melakukan presensi', 'GAGAL');
    }
  };

  // Handle Operator Check-in Submit
  const handleOperatorCheckinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSessionForCheckin) {
      toast.error('Pilih sesi presensi terlebih dahulu', 'ERROR');
      return;
    }
    if (!checkinInput.trim()) {
      toast.error('Masukkan NIM, ID, atau Kode QR', 'ERROR');
      return;
    }

    setIsSubmittingCheckin(true);
    try {
      await apiClient.post('/pkkmb/attendance/checkin', {
        sessionId: selectedSessionForCheckin._id,
        nim: checkinInput.trim(),
        method: checkinMethod,
        status: checkinStatus,
        notes: checkinNotes,
      });
      toast.success(`Presensi ${checkinInput} berhasil dicatat!`, 'CHECK-IN SUKSES');
      setCheckinInput('');
      setCheckinNotes('');
      setIsCheckInModalOpen(false);
      if (activeTab === 'MONITORING') fetchMonitoringData();
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { message?: string } } };
      toast.error(errorResponse.response?.data?.message || 'Gagal melakukan check-in', 'GAGAL');
    } finally {
      setIsSubmittingCheckin(false);
    }
  };

  // Handle Create Session Submit
  const handleCreateSessionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/pkkmb/attendance/sessions', newSessionData);
      toast.success('Sesi presensi universal berhasil dibuka!', 'BERHASIL');
      setIsNewSessionModalOpen(false);
      fetchSessions();
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { message?: string } } };
      toast.error(errorResponse.response?.data?.message || 'Gagal membuat sesi presensi', 'GAGAL');
    }
  };

  // Filter records in memory for quick search
  const filteredMonitoringRecords = monitoringRecords.filter((rec) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      rec.participant?.name?.toLowerCase().includes(q) ||
      rec.participant?.nim?.toLowerCase().includes(q) ||
      rec.participant?.email?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title & Navigation Tabs Header */}
      <div className="surface-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-[var(--accent-muted)] border border-[var(--accent-glow)] rounded-lg text-[var(--accent)] shrink-0">
            <CheckSquare className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-mono font-bold text-[var(--text-primary)] uppercase tracking-wider">
              UNIVERSAL ATTENDANCE (PRESENSI PKKMB FT 2026)
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
              Satu portal universal presensi kehadiran untuk Mahasiswa Baru dan Seluruh Divisi Panitia.
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 bg-black/40 p-1 border border-[var(--border-subtle)] rounded-lg text-xs font-mono">
          <button
            type="button"
            onClick={() => setActiveTab('SELF')}
            className={`px-3 py-1.5 rounded font-bold transition-all cursor-pointer ${
              activeTab === 'SELF'
                ? 'bg-[var(--accent)] text-black shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Presensi Saya
          </button>
          {canCheckInOperator && (
            <button
              type="button"
              onClick={() => setActiveTab('OPERATOR')}
              className={`px-3 py-1.5 rounded font-bold transition-all cursor-pointer ${
                activeTab === 'OPERATOR'
                  ? 'bg-[var(--accent)] text-black shadow-md'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Operator Check-in
            </button>
          )}
          {canViewMonitoring && (
            <button
              type="button"
              onClick={() => setActiveTab('MONITORING')}
              className={`px-3 py-1.5 rounded font-bold transition-all cursor-pointer ${
                activeTab === 'MONITORING'
                  ? 'bg-[var(--accent)] text-black shadow-md'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Live Monitoring
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <LoadingState message="Memuat modul presensi universal..." />
      ) : (
        <>
          {/* TAB 1: PRESENSI SAYA (MABA & PANITIA) */}
          {activeTab === 'SELF' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-mono font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[var(--accent)]" /> SESI PRESENSI AKTIF HARI INI
                </h2>
                {canManageSessions && (
                  <button
                    type="button"
                    onClick={() => setIsNewSessionModalOpen(true)}
                    className="btn-accent px-3 py-1.5 text-xs font-mono uppercase tracking-wider flex items-center gap-1.5"
                  >
                    <Plus className="h-4 w-4" /> Buka Sesi Presensi Baru
                  </button>
                )}
              </div>

              {sessions.length === 0 ? (
                <EmptyState
                  icon={CheckSquare}
                  title="BELUM ADA SESI PRESENSI AKTIF"
                  description="Sesi presensi universal akan dibuka sesuai jadwal kegiatan PKKMB FT."
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sessions.map((session) => (
                    <div
                      key={session._id}
                      className="surface-card p-5 space-y-4 border border-[var(--border-subtle)] hover:border-[var(--accent)] transition-all rounded-xl"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 text-[9px] font-mono font-bold text-[var(--semantic-success)] bg-[var(--semantic-success)]/10 border border-[var(--semantic-success)]/30 rounded uppercase tracking-wider">
                          TARGET: {session.targetParticipantType} {session.targetDivision ? `(${session.targetDivision})` : ''}
                        </span>
                        <span className="text-[10px] font-mono text-[var(--text-muted)] flex items-center gap-1">
                          <Clock className="h-3 w-3 text-[var(--accent)]" />
                          {new Date(session.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} - {new Date(session.endTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-[var(--text-primary)]">{session.title}</h3>
                        <p className="text-xs font-mono text-[var(--text-muted)] flex items-center gap-1 mt-1">
                          <MapPin className="h-3.5 w-3.5 text-[var(--accent)]" /> {session.location}
                        </p>
                      </div>

                      <div className="pt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSelfCheckin(session)}
                          className="btn-accent px-4 py-2 font-mono text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer w-full justify-center"
                        >
                          <QrCode className="h-4 w-4" />
                          <span>Check-in Sekarang</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Self History Table */}
              <div className="surface-card p-5 space-y-4 rounded-xl border border-[var(--border-subtle)]">
                <h3 className="text-xs font-mono font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-[var(--accent)]" /> RIWAYAT KEHADIRAN SAYA
                </h3>
                {myHistory.length === 0 ? (
                  <p className="text-xs font-mono text-[var(--text-muted)] py-4 text-center">
                    Belum ada catatan presensi yang tersimpan.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[var(--bg-surface-elevated)] text-[10px] font-mono text-[var(--accent)] uppercase">
                          <th className="py-2.5 px-3">SESI PRESENSI</th>
                          <th className="py-2.5 px-3">WAKTU CHECK-IN</th>
                          <th className="py-2.5 px-3">METODE</th>
                          <th className="py-2.5 px-3 text-right">STATUS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-subtle)] text-xs font-mono">
                        {myHistory.map((h) => (
                          <tr key={h._id}>
                            <td className="py-3 px-3 font-bold">{h.session?.title || 'Sesi PKKMB'}</td>
                            <td className="py-3 px-3 text-[11px] text-[var(--text-muted)]">
                              {new Date(h.checkInTime).toLocaleString('id-ID')}
                            </td>
                            <td className="py-3 px-3 text-[10px] uppercase">{h.attendanceMethod}</td>
                            <td className="py-3 px-3 text-right">
                              <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase ${
                                h.status === 'Hadir'
                                  ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                                  : h.status === 'Telat'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                  : 'bg-red-500/10 text-red-400 border border-red-500/30'
                              }`}>
                                {h.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: OPERATOR CHECK-IN CONSOLE */}
          {activeTab === 'OPERATOR' && canCheckInOperator && (
            <div className="space-y-6">
              <div className="surface-card p-6 border border-[var(--border-subtle)] rounded-xl space-y-4">
                <h2 className="text-sm font-mono font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-[var(--accent)]" /> OPERATOR QUICK CHECK-IN CONSOLE
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {sessions.map((s) => (
                    <div
                      key={s._id}
                      onClick={() => {
                        setSelectedSessionForCheckin(s);
                        setIsCheckInModalOpen(true);
                      }}
                      className="p-4 bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] hover:border-[var(--accent)] rounded-lg cursor-pointer transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="px-2 py-0.5 bg-[var(--accent-muted)] text-[var(--accent)] font-bold rounded">
                          {s.targetParticipantType}
                        </span>
                        <span className="text-[var(--text-muted)]">
                          {new Date(s.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-[var(--text-primary)]">{s.title}</h4>
                      <p className="text-[11px] text-[var(--text-muted)]">{s.location}</p>
                      <button type="button" className="btn-accent text-[10px] py-1 px-3 uppercase w-full">
                        Proses Check-in Operator
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LIVE MONITORING DASHBOARD & LAPORAN */}
          {activeTab === 'MONITORING' && canViewMonitoring && (
            <div className="space-y-6">
              {/* Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="surface-card p-4 text-center border-l-4 border-l-[var(--accent)] rounded-xl">
                  <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase">TOTAL LOG</div>
                  <div className="text-xl font-mono font-bold text-[var(--text-primary)]">{monitoringStats.totalRecords}</div>
                </div>
                <div className="surface-card p-4 text-center border-l-4 border-l-[var(--semantic-success)] rounded-xl">
                  <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase">TOTAL HADIR</div>
                  <div className="text-xl font-mono font-bold text-green-400">{monitoringStats.totalHadir}</div>
                </div>
                <div className="surface-card p-4 text-center border-l-4 border-l-amber-500 rounded-xl">
                  <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase">TERLAMBAT</div>
                  <div className="text-xl font-mono font-bold text-amber-400">{monitoringStats.terlambat}</div>
                </div>
                <div className="surface-card p-4 text-center border-l-4 border-l-blue-500 rounded-xl">
                  <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase">IZIN / SAKIT</div>
                  <div className="text-xl font-mono font-bold text-blue-400">{monitoringStats.sakitIzin}</div>
                </div>
                <div className="surface-card p-4 text-center border-l-4 border-l-[var(--semantic-danger)] rounded-xl">
                  <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase">TIDAK HADIR</div>
                  <div className="text-xl font-mono font-bold text-red-400">{monitoringStats.tidakHadir}</div>
                </div>
              </div>

              {/* Filters Bar */}
              <div className="surface-card p-4 border border-[var(--border-subtle)] rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[var(--accent)] uppercase flex items-center gap-1.5">
                    <Filter className="h-3.5 w-3.5" /> FILTER DASHBOARD MONITORING
                  </span>
                  <button
                    type="button"
                    onClick={fetchMonitoringData}
                    className="text-[10px] font-mono text-[var(--text-muted)] hover:text-[var(--accent)] flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="h-3 w-3" /> Refresh Live Data
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-mono">
                  {/* Session Filter */}
                  <div>
                    <label className="block text-[10px] text-[var(--text-muted)] uppercase mb-1">Pilih Sesi:</label>
                    <select
                      value={selectedSessionId}
                      onChange={(e) => setSelectedSessionId(e.target.value)}
                      className="w-full p-2 bg-black/40 border border-[var(--border-subtle)] text-[var(--text-primary)] rounded focus:border-[var(--accent)]"
                    >
                      <option value="">-- Semua Sesi --</option>
                      {sessions.map((s) => (
                        <option key={s._id} value={s._id}>{s.title}</option>
                      ))}
                    </select>
                  </div>

                  {/* Participant Type Filter */}
                  <div>
                    <label className="block text-[10px] text-[var(--text-muted)] uppercase mb-1">Jenis Peserta:</label>
                    <select
                      value={filterParticipantType}
                      onChange={(e) => setFilterParticipantType(e.target.value)}
                      className="w-full p-2 bg-black/40 border border-[var(--border-subtle)] text-[var(--text-primary)] rounded focus:border-[var(--accent)]"
                    >
                      <option value="">-- MABA & Panitia --</option>
                      <option value="MABA">Mahasiswa Baru (MABA)</option>
                      <option value="PANITIA">Panitia PKKMB</option>
                    </select>
                  </div>

                  {/* Panitia Division Filter */}
                  <div>
                    <label className="block text-[10px] text-[var(--text-muted)] uppercase mb-1">Divisi Panitia (Sie):</label>
                    <select
                      value={filterDivision}
                      onChange={(e) => setFilterDivision(e.target.value)}
                      className="w-full p-2 bg-black/40 border border-[var(--border-subtle)] text-[var(--text-primary)] rounded focus:border-[var(--accent)]"
                    >
                      <option value="">-- Semua Divisi Panitia --</option>
                      {PANITIA_DIVISIONS.map((div) => (
                        <option key={div} value={div}>{div}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="block text-[10px] text-[var(--text-muted)] uppercase mb-1">Status Kehadiran:</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full p-2 bg-black/40 border border-[var(--border-subtle)] text-[var(--text-primary)] rounded focus:border-[var(--accent)]"
                    >
                      <option value="">-- Semua Status --</option>
                      <option value="Hadir">Hadir</option>
                      <option value="Telat">Telat</option>
                      <option value="Izin">Izin</option>
                      <option value="Sakit">Sakit</option>
                      <option value="Tidak Hadir">Tidak Hadir</option>
                    </select>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative pt-1">
                  <Search className="absolute left-3 top-4 h-4 w-4 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari Nama, NIM, NIP, atau Email peserta..."
                    className="w-full pl-9 pr-3 py-2 bg-black/40 border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs font-mono rounded focus:border-[var(--accent)]"
                  />
                </div>
              </div>

              {/* Records Table */}
              <div className="surface-card overflow-hidden border border-[var(--border-subtle)] rounded-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[var(--bg-surface-elevated)] border-b border-[var(--border-subtle)] text-[10px] font-mono text-[var(--accent)] uppercase">
                        <th className="py-3 px-4">PESERTA</th>
                        <th className="py-3 px-4">JENIS & DIVISI</th>
                        <th className="py-3 px-4">SESI PRESENSI</th>
                        <th className="py-3 px-4">WAKTU & METODE</th>
                        <th className="py-3 px-4 text-right">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)] text-xs font-mono text-[var(--text-primary)]">
                      {filteredMonitoringRecords.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-[var(--text-muted)]">
                            Tidak ada data presensi yang sesuai dengan filter.
                          </td>
                        </tr>
                      ) : (
                        filteredMonitoringRecords.map((rec) => (
                          <tr key={rec._id} className="hover:bg-white/[0.02]">
                            <td className="py-3 px-4">
                              <div className="font-bold text-[var(--text-primary)]">{rec.participant?.name || 'Peserta'}</div>
                              <div className="text-[10px] text-[var(--text-muted)]">
                                {rec.participant?.nim ? `NIM: ${rec.participant.nim}` : rec.participant?.email}
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase ${
                                rec.participantType === 'MABA'
                                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                                  : 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                              }`}>
                                {rec.participantType}
                              </span>
                              {rec.division && (
                                <div className="text-[10px] text-[var(--accent)] font-bold mt-0.5">
                                  {rec.division}
                                </div>
                              )}
                            </td>

                            <td className="py-3 px-4 text-[11px]">
                              {rec.session?.title || 'Sesi Presensi'}
                            </td>

                            <td className="py-3 px-4 text-[10px] text-[var(--text-muted)]">
                              <div>{new Date(rec.checkInTime).toLocaleTimeString('id-ID')}</div>
                              <div className="text-[9px] text-[var(--accent)]">{rec.attendanceMethod}</div>
                            </td>

                            <td className="py-3 px-4 text-right">
                              <span className={`px-2.5 py-1 text-[10px] font-bold rounded uppercase ${
                                rec.status === 'Hadir'
                                  ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                                  : rec.status === 'Telat'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                  : 'bg-red-500/10 text-red-400 border border-red-500/30'
                              }`}>
                                {rec.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL 1: OPERATOR CHECK-IN */}
      <Dialog
        isOpen={isCheckInModalOpen}
        onClose={() => setIsCheckInModalOpen(false)}
        title={`OPERATOR CHECK-IN: ${selectedSessionForCheckin?.title || ''}`}
        description="Pencarian NIM / NIP / Email atau Scan Kode QR Peserta"
      >
        <form onSubmit={handleOperatorCheckinSubmit} className="space-y-4 font-mono text-xs">
          <div>
            <label className="block text-[10px] text-[var(--text-muted)] uppercase mb-1">Metode Opsi Check-in:</label>
            <div className="grid grid-cols-3 gap-2">
              {(['SEARCH_NIM', 'QR_CODE', 'MANUAL_OPERATOR'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setCheckinMethod(m)}
                  className={`py-1.5 text-[10px] font-bold uppercase rounded border ${
                    checkinMethod === m
                      ? 'bg-[var(--accent)] text-black border-[var(--accent)]'
                      : 'bg-black/30 border-[var(--border-subtle)] text-[var(--text-secondary)]'
                  }`}
                >
                  {m.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-[var(--text-muted)] uppercase mb-1">
              {checkinMethod === 'SEARCH_NIM' ? 'NIM / NIP / Email Peserta:' : 'Hasil Scan QR Payload:'}
            </label>
            <input
              type="text"
              required
              value={checkinInput}
              onChange={(e) => setCheckinInput(e.target.value)}
              placeholder="Contoh: 26050974001 / maba.demo@mhs.unesa.ac.id"
              className="w-full p-2.5 bg-black/40 border border-[var(--border-subtle)] text-[var(--text-primary)] rounded focus:border-[var(--accent)]"
            />
          </div>

          <div>
            <label className="block text-[10px] text-[var(--text-muted)] uppercase mb-1">Status Kehadiran:</label>
            <select
              value={checkinStatus}
              onChange={(e) => setCheckinStatus(e.target.value as 'Hadir' | 'Telat' | 'Izin' | 'Sakit')}
              className="w-full p-2.5 bg-black/40 border border-[var(--border-subtle)] text-[var(--text-primary)] rounded focus:border-[var(--accent)]"
            >
              <option value="Hadir">Hadir</option>
              <option value="Telat">Telat</option>
              <option value="Izin">Izin</option>
              <option value="Sakit">Sakit</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-[var(--text-muted)] uppercase mb-1">Catatan Operator (Opsional):</label>
            <input
              type="text"
              value={checkinNotes}
              onChange={(e) => setCheckinNotes(e.target.value)}
              placeholder="Keterangan tambahan..."
              className="w-full p-2.5 bg-black/40 border border-[var(--border-subtle)] text-[var(--text-primary)] rounded focus:border-[var(--accent)]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={() => setIsCheckInModalOpen(false)}
              className="px-4 py-2 border border-[var(--border-subtle)] text-[var(--text-secondary)] rounded uppercase"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmittingCheckin}
              className="btn-accent px-4 py-2 uppercase font-bold"
            >
              {isSubmittingCheckin ? 'Menyimpan...' : 'Simpan Presensi'}
            </button>
          </div>
        </form>
      </Dialog>

      {/* MODAL 2: BUKA SESI PRESENSI UNIVERSAL BARU */}
      <Dialog
        isOpen={isNewSessionModalOpen}
        onClose={() => setIsNewSessionModalOpen(false)}
        title="BUKA SESI PRESENSI UNIVERSAL BARU"
        description="Sesi presensi dapat ditargetkan untuk MABA, Panitia, atau Seluruh Pengguna PKKMB."
      >
        <form onSubmit={handleCreateSessionSubmit} className="space-y-4 font-mono text-xs">
          <div>
            <label className="block text-[10px] text-[var(--text-muted)] uppercase mb-1">Judul Sesi Presensi:</label>
            <input
              type="text"
              required
              value={newSessionData.title}
              onChange={(e) => setNewSessionData({ ...newSessionData, title: e.target.value })}
              placeholder="Contoh: Hari 1 - Opening Ceremony & Presensi Pagi"
              className="w-full p-2.5 bg-black/40 border border-[var(--border-subtle)] text-[var(--text-primary)] rounded focus:border-[var(--accent)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-[var(--text-muted)] uppercase mb-1">Tanggal Sesi:</label>
              <input
                type="date"
                required
                value={newSessionData.date}
                onChange={(e) => setNewSessionData({ ...newSessionData, date: e.target.value })}
                className="w-full p-2.5 bg-black/40 border border-[var(--border-subtle)] text-[var(--text-primary)] rounded focus:border-[var(--accent)]"
              />
            </div>
            <div>
              <label className="block text-[10px] text-[var(--text-muted)] uppercase mb-1">Lokasi Kegiatan:</label>
              <input
                type="text"
                required
                value={newSessionData.location}
                onChange={(e) => setNewSessionData({ ...newSessionData, location: e.target.value })}
                placeholder="Gedung Dekanat FT UNESA"
                className="w-full p-2.5 bg-black/40 border border-[var(--border-subtle)] text-[var(--text-primary)] rounded focus:border-[var(--accent)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-[var(--text-muted)] uppercase mb-1">Jam Mulai Sesi:</label>
              <input
                type="datetime-local"
                required
                value={newSessionData.startTime}
                onChange={(e) => setNewSessionData({ ...newSessionData, startTime: e.target.value })}
                className="w-full p-2.5 bg-black/40 border border-[var(--border-subtle)] text-[var(--text-primary)] rounded focus:border-[var(--accent)]"
              />
            </div>
            <div>
              <label className="block text-[10px] text-[var(--text-muted)] uppercase mb-1">Jam Selesai Sesi:</label>
              <input
                type="datetime-local"
                required
                value={newSessionData.endTime}
                onChange={(e) => setNewSessionData({ ...newSessionData, endTime: e.target.value })}
                className="w-full p-2.5 bg-black/40 border border-[var(--border-subtle)] text-[var(--text-primary)] rounded focus:border-[var(--accent)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-[var(--text-muted)] uppercase mb-1">Target Peserta:</label>
              <select
                value={newSessionData.targetParticipantType}
                onChange={(e) => setNewSessionData({ ...newSessionData, targetParticipantType: e.target.value as 'ALL' | 'MABA' | 'PANITIA' })}
                className="w-full p-2.5 bg-black/40 border border-[var(--border-subtle)] text-[var(--text-primary)] rounded focus:border-[var(--accent)]"
              >
                <option value="ALL">Semua (MABA & Panitia)</option>
                <option value="MABA">Khusus MABA</option>
                <option value="PANITIA">Khusus Panitia</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-[var(--text-muted)] uppercase mb-1">Target Divisi (Opsional):</label>
              <select
                value={newSessionData.targetDivision}
                onChange={(e) => setNewSessionData({ ...newSessionData, targetDivision: e.target.value })}
                className="w-full p-2.5 bg-black/40 border border-[var(--border-subtle)] text-[var(--text-primary)] rounded focus:border-[var(--accent)]"
              >
                <option value="">Semua Divisi Panitia</option>
                {PANITIA_DIVISIONS.map((div) => (
                  <option key={div} value={div}>{div}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={() => setIsNewSessionModalOpen(false)}
              className="px-4 py-2 border border-[var(--border-subtle)] text-[var(--text-secondary)] rounded uppercase"
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn-accent px-4 py-2 uppercase font-bold"
            >
              Buka Sesi Presensi
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
