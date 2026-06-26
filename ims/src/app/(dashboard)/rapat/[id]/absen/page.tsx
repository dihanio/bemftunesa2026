"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import ImsApiService from "@/lib/api";
import AbsenScanner from "@/components/rapat/AbsenScanner";
import { Calendar, CheckCircle2, AlertTriangle, ArrowLeft, Radio, MapPin } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function MemberAbsenPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [rapat, setRapat] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [successMsg, setSuccessMsg] = useState("");
  const [hasAttended, setHasAttended] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccessMsg("");
      
      const profileRes = await ImsApiService.getProfile();
      const rapatRes = await ImsApiService.getRapatDetail(id);
      
      if (profileRes?.data && rapatRes?.data) {
        setProfile(profileRes.data);
        setRapat(rapatRes.data);
        
        // Check if user already attended
        const userId = profileRes.data.id;
        const attended = rapatRes.data.attendees.some(
          (a: any) => (typeof a.userId === 'object' ? a.userId?._id : a.userId) === userId
        );
        setHasAttended(attended);
      }
    } catch (err: any) {
      setError(err?.message || "Gagal memuat halaman absensi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const handleScanSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setHasAttended(true);
    setError("");
  };

  const handleScanError = (msg: string) => {
    setError(msg);
    setSuccessMsg("");
  };

  if (loading) {
    return (
      <DashboardShell>
        <div className="py-24 text-center text-foreground/50">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 animate-spin rounded-full border-4 border-sage/20 border-t-sage" />
            <span className="text-sm font-medium">Memuat portal absensi...</span>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="max-w-md mx-auto w-full pb-12 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.push("/rapat")}
            className="p-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl transition-all duration-200 cursor-pointer text-foreground/75 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white">Portal Presensi Mandiri</h1>
            <p className="text-xs text-foreground/50">Presensi cepat fungsionaris via QR & Geofence</p>
          </div>
        </div>

        {/* Meeting Info Card */}
        {rapat && (
          <div className="glass-subtle border border-white/5 rounded-2xl p-5 mb-6 flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-sage">AGENDA PERTEMUAN</span>
              <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                rapat.status === 'ongoing' 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                  : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
              }`}>
                {rapat.status === 'ongoing' ? 'Presensi Dibuka' : 'Presensi Ditutup'}
              </span>
            </div>
            <h2 className="text-base font-bold text-white leading-tight">{rapat.title}</h2>
            <div className="text-xs text-foreground/75 flex flex-col gap-2 pt-2 border-t border-white/5">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-foreground/45" />
                <span>{formatDate(rapat.scheduledAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-foreground/45" />
                <span>{rapat.location.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-foreground/45" />
                <span>Radius Geofence: {rapat.location.radiusInMeters} Meter</span>
              </div>
            </div>
          </div>
        )}

        {/* Status banners */}
        {successMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Action scanner or Success Banner */}
        {hasAttended ? (
          <div className="glass-subtle border border-emerald-500/20 rounded-2xl p-8 text-center flex flex-col items-center gap-4 bg-emerald-500/5">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Presensi Berhasil ✓</h3>
              <p className="text-xs text-foreground/60 mt-1 max-w-[240px] mx-auto">
                Kehadiran Anda telah dicatat oleh sistem. Silakan ikuti jalannya rapat dengan tertib.
              </p>
            </div>
            <button
              onClick={() => router.push("/rapat")}
              className="mt-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-xs font-semibold text-white transition-all cursor-pointer"
            >
              Kembali ke Daftar Rapat
            </button>
          </div>
        ) : rapat?.status === 'ongoing' ? (
          <AbsenScanner 
            rapatId={id} 
            onSuccess={handleScanSuccess} 
            onError={handleScanError} 
          />
        ) : (
          <div className="glass-subtle border border-white/5 rounded-2xl p-8 text-center flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-foreground/35" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Presensi Tidak Dapat Dilakukan</h3>
              <p className="text-xs text-foreground/40 mt-1 max-w-[220px] mx-auto">
                Presensi untuk rapat ini belum dibuka oleh administrator atau telah berakhir.
              </p>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
