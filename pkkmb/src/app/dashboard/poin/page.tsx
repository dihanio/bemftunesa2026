"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Camera,
  ShieldAlert,
  Gamepad2,
  FileText,
  Star,
  AlertTriangle,
  CalendarClock,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { API_URL } from "@/lib/api";
import { formatWIB, useNow, wibDayKey, shiftDayKey } from "@/lib/presensi-time";

interface PointLog {
  _id: string;
  points: number;
  source: string;
  reason?: string;
  createdAt: string;
}

interface PointsData {
  totalPoints: number;
  logs: PointLog[];
}

// Ikon per kategori aktivitas (source bebas-text, mapping kata kunci).
function sourceMeta(source: string): { icon: ReactNode; cls: string } {
  const s = source.toLowerCase();
  if (/(kehadiran|presensi|hadir|absen)/.test(s))
    return {
      icon: <Camera className="w-4 h-4" />,
      cls: "bg-green-500/10 text-green-400 border-green-500/30",
    };
  if (/(kedisiplinan|tatib|tertib|disiplin|komdis)/.test(s))
    return {
      icon: <ShieldAlert className="w-4 h-4" />,
      cls: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    };
  if (/(games|game|permainan|quiz|kuis|pretest|posttest)/.test(s))
    return {
      icon: <Gamepad2 className="w-4 h-4" />,
      cls: "bg-purple-500/10 text-purple-300 border-purple-500/30",
    };
  if (/(tugas|task|pengumpulan|submit)/.test(s))
    return {
      icon: <FileText className="w-4 h-4" />,
      cls: "bg-blue-500/10 text-blue-300 border-blue-500/30",
    };
  return {
    icon: <Star className="w-4 h-4" />,
    cls: "bg-gold-500/10 text-gold-400 border-gold-500/30",
  };
}

export default function PoinPage() {
  const [data, setData] = useState<PointsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const now = useNow(); // update label "Hari Ini/Kemarin" + ringkasan tiap 30s

  const fetchPoints = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`${API_URL}/api/v1/pkkmb/maba/points`, {
        credentials: "include",
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setData({
            totalPoints: json.data.totalPoints ?? 0,
            logs: json.data.logs || [],
          });
          return;
        }
      }
      setError(true);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- inisialisasi state awal halaman (pola sama dgn MabaDashboard)
    void fetchPoints();
  }, [fetchPoints, reloadKey]);

  const todayWibKey = wibDayKey(now);

  // Ringkasan waktu (Hari Ini / 7 Hari Terakhir) berbasis WIB.
  const summary = useMemo(() => {
    const [y, m, d] = todayWibKey.split("-").map(Number);
    const todayStart = new Date(y, m - 1, d).getTime();
    const weekStart = todayStart - 6 * 86_400_000;
    let today = 0;
    let week = 0;
    for (const l of data?.logs || []) {
      const t = new Date(l.createdAt).getTime();
      if (t >= todayStart) today += l.points;
      if (t >= weekStart) week += l.points;
    }
    return { today, week };
  }, [data, todayWibKey]);

  // Breakdown per kategori. Denominator progress bar = jumlah |poin| seluruh
  // kategori (bukan |total|) agar bar selalu proporsional walau ada poin
  // negatif dan menambah hingga ~100%.
  const bySource = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of data?.logs || []) {
      map.set(l.source, (map.get(l.source) || 0) + l.points);
    }
    const entries = [...map.entries()];
    const denom = entries.reduce((acc, [, pts]) => acc + Math.abs(pts), 0);
    return entries
      .map(([source, pts]) => ({
        source,
        pts,
        pct: denom > 0 ? Math.min(100, (Math.abs(pts) / denom) * 100) : 0,
      }))
      .sort((a, b) => b.pts - a.pts);
  }, [data]);

  // Riwayat dikelompokkan per hari (WIB).
  const dayGroups = useMemo(() => {
    const map = new Map<string, PointLog[]>();
    for (const l of data?.logs || []) {
      const key = wibDayKey(l.createdAt);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(l);
    }
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [data]);

  const dayLabel = (key: string) => {
    if (key === todayWibKey) return "Hari Ini";
    if (key === shiftDayKey(todayWibKey, -1)) return "Kemarin";
    const [y, m, d] = key.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6" aria-busy="true">
        <div className="h-28 rounded-3xl bg-white/5 animate-pulse" />
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
        <div className="h-64 rounded-3xl bg-white/5 animate-pulse" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-3xl mx-auto rounded-3xl border border-red-500/25 bg-red-500/5 p-10 text-center">
        <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-white/80 font-semibold">Gagal memuat skor</p>
        <p className="text-sm text-white/40 mt-1">
          Periksa koneksi internet lalu coba lagi.
        </p>
        <button
          onClick={() => setReloadKey((k) => k + 1)}
          className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-gold-500 hover:bg-gold-400 text-black rounded-xl font-bold text-sm transition-colors"
        >
          <RotateCcw className="w-4 h-4" /> Coba Lagi
        </button>
      </div>
    );
  }

  const hasLogs = data.logs.length > 0;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold">Skor Keaktifan</h1>
        <p className="text-white/60 mt-1">
          Poin dihitung dari kehadiran, kedisiplinan, dan partisipasi selama
          PKKMB. Poin dicatat oleh panitia.
        </p>
      </div>

      {/* Ringkasan */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-gold-500/20 to-transparent border border-gold-500/30 rounded-2xl p-4 col-span-3 sm:col-span-1">
          <p className="text-white/50 text-[11px] uppercase tracking-wider font-semibold mb-1">
            Total Skor
          </p>
          <div className="flex items-baseline gap-1.5">
            <Trophy className="w-5 h-5 text-gold-400 self-center" />
            <span className="font-display text-4xl font-black text-gold-400">
              {data.totalPoints}
            </span>
          </div>
        </div>
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 col-span-3 sm:col-span-1">
          <p className="text-white/50 text-[11px] uppercase tracking-wider font-semibold mb-1">
            Hari Ini
          </p>
          <p className="font-display text-2xl font-black text-white">
            {summary.today > 0 ? `+${summary.today}` : summary.today}
          </p>
        </div>
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 col-span-3 sm:col-span-1">
          <p className="text-white/50 text-[11px] uppercase tracking-wider font-semibold mb-1">
            7 Hari Terakhir
          </p>
          <p className="font-display text-2xl font-black text-white">
            {summary.week > 0 ? `+${summary.week}` : summary.week}
          </p>
        </div>
      </div>

      {/* Breakdown per Kategori */}
      {bySource.length > 0 && (
        <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-5 md:p-6">
          <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-gold-500" />
            Rincian per Kategori
          </h3>
          <div className="space-y-4">
            {bySource.map(({ source, pts, pct }) => {
              const meta = sourceMeta(source);
              return (
                <div key={source}>
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <span className="inline-flex items-center gap-2 text-sm font-medium text-white/80 min-w-0">
                      <span
                        className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${meta.cls}`}
                      >
                        {meta.icon}
                      </span>
                      <span className="truncate">{source}</span>
                    </span>
                    <span
                      className={`font-bold text-sm shrink-0 ${
                        pts >= 0 ? "text-gold-400" : "text-red-400"
                      }`}
                    >
                      {pts > 0 ? "+" : ""}
                      {pts}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        pts >= 0 ? "bg-gold-500" : "bg-red-500"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Riwayat Perolehan */}
      <div>
        <h3 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
          <CalendarClock className="w-5 h-5 text-gold-500" />
          Riwayat Perolehan
        </h3>
        {!hasLogs ? (
          <div className="text-center py-14 bg-white/5 border border-white/10 rounded-3xl">
            <TrendingUp className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white/50">
              Belum Ada Riwayat
            </h3>
            <p className="text-white/40 text-sm mt-2 max-w-xs mx-auto">
              Poin akan bertambah seiring keaktifan kamu mengikuti kegiatan
              PKKMB — presensi, quiz, tugas, dan aktivitas lainnya.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {dayGroups.map(([key, logs]) => (
              <div key={key}>
                <p className="text-xs font-bold uppercase tracking-wider text-white/40 mb-2 px-1">
                  {dayLabel(key)}
                </p>
                <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-3xl divide-y divide-white/5 overflow-hidden">
                  {logs.map((log) => {
                    const meta = sourceMeta(log.source);
                    return (
                      <div
                        key={log._id}
                        className="flex items-center gap-3.5 p-4"
                      >
                        <div
                          className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
                            log.points >= 0
                              ? "bg-gold-500/10 text-gold-400 border-gold-500/20"
                              : "bg-red-500/10 text-red-400 border-red-500/20"
                          }`}
                        >
                          {log.points >= 0 ? (
                            <TrendingUp className="w-5 h-5" />
                          ) : (
                            <TrendingDown className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-white truncate">
                              {log.source}
                            </span>
                            <span
                              className={`w-6 h-6 rounded-md border hidden sm:inline-flex items-center justify-center shrink-0 ${meta.cls}`}
                            >
                              {meta.icon}
                            </span>
                          </div>
                          {log.reason && (
                            <p className="text-xs text-white/50 truncate">
                              {log.reason}
                            </p>
                          )}
                          <p className="text-[10px] text-white/40 mt-1">
                            {formatWIB(log.createdAt, {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <span
                          className={`font-bold text-sm shrink-0 ${
                            log.points >= 0
                              ? "text-gold-400"
                              : "text-red-400"
                          }`}
                        >
                          {log.points > 0 ? "+" : ""}
                          {log.points}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
