"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Clock, MapPin, Search, Fingerprint, AlertCircle } from "lucide-react";
import { API_URL } from "@/lib/api";
import toast from "react-hot-toast";

interface Session {
  _id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  status?: string;
}

interface AttendanceRecord {
  _id: string;
  session: Session;
  checkInTime: string;
  status: string;
  attendanceMethod: string;
  notes?: string;
}

export default function PresensiMabaPage() {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  
  // Form State
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [histRes, sessRes] = await Promise.all([
        fetch(`${API_URL}/api/v1/pkkmb/attendance/my-history`, { credentials: "include" }),
        fetch(`${API_URL}/api/v1/pkkmb/attendance/sessions?status=PUBLISHED`, { credentials: "include" })
      ]);
      
      const histJson = await histRes.json();
      const sessJson = await sessRes.json();

      if (histJson.success && histJson.data) {
        setHistory(histJson.data);
      }
      
      if (sessJson.success && sessJson.data) {
        setSessions(sessJson.data);
        if (sessJson.data.length > 0) {
          setSelectedSessionId(sessJson.data[0]._id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, []);

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSessionId) {
      toast.error("Pilih sesi terlebih dahulu");
      return;
    }
    
    setSubmitting(true);
    try {
      // Get GPS location
      let lat: number | undefined;
      let lng: number | undefined;
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 })
        );
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch {
        // GPS gagal, tetap lanjut tanpa koordinat
      }

      const body = JSON.stringify({
        sessionId: selectedSessionId,
        method: "SELF_CHECKIN",
        ...(lat !== undefined && { lat, lng })
      });

      // Retry 3x utk gagal jaringan/5xx, backoff 1s/2s/3s
      const maxAttempts = 3;
      let lastErr: Error | null = null;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const res = await fetch(`${API_URL}/api/v1/pkkmb/attendance/checkin`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body,
          });
          const json = await res.json();
          if (!res.ok || !json.success) {
            throw new Error(json.message || "Gagal melakukan presensi");
          }
          toast.success("Berhasil presensi!");
          fetchData();
          return;
        } catch (error: unknown) {
          // 4xx = kesalahan validasi/otorisasi, jangan retry
          if (error instanceof Error && /^(Pilih|Sesi|Lokasi|QR|Anda berada|Data peserta)/.test(error.message)) {
            throw error;
          }
          lastErr = error as Error;
          if (attempt < maxAttempts) {
            await new Promise((r) => setTimeout(r, attempt * 1000));
          }
        }
      }
      throw lastErr || new Error("Gagal melakukan presensi");
    } catch (error: unknown) {
      toast.error((error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-4 border-gold-500/20 border-t-gold-500 rounded-full animate-spin" />
      </div>
    );
  }

  const recap = history.reduce(
    (acc, r) => {
      const s = r.status || "";
      if (s === "HADIR") acc.hadir++;
      else if (s === "TERLAMBAT") acc.late++;
      else if (s === "IZIN" || s === "SAKIT") acc.izin++;
      else if (s === "ALPHA" || s === "TIDAK_HADIR") acc.alpha++;
      else acc.other++;
      return acc;
    },
    { hadir: 0, late: 0, izin: 0, alpha: 0, other: 0 }
  );
  const totalRecords = history.length;
  const hadirPct = totalRecords ? Math.round((recap.hadir / totalRecords) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-2">
        <div>
          <h1 className="text-3xl font-display font-bold mb-1">Presensi Kehadiran</h1>
          <p className="text-white/60">Lakukan presensi mandiri dan pantau rekapitulasi kehadiran Anda.</p>
        </div>
        {totalRecords > 0 && (
          <div className="flex items-center gap-2 text-sm text-white/60">
            <span>Total sesi dihadiri</span>
            <span className="px-3 py-1 bg-gold-500/10 border border-gold-500/20 text-gold-400 rounded-full font-bold">{totalRecords}</span>
          </div>
        )}
      </div>

      {/* Form Check-In Mandiri */}
      <div className="bg-gradient-to-br from-gold-500/[0.06] to-transparent border border-white/10 rounded-3xl p-6 md:p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-gold-500/15 rounded-2xl text-gold-400 shadow-[0_0_20px_rgba(234,179,8,0.15)]">
            <Fingerprint className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display">Check-In Mandiri</h2>
            <p className="text-sm text-white/50">Pilih sesi yang sedang berlangsung, lalu tekan Hadir.</p>
          </div>
        </div>
        
        {sessions.length === 0 ? (
          <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl text-white/60">
            <AlertCircle className="w-5 h-5 text-gold-400" />
            <p className="text-sm">Saat ini tidak ada sesi presensi yang sedang berlangsung.</p>
          </div>
        ) : (
          <form onSubmit={handleCheckIn} className="space-y-4">
            <label className="text-sm font-semibold text-white/70">Pilih Sesi Acara</label>
            <div className="space-y-3">
              {sessions.map(s => {
                const isSelected = selectedSessionId === s._id;
                return (
                  <label
                    key={s._id}
                    className={`flex items-center gap-4 px-4 py-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-gold-500/10 border-gold-500/40 text-white shadow-[0_0_20px_rgba(234,179,8,0.1)]'
                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/[0.08]'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      isSelected ? 'border-gold-500' : 'border-white/30'
                    }`}>
                      {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-gold-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-white/80'}`}>{s.title}</p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-white/40">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(s.startTime).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                          {new Date(s.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                        </span>
                        {s.location && (
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" />
                            {s.location}
                          </span>
                        )}
                      </div>
                    </div>
                    <input type="radio" name="session" value={s._id} checked={isSelected} onChange={() => setSelectedSessionId(s._id)} className="sr-only" />
                  </label>
                );
              })}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full px-8 py-4 bg-gold-500 hover:bg-gold-400 text-black font-bold rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-base shadow-[0_0_20px_rgba(234,179,8,0.25)] hover:shadow-[0_0_30px_rgba(234,179,8,0.4)] active:scale-[0.99]"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Hadir Sekarang
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Rekap Kehadiran */}
      {totalRecords > 0 && (
        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-3xl p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-display font-bold">Rekapitulasi Kehadiran</h3>
            <span className={`text-lg font-display font-black ${hadirPct >= 75 ? 'text-green-400' : hadirPct >= 50 ? 'text-gold-400' : 'text-red-400'}`}>
              {hadirPct}%
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Hadir", value: recap.hadir, color: "text-green-400", bar: "bg-green-500", pct: totalRecords ? Math.round((recap.hadir / totalRecords) * 100) : 0 },
              { label: "Terlambat", value: recap.late, color: "text-yellow-400", bar: "bg-yellow-500", pct: totalRecords ? Math.round((recap.late / totalRecords) * 100) : 0 },
              { label: "Izin / Sakit", value: recap.izin, color: "text-blue-400", bar: "bg-blue-500", pct: totalRecords ? Math.round((recap.izin / totalRecords) * 100) : 0 },
              { label: "Tidak Hadir", value: recap.alpha, color: "text-red-400", bar: "bg-red-500", pct: totalRecords ? Math.round((recap.alpha / totalRecords) * 100) : 0 },
            ].map((item) => (
              <div key={item.label} className="bg-white/[0.03] border border-white/5 rounded-2xl p-4">
                <p className="text-white/40 text-xs uppercase tracking-wider font-semibold mb-2">{item.label}</p>
                <p className={`font-display text-3xl font-black ${item.color}`}>{item.value}</p>
                <div className="w-full bg-white/5 rounded-full h-1.5 mt-3 overflow-hidden">
                  <div className={`${item.bar} h-1.5 rounded-full transition-all duration-700`} style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Riwayat Presensi */}
      <div>
        <h3 className="text-xl font-display font-bold mb-6">Riwayat Presensi</h3>
        
        {history.length === 0 ? (
          <div className="text-center py-16 bg-white/5 border border-white/10 rounded-3xl">
            <Search className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white/50">Belum Ada Presensi</h3>
            <p className="text-white/40 text-sm mt-2">Anda belum melakukan presensi pada sesi mana pun.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {history.map((record) => {
              const isPresent = record.status === "HADIR";
              return (
                <div key={record._id} className="bg-black/40 backdrop-blur-md border border-white/10 rounded-3xl p-6 flex flex-col hover:border-white/20 transition-colors group">
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-3 py-1 text-xs font-bold rounded-lg border flex items-center gap-1.5
                      ${isPresent ? 'bg-green-500/10 border-green-500/20 text-green-300' : 'bg-red-500/10 border-red-500/20 text-red-300'}
                    `}>
                      <CheckCircle2 className="w-3 h-3" />
                      <span className="capitalize">{record.status.toLowerCase()}</span>
                    </span>
                    <span className="text-[10px] text-white/40 font-mono">
                      {new Date(record.checkInTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-lg leading-tight mb-4">{record.session.title}</h3>
                  
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-sm text-white/50">
                      <Clock className="w-4 h-4 text-gold-400/70 shrink-0" />
                      <span>
                        {new Date(record.session.date).toLocaleDateString("id-ID", { dateStyle: "medium" })}
                        {" • "}
                        {new Date(record.session.startTime).toLocaleTimeString("id-ID", { timeStyle: "short" })} WIB
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/50">
                      <MapPin className="w-4 h-4 text-gold-400/70 shrink-0" />
                      <span className="truncate">{record.session.location || "Lokasi Belum Ditentukan"}</span>
                    </div>
                  </div>

                  <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                    <span className="text-white/40">Metode</span>
                    <span className="text-white/70 font-medium capitalize">
                      {record.attendanceMethod === "SELF_CHECKIN" ? "Self Check-in" : "Manual"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
