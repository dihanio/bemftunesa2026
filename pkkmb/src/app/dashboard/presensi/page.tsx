"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Clock, MapPin, Search, Fingerprint, AlertCircle, Trash2 } from "lucide-react";
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
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; id: string }>({ show: false, id: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [histRes, sessRes] = await Promise.all([
        fetch("http://localhost:4000/api/v1/pkkmb/attendance/my-history", { credentials: "include" }),
        fetch("http://localhost:4000/api/v1/pkkmb/attendance/sessions?status=PUBLISHED", { credentials: "include" })
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

      const res = await fetch("http://localhost:4000/api/v1/pkkmb/attendance/checkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          sessionId: selectedSessionId,
          method: "SELF_CHECKIN",
          ...(lat !== undefined && { lat, lng })
        }),
      });
      
      const json = await res.json();
      
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal melakukan presensi");
      }
      
      toast.success("Berhasil presensi!");
      fetchData();
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

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold mb-2">Presensi Kehadiran</h1>
        <p className="text-white/60">Lakukan presensi mandiri dan lihat rekapitulasi kehadiran Anda.</p>
      </div>

      {/* Form Check-In Mandiri */}
      <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-3xl p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gold-500/10 rounded-xl text-gold-400">
            <Fingerprint className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display">Check-In Mandiri</h2>
            <p className="text-sm text-white/50">Pilih sesi lalu klik Hadir untuk presensi mandiri.</p>
          </div>
        </div>
        
        {sessions.length === 0 ? (
          <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl text-white/60">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm">Saat ini tidak ada sesi presensi yang sedang berlangsung.</p>
          </div>
        ) : (
          <form onSubmit={handleCheckIn} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full space-y-2">
              <label className="text-sm font-semibold text-white/70">Pilih Sesi Acara</label>
              <div className="space-y-2">
                {sessions.map(s => (
                  <label
                    key={s._id}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl border cursor-pointer transition-all ${
                      selectedSessionId === s._id
                        ? 'bg-gold-500/10 border-gold-500/40 text-white'
                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/[0.08]'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      selectedSessionId === s._id ? 'border-gold-500' : 'border-white/30'
                    }`}>
                      {selectedSessionId === s._id && <div className="w-2 h-2 rounded-full bg-gold-500" />}
                    </div>
                    <span className="text-sm font-medium">{s.title}</span>
                    <input type="radio" name="session" value={s._id} checked={selectedSessionId === s._id} onChange={() => setSelectedSessionId(s._id)} className="sr-only" />
                  </label>
                ))}
              </div>
            </div>
            
            <button
              type="submit"
              disabled={submitting}
              className="w-full md:w-auto px-8 py-3 bg-gold-500 hover:bg-gold-400 text-black font-bold rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center min-h-[50px]"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                "Hadir"
              )}
            </button>
          </form>
        )}
      </div>

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
                <div key={record._id} className="bg-black/40 backdrop-blur-md border border-white/10 rounded-3xl p-6 flex flex-col hover:border-white/20 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`px-3 py-1 text-xs font-bold rounded-lg border flex items-center gap-1.5
                      ${isPresent ? 'bg-green-500/10 border-green-500/20 text-green-300' : 'bg-red-500/10 border-red-500/20 text-red-300'}
                    `}>
                      <CheckCircle2 className="w-3 h-3" />
                      <span className="capitalize">{record.status}</span>
                    </div>
                  </div>

                  <h3 className="font-display font-bold text-lg leading-tight mb-2">{record.session.title}</h3>
                  
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-sm text-white/50">
                      <Clock className="w-4 h-4 text-gold-400/70" />
                      <span>
                        {new Date(record.session.date).toLocaleDateString("id-ID", { dateStyle: "medium" })}
                        {" • "}
                        {new Date(record.session.startTime).toLocaleTimeString("id-ID", { timeStyle: "short" })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/50">
                      <MapPin className="w-4 h-4 text-gold-400/70" />
                      <span className="truncate">{record.session.location || "Lokasi Belum Ditentukan"}</span>
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-center">
                    <div className="flex justify-between items-center text-xs flex-1">
                      <span className="text-white/40">Waktu Scan:</span>
                      <span className="text-white font-mono bg-white/10 px-2 py-1 rounded">
                        {new Date(record.checkInTime).toLocaleTimeString("id-ID", { timeStyle: "medium" })}
                      </span>
                    </div>
                    <button
                      onClick={() => setDeleteModal({ show: true, id: record._id })}
                      className="ml-3 p-1.5 text-red-500/50 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {deleteModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1405] border border-red-500/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl -mr-10 -mt-10" />
            <h3 className="text-lg font-bold text-white mb-2 relative z-10 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-500" /> Hapus Record Presensi?
            </h3>
            <p className="text-red-200/60 text-sm mb-6 relative z-10">Data presensi ini akan dihapus permanen.</p>
            <div className="flex justify-end gap-3 relative z-10">
              <button onClick={() => setDeleteModal({ show: false, id: '' })} className="px-4 py-2 rounded-xl text-white/70 hover:bg-white/10 text-sm font-semibold transition-colors">Batal</button>
              <button
                onClick={async () => {
                  const id = deleteModal.id;
                  setDeleteModal({ show: false, id: '' });
                  try {
                    const res = await fetch(`http://localhost:4000/api/v1/pkkmb/attendance/records/${id}`, { method: 'DELETE', credentials: 'include' });
                    const json = await res.json();
                    if (res.ok && json.success) { toast.success('Record dihapus'); fetchData(); }
                    else toast.error(json.message || 'Gagal menghapus');
                  } catch { toast.error('Kesalahan jaringan'); }
                }}
                className="px-5 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-colors shadow-[0_0_15px_rgba(239,68,68,0.3)]"
              >Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
