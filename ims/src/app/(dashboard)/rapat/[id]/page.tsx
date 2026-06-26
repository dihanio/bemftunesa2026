"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import ImsApiService from "@/lib/api";
import { useRapatSocket } from "@/hooks/useRapatSocket";
import QrDisplay from "@/components/rapat/QrDisplay";
import { 
  Calendar, MapPin, Users, Play, CheckCircle, ArrowLeft, 
  Trash2, UserPlus, Radio, AlertTriangle 
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface RapatDetail {
  _id: string;
  title: string;
  description?: string;
  scheduledAt: string;
  endedAt?: string;
  location: {
    name: string;
    latitude: number;
    longitude: number;
    radiusInMeters: number;
  };
  status: 'scheduled' | 'ongoing' | 'ended';
  createdBy?: { name: string; email: string };
  attendees: Array<{
    _id: string;
    userId: { _id: string; name: string; email: string } | string;
    name: string;
    attendedAt: string;
    method: 'qr' | 'manual';
    latitude?: number;
    longitude?: number;
    distanceFromTarget?: number;
    note?: string;
  }>;
}

export default function RapatDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [rapat, setRapat] = useState<RapatDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Manual attendance states
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [manualNote, setManualNote] = useState("");
  const [manualSubmitting, setManualSubmitting] = useState(false);

  // Socket connection
  const { newAttendee, rapatStatus, connected } = useRapatSocket(id);

  // Fetch meeting detail
  const fetchDetail = async () => {
    try {
      const res = await ImsApiService.getRapatDetail(id);
      if (res?.data) {
        setRapat(res.data);
      }
    } catch (err: any) {
      setError(err?.message || "Gagal memuat detail rapat.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchDetail();
      
      // Load user list for manual check-in
      const loadUsers = async () => {
        try {
          const res = await ImsApiService.getUsers();
          if (res?.data) {
            setUsers(res.data);
          }
        } catch (err) {
          console.error("Failed to load user list", err);
        }
      };
      loadUsers();
    }
  }, [id]);

  // Handle incoming live socket events
  useEffect(() => {
    if (newAttendee && rapat) {
      // Avoid duplicate list insertions
      const exists = rapat.attendees.some(
        (a) => (typeof a.userId === 'object' ? a.userId?._id : a.userId) === newAttendee.userId
      );
      if (!exists) {
        setRapat((prev: any) => {
          if (!prev) return null;
          return {
            ...prev,
            attendees: [newAttendee, ...prev.attendees],
          };
        });
      }
    }
  }, [newAttendee]);

  useEffect(() => {
    if (rapatStatus && rapat) {
      setRapat((prev: any) => {
        if (!prev) return null;
        return {
          ...prev,
          status: rapatStatus,
        };
      });
    }
  }, [rapatStatus]);

  // Rapat control actions
  const handleStartRapat = async () => {
    try {
      const res = await ImsApiService.startRapat(id);
      if (res?.data) {
        setRapat((prev: any) => ({ ...prev, status: 'ongoing' }));
      }
    } catch (err: any) {
      alert(err?.message || "Gagal memulai rapat.");
    }
  };

  const handleEndRapat = async () => {
    if (!confirm("Apakah Anda yakin ingin mengakhiri rapat ini? QR Code absen akan dinonaktifkan.")) return;
    try {
      const res = await ImsApiService.endRapat(id);
      if (res?.data) {
        setRapat((prev: any) => ({ ...prev, status: 'ended', endedAt: res.data.endedAt }));
      }
    } catch (err: any) {
      alert(err?.message || "Gagal mengakhiri rapat.");
    }
  };

  const handleManualAttend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    setManualSubmitting(true);
    try {
      const res = await ImsApiService.attendManual(id, {
        userId: selectedUserId,
        note: manualNote,
      });
      // The socket event will trigger or we can fetch/append directly
      alert("Absensi manual berhasil dicatat!");
      setSelectedUserId("");
      setManualNote("");
      fetchDetail(); // Reload list
    } catch (err: any) {
      alert(err?.message || "Gagal mencatat absensi.");
    } finally {
      setManualSubmitting(false);
    }
  };

  const handleRemoveAttendee = async (userId: string) => {
    if (!confirm("Hapus absensi untuk user ini?")) return;
    try {
      await ImsApiService.removeAttendee(id, userId);
      setRapat((prev: any) => {
        if (!prev) return null;
        return {
          ...prev,
          attendees: prev.attendees.filter(
            (a: any) => (typeof a.userId === 'object' ? a.userId?._id : a.userId) !== userId
          ),
        };
      });
    } catch (err: any) {
      alert(err?.message || "Gagal menghapus absensi.");
    }
  };

  if (loading) {
    return (
      <DashboardShell>
        <div className="py-24 text-center text-foreground/50">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 animate-spin rounded-full border-4 border-sage/20 border-t-sage" />
            <span className="text-sm font-medium">Memuat detail rapat...</span>
          </div>
        </div>
      </DashboardShell>
    );
  }

  if (error || !rapat) {
    return (
      <DashboardShell>
        <div className="max-w-md mx-auto py-12 text-center">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-white mb-2">Rapat Tidak Ditemukan</h2>
          <p className="text-sm text-foreground/60 mb-6">{error || "Agenda rapat tidak valid atau telah dihapus."}</p>
          <button
            onClick={() => router.push("/rapat")}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-sm font-semibold transition-all text-white cursor-pointer"
          >
            Kembali ke Daftar Rapat
          </button>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="max-w-6xl mx-auto w-full pb-12 animate-fade-in">
        {/* Navigation Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.push("/rapat")}
            className="p-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl transition-all duration-200 cursor-pointer text-foreground/75 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Detail & Presensi Live</h1>
            <p className="text-xs text-foreground/50">Lacak check-in real-time fungsionaris di lokasi rapat</p>
          </div>
        </div>

        {/* Dynamic Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: Rapat Details & QR generator (40%) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Info Card */}
            <div className="glass-subtle border border-white/5 rounded-2xl p-6 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <h2 className="text-lg font-semibold text-white leading-tight">{rapat.title}</h2>
                <div className="flex flex-col items-end gap-1.5">
                  {rapat.status === 'scheduled' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold border bg-blue-500/10 text-blue-400 border-blue-500/20">
                      Mendatang
                    </span>
                  )}
                  {rapat.status === 'ongoing' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                      Berlangsung
                    </span>
                  )}
                  {rapat.status === 'ended' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold border bg-slate-500/10 text-slate-400 border-slate-500/20">
                      Selesai
                    </span>
                  )}
                </div>
              </div>
              
              <p className="text-xs text-foreground/60 -mt-1 leading-relaxed">
                {rapat.description || "Tidak ada deskripsi rapat."}
              </p>

              <div className="border-t border-white/5 pt-4 flex flex-col gap-3 text-xs text-foreground/80">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-foreground/45" />
                  <span>Jadwal: {formatDate(rapat.scheduledAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-foreground/45" />
                  <span>Lokasi: {rapat.location.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-foreground/45" />
                  <span>Radius Geofence: {rapat.location.radiusInMeters} Meter</span>
                </div>
              </div>

              {/* Status Action Buttons */}
              <div className="border-t border-white/5 pt-4 mt-1">
                {rapat.status === 'scheduled' && (
                  <button
                    onClick={handleStartRapat}
                    className="w-full flex items-center justify-center gap-2 bg-sage text-white py-2.5 rounded-xl text-xs font-semibold hover:bg-sage/90 transition-all cursor-pointer shadow-lg shadow-sage/10 border border-sage/40"
                  >
                    <Play className="w-4 h-4" />
                    Mulai Rapat (Aktifkan QR)
                  </button>
                )}
                {rapat.status === 'ongoing' && (
                  <button
                    onClick={handleEndRapat}
                    className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-lg shadow-rose-600/10 border border-rose-500"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Akhiri Rapat & Tutup Absen
                  </button>
                )}
                {rapat.status === 'ended' && (
                  <div className="text-center py-2 bg-white/5 rounded-xl border border-white/5 text-[11px] text-foreground/40 font-medium">
                    Rapat ini telah selesai pada {rapat.endedAt ? formatDate(rapat.endedAt) : "waktu yang lalu"}
                  </div>
                )}
              </div>
            </div>

            {/* QR display block */}
            {rapat.status === 'ongoing' && (
              <div className="animate-slide-up">
                <QrDisplay rapatId={rapat._id} />
              </div>
            )}

            {/* Manual Attendance Check-in */}
            {rapat.status !== 'ended' && (
              <div className="glass-subtle border border-white/5 rounded-2xl p-6 flex flex-col gap-4">
                <h3 className="text-xs font-bold text-white tracking-wider uppercase border-b border-white/5 pb-2">Absensi Manual (Fallback)</h3>
                
                <form onSubmit={handleManualAttend} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-foreground/50 uppercase">Pilih Fungsionaris</label>
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-sage/40"
                    >
                      <option value="">-- Pilih User --</option>
                      {users
                        .filter(u => u.isActive)
                        .map(u => (
                          <option key={u._id} value={u._id}>{u.name} ({u.nim || "NIM tidak disetel"})</option>
                        ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-foreground/50 uppercase">Keterangan / Catatan</label>
                    <input
                      type="text"
                      value={manualNote}
                      onChange={(e) => setManualNote(e.target.value)}
                      placeholder="Contoh: Izin terlambat, Sakit, dll."
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-sage/40"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={manualSubmitting || !selectedUserId}
                    className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white py-2 rounded-xl text-xs font-semibold disabled:opacity-50 transition-all cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4 text-sage" />
                    {manualSubmitting ? "Memproses..." : "Catat Presensi"}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* RIGHT: Live Attendees Listing (60%) */}
          <div className="lg:col-span-7 glass-subtle border border-white/5 rounded-2xl p-6 flex flex-col gap-4 self-stretch min-h-[500px]">
            
            {/* List Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Users className="w-4.5 h-4.5 text-sage" />
                Hadir: {rapat.attendees.length} Orang
              </h2>
              
              {/* Connection Status indicator */}
              <div className="flex items-center gap-2 text-xs">
                <span className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                <span className="text-foreground/50 text-[10px] uppercase font-bold tracking-wider">
                  {connected ? 'Socket Connected' : 'Socket Offline'}
                </span>
              </div>
            </div>

            {/* List entries */}
            <div className="flex-1 overflow-y-auto max-h-[600px] pr-1 flex flex-col gap-3">
              {rapat.attendees.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-foreground/45 py-24">
                  <Users className="w-10 h-10 text-foreground/20 mb-2.5" />
                  <span className="text-sm font-semibold text-white/95">Presensi Belum Dimulai</span>
                  <p className="text-xs text-foreground/40 max-w-[200px] mt-1">Presensi akan muncul di sini secara real-time setelah QR di-scan.</p>
                </div>
              ) : (
                rapat.attendees.map((attendee) => {
                  const attendeeId = typeof attendee.userId === 'object' ? attendee.userId?._id : attendee.userId;
                  return (
                    <div
                      key={attendee._id || attendeeId}
                      className="p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 hover:border-white/10 transition-all flex items-center justify-between gap-3 animate-fade-in"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="text-xs font-semibold text-white flex items-center gap-2">
                          {attendee.name}
                          
                          {/* Method Chip */}
                          {attendee.method === 'qr' ? (
                            <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] font-bold">
                              QR Code
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-bold">
                              Manual
                            </span>
                          )}
                        </div>

                        {/* Additional logs */}
                        <div className="text-[10px] text-foreground/45 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span>Waktu: {new Date(attendee.attendedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB</span>
                          
                          {attendee.distanceFromTarget !== undefined && (
                            <span>Jarak: {attendee.distanceFromTarget}m dari target</span>
                          )}

                          {attendee.note && (
                            <span className="text-amber-400/90 font-medium">Catatan: "{attendee.note}"</span>
                          )}
                        </div>
                      </div>

                      {/* Remove Presensi */}
                      {rapat.status !== 'ended' && (
                        <button
                          onClick={() => handleRemoveAttendee(attendeeId)}
                          className="p-2 bg-transparent text-foreground/40 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-all cursor-pointer border border-transparent hover:border-rose-500/20"
                          title="Hapus Presensi"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
