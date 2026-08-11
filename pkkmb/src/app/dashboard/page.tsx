"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { API_URL } from "@/lib/api";
import Link from "next/link";
import MabaDashboard from "@/components/dashboard/MabaDashboard";

interface Profile {
  name?: string;
  role?: { slug?: string; name?: string } | string;
  division?: string;
}

interface AdminStats {
  totalMaba?: number;
  attendanceToday?: number;
  tasksSubmitted?: number;
}

export default function DashboardPage() {
  const [role, setRole] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfileAndRole = async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/auth/me`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            const roleObj = data.data.role;
            const roleString =
              typeof roleObj === "object" && roleObj !== null
                ? (roleObj.slug || roleObj.name || "user").toLowerCase()
                : String(roleObj || "user").toLowerCase();
            setRole(roleString);
            setProfile(data.data);

            if (roleString !== "user" && roleString !== "maba") {
              try {
                const adminRes = await fetch(
                  `${API_URL}/api/v1/pkkmb/dashboard/admin`,
                  { credentials: "include" },
                );
                if (adminRes.ok) {
                  const adminData = await adminRes.json();
                  if (adminData.success) {
                    setAdminStats(adminData.data);
                  }
                }
              } catch (e) {
                console.error("Failed to fetch admin stats:", e);
              }
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileAndRole();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
      </div>
    );
  }

  const isMaba = role === "user" || role === "maba";

  if (isMaba) {
    return <MabaDashboard />;
  }

  // Admin View
  const userDiv = ((profile as { division?: string } | null | undefined)
    ?.division || "").toLowerCase();
  const isPendamping = userDiv.includes("pendamping");

  return (
    <div className="space-y-8">
      <div className="bg-white/5 border border-white/10 rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10">
          <h2 className="font-display text-3xl font-bold mb-2">
            Selamat Datang di{" "}
            {role === "super_admin"
              ? "Admin Panel"
              : isPendamping
                ? "Portal Pendamping"
                : "Portal Panitia"}
            !
          </h2>
          <p className="text-white/60 font-body max-w-2xl">
            {isPendamping
              ? "Pusat kendali Pendamping Gugus. Awasi kehadiran, periksa penugasan, dan kelola data mahasiswa baru di gugusmu."
              : "Pusat kendali Panitia dan Evaluator. Awasi kehadiran, periksa penugasan, dan kelola data mahasiswa baru di sini."}
          </p>
        </div>
      </div>

      {/* Admin Quick Action Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {(role === "super_admin" ||
          role === "admin_pkkmb" ||
          role === "panitia" ||
          userDiv.includes("pendamping") ||
          userDiv.includes("sekretaris") ||
          userDiv.includes("bph")) && (
          <Link
            href="/dashboard/manage/maba"
            className="relative bg-white/[0.02] border border-white/10 rounded-2xl p-6 flex flex-col hover:bg-white/[0.06] transition-all group overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform duration-700 group-hover:scale-150 group-hover:bg-blue-500/20"></div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wider mb-2 font-semibold">
                  Total Mahasiswa
                </p>
                <h3 className="font-display text-4xl font-bold text-white mb-4 group-hover:text-blue-400 transition-colors">
                  {adminStats?.totalMaba || 0}
                </h3>
              </div>
              <div>
                <p className="font-bold text-sm text-white/90">
                  {role === "super_admin" || role === "admin_pkkmb"
                    ? "Data Maba Global"
                    : "Data Maba Gugus"}
                </p>
                <p className="text-xs text-white/50">
                  {role === "super_admin" || role === "admin_pkkmb"
                    ? "Kelola keseluruhan mahasiswa"
                    : "Mahasiswa di gugus Anda"}
                </p>
              </div>
            </div>
          </Link>
        )}

        {(role === "super_admin" ||
          role === "admin_pkkmb" ||
          role === "panitia" ||
          userDiv.includes("pendamping") ||
          userDiv.includes("sekretaris") ||
          userDiv.includes("bph")) && (
          <Link
            href="/dashboard/manage/attendance"
            className="relative bg-white/[0.02] border border-white/10 rounded-2xl p-6 flex flex-col hover:bg-white/[0.06] transition-all group overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform duration-700 group-hover:scale-150 group-hover:bg-green-500/20"></div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wider mb-2 font-semibold">
                  Kehadiran Hari Ini
                </p>
                <h3 className="font-display text-4xl font-bold text-white mb-4 group-hover:text-green-400 transition-colors">
                  {adminStats?.attendanceToday || 0}
                </h3>
              </div>
              <div>
                <p className="font-bold text-sm text-white/90">
                  {role === "super_admin" || role === "admin_pkkmb"
                    ? "Live Presensi"
                    : "Presensi Gugus"}
                </p>
                <p className="text-xs text-white/50">
                  Pantau presensi selfie real-time
                </p>
              </div>
            </div>
          </Link>
        )}

        {(role === "super_admin" ||
          role === "admin_pkkmb" ||
          role === "panitia" ||
          userDiv.includes("pendamping") ||
          userDiv.includes("pemateri")) && (
          <Link
            href="/dashboard/manage/evaluator"
            className="relative bg-white/[0.02] border border-white/10 rounded-2xl p-6 flex flex-col hover:bg-white/[0.06] transition-all group overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform duration-700 group-hover:scale-150 group-hover:bg-purple-500/20"></div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wider mb-2 font-semibold">
                  Tugas Terkumpul
                </p>
                <h3 className="font-display text-4xl font-bold text-white mb-4 group-hover:text-purple-400 transition-colors">
                  {adminStats?.tasksSubmitted || 0}
                </h3>
              </div>
              <div>
                <p className="font-bold text-sm text-white/90">
                  {role === "super_admin" || role === "admin_pkkmb"
                    ? "Evaluator Tugas"
                    : "Tugas Gugus"}
                </p>
                <p className="text-xs text-white/50">
                  Antrean koreksi penugasan
                </p>
              </div>
            </div>
          </Link>
        )}

        {(role === "super_admin" ||
          role === "admin_pkkmb" ||
          userDiv.includes("tatib") ||
          userDiv.includes("tata tertib") ||
          userDiv.includes("komdis")) && (
          <Link
            href="/dashboard/manage/komdis"
            className="relative bg-white/[0.02] border border-white/10 rounded-2xl p-6 flex flex-col justify-end hover:bg-white/[0.06] transition-all group overflow-hidden min-h-[160px]"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform duration-700 group-hover:scale-150 group-hover:bg-red-500/20"></div>
            <div className="relative z-10">
              <h3 className="font-display text-xl font-bold text-white mb-1 group-hover:text-red-400 transition-colors">
                Tata Tertib
              </h3>
              <p className="text-xs text-white/50">
                Catat insiden ketertiban evaluasi
              </p>
            </div>
            <div className="absolute top-6 right-6 text-white/20 group-hover:text-red-400 group-hover:translate-x-1 transition-all">
              &rarr;
            </div>
          </Link>
        )}

        {role === "super_admin" && (
          <Link
            href="/dashboard/manage/groups"
            className="relative bg-white/[0.02] border border-white/10 rounded-2xl p-6 flex flex-col justify-end hover:bg-white/[0.06] transition-all group overflow-hidden min-h-[160px]"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform duration-700 group-hover:scale-150 group-hover:bg-cyan-500/20"></div>
            <div className="relative z-10">
              <h3 className="font-display text-xl font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors">
                Manajemen Gugus
              </h3>
              <p className="text-xs text-white/50">
                Kelola kelompok PKKMB dan pendamping
              </p>
            </div>
            <div className="absolute top-6 right-6 text-white/20 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all">
              &rarr;
            </div>
          </Link>
        )}

        {/* Shortcut Simulator Presensi untuk Admin */}
        {(role === "super_admin" || role === "admin_pkkmb") && (
          <Link
            href="/dashboard/presensi"
            className="relative bg-white/[0.02] border border-white/10 rounded-2xl p-6 flex flex-col justify-end hover:bg-white/[0.06] transition-all group overflow-hidden min-h-[160px]"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform duration-700 group-hover:scale-150 group-hover:bg-gold-500/20"></div>
            <div className="relative z-10">
              <h3 className="font-display text-xl font-bold text-white mb-1 group-hover:text-gold-400 transition-colors">
                Tes Presensi
              </h3>
              <p className="text-xs text-white/50">
                Buka mode mahasiswa untuk uji coba presensi selfie
              </p>
            </div>
            <div className="absolute top-6 right-6 text-white/20 group-hover:text-gold-400 group-hover:translate-x-1 transition-all">
              &rarr;
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}
