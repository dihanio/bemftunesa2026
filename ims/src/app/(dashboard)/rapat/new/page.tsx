"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import ImsApiService from "@/lib/api";
import { FormInput, FormTextarea } from "@/components/ui";
import { Calendar, ArrowLeft, Save, MapPin } from "lucide-react";

export default function CreateRapatPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    scheduledAt: "",
    locationName: "",
    latitude: "",
    longitude: "",
    radiusInMeters: "100",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await ImsApiService.getProfile();
        if (res?.data) {
          setProfile(res.data);
        }
      } catch (err) {
        console.error("Failed to load user profile:", err);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cabinetPeriodId = profile?.activeContext?.periodId;
    if (!cabinetPeriodId) {
      setError("Active cabinet period context not found. Reload page.");
      return;
    }

    if (!formData.title || !formData.scheduledAt || !formData.locationName || !formData.latitude || !formData.longitude) {
      setError("Mohon isi semua field wajib yang bertanda bintang (*)");
      return;
    }

    setSubmitting(true);
    try {
      await ImsApiService.createRapat({
        title: formData.title,
        description: formData.description,
        scheduledAt: formData.scheduledAt,
        location: {
          name: formData.locationName,
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          radiusInMeters: parseInt(formData.radiusInMeters, 10),
        },
        cabinetPeriod: cabinetPeriodId,
      });
      router.push("/rapat");
    } catch (err: any) {
      setError(err?.message || "Gagal membuat rapat. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardShell>
      <div className="max-w-3xl mx-auto w-full pb-12 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.push("/rapat")}
            className="p-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl transition-all duration-200 cursor-pointer text-foreground/75 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-sage" />
              Buat Rapat Baru
            </h1>
            <p className="text-xs text-foreground/50">Jadwalkan rapat dan atur radius absen GPS untuk fungsionaris</p>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2.5">
            <span className="font-semibold">Error:</span> {error}
          </div>
        )}

        {/* Form panel */}
        <form onSubmit={handleSubmit} className="glass-subtle border border-white/5 rounded-2xl p-6 md:p-8 flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-white tracking-wide uppercase border-b border-white/5 pb-2">Informasi Rapat</h2>
            
            <FormInput
              label="Judul Rapat *"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Contoh: Rapat Koordinasi Bulanan BEM FT"
            />

            <FormTextarea
              label="Deskripsi Rapat"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Tulis agenda pembahasan rapat di sini..."
              rows={4}
            />

            <FormInput
              label="Waktu Pelaksanaan *"
              name="scheduledAt"
              type="datetime-local"
              value={formData.scheduledAt}
              onChange={handleChange}
            />
          </div>

          <div className="flex flex-col gap-4 mt-2">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <h2 className="text-sm font-semibold text-white tracking-wide uppercase">Lokasi & Geofence GPS</h2>
              <span className="text-[10px] text-foreground/40 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-sage" />
                GPS Required
              </span>
            </div>
            
            <FormInput
              label="Nama Lokasi / Ruangan *"
              name="locationName"
              value={formData.locationName}
              onChange={handleChange}
              placeholder="Contoh: Gedung A1 Lantai 2 Dekanat FT UNESA"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="Latitude Koordinat *"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                placeholder="Contoh: -7.312345"
              />
              <FormInput
                label="Longitude Koordinat *"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                placeholder="Contoh: 112.721234"
              />
            </div>
            <p className="text-[11px] text-foreground/40 -mt-2">
              * Gunakan Google Maps untuk mendapatkan titik koordinat lokasi rapat.
            </p>

            <FormInput
              label="Radius Absensi (Meter) *"
              name="radiusInMeters"
              type="number"
              min="10"
              value={formData.radiusInMeters}
              onChange={handleChange}
              placeholder="Default: 100"
            />
            <p className="text-[11px] text-foreground/40 -mt-2">
              * Jarak toleransi maksimal presensi QR dari titik koordinat (minimal 10m).
            </p>
          </div>

          <div className="border-t border-white/5 pt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push("/rapat")}
              className="px-5 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 transition-all text-sm font-semibold text-foreground cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center justify-center gap-2 bg-sage text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-sage/90 transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-sage/20 border border-sage/50"
            >
              <Save className="w-4 h-4" />
              {submitting ? "Menyimpan..." : "Simpan Rapat"}
            </button>
          </div>
        </form>
      </div>
    </DashboardShell>
  );
}
