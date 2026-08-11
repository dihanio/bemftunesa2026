"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  BellRing,
  ClipboardList,
  FileText,
  Camera,
  CalendarDays,
  ArrowRight,
  CheckCheck,
  AlertTriangle,
} from "lucide-react";
import { API_URL } from "@/lib/api";
import {
  notificationHref,
  type MabaNotification,
} from "@/lib/maba";

interface NotifPayload {
  unreadCount: number;
  items: MabaNotification[];
}

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "Baru saja";
  if (min < 60) return `${min} menit lalu`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} jam lalu`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} hari lalu`;
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

function actionMeta(
  n: MabaNotification,
  href: string | null,
): { icon: React.ReactNode; cls: string } {
  const t = (n.actionType || "").toLowerCase();
  if (t === "quiz")
    return {
      icon: <ClipboardList className="w-5 h-5" />,
      cls: "bg-purple-500/10 border-purple-500/30 text-purple-300",
    };
  if (t === "task")
    return {
      icon: <FileText className="w-5 h-5" />,
      cls: "bg-blue-500/10 border-blue-500/30 text-blue-300",
    };
  if (t === "attendance")
    return {
      icon: <Camera className="w-5 h-5" />,
      cls: "bg-green-500/10 border-green-500/30 text-green-300",
    };
  if (t === "schedule")
    return {
      icon: <CalendarDays className="w-5 h-5" />,
      cls: "bg-amber-500/10 border-amber-500/30 text-amber-300",
    };
  // Pengumuman lama (tanpa actionType): ikon disesuaikan hasil inferensi
  // agar tidak tampil ikon umum padahal CTA mengarah ke halaman tertentu.
  if (href && href.includes("/presensi"))
    return {
      icon: <Camera className="w-5 h-5" />,
      cls: "bg-green-500/10 border-green-500/30 text-green-300",
    };
  if (href && href.includes("/jadwal"))
    return {
      icon: <CalendarDays className="w-5 h-5" />,
      cls: "bg-amber-500/10 border-amber-500/30 text-amber-300",
    };
  if (href && (href.includes("/assignments") || href.includes("/quiz")))
    return {
      icon: <ClipboardList className="w-5 h-5" />,
      cls: "bg-purple-500/10 border-purple-500/30 text-purple-300",
    };
  return {
    icon: <Bell className="w-5 h-5" />,
    cls: "bg-white/5 border-white/15 text-white/50",
  };
}

export default function NotifikasiPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [data, setData] = useState<NotifPayload>({ unreadCount: 0, items: [] });

  const fetchData = useCallback(async () => {
    setError(false);
    setLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/api/v1/pkkmb/dashboard/maba/announcements/notifications?limit=50`,
        { credentials: "include" },
      );
      if (res.ok) {
        const json = await res.json();
        if (json.success)
          setData({
            unreadCount: json.data.unreadCount || 0,
            items: json.data.items || [],
          });
        else setError(true);
      } else {
        setError(true);
      }
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

  const markRead = async (ids?: string[]) => {
    const idSet = ids && ids.length > 0 ? new Set(ids) : null;
    setData((prev) => ({
      unreadCount: idSet
        ? prev.items.filter((i) => idSet.has(i._id) && !i.isRead).length
          ? prev.unreadCount -
            prev.items.filter((i) => idSet.has(i._id) && !i.isRead).length
          : prev.unreadCount
        : 0,
      items: prev.items.map((i) =>
        idSet && !idSet.has(i._id)
          ? i
          : { ...i, isRead: true },
      ),
    }));
    try {
      const res = await fetch(
        `${API_URL}/api/v1/pkkmb/dashboard/maba/announcements/read`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(
            idSet ? { announcementIds: ids } : {},
          ),
        },
      );
      if (res.ok) {
        const json = await res.json();
        if (json.success)
          setData((prev) => ({
            ...prev,
            unreadCount: json.data.unreadCount ?? prev.unreadCount,
          }));
      }
    } catch {
      /* abaikan — status dibaca tetap di-update lokal */
    }
  };

  const openItem = (n: MabaNotification) => {
    if (!n.isRead) void markRead([n._id]);
    const href = notificationHref(n);
    if (href) router.push(href);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold flex items-center gap-2">
            🔔 Notifikasi
            {data.unreadCount > 0 && (
              <span className="text-xs font-black px-2 py-1 rounded-full bg-gold-500 text-black">
                {data.unreadCount} baru
              </span>
            )}
          </h1>
          <p className="text-sm text-white/50 mt-1">
            Pengumuman penting seputar PKKMB — tap notifikasi untuk langsung ke
            kegiatannya.
          </p>
        </div>
        {data.unreadCount > 0 && (
          <button
            onClick={() => void markRead()}
            className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gold-500 hover:text-gold-400 transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            Tandai semua dibaca
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 animate-pulse space-y-2.5"
            >
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-2/3 rounded bg-white/10" />
                  <div className="h-3 w-full rounded bg-white/5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/25 bg-red-500/5 p-8 text-center">
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-white/70 text-sm">
            Gagal memuat notifikasi. Periksa koneksi lalu coba lagi.
          </p>
          <button
            onClick={() => void fetchData()}
            className="mt-4 px-5 py-2.5 bg-gold-500 hover:bg-gold-400 text-black rounded-xl font-bold text-sm transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      ) : data.items.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
          <BellRing className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-white font-semibold">Tidak ada notifikasi</p>
          <p className="text-sm text-white/40 mt-1">
            Pengumuman dari panitia akan muncul di sini.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {data.items.map((n) => {
            const href = notificationHref(n);
            const meta = actionMeta(n, href);
            return (
              <div
                key={n._id}
                onClick={() => openItem(n)}
                className={`cursor-pointer rounded-2xl border p-4 transition-colors ${
                  n.isRead
                    ? "border-white/10 bg-gradient-to-br from-white/[0.03] to-white/[0.01] hover:bg-white/[0.04]"
                    : "border-gold-500/25 bg-gradient-to-br from-gold-500/[0.07] to-white/[0.02] hover:from-gold-500/[0.1]"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${meta.cls}`}
                  >
                    {meta.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={`text-sm leading-snug truncate ${
                          n.isRead
                            ? "text-white/80 font-medium"
                            : "text-white font-bold"
                        }`}
                      >
                        {n.title}
                      </p>
                      {!n.isRead && (
                        <span className="shrink-0 w-2 h-2 rounded-full bg-gold-500" />
                      )}
                    </div>
                    <p className="text-xs text-white/50 mt-1 line-clamp-2">
                      {n.content}
                    </p>
                    <div className="flex items-center justify-between gap-2 mt-2.5 flex-wrap">
                      <span className="text-[11px] text-white/35">
                        {timeAgo(n.createdAt)}
                        {n.isPriority && (
                          <span className="ml-2 text-red-400 font-bold">
                            ● Penting
                          </span>
                        )}
                      </span>
                      <div className="flex items-center gap-2">
                        {!n.isRead && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              void markRead([n._id]);
                            }}
                            className="text-[11px] text-white/50 hover:text-white font-semibold px-2 py-1 rounded-lg hover:bg-white/5"
                          >
                            Tandai dibaca
                          </button>
                        )}
                        {href && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gold-500">
                            Buka <ArrowRight className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
