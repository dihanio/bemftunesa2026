"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  RotateCcw,
  BookOpen,
  MessagesSquare,
  Megaphone,
} from "lucide-react";
import { API_URL, apiFetch } from "@/lib/api";
import { getPeriodStatus } from "@/lib/presensi-time";
import {
  pendampingWaLink,
  quizCounts,
  type MabaAnnouncement,
  type MabaAssignment,
  type MabaGroup,
  type MabaRibbon,
  type MabaSchedule,
} from "@/lib/maba";
import HeroToday from "./HeroToday";
import NextActions from "./NextActions";
import StatStrip from "./StatStrip";
import PitaCard from "./PitaCard";

type AttendanceState =
  | { state: "active" | "done" | "none"; checkInTime?: string }
  | null;

interface DashboardData {
  name: string;
  avatarUrl: string | null;
  isKetuaGugus: boolean;
  group: MabaGroup | null;
  schedule: MabaSchedule | null;
  announcements: MabaAnnouncement[];
  taskSubmitted: number;
  taskTotal: number;
  quizDone: number;
  quizTotal: number;
  points: number | null;
  attendance: AttendanceState;
  assignments: MabaAssignment[];
  ribbon: MabaRibbon;
  bukuPanduanUrl: string;
  pusatBantuanUrl: string;
}

interface SessionItem {
  _id: string;
  startTime?: string;
  endTime?: string;
  targetParticipantType?: string;
}
interface HistoryItem {
  session?: { _id?: string };
  status?: string;
  checkInTime?: string;
}

export default function MabaDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    let coreFailed = false;
    try {
      // apiFetch: auto-refresh saat access token kedaluwarsa (401/403) via
      // refresh token 30 hari — maba tidak perlu login ulang tiap token expire.
      const [
        dashRes,
        meRes,
        assignRes,
        pointsRes,
        sessRes,
        histRes,
        linksRes,
        healthRes,
      ] = await Promise.all([
        apiFetch("/pkkmb/dashboard/maba"),
        apiFetch("/auth/me"),
        apiFetch("/pkkmb/assignments"),
        apiFetch("/pkkmb/maba/points/summary"),
        apiFetch("/pkkmb/attendance/sessions?status=PUBLISHED"),
        apiFetch("/pkkmb/attendance/my-history"),
        apiFetch("/settings/public/links"),
        apiFetch("/pkkmb/health/me"),
      ]);

      const dashJson = dashRes.ok ? await dashRes.json().catch(() => null) : null;
      const meJson = meRes.ok ? await meRes.json().catch(() => null) : null;
      const assignJson = assignRes.ok
        ? await assignRes.json().catch(() => null)
        : null;
      const pointsJson = pointsRes.ok
        ? await pointsRes.json().catch(() => null)
        : null;
      const sessJson = sessRes.ok ? await sessRes.json().catch(() => null) : null;
      const histJson = histRes.ok ? await histRes.json().catch(() => null) : null;
      const linksJson = linksRes.ok
        ? await linksRes.json().catch(() => null)
        : null;
      const healthJson = healthRes.ok
        ? await healthRes.json().catch(() => null)
        : null;

      if (!dashJson?.success || !assignJson?.success) {
        coreFailed = true;
        throw new Error("core-failed");
      }

      const dash = dashJson.data || {};
      const me = meJson?.data || {};
      const user = dash.user || {};
      const group: MabaGroup | null = user.pkkmbGroup || null;

      // Status presensi hari ini: sesi PUBLISHED yang sedang aktif + riwayat.
      // Sesi panitia-saja (PANITIA) tidak relevan bagi MABA.
      const sessions: SessionItem[] = ((sessJson?.data || []) as SessionItem[]).filter(
        (s) =>
          !s.targetParticipantType ||
          s.targetParticipantType === "ALL" ||
          s.targetParticipantType === "MABA",
      );
      const history: HistoryItem[] = histJson?.data || [];
      const now = Date.now();
      const activeSession =
        sessions.find(
          (s) =>
            getPeriodStatus(now, s.startTime, s.endTime) === "aktif",
        ) || null;
      const attended = activeSession
        ? history.find(
            (r) =>
              r.session?._id === activeSession._id &&
              String(r.status || "").toUpperCase() === "HADIR",
          )
        : null;

      const assignments: MabaAssignment[] = assignJson.data || [];
      const qc = quizCounts(assignments);

      const rawAvatar = me.avatar || me.image || user.avatar || null;
      setData({
        name: me.name || user.name || "Maba Adrata",
        avatarUrl:
          rawAvatar && rawAvatar.startsWith("/")
            ? `${API_URL}${rawAvatar}`
            : rawAvatar,
        isKetuaGugus: !!me.isKetuaGugus,
        group,
        schedule: dash.upcomingSchedules?.[0] || null,
        announcements: dash.announcements || [],
        taskSubmitted: dash.tasks?.submitted || 0,
        taskTotal: dash.tasks?.total || 0,
        quizDone: qc.done,
        quizTotal: qc.total,
        points: pointsJson?.data?.totalPoints ?? null,
        attendance: attended
          ? { state: "done", checkInTime: attended.checkInTime }
          : activeSession
            ? { state: "active" }
            : { state: "none" },
        assignments,
        ribbon: healthJson?.data?.ribbon || null,
        bukuPanduanUrl:
          linksJson?.data?.pkkmb_buku_panduan_url || "#",
        pusatBantuanUrl:
          linksJson?.data?.pkkmb_pusat_bantuan_url || "#",
      });
    } catch {
      if (coreFailed) {
        setError(
          "Gagal memuat data dashboard. Periksa koneksi internet lalu coba lagi.",
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch data sekali saat mount
    void load();
  }, [load, reloadKey]);

  if (loading && !data) {
    return (
      <div className="space-y-6" aria-busy="true">
        <div className="h-52 rounded-3xl bg-white/5 animate-pulse" />
        <div className="h-40 rounded-3xl bg-white/5 animate-pulse" />
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-8 text-center">
        <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-white/80 font-semibold">Gagal memuat dashboard</p>
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

  return (
    <div className="space-y-8">
      {error && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3">
          <p className="text-sm text-red-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </p>
          <button
            onClick={() => setReloadKey((k) => k + 1)}
            className="shrink-0 inline-flex items-center gap-1.5 text-xs font-bold text-gold-400 hover:text-gold-300"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Coba Lagi
          </button>
        </div>
      )}

      <HeroToday
        name={data.name}
        avatarUrl={data.avatarUrl}
        group={data.group}
        schedule={data.schedule}
        attendance={data.attendance}
      />

      <PitaCard ribbon={data.ribbon} />

      <NextActions
        assignments={data.assignments}
        isKetuaGugus={data.isKetuaGugus}
        onSubmitted={() => setReloadKey((k) => k + 1)}
      />

      <StatStrip
        taskSubmitted={data.taskSubmitted}
        taskTotal={data.taskTotal}
        quizDone={data.quizDone}
        quizTotal={data.quizTotal}
        points={data.points}
      />

      {data.announcements.length > 0 && (
        <section>
          <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-gold-500" /> Papan Pengumuman
          </h3>
          <div className="space-y-3">
            {data.announcements.slice(0, 2).map((ann, idx) => (
              <div
                key={ann._id || idx}
                className="bg-white/[0.02] border border-white/10 rounded-2xl p-4"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-white">{ann.title}</p>
                  {ann.isPriority && (
                    <span className="bg-red-500/20 text-red-400 text-[10px] px-2 py-0.5 rounded font-bold border border-red-500/30">
                      Penting
                    </span>
                  )}
                </div>
                <p className="text-xs text-white/60 leading-relaxed mt-1.5 line-clamp-2">
                  {ann.content}
                </p>
                <p className="text-[10px] text-white/40 mt-2">
                  {new Date(ann.createdAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <a
          href={data.bukuPanduanUrl}
          target={data.bukuPanduanUrl !== "#" ? "_blank" : "_self"}
          rel="noreferrer"
          className="flex items-center gap-3 bg-white/[0.02] border border-white/10 rounded-2xl p-4 hover:bg-white/[0.06] transition-colors"
        >
          <div className="p-2.5 rounded-xl bg-gold-500/10 text-gold-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">Buku Panduan PKKMB</p>
            <p className="text-xs text-white/40">Tata tertib & daftar atribut</p>
          </div>
        </a>
        <a
          href={pendampingWaLink(data.group, data.name, data.pusatBantuanUrl)}
          target={
            pendampingWaLink(data.group, data.name, data.pusatBantuanUrl) !== "#"
              ? "_blank"
              : "_self"
          }
          rel="noreferrer"
          className="flex items-center gap-3 bg-white/[0.02] border border-white/10 rounded-2xl p-4 hover:bg-white/[0.06] transition-colors"
        >
          <div className="p-2.5 rounded-xl bg-green-500/10 text-green-400">
            <MessagesSquare className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">
              {data.group ? "Hubungi Pendamping" : "Pusat Bantuan"}
            </p>
            <p className="text-xs text-white/40">
              {data.group?.pendampingName
                ? `Kak ${data.group.pendampingName}`
                : "Tim IT PKKMB"}
            </p>
          </div>
        </a>
      </section>
    </div>
  );
}
