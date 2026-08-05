"use client";

import { useState, useEffect, useCallback } from "react";
import { MapPin, Clock, Users, Activity } from "lucide-react";
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

export default function AttendancePage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [stats, setStats] = useState({ present: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

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
    const interval = setInterval(fetchLogs, 10000); // Polling every 10 seconds
    return () => clearInterval(interval);
  }, [fetchLogs, checkProfile]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Kontrol Presensi</h1>
          <p className="text-white/50 text-sm mt-1">Pantau check-in dan check-out Maba secara real-time.</p>
        </div>
        
        {isAdmin && (
          <div className="flex gap-2">
            <button className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 px-4 py-2 rounded-xl text-sm font-bold transition-colors">
              <Clock className="w-4 h-4" />
              Buka Sesi Presensi
            </button>
            <button className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 px-4 py-2 rounded-xl text-sm font-bold transition-colors">
              <Clock className="w-4 h-4" />
              Tutup Sesi
            </button>
          </div>
        )}
      </div>

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
    </div>
  );
}
