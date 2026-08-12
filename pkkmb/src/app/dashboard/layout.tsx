"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { API_URL, apiFetch } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";
import { Home, User, FileText, CheckSquare, Users, ShieldAlert, MonitorSmartphone, Bell, ClipboardList, CalendarDays, QrCode, Wrench } from "lucide-react";
import { notificationHref, type MabaNotification } from "@/lib/maba";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  active: boolean;
  badge?: number;
}

interface UserProfile {
  id: string;
  name: string;
  role: { name: string, slug?: string } | string;
  image?: string;
  avatar?: string;
  division?: string;
  isOnboarded?: boolean;
  permissions?: string[];
}

type NotifItem = MabaNotification;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<{ user: UserProfile } | null>(null);
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");
  const [now, setNow] = useState(new Date());
  const [notif, setNotif] = useState<{ unreadCount: number; items: NotifItem[] }>({ unreadCount: 0, items: [] });
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // apiFetch: kalau access token kedaluwarsa (401/403), otomatis
        // refresh via refreshToken (30 hari) lalu retry — user tidak perlu
        // login ulang. Hanya ketika refresh pun gagal, barulah dianggap
        // unauthenticated. Error jaringan (network) TIDAK mengarahkan ke
        // /login — biarkan loading, user tinggal coba lagi.
        const res = await apiFetch("/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            setSession({ user: data.data });
            setStatus("authenticated");
          } else {
            setStatus("unauthenticated");
          }
        } else {
          setStatus("unauthenticated");
        }
      } catch {
        // Jangan logout saat error jaringan — status tetap loading.
      }
    };
    
    fetchProfile();
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    const roleObj = session?.user?.role;
    const roleString =
      typeof roleObj === "object" && roleObj !== null
        ? (roleObj.slug || roleObj.name || "user").toLowerCase()
        : String(roleObj || "user").toLowerCase();
    // Feed notifikasi khusus maba — jangan fetch untuk panitia/pendamping.
    if (roleString !== "maba" && roleString !== "user") return;
    const fetchNotif = async () => {
      try {
        // limit besar agar unreadCount akurat (default backend = 3)
        const res = await apiFetch("/pkkmb/dashboard/maba/announcements/notifications?limit=50");
        if (res.ok) {
          const json = await res.json();
          if (json.success) setNotif({ unreadCount: json.data.unreadCount, items: json.data.items });
        }
      } catch {}
    };
    fetchNotif();
    const t = setInterval(fetchNotif, 60000);
    return () => clearInterval(t);
  }, [status, session]);

  const markRead = async (ids?: string[]) => {
    setNotif((prev) => {
      if (ids && ids.length > 0) {
        const idSet = new Set(ids);
        return {
          unreadCount: prev.items.filter((i) => idSet.has(i._id) && !i.isRead).length
            ? prev.unreadCount - prev.items.filter((i) => idSet.has(i._id) && !i.isRead).length
            : prev.unreadCount,
          items: prev.items.map((i) => (idSet.has(i._id) ? { ...i, isRead: true } : i)),
        };
      }
      return { unreadCount: 0, items: prev.items.map((i) => ({ ...i, isRead: true })) };
    });
    try {
      const res = await apiFetch("/pkkmb/dashboard/maba/announcements/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ids && ids.length > 0 ? { announcementIds: ids } : {}),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) setNotif((prev) => ({ ...prev, unreadCount: json.data.unreadCount }));
      }
    } catch {}
  };

  const openNotification = (item: NotifItem) => {
    setNotifOpen(false);
    if (!item.isRead) markRead([item._id]);
    const roleObj = session?.user?.role;
    const roleString =
      typeof roleObj === "object" && roleObj !== null
        ? (roleObj.slug || roleObj.name || "user").toLowerCase()
        : String(roleObj || "user").toLowerCase();
    const isMaba = roleString === "maba" || roleString === "user";
    // Halaman Notifikasi khusus MABA; panitia/admin tetap ke dashboard.
    router.push(notificationHref(item) || (isMaba ? "/dashboard/notifikasi" : "/dashboard"));
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session) {
      const roleObj = session.user.role;
      const roleString = typeof roleObj === 'object' && roleObj !== null
        ? (roleObj.slug || roleObj.name || 'user').toLowerCase()
        : String(roleObj || 'user').toLowerCase();

      // Jika role adalah maba dan belum onboard, tendang ke /onboarding
      if ((roleString === 'maba' || roleString === 'user') && !session.user.isOnboarded) {
        router.push("/onboarding");
      }
    }
  }, [status, session, router]);

  const handleLogout = () => {
    setConfirmLogout(true);
    setProfileOpen(false);
  };

  const doLogout = async () => {
    setConfirmLogout(false);
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {
      /* tetap arahkan ke login */
    }
    router.push("/login");
  };

  const menus = useMemo(() => {
    if (!session) return [];
    
    const roleObj = session.user.role;
    const roleString = typeof roleObj === 'object' && roleObj !== null
      ? (roleObj.slug || roleObj.name || 'user').toLowerCase()
      : String(roleObj || 'user').toLowerCase();

    const division = (session.user.division || '').toLowerCase();
    
    // Default maba if role is not panitia or admin
    const isMaba = roleString === 'maba' || roleString === 'user';

    if (isMaba) {
      // 5 menu utama: Beranda / Aktivitas / Jadwal / Notifikasi / Profil.
      // Presensi & Skor Keaktifan bersifat kontekstual (CTA di hero & stat
      // dashboard) agar Maba tidak kebingungan dengan banyak menu.
      const items: NavItem[] = [
        { label: "Beranda", href: "/dashboard", icon: <Home className="w-5 h-5" />, active: pathname === "/dashboard" },
        { label: "Aktivitas", href: "/dashboard/assignments", icon: <ClipboardList className="w-5 h-5" />, active: pathname.startsWith("/dashboard/assignments") || pathname.startsWith("/dashboard/quiz") || pathname === "/dashboard/tugas" },
        { label: "Jadwal", href: "/dashboard/jadwal", icon: <CalendarDays className="w-5 h-5" />, active: pathname.startsWith("/dashboard/jadwal") },
        { label: "Notifikasi", href: "/dashboard/notifikasi", icon: <Bell className="w-5 h-5" />, active: pathname === "/dashboard/notifikasi", badge: notif.unreadCount },
        { label: "Profil", href: "/dashboard/profil", icon: <User className="w-5 h-5" />, active: pathname === "/dashboard/profil" },
      ];
      return items;
    } else {
      // Panitia / Admin / Evaluator
      const isPendamping = division.includes('pendamping');
      const isSekretaris = division.includes('sekretaris');
      const isBph = division.includes('bph');
      const isPemateri = division.includes('pemateri') || division.includes('acara');
      const isKsk = division.includes('ksk');
      const isTatib = division.includes('tatib') || division.includes('komdis') || division.includes('tata tertib');

      const items: NavItem[] = [
        { label: roleString === 'super_admin' ? "Admin Panel" : isPendamping ? "Portal Pendamping" : "Portal Panitia", href: "/dashboard", icon: <MonitorSmartphone className="w-5 h-5" />, active: pathname === "/dashboard" },
      ];

      // Data Maba — management gugus sendiri (pendamping boleh penuh).
      if (roleString === 'super_admin' || roleString === 'admin_pkkmb' || roleString === 'panitia' || isPendamping || isSekretaris || isBph) {
        items.push({ label: "Data Maba", href: "/dashboard/manage/maba", icon: <Users className="w-5 h-5" />, active: pathname === "/dashboard/manage/maba" });
      }

      // Evaluasi Penugasan — read-only utk pendamping (di-scope gugusnya).
      if (roleString === 'super_admin' || roleString === 'admin_pkkmb' || isPendamping || isSekretaris || isPemateri) {
        items.push({ label: "Evaluasi Penugasan", href: "/dashboard/manage/evaluator", icon: <FileText className="w-5 h-5" />, active: pathname === "/dashboard/manage/evaluator" });
      }

      // Manajemen Penugasan (TASK & QUIZ assignments) — tugas Sie Acara.
      if (roleString === 'super_admin' || roleString === 'admin_pkkmb' || isSekretaris || isPemateri) {
        items.push({ label: "Manajemen Penugasan", href: "/dashboard/manage/assignments", icon: <FileText className="w-5 h-5" />, active: pathname.startsWith("/dashboard/manage/assignments") });
      }

      // Kontrol Presensi — read-only utk pendamping; aksi management dibatasi
      // division di halaman (KSK) — backend tetap authority.
      if (roleString === 'super_admin' || roleString === 'admin_pkkmb' || isPendamping || isSekretaris || isBph || isKsk) {
        items.push({ label: "Kontrol Presensi", href: "/dashboard/manage/attendance", icon: <CheckSquare className="w-5 h-5" />, active: pathname === "/dashboard/manage/attendance" });
      }

      // QR Poin Keaktifan — tugas Sie KSK.
      if (roleString === 'super_admin' || roleString === 'admin_pkkmb' || isSekretaris || isBph || isKsk) {
        items.push({ label: "QR Poin Keaktifan", href: "/dashboard/manage/qrpoints", icon: <QrCode className="w-5 h-5" />, active: pathname === "/dashboard/manage/qrpoints" });
      }

      // Tata Tertib
      if (roleString === 'super_admin' || roleString === 'admin_pkkmb' || isTatib) {
        items.push({ label: "Tata Tertib", href: "/dashboard/manage/komdis", icon: <ShieldAlert className="w-5 h-5" />, active: pathname === "/dashboard/manage/komdis" });
      }

      // Manajemen Akun & Gugus (Super Admin)
      if (roleString === 'super_admin') {
        items.push({ label: "Manajemen Gugus", href: "/dashboard/manage/groups", icon: <Users className="w-5 h-5" />, active: pathname === "/dashboard/manage/groups" });
        items.push({ label: "Manajemen Akun", href: "/dashboard/manage/users", icon: <User className="w-5 h-5" />, active: pathname === "/dashboard/manage/users" });
        items.push({ label: "Mode Maintenance", href: "/dashboard/manage/maintenance", icon: <Wrench className="w-5 h-5" />, active: pathname === "/dashboard/manage/maintenance" });
      }

      // Manajemen Quiz (permission-based, frontend visibility only) —
      // bukan menu pendamping.
      const perms = Array.isArray(session.user.permissions) ? session.user.permissions : [];
      const canManageQuiz = !isPendamping && (perms.includes('manage:all') || perms.includes('pkkmb.quiz.create') || perms.includes('pkkmb.quiz.update'));
      if (canManageQuiz) {
        items.push({ label: "Manajemen Quiz", href: "/dashboard/manage/quiz", icon: <ClipboardList className="w-5 h-5" />, active: pathname.startsWith("/dashboard/manage/quiz") });
      }

      return items;
    }
  }, [session, pathname, notif.unreadCount]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center relative z-50">
        <div className="w-10 h-10 border-4 border-gold-500/20 border-t-gold-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">
      {/* Sidebar */}
      <aside className="w-72 bg-black border-r border-white/5 hidden md:flex flex-col sticky top-0 h-screen">
        <div className="p-8 flex items-center gap-4 border-b border-white/5">
          <Image src="/logo_adrata.webp" alt="Logo" width={40} height={40} priority style={{ width: 'auto', height: 'auto' }} className="object-contain" />
          <div>
            <h2 className="font-display font-bold text-lg leading-tight">Portal<br/><span className="text-gold-500">Adrata</span></h2>
          </div>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2 font-body">
          {/* Sidebar (desktop) TIDAK memuat Notifikasi & Profil — keduanya
              diakses lewat header (lonceng dropdown & avatar dropdown).
              Bottom navigation (mobile) tetap menampilkan semua menu. */}
          {menus
            .filter(
              (menu) =>
                menu.href !== "/dashboard/notifikasi" &&
                menu.href !== "/dashboard/profil",
            )
            .map((menu) => (
              <Link
                key={menu.href}
                href={menu.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  menu.active 
                    ? "bg-gold-500/10 text-gold-500 font-bold border border-gold-500/20" 
                    : "text-white/50 hover:text-white hover:bg-white/5"
                }`}
              >
                {menu.icon}
                <span className="flex-1">{menu.label}</span>
                {menu.badge ? (
                  <span className="min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-gold-500 text-black text-[10px] font-black rounded-full">
                    {menu.badge > 9 ? "9+" : menu.badge}
                  </span>
                ) : null}
              </Link>
            ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden relative">
        {/* Dashboard Background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <Image
            src="/images/gedung_ft_new.webp"
            alt="Background Dashboard"
            fill
            priority
            className="object-cover opacity-[0.07]"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/95 to-black" />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold-500/5 blur-[100px] rounded-full" />
        </div>

        {/* Header */}
        <header className="h-20 border-b border-white/5 bg-black/60 backdrop-blur-xl sticky top-0 z-40 flex items-center justify-between px-8">
          <h1 className="font-display font-bold text-xl">
            {typeof session.user?.role === 'object' 
              ? (['maba', 'user'].includes(session.user.role.slug || '') || session.user.role.name.toLowerCase() === 'mahasiswa baru' ? 'Dashboard Maba' : (session.user.role.slug === 'super_admin' ? 'Admin Panel' : `Portal ${session.user.role.name}`))
              : (['maba', 'user'].includes(session.user?.role?.toLowerCase() || '') ? 'Dashboard Maba' : (session.user?.role?.toLowerCase() === 'super_admin' ? 'Admin Panel' : 'Portal Panitia'))
            }
          </h1>
          
          <div className="flex items-center gap-6">
            {/* Live Clock */}
            <div className="hidden md:block text-right">
              <div className="font-body font-bold text-sm text-white">{now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
              <div className="font-body text-xs text-white/40 tabular-nums">{now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB</div>
            </div>
            {/* Announcement Bell Dropdown — hanya di desktop (md+); di mobile
                notifikasi diakses lewat menu di bottom navigation. */}
            <div className="relative hidden md:block">
              {notifOpen && <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />}
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 rounded-xl hover:bg-white/10 transition-colors"
              >
                <Bell className="w-5 h-5 text-white/70" />
                {notif.unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-gold-500 text-black text-[10px] font-black rounded-full">
                    {notif.unreadCount > 9 ? '9+' : notif.unreadCount}
                  </span>
                )}
              </button>

              {/* Di mobile dropdown dibatasi selebar viewport (dikurangi
                  padding header) agar tidak keluar layar; di desktop kembali
                  ke ukuran tetap w-80. */}
              {notifOpen && (
                <div className="absolute right-0 mt-2 z-50 w-[calc(100vw-4rem)] max-w-[20rem] md:w-80 bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                    <h3 className="font-bold text-sm text-white">Notifikasi</h3>
                    {notif.unreadCount > 0 && (
                      <button onClick={() => markRead()} className="text-xs text-gold-500 hover:text-gold-400 font-semibold">
                        Tandai semua dibaca
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notif.items.length === 0 ? (
                      <div className="px-4 py-10 text-center">
                        <p className="text-white/40 text-sm">Belum ada pengumuman</p>
                      </div>
                    ) : (
                      notif.items.map((item) => (
                        <div
                          key={item._id}
                          onClick={() => openNotification(item)}
                          className={`px-4 py-3 border-b border-white/5 cursor-pointer transition-colors hover:bg-white/[0.04] ${item.isRead ? '' : 'bg-gold-500/5'}`}
                        >
                          <div className="flex items-start gap-2">
                            <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${item.isRead ? 'bg-white/15' : 'bg-gold-500'}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-white truncate">{item.title}</p>
                                {item.isPriority && (
                                  <span className="bg-red-500/20 text-red-400 text-[10px] px-1.5 py-0.5 rounded font-bold border border-red-500/30 shrink-0">Penting</span>
                                )}
                              </div>
                              <p className="text-xs text-white/50 line-clamp-2 mt-1">{item.content}</p>
                              <div className="flex items-center justify-between mt-1.5">
                                <span className="text-[10px] text-white/40">
                                  {new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                </span>
                                {!item.isRead && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); markRead([item._id]); }}
                                    className="text-[10px] text-gold-500 hover:text-gold-400 font-semibold"
                                  >
                                    Tandai dibaca
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {notif.items.length > 0 && (
                    <Link href="/dashboard/notifikasi" onClick={() => setNotifOpen(false)} className="block px-4 py-3 text-center text-xs text-gold-500 hover:text-gold-400 font-semibold border-t border-white/5">
                      Lihat Semua Notifikasi
                    </Link>
                  )}
                </div>
              )}
            </div>
            <div className="relative">
              {profileOpen && <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />}
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/10 transition-colors"
              >
                <div className="text-right hidden sm:block">
                  <div className="font-body font-bold text-sm">{session.user?.name || "Maba Adrata"}</div>
                  <div className="font-body text-xs text-white/40">
                    {typeof session.user?.role === 'object' ? session.user.role.name : (session.user?.role || "MABA")}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden border-2 border-gold-500/30 shrink-0">
                  {session.user?.avatar || session.user?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={(session.user.avatar || session.user.image)?.startsWith('/') ? `${API_URL}${session.user.avatar || session.user.image}` : (session.user.avatar || session.user.image)} alt="Avatar" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gold-500 font-bold">
                      {session.user?.name?.charAt(0) || "M"}
                    </div>
                  )}
                </div>
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-52 z-50 bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/5">
                    <p className="text-sm font-bold text-white truncate">{session.user?.name || "Maba Adrata"}</p>
                    <p className="text-xs text-white/40 truncate">{session.user?.role && typeof session.user.role === 'object' ? session.user.role.name : ''}</p>
                  </div>
                  <Link
                    href="/dashboard/profil"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-white/80 hover:bg-white/5 transition-colors"
                  >
                    <User className="w-4 h-4 text-gold-400" />
                    Profil & ID Card
                  </Link>
                  <button
                    onClick={() => { setProfileOpen(false); handleLogout(); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    Keluar Sistem
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 pb-24 md:p-8 md:pb-8 relative z-10">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-t border-white/10 safe-area-pb">
        <div className="flex items-center justify-around p-2">
          {menus.map((menu) => (
            <Link
              key={menu.href}
              href={menu.href}
              className={`relative flex flex-col items-center justify-center p-2 rounded-xl transition-colors ${
                menu.active 
                  ? "text-gold-500 font-bold" 
                  : "text-white/50 hover:text-white"
              }`}
            >
              {menu.icon}
              {menu.badge ? (
                <span className="absolute top-0.5 right-1/2 translate-x-4 min-w-[16px] h-4 px-0.5 flex items-center justify-center bg-gold-500 text-black text-[9px] font-black rounded-full">
                  {menu.badge > 9 ? "9+" : menu.badge}
                </span>
              ) : null}
              <span className="text-[10px] mt-1">{menu.label.split(" ")[0]}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Confirm Logout Modal */}
      {confirmLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setConfirmLogout(false)} />
          <div className="bg-[#111] border border-white/10 p-6 md:p-8 rounded-3xl w-full max-w-md relative z-10 shadow-2xl">
            <h2 className="font-display font-bold text-xl text-white mb-2">Keluar Sistem?</h2>
            <p className="text-sm text-white/60 mb-6">Anda akan keluar dari Portal. Pastikan data sudah tersimpan sebelum melanjutkan.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmLogout(false)}
                className="flex-1 py-3 bg-white/10 hover:bg-white/15 text-white rounded-xl font-bold transition-colors"
              >
                Batal
              </button>
              <button
                onClick={doLogout}
                className="flex-1 py-3 bg-red-500 hover:bg-red-400 text-white rounded-xl font-bold transition-colors"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
