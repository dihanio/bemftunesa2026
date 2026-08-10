"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { API_URL } from "@/lib/api";
import { Loader2, XCircle, ShieldCheck, GraduationCap, Users } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface VerificationData {
  name: string;
  nim: string;
  department: string;
  avatar?: string;
  pkkmbGroup?: {
    name: string;
    nomor: number;
  };
}

export default function VerifyPage() {
  const { token } = useParams();
  const [data, setData] = useState<VerificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    
    fetch(`${API_URL}/api/v1/auth/verify-token/${token}`)
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          setData(json.data);
        } else {
          setError(json.message || "Token tidak valid");
        }
      })
      .catch(() => {
        setError("Terjadi kesalahan sistem. Tidak dapat memverifikasi.");
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-gold-500 animate-spin mb-4 opacity-80" />
        <h2 className="text-lg font-medium text-white/60">Memverifikasi Data...</h2>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-red-500/5 border border-red-500/20 rounded-3xl p-8 max-w-sm w-full text-center"
        >
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4 opacity-80" />
          <h2 className="text-2xl font-semibold mb-2 text-white">Validasi Gagal</h2>
          <p className="text-white/60 mb-8 text-sm">{error}</p>
          <Link href="/" className="inline-block px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-lg font-medium transition-colors text-sm border border-white/10">
            Kembali ke Beranda
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-4 relative">
      {/* Subtle background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold-500/10 rounded-full blur-[120px] pointer-events-none opacity-50" />
      
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-[400px] relative z-10"
      >
        <div className="text-center mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo_adrata.webp" alt="Logo Adrata" width={64} height={64} className="mx-auto mb-4 opacity-90 object-contain" />
          <h1 className="font-display text-xl font-bold text-white tracking-wide">Validasi Identitas</h1>
        </div>

        <div className="bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
          
          <div className="flex flex-col items-center text-center">
            {/* Status Badge */}
            <div className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border border-emerald-500/20 mb-6">
              <ShieldCheck className="w-3.5 h-3.5" /> Valid
            </div>

            {/* Avatar */}
            <div className="relative w-28 h-28 mb-5">
              <div className="w-full h-full rounded-full overflow-hidden bg-[#222] border-2 border-white/10 shadow-lg">
                {data.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={data.avatar.startsWith('/') ? `${API_URL}${data.avatar}` : data.avatar} 
                    alt={data.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-gold-500">
                    {data.name.charAt(0)}
                  </div>
                )}
              </div>
            </div>

            <h2 className="text-xl font-bold font-display mb-1 text-white/90">{data.name}</h2>
            <p className="text-gold-400 font-mono text-sm mb-6">{data.nim}</p>

            <div className="w-full h-px bg-white/5 my-2" />

            {/* Data Information */}
            <div className="w-full space-y-4 mt-4">
              <div className="flex flex-col items-center">
                <p className="text-white/40 text-[10px] uppercase tracking-widest font-semibold mb-1 flex items-center gap-1.5">
                  <GraduationCap className="w-3 h-3" /> Program Studi
                </p>
                <p className="font-medium text-white/90 text-sm">{data.department || "-"}</p>
              </div>

              <div className="flex flex-col items-center">
                <p className="text-white/40 text-[10px] uppercase tracking-widest font-semibold mb-1 flex items-center gap-1.5">
                  <Users className="w-3 h-3" /> Kelompok PKKMB
                </p>
                <p className="font-medium text-white/90 text-sm">
                  {data.pkkmbGroup ? `Gugus ${data.pkkmbGroup.nomor} - ${data.pkkmbGroup.name}` : "Belum Ditentukan"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-white/30 text-[11px] mt-6 font-medium leading-relaxed">
          Data diverifikasi secara real-time oleh<br/>Sistem Informasi PKKMB FT UNESA 2026.
        </p>
      </motion.div>
    </div>
  );
}
