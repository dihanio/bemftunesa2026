"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ShieldAlert, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@bemft/api-client";

interface Settings {
  maintenanceMode: boolean;
  publicAspirationFlow: boolean;
}

export function MaintenanceWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, _hasHydrated: isHydrated } = useAuth();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiDown, setApiDown] = useState(false);

  const fetchSettings = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const res = await api.get<{ data: Settings }>("/public/settings");
      setSettings(res.data);
      setApiDown(false);
    } catch (err) {
      console.error("Failed to fetch settings", err);
      setApiDown(true);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings(true);
    // Poll every 30 seconds
    const interval = setInterval(() => fetchSettings(false), 30000);
    return () => clearInterval(interval);
  }, []);

  if (!isHydrated || loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#091c11]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/10 border-t-[#10b981]" />
      </div>
    );
  }

  // Bypass if user is an administrator
  const isSysAdmin =
    user?.role === "System Administrator" ||
    user?.role === "Super Admin" ||
    user?.role === "KaBEM";

  if ((settings?.maintenanceMode || apiDown) && !isSysAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#091c11] px-6 text-center">
        <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-[#10b981]/10">
          <ShieldAlert className="h-12 w-12 text-[#10b981]" />
        </div>
        <h1 className="mb-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
          {apiDown ? "Sistem Terputus" : "System Under Maintenance"}
        </h1>
        <p className="mx-auto mb-8 max-w-lg text-[#b8c4aa] sm:text-lg">
          {apiDown 
            ? "IMS gagal terhubung ke backend server BEM FT. Terjadi kesalahan jaringan atau server sedang offline."
            : "IMS BEM FT sedang dalam tahap pemeliharaan sistem oleh Administrator. Mohon kembali beberapa saat lagi. Jika mendesak, silakan hubungi BPI atau Administrator."}
        </p>
        <Button
          onClick={() => fetchSettings(true)}
          className="rounded-full bg-white px-8 font-semibold text-[#091c11] hover:bg-[#a7f3d0]"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Coba Lagi
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
