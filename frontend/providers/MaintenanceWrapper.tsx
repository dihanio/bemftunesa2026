"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, RefreshCw } from "lucide-react";
import { api } from "@bemft/api-client";

interface Settings {
  maintenanceMode: boolean;
  publicAspirationFlow: boolean;
}

export function MaintenanceWrapper({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiDown, setApiDown] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ data: Settings }>("/public/settings");
      setSettings(res.data);
      setApiDown(false);
    } catch (err) {
      console.error("Failed to fetch settings", err);
      setApiDown(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    // Poll every 30 seconds
    const interval = setInterval(fetchSettings, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#091c11]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/10 border-t-[#10b981]" />
      </div>
    );
  }

  // Frontend public portal blocks EVERYONE when maintenance is active or API is unreachable.
  if (settings?.maintenanceMode || apiDown) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#091c11] px-6 text-center text-white">
        <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-[#10b981]/10">
          <ShieldAlert className="h-12 w-12 text-[#10b981]" />
        </div>
        <h1 className="mb-4 text-4xl font-black tracking-tight sm:text-5xl">
          {apiDown ? "Koneksi Terputus" : "We'll be back soon"}
        </h1>
        <p className="mx-auto mb-8 max-w-lg text-[#b8c4aa] sm:text-lg">
          {apiDown 
            ? "Tidak dapat terhubung ke peladen BEM FT. Peladen mungkin sedang *offline* atau sibuk. Mohon coba lagi."
            : "Website Publik BEM FT sedang dalam pemeliharaan sistem. Mohon kembali dalam beberapa saat lagi."}
        </p>
        <button
          onClick={fetchSettings}
          className="flex items-center rounded-full bg-white px-8 py-3 font-semibold text-[#091c11] hover:bg-[#a7f3d0] transition-colors"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Coba Lagi
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
