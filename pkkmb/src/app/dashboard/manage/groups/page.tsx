"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Users, RefreshCw, X, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface GroupDetail {
  gugus: { _id: string; nomor: number; name: string; kapasitas: number; status: string; ketuaGugusId?: { name: string; nim?: string; email?: string } | string | null; pendampingId?: { name: string } };
  totalAnggota: number;
  distribusiGender: { maleCount: number; femaleCount: number; malePercentage: number; femalePercentage: number };
  distribusiProdi: { name: string; count: number; percentage: number }[];
  members: { _id: string; name: string; nim: string; gender: string; avatar?: string; studyProgram: string; studyProgramId?: { name: string } }[];
}

export default function ManageGroupsPage() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<GroupDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:4000/api/v1/pkkmb/gugus", {
        credentials: "include"
      });
      const json = await res.json();
      if (res.ok && json.data) {
        setGroups(json.data);
      } else {
        toast.error("Gagal mengambil data gugus");
      }
    } catch (error) {
      console.error(error);
      toast.error("Gagal terhubung ke server");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAutoAssign = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:4000/api/v1/pkkmb/gugus/auto-distribute", {
        method: "POST",
        credentials: "include"
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.data?.message || json.message || "Distribusi gugus berhasil");
        fetchGroups();
      } else {
        toast.error(json.message || "Gagal mendistribusikan gugus");
      }
    } catch (error) {
      console.error(error);
      toast.error("Gagal terhubung ke server");
    } finally {
      setLoading(false);
    }
  }, [fetchGroups]);

  const openDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await fetch(`http://localhost:4000/api/v1/pkkmb/gugus/${id}`, {
        credentials: "include"
      });
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        setDetail(json.data);
      } else {
        toast.error("Gagal mengambil detail gugus");
      }
    } catch (error) {
      console.error(error);
      toast.error("Gagal terhubung ke server");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchGroups();
  }, [fetchGroups]);

  useEffect(() => {
    const lenis = (window as unknown as Record<string, unknown>)?.['__lenis'];
    if (detail || detailLoading) {
      (lenis as { stop?: () => void } | undefined)?.stop?.();
      document.body.style.overflow = "hidden";
    } else {
      (lenis as { start?: () => void } | undefined)?.start?.();
      document.body.style.overflow = "";
    }
    return () => {
      (lenis as { start?: () => void } | undefined)?.start?.();
      document.body.style.overflow = "";
    };
  }, [detail, detailLoading]);

  return (
    <div className="space-y-8 w-full max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-white mb-2">Manajemen Gugus</h1>
          <p className="text-white/60">Kelola kelompok/gugus PKKMB dan tetapkan ketua gugus.</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={fetchGroups}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button 
            onClick={handleAutoAssign}
            className="px-4 py-2 bg-gold-500 hover:bg-gold-400 text-black font-bold rounded-xl transition-colors flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            Auto Assign
          </button>
        </div>
      </div>

      <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-3xl p-6">
        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 border-4 border-gold-500/20 border-t-gold-500 rounded-full animate-spin" />
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-20">
            <AlertCircle className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white/70">Data Gugus Kosong</h3>
            <p className="text-white/40 text-sm mt-2">Belum ada gugus yang dibuat. Gunakan Auto Assign atau buat manual melalui API.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group: Record<string, unknown>) => (
              <div key={group._id as string} onClick={() => openDetail(group._id as string)} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/[0.07] hover:border-gold-500/30 transition-all cursor-pointer">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="px-2 py-1 bg-gold-500/20 text-gold-400 text-xs font-bold rounded-md uppercase mb-2 inline-block">
                      Gugus {(group.nomor as number)}
                    </span>
                    <h3 className="font-bold text-lg text-white">{group.name as string}</h3>
                  </div>
                  <div className="p-2 bg-white/5 rounded-lg text-white/50">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                
                <div className="space-y-2 mt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/50">Pendamping</span>
                    <span className="text-white font-medium">{(group.pendampingId as Record<string, unknown> | undefined)?.name as string || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/50">Ketua Gugus</span>
                    <span className="text-white font-medium">{(group.ketuaGugusId as Record<string, unknown> | undefined)?.name as string || '-'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {detailLoading && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-gold-500/20 border-t-gold-500 rounded-full animate-spin" />
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setDetail(null)}>
          <div className="bg-[#141414] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[80vh] overflow-y-auto" data-lenis-prevent="true" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-white/10 sticky top-0 bg-[#141414]">
              <div>
                <span className="px-2 py-1 bg-gold-500/20 text-gold-400 text-xs font-bold rounded-md uppercase inline-block mb-1">
                  Gugus {detail.gugus.nomor}
                </span>
                <h2 className="text-xl font-bold text-white">{detail.gugus.name}</h2>
                <p className="text-white/50 text-sm">
                  Pendamping: {detail.gugus.pendampingId?.name || '-'}
                  {' · '}
                  Ketua: {typeof detail.gugus.ketuaGugusId === 'object' && detail.gugus.ketuaGugusId ? (detail.gugus.ketuaGugusId as { name?: string }).name || '-' : typeof detail.gugus.ketuaGugusId === 'string' ? detail.gugus.ketuaGugusId : '-'}
                  {' · '}
                  Status: {detail.gugus.status}
                </p>
              </div>
              <button onClick={() => setDetail(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/50">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-white/5 rounded-2xl p-4">
                  <p className="text-white/50 text-sm">Anggota</p>
                  <p className="text-2xl font-bold text-white">{detail.totalAnggota}<span className="text-sm text-white/40 font-normal"> / {detail.gugus.kapasitas}</span></p>
                </div>
                <div className="bg-white/5 rounded-2xl p-4">
                  <p className="text-white/50 text-sm">Laki-laki</p>
                  <p className="text-2xl font-bold text-white">{detail.distribusiGender.maleCount} <span className="text-sm text-white/40 font-normal">({detail.distribusiGender.malePercentage}%)</span></p>
                </div>
                <div className="bg-white/5 rounded-2xl p-4">
                  <p className="text-white/50 text-sm">Perempuan</p>
                  <p className="text-2xl font-bold text-white">{detail.distribusiGender.femaleCount} <span className="text-sm text-white/40 font-normal">({detail.distribusiGender.femalePercentage}%)</span></p>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-white mb-3">Prodi Anggota</h3>
                <div className="flex flex-wrap gap-2">
                  {detail.distribusiProdi.map((p) => (
                    <span key={p.name} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-white/70 text-sm">
                      {p.name} · {p.count}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-white mb-3">Anggota</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1" data-lenis-prevent="true">
                  {detail.members.length === 0 ? (
                    <p className="text-white/40 text-sm">Belum ada anggota.</p>
                  ) : detail.members.map((m) => (
                    <div key={m._id} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-white/10 overflow-hidden border border-white/10 shrink-0">
                          {m.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={m.avatar.startsWith('/') ? `http://localhost:4000${m.avatar}` : m.avatar} alt={m.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gold-500 font-bold text-sm">{m.name.charAt(0)}</div>
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">{m.name}</p>
                          <p className="text-white/40 text-xs">{m.nim}</p>
                        </div>
                      </div>
                      <span className="text-white/50 text-sm">{typeof m.studyProgramId === 'object' && m.studyProgramId?.name ? (m.studyProgramId as { name?: string }).name : m.studyProgram || '-'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
