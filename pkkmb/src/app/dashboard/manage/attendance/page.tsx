"use client";

import { useState, useEffect, useCallback } from "react";
import { MapPin, Clock, Users, Activity, Plus, Wifi, WifiOff } from "lucide-react";
import { API_URL } from "@/lib/api";
import LiveAttendanceMap from './LiveAttendanceMap';

interface Log {
  _id: string;
  participant: { name: string; nim: string; division?: string };
  checkInTime: string;
  status: string;
  session: { title: string };
  operator?: { name: string };
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
  const [isAdmin, setIsAdmin] = useState(false);

  // Sessions
  const [sessions, setSessions] = useState<Session[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: "",
    date: new Date().toISOString().split("T")[0],
    startTime: "07:00",
    endTime: "09:00",
    location: "",
    isOnline: true,
  });

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/pkkmb/attendance/sessions`, {
        credentials: "include",
      });
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
      const res = await fetch(`${API_URL}/api/v1/pkkmb/attendance/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
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

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/pkkmb/attendance/monitoring?limit=50`, {
        credentials: "include"
      });
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
      const res = await fetch(`${API_URL}/api/v1/auth/me`, {
        credentials: "include"
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const role = typeof json.data.role === 'object' ? json.data.role.slug : json.data.role;
          // Typically only admin and super-admin should open/close sessions based on PRD
          setIsAdmin(['super-admin', 'admin'].includes(role));
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
    const interval = setInterval(fetchLogs, 10000); // Polling every 10 seconds
    return () => clearInterval(interval);
  }, [fetchLogs, checkProfile, fetchSessions]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Kontrol Presensi</h1>
          <p className="text-white/50 text-sm mt-1">Pantau check-in dan check-out Maba secara real-time.</p>
        </div>
        
        {isAdmin && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 px-4 py-2 rounded-xl text-sm font-bold transition-colors"
          >
            <Plus className="w-4 h-4" />
            Buat Sesi Presensi
          </button>
        )}
      </div>

      {/* Sessions */}
      {isAdmin && (
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gold-500" /> Sesi Presensi
          </h3>
          {sessions.length === 0 ? (
            <p className="text-white/40 text-sm italic">Belum ada sesi presensi.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sessions.map((s) => (
                <div key={s._id} className="bg-black/30 border border-white/10 rounded-xl p-4 flex items-center justify-between">
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
                  </div>
                  <span className={`px-2 py-1 text-xs rounded font-bold ${s.isOnline ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-white/10 text-white/60"}`}>
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
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                      log.status === 'PRESENT' ? 'bg-green-500/20 text-green-400' : 
                      log.status === 'LATE' ? 'bg-orange-500/20 text-orange-400' : 'bg-white/10 text-white/60'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                  <p className="text-white">
                    <span className="font-bold text-gold-500">{log.participant?.nim}</span> ({log.participant?.name.split(' ')[0]}) berhasil check-in.
                  </p>
                  <p className="text-white/40 text-[10px] mt-1">Sesi: {log.session?.title} • Oleh: {log.operator?.name || 'Sistem'}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Create Session Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#14100a] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl relative overflow-hidden">
            <h3 className="text-lg font-bold text-white mb-4">Buat Sesi Presensi</h3>
            <form onSubmit={createSession} className="space-y-4">
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
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 rounded-xl text-white/70 hover:bg-white/10 text-sm font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-bold text-sm transition-colors"
                >
                  {creating ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
