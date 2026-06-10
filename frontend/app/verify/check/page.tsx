"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Search,
  ArrowRight,
  AlertCircle,
  FileText,
} from "lucide-react";

export default function VerifyCheckPage() {
  const [uuid, setUuid] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uuid.trim()) {
      setError("Silakan masukkan ID Verifikasi.");
      return;
    }
    // Simple UUID-like validation if needed
    router.push(`/verify/${uuid.trim()}`);
  };

  return (
    <div className="pt-44 pb-24 px-6 max-w-4xl mx-auto relative z-10">
      {/* Header */}
      <div className="text-center mb-16">
        <div className="w-16 h-16 rounded-full bg-[#10b981]/20 flex items-center justify-center mx-auto mb-6">
          <ShieldCheck className="w-8 h-8 text-[#10b981]" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 font-sans tracking-tight">
          Cek Validitas Dokumen
        </h1>
        <p className="text-gray-400 max-w-xl mx-auto text-sm leading-relaxed">
          Verifikasi keaslian surat keterangan, sertifikat, atau dokumen resmi
          lainnya yang diterbitkan oleh BEM FT UNESA melalui sistem integrasi
          kami.
        </p>
      </div>

      {/* Search Box */}
      <div className="bg-[#0a2214]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
        {/* Decor */}
        <div className="absolute top-0 right-0 w-32 h-32 border-t border-r border-[#10b981]/10" />

        <form onSubmit={handleSearch} className="relative z-10">
          <div className="mb-8">
            <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block mb-4 ml-2">
              Masukkan ID Verifikasi (UUID)
            </label>
            <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-[#10b981] transition-colors" />
              <input
                type="text"
                value={uuid}
                onChange={(e) => {
                  setUuid(e.target.value);
                  setError("");
                }}
                placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-16 pr-6 py-5 text-lg text-white focus:outline-none focus:border-[#10b981]/50 transition-all font-mono"
              />
            </div>
            {error && (
              <p className="flex items-center gap-2 text-xs text-red-400 mt-3 ml-2">
                <AlertCircle className="w-3.5 h-3.5" /> {error}
              </p>
            )}
          </div>

          <button className="w-full py-5 bg-white text-[#091c11] font-bold rounded-2xl hover:bg-army-accent hover:text-white transition-all shadow-xl flex items-center justify-center gap-2 group">
            Verifikasi Sekarang{" "}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="mt-12 flex flex-col md:flex-row items-center justify-center gap-8 border-t border-white/5 pt-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
              <FileText className="w-5 h-5 text-gray-500" />
            </div>
            <div className="text-left">
              <p className="text-[9px] font-mono text-gray-600 uppercase">
                Input Type
              </p>
              <p className="text-[11px] font-bold text-white">
                Digital Certificate / Letter ID
              </p>
            </div>
          </div>
          <div className="h-4 w-px bg-white/10 hidden md:block" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-gray-500" />
            </div>
            <div className="text-left">
              <p className="text-[9px] font-mono text-gray-600 uppercase">
                Security
              </p>
              <p className="text-[11px] font-bold text-white">
                SHA-256 Enforced Verification
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Warning Footer */}
      <p className="mt-8 text-center text-[10px] font-mono text-gray-600 max-w-sm mx-auto uppercase tracking-widest leading-relaxed">
        The integrity of BEM FT documents is protected by law. Falsifying
        records may result in disciplinary action.
      </p>
    </div>
  );
}
