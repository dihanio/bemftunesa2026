"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  CalendarDays,
  MapPin,
  Wifi,
  WifiOff,
  CheckCircle2,
  ArrowRight,
  Clock,
  Camera,
  AlertTriangle,
  User as UserIcon,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import {
  formatWIB,
  getPeriodStatus,
  shiftDayKey,
  useNow,
  wibDayKey,
} from "@/lib/presensi-time";

interface ScheduleItem {
  _id: string;
  name: string;
  startTime: string;
  endTime: string;
  location?: string;
  pic?: string;
  isOnline?: boolean;
}

interface AttendanceSession {
  _id: string;
  title: string;
  startTime: string;
  endTime: string;
  location?: string;
  isOnline?: boolean;
  targetParticipantType?: string;
}

interface AttendanceRecord {
  session: { _id: string };
  status?: string;
}

const dayLabel = (key: string) => {
  const todayKey = wibDayKey(new Date());
  if (key === todayKey) return "Hari Ini";
  if (key === shiftDayKey(todayKey, 1)) return "Besok";
  const [y, m, d] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(y, m - 1, d));
};

const isToday = (key: string) => key === wibDayKey(new Date());

export default function JadwalMabaPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const now = useNow();

  const fetchData = useCallback(async () => {
    setError(false);
    setLoading(true);
    try {
      const [schedRes, sessRes, histRes] = await Promise.all([
        apiFetch("/pkkmb/schedules?limit=100"),
        apiFetch("/pkkmb/attendance/sessions?status=PUBLISHED"),
        apiFetch("/pkkmb/attendance/my-history"),
      ]);

      const schedJson = await schedRes.json();
      const sessJson = await sessRes.json();
      const histJson = await histRes.json();

      const schedData = Array.isArray(schedJson.data)
        ? schedJson.data
        : schedJson.data?.items || [];
      setSchedules(schedData);

      const sessData: AttendanceSession[] = Array.isArray(sessJson.data)
        ? sessJson.data
        : sessJson.data?.items || [];
      setSessions(
        sessData.filter(
          (s) =>
            !s.targetParticipantType ||
            s.targetParticipantType === "ALL" ||
            s.targetParticipantType === "MABA",
        ),
      );
      setHistory(
        Array.isArray(histJson.data) ? histJson.data : histJson.data?.items || [],
      );
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- inisialisasi state awal halaman (pola sama dgn MabaDashboard)
    void fetchData();
  }, [fetchData]);

  // Kelompokkan jadwal per hari (WIB)
  const grouped = schedules.reduce<Record<string, ScheduleItem[]>>((acc, s) => {
    const key = wibDayKey(s.startTime);
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});
  const dayKeys = Object.keys(grouped).sort();

  // Sesi presensi hari ini (WIB)
  const todayKey = wibDayKey(new Date());
  const todaySessions = sessions.filter(
    (s) => wibDayKey(s.startTime) === todayKey,
  );
  const recordedSessionIds = new Set(
    history.map((r) => r.session?._id?.toString()),
  );

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold">
          📅 Jadwal PKKMB
        </h1>
        <p className="text-sm text-white/50 mt-1">
          Rangkaian kegiatan resmi — cek mode <span className="text-blue-300 font-semibold">ONLINE</span> /{" "}
          <span className="text-green-300 font-semibold">OFFLINE</span> dan lokasi setiap kegiatan.
        </p>
      </div>

      {/* Seksi Presensi Hari Ini */}
      <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-4 md:p-5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2 className="font-bold text-white flex items-center gap-2">
            <Camera className="w-4 h-4 text-gold-400" />
            Presensi Hari Ini
          </h2>
          <Link
            href="/dashboard/presensi"
            className="text-xs text-gold-500 hover:text-gold-400 font-semibold inline-flex items-center gap-1"
          >
            Buka Halaman Presensi <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-2 mt-4">
            <div className="h-16 rounded-xl bg-white/5 animate-pulse" />
            <div className="h-16 rounded-xl bg-white/5 animate-pulse" />
          </div>
        ) : todaySessions.length === 0 ? (
          <p className="mt-4 text-sm text-white/40">
            Tidak ada sesi presensi hari ini. Pantau terus ya! 👀
          </p>
        ) : (
          <div className="mt-4 space-y-2">
            {todaySessions.map((s) => {
              const period = getPeriodStatus(now, s.startTime, s.endTime);
              const recorded = recordedSessionIds.has(s._id);
              return (
                <div
                  key={s._id}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-3.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white truncate">
                      {s.title}
                    </p>
                    <p className="text-xs text-white/50 mt-0.5 flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatWIB(s.startTime, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        –
                        {formatWIB(s.endTime, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {s.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {s.location}
                        </span>
                      )}
                    </p>
                  </div>
                  {recorded ? (
                    <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Tercatat
                    </span>
                  ) : period === "aktif" ? (
                    <Link
                      href="/dashboard/presensi"
                      className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gold-500 text-black text-xs font-black hover:bg-gold-400 transition-colors"
                    >
                      <Camera className="w-3.5 h-3.5" /> Presensi Sekarang
                    </Link>
                  ) : (
                    <span className="shrink-0 text-[11px] text-white/40 font-semibold">
                      {period === "belum" ? "Belum dibuka" : "Sesi selesai"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Daftar Jadwal */}
      <section className="space-y-6">
        {loading ? (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-5 animate-pulse space-y-3">
                <div className="h-4 w-1/3 rounded bg-white/10" />
                <div className="h-16 rounded-xl bg-white/5" />
                <div className="h-16 rounded-xl bg-white/5" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/25 bg-red-500/5 p-6 text-center">
            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-white/70 text-sm">
              Gagal memuat jadwal. Periksa koneksi lalu coba lagi.
            </p>
            <button
              onClick={() => void fetchData()}
              className="mt-4 px-5 py-2.5 bg-gold-500 hover:bg-gold-400 text-black rounded-xl font-bold text-sm transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        ) : dayKeys.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
            <p className="text-3xl mb-2">🎉</p>
            <p className="text-white font-semibold">
              Belum ada jadwal kegiatan
            </p>
            <p className="text-sm text-white/40 mt-1">
              Panitia akan mengumumkan jadwal PKKMB di sini.
            </p>
          </div>
        ) : (
          dayKeys.map((key) => {
            const pastDay = key < todayKey;
            return (
            <div key={key} className={pastDay ? "opacity-50" : ""}>
              <div className="flex items-center gap-2 mb-2.5 px-1">
                <span
                  className={`text-sm font-bold ${
                    isToday(key) ? "text-gold-500" : "text-white/70"
                  }`}
                >
                  {dayLabel(key)}
                </span>
                {isToday(key) && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-400 font-bold">
                    SEKARANG
                  </span>
                )}
                {pastDay && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/40 font-bold">
                    SELESAI
                  </span>
                )}
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <div className="space-y-2">
                {grouped[key].map((s) => {
                  const period = getPeriodStatus(now, s.startTime, s.endTime);
                  const live = period === "aktif";
                  return (
                    <div
                      key={s._id}
                      className={`rounded-2xl border p-4 bg-gradient-to-br from-white/[0.05] to-white/[0.02] ${
                        live ? "border-gold-500/40" : "border-white/10"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-white leading-snug">
                            {s.name}
                          </p>
                          <p className="text-xs text-white/50 mt-1 inline-flex items-center gap-1.5">
                            <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                            {formatWIB(s.startTime, {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {" – "}
                            {formatWIB(s.endTime, {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            WIB
                          </p>
                        </div>
                        <span
                          className={`shrink-0 text-[11px] px-2.5 py-1 rounded-full border font-bold inline-flex items-center gap-1.5 ${
                            s.isOnline
                              ? "bg-blue-500/10 border-blue-500/30 text-blue-300"
                              : "bg-green-500/10 border-green-500/30 text-green-300"
                          }`}
                        >
                          {s.isOnline ? (
                            <Wifi className="w-3 h-3" />
                          ) : (
                            <WifiOff className="w-3 h-3" />
                          )}
                          {s.isOnline ? "ONLINE" : "OFFLINE"}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-white/60">
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-white/40" />
                          {s.isOnline
                            ? "Daring (Online)"
                            : s.location || "Lokasi menyusul"}
                        </span>
                        {s.pic && (
                          <span className="inline-flex items-center gap-1.5">
                            <UserIcon className="w-3.5 h-3.5 text-white/40" />
                            PIC: {s.pic}
                          </span>
                        )}
                        {live && (
                          <span className="inline-flex items-center gap-1.5 text-gold-400 font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" />
                            Sedang Berlangsung
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            );
          })
        )}
      </section>

      {!loading && !error && dayKeys.length > 0 && (
        <p className="text-center text-xs text-white/30 pb-2">
          Semua jadwal ditampilkan dalam waktu WIB
        </p>
      )}
    </div>
  );
}
