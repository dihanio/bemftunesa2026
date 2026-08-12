"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Wrench, Loader2, Save, AlertTriangle, Power } from "lucide-react";
import { apiFetch, getMaintenance, setMaintenance } from "@/lib/api";

export default function ManageMaintenancePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loaded, setLoaded] = useState(false);

  // Auth check: hanya super_admin / admin_pkkmb yang boleh akses halaman ini
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const meRes = await apiFetch("/auth/me");
        if (!meRes.ok) {
          router.replace("/login");
          return;
        }
        const me = (await meRes.json()) as {
          data?: { role?: { slug?: string } };
        };
        const slug = me?.data?.role?.slug;
        if (slug !== "super_admin" && slug !== "admin_pkkmb") {
          router.replace("/dashboard");
          return;
        }

        const m = await getMaintenance();
        if (active) {
          setEnabled(m.enabled);
          setMessage(m.message);
          setLoaded(true);
          setLoading(false);
        }
      } catch {
        if (active) {
          setLoading(false);
          setErrorMsg("Gagal memuat status maintenance.");
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const result = await setMaintenance(enabled, message);
      setEnabled(result.enabled);
      setMessage(result.message);
      setSuccessMsg(
        result.enabled
          ? "Mode maintenance AKTIF. Portal maba akan menampilkan halaman perbaikan."
          : "Mode maintenance nonaktif. Portal maba kembali normal.",
      );
    } catch (err) {
      setErrorMsg((err as Error).message || "Gagal menyimpan pengaturan maintenance.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-11 h-11 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
          <Wrench className="w-6 h-6 text-gold-500" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-white">Mode Maintenance</h1>
          <p className="text-xs text-white/50">
            Aktifkan untuk menampilkan halaman perbaikan pada portal maba PKKMB.
          </p>
        </div>
      </div>

      {/* Status card + toggle */}
      <div className="mt-6 bg-white/5 border border-white/10 rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-white flex items-center gap-2">
              <Power className="w-4 h-4" />
              Status:{" "}
              <span className={enabled ? "text-red-400" : "text-emerald-400"}>
                {enabled ? "Maintenance AKTIF" : "Normal"}
              </span>
            </p>
            <p className="text-xs text-white/50 mt-1">
              {enabled
                ? "Maba akan melihat halaman 'Sedang Dalam Perbaikan'."
                : "Portal maba dapat diakses seperti biasa."}
            </p>
          </div>
          {/* Toggle switch */}
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={() => setEnabled((v) => !v)}
            className={`relative w-14 h-8 rounded-full transition-colors shrink-0 ${
              enabled ? "bg-red-500" : "bg-white/15"
            }`}
          >
            <span
              className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${
                enabled ? "left-7" : "left-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Pesan maintenance */}
      <div className="mt-4 bg-white/5 border border-white/10 rounded-2xl p-5">
        <label className="block text-sm font-semibold text-white mb-2">
          Pesan yang ditampilkan
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          placeholder="Sedang dalam maintenance, silakan kembali lagi nanti..."
          className="w-full rounded-xl bg-black/40 border border-white/10 p-3 text-sm text-white placeholder-white/30 focus:border-gold-500/60 focus:outline-none"
        />
        <p className="text-xs text-white/40 mt-2">
          Kosongkan untuk memakai pesan default.
        </p>
      </div>

      {/* Warning */}
      {enabled && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-300">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>
            Setelah diaktifkan, seluruh maba tidak bisa membuka dashboard & halaman
            portal (kecuali halaman login). Admin tetap bisa akses untuk mematikan mode ini.
          </span>
        </div>
      )}

      {errorMsg && (
        <div className="mt-4 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-300">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="mt-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-300">
          {successMsg}
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || !loaded}
          className="inline-flex items-center gap-2 rounded-xl bg-gold-500 px-5 py-2.5 text-sm font-bold text-black hover:bg-gold-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Simpan
        </button>
      </div>
    </div>
  );
}
