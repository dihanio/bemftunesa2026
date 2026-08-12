"use client";

import { useEffect, useState, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { getMaintenance, apiFetch } from "@/lib/api";
import { Wrench } from "lucide-react";

interface MaintenanceGateProps {
  children: ReactNode;
}

export default function MaintenanceGate({ children }: MaintenanceGateProps) {
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);
  const [maintenance, setMaintenance] = useState<{
    enabled: boolean;
    message: string;
  }>({ enabled: false, message: "" });
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const m = await getMaintenance();
        if (!active) return;

        // Cek role user (admin/panitia tetap boleh akses saat maintenance)
        let admin = false;
        try {
          const meRes = await apiFetch("/auth/me");
          if (meRes.ok) {
            const me = (await meRes.json()) as {
              data?: { role?: { slug?: string } };
            };
            const slug = me?.data?.role?.slug;
            admin = slug === "super_admin" || slug === "panitia";
          }
        } catch {
          admin = false;
        }

        if (active) {
          setMaintenance(m);
          setIsAdmin(admin);
          setChecked(true);
        }
      } catch {
        if (active) {
          setChecked(true);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Selama cek, jangan tampilkan apa-apa (hindari flash)
  if (!checked) return null;

  const maintenanceActive = maintenance.enabled;
  const isLoginPage = pathname === "/login";

  // Kalau maintenance aktif & user bukan admin & bukan halaman login → tampilkan maintenance
  if (maintenanceActive && !isAdmin && !isLoginPage) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-black text-white px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center mb-6">
          <Wrench className="w-8 h-8 text-gold-500" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Sedang Dalam Perbaikan
        </h1>
        <p className="mt-4 max-w-md text-white/60 text-sm sm:text-base leading-relaxed">
          {maintenance.message ||
            "Website PKKMB FT UNESA sedang dalam maintenance. Silakan kembali lagi nanti."}
        </p>
      </main>
    );
  }

  return <>{children}</>;
}
