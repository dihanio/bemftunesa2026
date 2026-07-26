"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Shuffle,
  Search,
  BookOpen,
  RefreshCw,
  Layers,
  ChevronRight,
} from 'lucide-react';

import { usePermission } from '@/features/auth/hooks/usePermission';
import { apiClient } from '@/shared/api/axios';
import { useToast } from '@/components/ui/toast';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';

interface GugusItem {
  _id: string;
  nomor: number;
  name: string;
  kapasitas: number;
  totalAnggota: number;
  status: 'ACTIVE' | 'INACTIVE';
  pendampingId?: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    division?: string;
    position?: string;
    avatar?: string;
  };
}

interface GugusDetailData {
  gugus: GugusItem;
  totalAnggota: number;
  distribusiGender: {
    maleCount: number;
    femaleCount: number;
    malePercentage: number;
    femalePercentage: number;
  };
  distribusiProdi: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
  distribusiRumpun: Array<{
    name: string;
    color: string;
    count: number;
    percentage: number;
  }>;
  members: Array<{
    _id: string;
    name: string;
    nim?: string;
    email: string;
    studyProgram?: string;
    gender?: 'L' | 'P';
    studyProgramId?: {
      name: string;
      code: string;
      rumpun?: {
        name: string;
        color: string;
      };
    };
  }>;
}

export default function GugusPage() {
  const { hasPermission } = usePermission();
  const toast = useToast();

  const canAutoDistribute = hasPermission('pkkmb.group.create') || hasPermission('manage:all');

  const [gugusList, setGugusList] = useState<GugusItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Detail Modal
  const [selectedGugusId, setSelectedGugusId] = useState<string | null>(null);
  const [gugusDetail, setGugusDetail] = useState<GugusDetailData | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Auto distribute loading
  const [isDistributing, setIsDistributing] = useState(false);

  const fetchGugusList = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/pkkmb/gugus');
      setGugusList(res.data?.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengambil data Gugus PKKMB.', 'ERROR');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchGugusList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchGugusList]);

  // Fetch Gugus Detail
  const handleViewDetail = async (gugusId: string) => {
    setSelectedGugusId(gugusId);
    setIsLoadingDetail(true);
    try {
      const res = await apiClient.get(`/pkkmb/gugus/${gugusId}`);
      setGugusDetail(res.data?.data || null);
    } catch (err) {
      console.error(err);
      toast.error('Gagal memuat detail Gugus.', 'ERROR');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Run Auto Distribution Algorithm
  const handleRunAutoDistribute = async () => {
    if (!confirm('Apakah Anda yakin ingin mendistribusikan Mahasiswa Baru yang belum memiliki Gugus secara otomatis ke 50 Gugus PKKMB (Cross-Major Round-Robin)?')) {
      return;
    }

    setIsDistributing(true);
    try {
      const res = await apiClient.post('/pkkmb/gugus/auto-distribute');
      toast.success(res.data?.message || 'Pembagian Gugus otomatis berhasil dijalankan!', 'PEMBAGIAN GUGUS SUKSES');
      fetchGugusList();
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { message?: string } } };
      toast.error(errorResponse.response?.data?.message || 'Gagal menjalankan pembagian Gugus otomatis.', 'GAGAL');
    } finally {
      setIsDistributing(false);
    }
  };

  // Filtered Gugus
  const filteredGugus = gugusList.filter((g) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      g.name.toLowerCase().includes(q) ||
      g.nomor.toString().includes(q) ||
      g.pendampingId?.name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title & Action Header */}
      <div className="surface-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-[var(--accent-muted)] border border-[var(--accent-glow)] rounded-lg text-[var(--accent)] shrink-0">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-[9px] font-mono font-bold text-[var(--accent)] bg-[var(--accent-muted)] border border-[var(--accent-glow)] rounded uppercase tracking-wider">
                50 GUGUS FAKULTAS TEKNIK
              </span>
            </div>
            <h1 className="text-lg font-mono font-bold text-[var(--text-primary)] uppercase tracking-wider mt-1">
              PEMBAGIAN GUGUS PKKMB FT UNESA 2026
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
              Distribusi mahasiswa baru lintas Program Studi untuk menjamin pembagian Gugus yang seimbang.
            </p>
          </div>
        </div>

        {/* Toolbar Button */}
        {canAutoDistribute && (
          <button
            type="button"
            disabled={isDistributing}
            onClick={handleRunAutoDistribute}
            className="btn-accent px-4 py-2.5 font-mono text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg hover:scale-105 transition-all shrink-0"
          >
            <Shuffle className="h-4 w-4" />
            <span>{isDistributing ? 'Membagi Gugus...' : 'Auto-Distribusi Lintas Prodi (Round-Robin)'}</span>
          </button>
        )}
      </div>

      {/* Search & Counter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari Gugus 01 - 50 atau Pendamping..."
            className="w-full pl-9 pr-3 py-2 bg-black/40 border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs font-mono rounded focus:border-[var(--accent)]"
          />
        </div>
        <div className="text-xs font-mono text-[var(--text-secondary)] flex items-center gap-3">
          <span>Total Gugus Terdaftar: <strong className="text-[var(--accent)]">{gugusList.length}</strong></span>
          <button
            type="button"
            onClick={fetchGugusList}
            className="p-1.5 bg-white/5 border border-[var(--border-subtle)] hover:border-[var(--accent)] text-[var(--accent)] rounded cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Gugus 50 Grid */}
      {isLoading ? (
        <LoadingState message="Memuat 50 Gugus PKKMB FT UNESA..." />
      ) : filteredGugus.length === 0 ? (
        <EmptyState
          icon={Users}
          title="TIDAK ADA GUGUS DITEMUKAN"
          description="Data Gugus belum dibuat atau tidak sesuai dengan kata kunci pencarian."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredGugus.map((g) => (
            <div
              key={g._id}
              onClick={() => handleViewDetail(g._id)}
              className="surface-card p-4 space-y-3 border border-[var(--border-subtle)] hover:border-[var(--accent)] rounded-xl cursor-pointer transition-all hover:-translate-y-0.5 group"
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold text-[var(--accent)] bg-[var(--accent-muted)] border border-[var(--accent-glow)] rounded uppercase">
                  GUGUS {g.nomor < 10 ? `0${g.nomor}` : g.nomor}
                </span>
                <span className="text-[10px] font-mono text-[var(--text-muted)]">
                  {g.totalAnggota} / {g.kapasitas} MABA
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                  {g.name}
                </h3>
                <p className="text-[11px] font-mono text-[var(--text-muted)] mt-1 truncate">
                  Pendamping: <strong className="text-[var(--text-primary)]">{g.pendampingId?.name || 'Sie Pendamping'}</strong>
                </p>
              </div>

              {/* Progress bar of capacity */}
              <div className="space-y-1">
                <div className="w-full bg-black/50 h-1.5 rounded-full overflow-hidden border border-[var(--border-subtle)]">
                  <div
                    className="bg-[var(--accent)] h-full transition-all"
                    style={{ width: `${Math.min(100, Math.round((g.totalAnggota / g.kapasitas) * 100))}%` }}
                  />
                </div>
              </div>

              <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-[var(--accent)]">
                <span>Lihat Statistik & Anggota</span>
                <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* INSPECT DETAIL MODAL */}
      <Dialog
        isOpen={Boolean(selectedGugusId)}
        onClose={() => {
          setSelectedGugusId(null);
          setGugusDetail(null);
        }}
        title={`DETAIL ANALITIK: ${gugusDetail?.gugus.name || 'GUGUS'}`}
        description="Statistik distribusi Program Studi, Rumpun Akademik, dan Gender Anggota."
        maxWidth="lg"
      >
        {isLoadingDetail ? (
          <LoadingState message="Memuat analitik Gugus..." />
        ) : gugusDetail ? (
          <div className="space-y-5 font-mono text-xs">
            {/* Header info */}
            <div className="p-3 bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] rounded-lg grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div>
                <div className="text-[9px] text-[var(--text-muted)] uppercase">NOMOR GUGUS</div>
                <div className="text-sm font-bold text-[var(--accent)]">{gugusDetail.gugus.nomor}</div>
              </div>
              <div>
                <div className="text-[9px] text-[var(--text-muted)] uppercase">TOTAL ANGGOTA</div>
                <div className="text-sm font-bold text-[var(--text-primary)]">{gugusDetail.totalAnggota} MABA</div>
              </div>
              <div>
                <div className="text-[9px] text-[var(--text-muted)] uppercase">KAPASITAS</div>
                <div className="text-sm font-bold text-[var(--text-primary)]">{gugusDetail.gugus.kapasitas}</div>
              </div>
              <div>
                <div className="text-[9px] text-[var(--text-muted)] uppercase">SIE PENDAMPING</div>
                <div className="text-xs font-bold text-[var(--text-primary)] truncate">
                  {gugusDetail.gugus.pendampingId?.name || 'Panitia Pendamping'}
                </div>
              </div>
            </div>

            {/* Gender Stats */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] text-[var(--text-muted)] uppercase">
                <span>Distribusi Gender:</span>
                <span>Laki-Laki ({gugusDetail.distribusiGender.maleCount}) • Perempuan ({gugusDetail.distribusiGender.femaleCount})</span>
              </div>
              <div className="flex h-3 w-full rounded-full overflow-hidden bg-black/60 border border-[var(--border-subtle)]">
                <div
                  className="bg-blue-500 h-full text-[8px] flex items-center justify-center font-bold text-white"
                  style={{ width: `${gugusDetail.distribusiGender.malePercentage}%` }}
                >
                  {gugusDetail.distribusiGender.malePercentage}% L
                </div>
                <div
                  className="bg-pink-500 h-full text-[8px] flex items-center justify-center font-bold text-white"
                  style={{ width: `${gugusDetail.distribusiGender.femalePercentage}%` }}
                >
                  {gugusDetail.distribusiGender.femalePercentage}% P
                </div>
              </div>
            </div>

            {/* Rumpun Akademik Badges */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-wider flex items-center gap-1">
                <Layers className="h-3 w-3" /> Distribusi Rumpun Akademik (Lintas Rumpun)
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {gugusDetail.distribusiRumpun.map((r) => (
                  <div key={r.name} className="p-2 bg-black/40 border border-[var(--border-subtle)] rounded flex items-center justify-between">
                    <span className="text-[10px] font-bold truncate" style={{ color: r.color }}>{r.name}</span>
                    <span className="text-[10px] text-[var(--text-muted)]">{r.count} ({r.percentage}%)</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Study Program List */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-wider flex items-center gap-1">
                <BookOpen className="h-3 w-3" /> Sebaran Program Studi
              </h4>
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {gugusDetail.distribusiProdi.map((p) => (
                  <div key={p.name} className="flex items-center justify-between text-[11px] p-1.5 bg-black/30 border border-[var(--border-subtle)] rounded">
                    <span>{p.name}</span>
                    <span className="font-bold text-[var(--accent)]">{p.count} Mahasiswa ({p.percentage}%)</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Member List Table */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-1">
                <Users className="h-3 w-3 text-[var(--accent)]" /> Daftar Anggota Mahasiswa Baru ({gugusDetail.members.length})
              </h4>
              <div className="max-h-48 overflow-y-auto border border-[var(--border-subtle)] rounded-lg">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[var(--bg-surface-elevated)] text-[9px] text-[var(--accent)] uppercase sticky top-0">
                      <th className="py-2 px-3">NAMA</th>
                      <th className="py-2 px-3">NIM</th>
                      <th className="py-2 px-3">PROGRAM STUDI</th>
                      <th className="py-2 px-3 text-right">GENDER</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)] text-[11px]">
                    {gugusDetail.members.map((m) => (
                      <tr key={m._id} className="hover:bg-white/[0.02]">
                        <td className="py-2 px-3 font-bold text-[var(--text-primary)]">{m.name}</td>
                        <td className="py-2 px-3 text-[10px] text-[var(--text-muted)]">{m.nim || '-'}</td>
                        <td className="py-2 px-3 text-[10px] text-[var(--accent)]">{m.studyProgram || 'S1 Teknik Informatika'}</td>
                        <td className="py-2 px-3 text-right font-bold">{m.gender || 'L'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedGugusId(null);
                  setGugusDetail(null);
                }}
                className="px-4 py-2 btn-accent text-xs uppercase"
              >
                Tutup Inspection
              </button>
            </div>
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}
