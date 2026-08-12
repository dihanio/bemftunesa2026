"use client";

import { useState, useEffect, useCallback } from "react";
import { MapPin, Clock, Users, Activity, Plus, Wifi, WifiOff, Check, X, FileText, Trash2, Pencil } from "lucide-react";
import { apiFetch } from "@/lib/api";
import LiveAttendanceMap from './LiveAttendanceMap';
import toast from "react-hot-toast";

interface Log {
  _id: string;
  participant: { name: string; nim: string; division?: string };
  checkInTime: string;
  status: string;
  session: { title: string };
  operator?: { name: string };
}

interface IzinRecord {
  _id: string;
  participant?: { name: string; nim: string };
  session?: { title: string; location: string };
  status: string;
  reason?: string;
  proofUrl?: string;
  izinStatus?: string;
}

interface Session {
  _id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  isOnline?: boolean;
  status?: string;
}

export default function AttendancePage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [stats, setStats] = useState({ present: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  // Pengelola absensi (KSK/sekretaris/super-admin); panitia lain read-only.
  const [isManager, setIsManager] = useState(false);

  // Sessions
  const [sessions, setSessions] = useState<Session[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [form, setForm] = useState({
    title: "",
    date: new Date().toISOString().split("T")[0],
    startTime: "07:00",
    endTime: "09:00",
    location: "",
    isOnline: true,
  });

  // Izin / Sakit pending
  const [izins, setIzins] = useState<IzinRecord[]>([]);
  const [verifying, setVerifying] = useState<string | null>(null);

  const STATUSES = ["Hadir", "Telat", "Izin", "Sakit", "Tidak Hadir"];

  const changeStatus = async (id: string, status: string) => {
    try {
      const res = await apiFetch(`/pkkmb/attendance/records/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Gagal ubah status");
      toast.success(`Status diubah ke ${status}`);
      fetchLogs();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const deleteRecord = async (log: Log) => {
    if (!window.confirm("Hapus record presensi ini?")) return;
    try {
      const res = await apiFetch(`/pkkmb/attendance/records/${log._id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Gagal hapus record");
      toast.success("Record presensi dihapus");
      fetchLogs();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const fetchIzins = useCallback(async () => {
    try {
      const res = await apiFetch("/pkkmb/attendance/izin/pending");
      if (res.ok) {
        const json = await res.json();
        if (json.success) setIzins(json.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const verifyIzin = async (recordId: string, decision: "APPROVED" | "REJECTED") => {
    setVerifying(recordId);
    try {
      const res = await apiFetch("/pkkmb/attendance/izin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordId, decision }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Gagal verifikasi");
      toast.success(decision === "APPROVED" ? "Izin disetujui" : "Izin ditolak");
      fetchIzins();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setVerifying(null);
    }
  };

  const fetchSessions = useCallback(async () => {
    try {
      const res = await apiFetch("/pkkmb/attendance/sessions");
      if (res.ok) {
        const json = await res.json();
        if (json.success) setSessions(json.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const createSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await apiFetch("/pkkmb/attendance/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          date: form.date,
          startTime: `${form.date}T${form.startTime}`,
          endTime: `${form.date}T${form.endTime}`,
          location: form.location || "Online",
          isOnline: form.isOnline,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setShowCreate(false);
        setForm({ title: "", date: new Date().toISOString().split("T")[0], startTime: "07:00", endTime: "09:00", location: "", isOnline: true });
        fetchSessions();
      } else {
        alert(json.message || "Gagal membuat sesi");
      }
    } catch (err) {
      console.error(err);
      alert("Gagal membuat sesi");
    } finally {
      setCreating(false);
    }
  };

  const startEditSession = (s: Session) => {
    setEditingSession(s);
    setForm({
      title: s.title,
      date: s.date.slice(0, 10),
      startTime: s.startTime.slice(11, 16),
      endTime: s.endTime.slice(11, 16),
      location: s.location,
      isOnline: !!s.isOnline,
    });
    setShowCreate(true);
  };

  const updateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession) return;
    setCreating(true);
    try {
      const res = await apiFetch(`/pkkmb/attendance/sessions/${editingSession._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          date: form.date,
          startTime: `${form.date}T${form.startTime}`,
          endTime: `${form.date}T${form.endTime}`,
          location: form.location || "Online",
          isOnline: form.isOnline,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setShowCreate(false);
        setEditingSession(null);
        setForm({ title: "", date: new Date().toISOString().split("T")[0], startTime: "07:00", endTime: "09:00", location: "", isOnline: true });
        toast.success("Sesi presensi diperbarui");
        fetchSessions();
      } else {
        alert(json.message || "Gagal memperbarui sesi");
      }
    } catch (err) {
      console.error(err);
      alert("Gagal memperbarui sesi");
    } finally {
      setCreating(false);
    }
  };

  const deleteSession = async (s: Session) => {
    if (!window.confirm(`Hapus sesi "${s.title}"?`)) return;
    try {
      const res = await apiFetch(`/pkkmb/attendance/sessions/${s._id}`, { method: "DELETE" });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Sesi presensi dihapus");
        fetchSessions();
      } else {
        toast.error(json.message || "Gagal menghapus sesi");
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal menghapus sesi");
    }
  };

  const fetchLogs = useCallback(async () => {
    try {
      const res = await apiFetch("/pkkmb/attendance/monitoring?limit=50");
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setLogs(json.data.records || []);
          if (json.data.statistics) {
            setStats({ 
              present: json.data.statistics.totalHadir + json.data.statistics.terlambat, 
              total: json.data.statistics.totalRecords 
            });
          } else {
            setStats({ present: 0, total: 0 });
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkProfile = useCallback(async () => {
    try {
      const res = await apiFetch("/auth/me");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const role = typeof json.data.role === 'object' ? json.data.role.slug : json.data.role;
          const division = (json.data.division || "").toLowerCase();
          const perms = Array.isArray(json.data.permissions)
            ? (json.data.permissions as string[])
            : [];
          // Pengelola absensi = KSK (Kesekretariatan, DIVISI dalam role panitia),
          // sekretaris, atau admin (manage:all). Panitia divisi lain = read-only.
          // Backend tetap authority (assertAttendanceManager di service).
          const isKskDivision =
            role === "panitia" &&
            (division.includes("ksk") || division.includes("kesekretariatan"));
          const canManage =
            perms.includes("manage:all") ||
            role === "sekretaris" ||
            isKskDivision;
          setIsManager(canManage);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkProfile();
    fetchLogs();
    fetchSessions();
    fetchIzins();
    const interval = setInterval(fetchLogs, 10000); // Polling every 10 seconds
    return () => clearInterval(interval);
  }, [fetchLogs, checkProfile, fetchSessions, fetchIzins]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Kontrol Presensi</h1>
          <p className="text-white/50 text-sm mt-1">Pantau check-in dan check-out Maba secara real-time.</p>
        </div>
        
        {isManager ? (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 px-4 py-2 rounded-xl text-sm font-bold transition-colors"
          >
            <Plus className="w-4 h-4" />
            Buat Sesi Presensi
          </button>
        ) : (
          <span className="px-3 py-1.5 text-xs font-bold rounded-xl bg-white/5 border border-white/10 text-white/50">
            Mode baca saja
          </span>
        )}
      </div>

      {/* Sessions */}
      {isManager && (
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gold-500" /> Sesi Presensi
          </h3>
          {sessions.length === 0 ? (
            <p className="text-white/40 text-sm italic">Belum ada sesi presensi.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sessions.map((s) => (
                <div key={s._id} className="bg-black/30 border border-white/10 rounded-xl p-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{s.title}</span>
                      {s.isOnline ? (
                        <Wifi className="w-3.5 h-3.5 text-blue-400" />
                      ) : (
                        <WifiOff className="w-3.5 h-3.5 text-white/40" />
                      )}
                    </div>
                    <p className="text-white/50 text-xs mt-1">
                      {new Date(s.date).toLocaleDateString("id-ID", { dateStyle: "medium" })} •{" "}
                      {new Date(s.startTime).toLocaleTimeString("id-ID", { timeStyle: "short" })} -{" "}
                      {new Date(s.endTime).toLocaleTimeString("id-ID", { timeStyle: "short" })} •{" "}
                      {s.location}
                    </p>
                    <div className="flex gap-3 mt-2">
                      <button onClick={() => startEditSession(s)} className="inline-flex items-center gap-1 text-[11px] text-gold-400 hover:text-gold-300">
                        <Pencil className="w-3 h-3" /> Edit
                      </button>
                      <button onClick={() => deleteSession(s)} className="inline-flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300">
                        <Trash2 className="w-3 h-3" /> Hapus
                      </button>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded font-bold shrink-0 ${s.isOnline ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-white/10 text-white/60"}`}>
                    {s.isOnline ? "Online" : "Offline"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 text-blue-400 mb-2">
            <Activity className="w-5 h-5" />
            <h3 className="font-bold">Total Presensi Hari Ini</h3>
          </div>
          <p className="text-3xl font-display font-bold text-white">{stats.total || 0}</p>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 text-green-400 mb-2">
            <Users className="w-5 h-5" />
            <h3 className="font-bold">Hadir</h3>
          </div>
          <p className="text-3xl font-display font-bold text-white">{stats.present || 0}</p>
        </div>
      </div>

            {/* Izin / Sakit menunggu verifikasi */}
      {izins.length > 0 && (
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-yellow-500" /> Izin / Sakit Menunggu Verifikasi ({izins.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {izins.map((izin) => (
              <div key={izin._id} className="bg-black/30 border border-yellow-500/20 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-white">{izin.participant?.name || "-"} <span className="text-gold-500 text-sm font-mono">({izin.participant?.nim || "-"})</span></p>
                  <span className={`px-2 py-0.5 text-[10px] rounded font-bold uppercase ${izin.status === "Sakit" ? "bg-red-500/10 text-red-400" : "bg-blue-500/10 text-blue-400"} border ${izin.status === "Sakit" ? "border-red-500/20" : "border-blue-500/20"}`}>{izin.status}</span>
                </div>
                <p className="text-sm text-white/60 mb-1">Sesi: {izin.session?.title || "-"}</p>
                <p className="text-xs text-white/50 italic mb-3">{izin.reason || "-"}</p>
                {izin.proofUrl && (
                  <a href={izin.proofUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-gold-400 hover:underline mb-3">
                    <FileText className="w-3.5 h-3.5" /> Lihat Bukti
                  </a>
                )}
                {isManager ? (
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => verifyIzin(izin._id, "APPROVED")} disabled={verifying === izin._id} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg text-xs font-bold disabled:opacity-50">
                      <Check className="w-3.5 h-3.5" /> Setujui
                    </button>
                    <button onClick={() => verifyIzin(izin._id, "REJECTED")} disabled={verifying === izin._id} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-xs font-bold disabled:opacity-50">
                      <X className="w-3.5 h-3.5" /> Tolak
                    </button>
                  </div>
                ) : (
                  <p className="text-[10px] text-white/40 mt-2 italic">
                    Verifikasi izin hanya untuk pengelola absensi (Sie KSK).
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map / Stats */}
        <div className="lg:col-span-2 bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden min-h-[400px] flex flex-col relative">
          <div className="p-6 border-b border-white/10 bg-black/20 flex justify-between items-center z-10 relative">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gold-500" /> Peta Presensi Live
            </h3>
            <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded border border-green-500/20 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Live
            </span>
          </div>
          <div className="flex-1 w-full h-full relative z-0">
            <LiveAttendanceMap logs={logs} />
          </div>
        </div>


        {/* Log / Stream */}
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl flex flex-col h-[500px]">
          <div className="p-4 border-b border-white/10 font-bold flex items-center gap-2 bg-black/20">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            <span className="text-white">Live Log Absensi</span>
          </div>
          <div className="p-4 flex-1 overflow-y-auto space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-gold-500/20 border-t-gold-500 rounded-full animate-spin" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8 text-white/40 text-sm italic">Belum ada log hari ini</div>
            ) : (
              logs.map((log) => (
                <div key={log._id} className="text-sm bg-white/5 p-3 rounded-xl border border-white/5 hover:border-gold-500/30 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-white/40 text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(log.checkInTime).toLocaleTimeString('id-ID', { hour12: false })} WIB
                    </span>
                    {isManager ? (
                      <select
                        value={log.status}
                        onChange={(e) => changeStatus(log._id, e.target.value)}
                        className="text-[10px] px-1.5 py-0.5 rounded border bg-black/40 text-white outline-none focus:border-gold-500/50"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        log.status === 'PRESENT' ? 'bg-green-500/20 text-green-400' : 
                        log.status === 'LATE' ? 'bg-orange-500/20 text-orange-400' : 'bg-white/10 text-white/60'
                      }`}>
                        {log.status}
                      </span>
                    )}
                  </div>
                  <p className="text-white">
                    <span className="font-bold text-gold-500">{log.participant?.nim}</span> ({log.participant?.name.split(' ')[0]}) berhasil check-in.
                  </p>
                  <p className="text-white/40 text-[10px] mt-1">Sesi: {log.session?.title} • Oleh: {log.operator?.name || 'Sistem'}</p>
                  {isManager && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => deleteRecord(log)}
                        className="inline-flex items-center gap-1 text-[10px] text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-3 h-3" /> Hapus
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Create / Edit Session Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#14100a] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl relative overflow-hidden">
            <h3 className="text-lg font-bold text-white mb-4">
              {editingSession ? "Edit Sesi Presensi" : "Buat Sesi Presensi"}
            </h3>
            <form onSubmit={editingSession ? updateSession : createSession} className="space-y-4">
              <div>
                <label className="block text-xs text-white/50 mb-1">Judul Sesi</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="cth: Pra-PKKMB Day 1"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-gold-500/50"
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1">Tanggal</label>
                <input
                  required
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-gold-500/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/50 mb-1">Jam Mulai</label>
                  <input
                    required
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-gold-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1">Jam Selesai</label>
                  <input
                    required
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-gold-500/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1">Lokasi</label>
                <input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="cth: Gedung Dekanat FT UNESA"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-gold-500/50"
                />
              </div>
              <button
                type="button"
                onClick={() => setForm({ ...form, isOnline: !form.isOnline })}
                className={`w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-bold transition-colors border ${
                  form.isOnline
                    ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                    : "bg-white/5 border-white/10 text-white/60"
                }`}
              >
                {form.isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                {form.isOnline ? "Online (tanpa batas lokasi)" : "Offline (geofence area kampus)"}
              </button>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowCreate(false); setEditingSession(null); }}
                  className="px-4 py-2 rounded-xl text-white/70 hover:bg-white/10 text-sm font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-bold text-sm transition-colors"
                >
                  {creating ? "Menyimpan..." : editingSession ? "Simpan Perubahan" : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
