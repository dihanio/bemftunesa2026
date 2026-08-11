"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Users, RefreshCw, X, AlertCircle, ChevronDown, Check } from 'lucide-react';
import { API_URL, apiFetch } from "@/lib/api";
import toast from 'react-hot-toast';

interface Pendamping {
  _id: string;
  name: string;
  email?: string;
  division?: string;
}

interface GroupDetail {
  gugus: { _id: string; nomor: number; name: string; kapasitas: number; status: string; ketuaGugusId?: { name: string; nim?: string; email?: string } | string | null; pendampingId?: { name: string }; pendampingWhatsApp?: string; pendampingEmail?: string };
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
  const [pendampings, setPendampings] = useState<Pendamping[]>([]);
  const [assigningTo, setAssigningTo] = useState<string | null>(null);
  const [openMenuFor, setOpenMenuFor] = useState<string | null>(null);
  const [searchPendamping, setSearchPendamping] = useState("");
  const [searchGugus, setSearchGugus] = useState("");

  // Tutup menu saat klik di luar dropdown yang terbuka.
  useEffect(() => {
    if (!openMenuFor) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node;
      if (t instanceof Element && t.closest(`[data-menu-id="${openMenuFor}"]`)) return;
      setOpenMenuFor(null);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [openMenuFor]);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/pkkmb/gugus");
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

  const fetchPendampings = useCallback(async () => {
    try {
      const res = await apiFetch("/pkkmb/gugus/pendamping");
      const json = await res.json();
      if (res.ok && json.data) setPendampings(json.data);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const handleAssignPendamping = useCallback(async (gugusId: string, pendampingId: string) => {
    if (!pendampingId) return;
    setAssigningTo(gugusId);
    try {
      const res = await apiFetch(`/pkkmb/gugus/${gugusId}/pendamping`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pendampingId }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Pendamping ditetapkan");
        fetchGroups();
      } else {
        toast.error(json.message || "Gagal menetapkan pendamping");
      }
    } catch (error) {
      console.error(error);
      toast.error("Gagal terhubung ke server");
    } finally {
      setAssigningTo(null);
    }
  }, [fetchGroups]);

  const openDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await apiFetch(`/pkkmb/gugus/${id}`);
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
    fetchPendampings();
  }, [fetchGroups, fetchPendampings]);

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
            <p className="text-white/40 text-sm mt-2">Belum ada data gugus.</p>
          </div>
        ) : (
          <>
            <input
              type="text"
              value={searchGugus}
              onChange={(e) => setSearchGugus(e.target.value)}
              placeholder="Cari gugus (nomor / nama)..."
              className="w-full mb-4 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-gold-500 text-sm"
            />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(() => {
              const usedPendampingIds = new Set(
                (groups as Array<Record<string, unknown>>)
                  .map((g) => (g.pendampingId as Record<string, unknown> | undefined)?._id as string | undefined)
                  .filter(Boolean) as string[],
              );
              const q = searchGugus.toLowerCase();
              const filtered = (groups as Array<Record<string, unknown>>).filter((g) => {
                if (!q) return true;
                return String(g.nomor as number).includes(q) || (g.name as string).toLowerCase().includes(q);
              });
              return filtered.map((group: Record<string, unknown>) => (
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
                  <div onClick={(e) => e.stopPropagation()} data-menu-id={group._id as string} className="relative mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const open = openMenuFor === (group._id as string);
                        setOpenMenuFor(open ? null : (group._id as string));
                        if (!open) setSearchPendamping("");
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white hover:border-gold-500/50 transition-colors"
                    >
                      <span className="truncate">{(group.pendampingId as Record<string, unknown> | undefined)?.name as string || "Tunjuk Pendamping..."}</span>
                      <ChevronDown className={`w-4 h-4 text-white/40 shrink-0 transition-transform ${openMenuFor === (group._id as string) ? "rotate-180" : ""}`} />
                    </button>
                    {openMenuFor === (group._id as string) && (
                      <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-[#111] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                        <input
                          type="text"
                          value={searchPendamping}
                          onChange={(e) => setSearchPendamping(e.target.value)}
                          placeholder="Cari pendamping..."
                          className="w-full px-4 py-2.5 text-white bg-white/5 border-b border-white/10 focus:outline-none focus:border-gold-500 text-xs"
                        />
                        {                          pendampings.filter((p) => p.name.toLowerCase().includes(searchPendamping.toLowerCase()) && (!usedPendampingIds.has(p._id) || (group.pendampingId as Record<string, unknown> | undefined)?._id === p._id)).length === 0 ? (
                          <div className="px-4 py-3 text-white/50 text-xs">Pendamping tidak ditemukan</div>
                        ) : (
                          pendampings.filter((p) => p.name.toLowerCase().includes(searchPendamping.toLowerCase()) && (!usedPendampingIds.has(p._id) || (group.pendampingId as Record<string, unknown> | undefined)?._id === p._id)).map((p) => {
                            const isCurrent = (group.pendampingId as Record<string, unknown> | undefined)?._id === p._id;
                            return (
                              <button
                                key={p._id}
                                type="button"
                                disabled={assigningTo === (group._id as string)}
                                onClick={() => {
                                  handleAssignPendamping(group._id as string, p._id);
                                  setOpenMenuFor(null);
                                }}
                                className={`w-full px-4 py-2.5 text-left text-xs flex items-center justify-between transition-colors hover:bg-white/10 ${isCurrent ? "text-gold-400 font-bold" : "text-white/70"}`}
                              >
                                <span className="truncate">{p.name}</span>
                                {isCurrent && <Check className="w-4 h-4 text-gold-500 shrink-0 ml-2" />}
                              </button>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              ))
            })()}
          </div>
          </>
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
                </p>
                {(detail.gugus.pendampingWhatsApp || detail.gugus.pendampingEmail) && (
                  <p className="text-white/40 text-xs mt-1">
                    {detail.gugus.pendampingWhatsApp && (
                      <a href={detail.gugus.pendampingWhatsApp} target="_blank" rel="noreferrer" className="text-gold-400 hover:underline mr-3">WhatsApp</a>
                    )}
                    {detail.gugus.pendampingEmail && (
                      <a href={`mailto:${detail.gugus.pendampingEmail}`} className="text-gold-400 hover:underline">{detail.gugus.pendampingEmail}</a>
                    )}
                  </p>
                )}
              </div>
              <button onClick={() => setDetail(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/50">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-white/5 rounded-2xl p-4">
                  <p className="text-white/50 text-sm">Total Anggota</p>
                  <p className="text-2xl font-bold text-white">{detail.totalAnggota}</p>
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
                            <img src={m.avatar.startsWith('/') ? `${API_URL}${m.avatar}` : m.avatar} alt={m.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
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
