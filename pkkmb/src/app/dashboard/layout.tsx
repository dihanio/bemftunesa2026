"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Home, User, FileText, CheckSquare, Users, ShieldAlert, MonitorSmartphone } from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  role: { name: string, slug?: string } | string;
  image?: string;
  avatar?: string;
  division?: string;
  isOnboarded?: boolean;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<{ user: UserProfile } | null>(null);
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("http://localhost:4000/api/v1/auth/me", {
          credentials: "include"
        });
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
        setStatus("unauthenticated");
      }
    };
    
    fetchProfile();
  }, []);

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

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:4000/api/v1/auth/logout", {
        method: "POST",
        credentials: "include"
      });
      router.push("/login");
    } catch {
      router.push("/login");
    }
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
      return [
        { label: "Maba Hub", href: "/dashboard", icon: <Home className="w-5 h-5" />, active: pathname === "/dashboard" },
        { label: "Profil & ID Card", href: "/dashboard/profil", icon: <User className="w-5 h-5" />, active: pathname === "/dashboard/profil" },
        { label: "Penugasan", href: "/dashboard/tugas", icon: <FileText className="w-5 h-5" />, active: pathname === "/dashboard/tugas" },
        { label: "Presensi", href: "/dashboard/presensi", icon: <CheckSquare className="w-5 h-5" />, active: pathname === "/dashboard/presensi" },
      ];
    } else {
      // Panitia / Admin / Evaluator
      const isPendamping = division.includes('pendamping');
      const isSekretaris = division.includes('sekretaris');
      const isBph = division.includes('bph');
      const isPemateri = division.includes('pemateri') || division.includes('acara');
      const isTatib = division.includes('tatib') || division.includes('komdis') || division.includes('tata tertib');

      const items = [
        { label: roleString === 'super_admin' ? "Admin Panel" : isPendamping ? "Portal Pendamping" : "Portal Panitia", href: "/dashboard", icon: <MonitorSmartphone className="w-5 h-5" />, active: pathname === "/dashboard" },
      ];

      // Data Maba
      if (roleString === 'super_admin' || roleString === 'admin_pkkmb' || roleString === 'panitia' || isPendamping || isSekretaris || isBph) {
        items.push({ label: "Data Maba", href: "/dashboard/manage/maba", icon: <Users className="w-5 h-5" />, active: pathname === "/dashboard/manage/maba" });
      }

      // Evaluasi Penugasan
      if (roleString === 'super_admin' || roleString === 'admin_pkkmb' || roleString === 'panitia' || isPendamping || isPemateri) {
        items.push({ label: "Evaluasi Penugasan", href: "/dashboard/manage/evaluator", icon: <FileText className="w-5 h-5" />, active: pathname === "/dashboard/manage/evaluator" });
      }

      // Kontrol Presensi
      if (roleString === 'super_admin' || roleString === 'admin_pkkmb' || roleString === 'panitia' || isPendamping || isSekretaris || isBph) {
        items.push({ label: "Kontrol Presensi", href: "/dashboard/manage/attendance", icon: <CheckSquare className="w-5 h-5" />, active: pathname === "/dashboard/manage/attendance" });
      }

      // Tata Tertib
      if (roleString === 'super_admin' || roleString === 'admin_pkkmb' || isTatib) {
        items.push({ label: "Tata Tertib", href: "/dashboard/manage/komdis", icon: <ShieldAlert className="w-5 h-5" />, active: pathname === "/dashboard/manage/komdis" });
      }

      // Manajemen Akun & Gugus (Super Admin)
      if (roleString === 'super_admin') {
        items.push({ label: "Manajemen Gugus", href: "/dashboard/manage/groups", icon: <Users className="w-5 h-5" />, active: pathname === "/dashboard/manage/groups" });
        items.push({ label: "Manajemen Akun", href: "/dashboard/manage/users", icon: <User className="w-5 h-5" />, active: pathname === "/dashboard/manage/users" });
      }

      return items;
    }
  }, [session, pathname]);

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
          <Image src="/logo_adrata.png" alt="Logo" width={40} height={40} priority style={{ width: 'auto', height: 'auto' }} className="object-contain" />
          <div>
            <h2 className="font-display font-bold text-lg leading-tight">Portal<br/><span className="text-gold-500">Adrata</span></h2>
          </div>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2 font-body">
          {menus.map((menu) => (
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
              {menu.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-400 hover:bg-red-500/10 transition-colors font-body text-sm font-bold"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Keluar Sistem
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden relative">
        {/* Dashboard Background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <Image
            src="/images/gedung_ft_new.jpeg"
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
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="font-body font-bold text-sm">{session.user?.name || "Maba Adrata"}</div>
              <div className="font-body text-xs text-white/40">
                {typeof session.user?.role === 'object' ? session.user.role.name : (session.user?.role || "MABA")}
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden border-2 border-gold-500/30">
              {session.user?.avatar || session.user?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={(session.user.avatar || session.user.image)?.startsWith('/') ? `http://localhost:4000${session.user.avatar || session.user.image}` : (session.user.avatar || session.user.image)} alt="Avatar" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gold-500 font-bold">
                  {session.user?.name?.charAt(0) || "M"}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-8 pb-24 md:pb-8 relative z-10">
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
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition-colors ${
                menu.active 
                  ? "text-gold-500 font-bold" 
                  : "text-white/50 hover:text-white"
              }`}
            >
              {menu.icon}
              <span className="text-[10px] mt-1">{menu.label.split(" ")[0]}</span>
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="flex flex-col items-center justify-center p-2 rounded-xl text-red-400 hover:text-red-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            <span className="text-[10px] mt-1">Keluar</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
