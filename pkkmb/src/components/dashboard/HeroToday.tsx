"use client";

import { useState } from "react";
import Link from "next/link";
import { greeting, pkkmbDay, type MabaGroup, type MabaSchedule } from "@/lib/maba";
import { formatWIB } from "@/lib/presensi-time";

interface HeroTodayProps {
  name: string;
  avatarUrl?: string | null;
  group: MabaGroup | null;
  schedule: MabaSchedule | null;
  attendance:
    | { state: "active" | "done" | "none"; checkInTime?: string }
    | null;
}

export default function HeroToday({
  name,
  avatarUrl,
  group,
  schedule,
  attendance,
}: HeroTodayProps) {
  const firstName = (name || "Maba").trim().split(" ")[0];
  const day = pkkmbDay();
  // Fallback inisial bila avatar gagal dimuat (url rusak / diblokir) —
  // mencegah browser menampilkan teks alt "Avatar" yang jelek di layar.
  const [imgFailed, setImgFailed] = useState(false);

  const scheduleIsToday = (() => {
    if (!schedule) return false;
    const s = new Date(schedule.startTime);
    const n = new Date();
    return (
      s.getDate() === n.getDate() &&
      s.getMonth() === n.getMonth() &&
      s.getFullYear() === n.getFullYear()
    );
  })();

  return (
    <section className="relative overflow-hidden rounded-3xl border border-gold-500/20 bg-gradient-to-br from-gold-500/[0.12] via-white/[0.03] to-transparent p-6 md:p-8">
      <div className="absolute inset-0 bg-gradient-to-r from-gold-500/10 to-transparent pointer-events-none" />

      {/* Baris identitas */}
      <div className="relative z-10 flex flex-wrap items-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-gold-500/40 bg-white/10 overflow-hidden shrink-0">
          {avatarUrl && !imgFailed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={`Avatar ${firstName}`}
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gold-500 font-bold">
              {name?.charAt(0) || "M"}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-xl md:text-2xl font-bold truncate">
            {greeting()}, <span className="text-gold-500">{firstName}</span>!
          </h2>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            {group ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-gold-500/30 bg-gold-500/10 text-gold-400 text-xs font-bold">
                Gugus {String(group.nomor).padStart(2, "0")}: {group.name}
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full border border-white/10 bg-white/5 text-white/40 text-xs">
                Gugus belum ditetapkan
              </span>
            )}
            {day !== null && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full border border-white/10 bg-white/5 text-white/60 text-xs font-medium">
                Hari ke-{day}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Kegiatan berikutnya */}
      <div data-dash-schedule className="relative z-10 mt-6 rounded-2xl border border-white/10 bg-black/30 p-4 md:p-5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-xs font-bold uppercase tracking-wider text-white/40">
            {scheduleIsToday ? "Kegiatan Hari Ini" : "Kegiatan Berikutnya"}
          </p>
          {schedule && (
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold inline-flex items-center gap-1.5 ${
                schedule.isOnline
                  ? "bg-blue-500/10 border-blue-500/30 text-blue-300"
                  : "bg-green-500/10 border-green-500/30 text-green-300"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  schedule.isOnline ? "bg-blue-400" : "bg-green-400"
                }`}
              />
              {schedule.isOnline ? "ONLINE" : "OFFLINE"}
            </span>
          )}
        </div>

        {schedule ? (
          <div className="mt-3 space-y-2">
            <p className="text-white font-semibold text-base md:text-lg leading-snug">
              {schedule.name}
            </p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-white/60">
              <span>
                {formatWIB(schedule.startTime, {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {" – "}
                {formatWIB(schedule.endTime, {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {" WIB"}
              </span>
              {schedule.location && <span>{schedule.location}</span>}
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-white/40 italic">
            Belum ada jadwal yang diumumkan.
          </p>
        )}
      </div>

      {/* Status presensi hari ini */}
      <div className="relative z-10 mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
        {attendance?.state === "active" && (
          <Link
            href="/dashboard/presensi"
            className="inline-flex items-center justify-center gap-2 bg-gold-500 hover:bg-gold-400 text-black font-bold px-5 py-3 rounded-xl transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(234,179,8,0.3)]"
          >
            Presensi Sekarang
          </Link>
        )}
        {attendance?.state === "done" && (
          <div className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-green-500/30 bg-green-500/10 text-green-400 font-semibold text-sm">
            <span
              className="w-1.5 h-1.5 rounded-full bg-green-400"
              aria-hidden="true"
            />
            Sudah presensi{attendance.checkInTime ? ` ${formatWIB(attendance.checkInTime, { hour: "2-digit", minute: "2-digit" })} WIB` : ""}
          </div>
        )}
        {attendance?.state === "none" && (
          <p className="text-xs text-white/40">
            Belum ada sesi presensi yang sedang berlangsung.
          </p>
        )}
        {group?.grupLink && (
          <a
            href={group.grupLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-green-500/30 bg-green-500/10 text-green-400 text-sm font-semibold hover:bg-green-500/20 transition-colors"
          >
            Gabung Grup Gugus
          </a>
        )}
      </div>
    </section>
  );
}
