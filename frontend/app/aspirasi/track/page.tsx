"use client";

import { useState } from "react";
import {
  MessageSquare,
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { useAspirasiStatus } from "@/hooks/useAspirasi";

export default function AspirasiTrackPage() {
  const [trackingId, setTrackingId] = useState("");
  const [searchId, setSearchId] = useState<string | null>(null);
  const {
    data: statusData,
    isLoading,
    error,
  } = useAspirasiStatus(searchId || "");

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingId.trim()) {
      setSearchId(trackingId.trim());
    }
  };

  const status = statusData?.data;

  // Map status to progress steps
  const getSteps = (aspirationData: {
    status?: string;
    createdAt?: string;
  }) => {
    const currentStatus = aspirationData?.status || "Pending";
    const dateStr = aspirationData?.createdAt
      ? new Date(aspirationData.createdAt).toLocaleDateString("id-ID")
      : "Tercatat Server";

    const allSteps = [
      { label: "Diterima", status: "complete", date: dateStr },
      { label: "Diverifikasi", status: "pending", date: "" },
      { label: "Diproses", status: "pending", date: "" },
      { label: "Selesai", status: "pending", date: "" },
    ];

    if (currentStatus === "Reviewed") {
      allSteps[1].status = "complete";
      allSteps[2].status = "active";
    } else if (currentStatus === "Done") {
      allSteps[1].status = "complete";
      allSteps[2].status = "complete";
      allSteps[3].status = "complete";
    }

    return allSteps;
  };

  const steps = status ? getSteps(status) : [];

  return (
    <div className="pt-44 md:pt-52 pb-24 px-6 max-w-5xl mx-auto relative z-10">
      <Breadcrumbs
        items={[
          { label: "Aspirasi", href: "/aspirasi" },
          { label: "Track System", isCurrent: true },
        ]}
      />

      {/* Header */}
      <div className="mb-16">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 font-sans tracking-tight">
          Lacak Aspirasi
        </h1>
        <p className="text-[#10b981] font-mono tracking-widest uppercase mb-12">
          {"// Transparency Protocol 1.0"}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: Input Form */}
        <div className="lg:col-span-4">
          <div className="p-8 rounded-3xl glass-subtle h-fit">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-[#10b981]" /> Masukkan
              Tracking ID
            </h3>
            <form onSubmit={handleTrack} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest pl-2">
                  Nomor Laporan
                </label>
                <input
                  type="text"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  className="w-full bg-[#12331e]/10 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:border-[#10b981]/50 transition-all font-mono"
                  placeholder="e.g. ASP-2026-X832"
                />
              </div>
              <button className="btn-strategic w-full">
                Lacak Status <Search className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-white/5">
              <p className="text-xs text-gray-500 leading-relaxed">
                ID Lacak didapatkan setelah Anda berhasil mengirimkan formulir
                aspirasi. Jika lupa, silakan hubungi tim Adkesma kami.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Status View */}
        <div className="lg:col-span-8">
          {isLoading ? (
            <div className="p-12 rounded-[40px] glass-subtle flex flex-col items-center justify-center animate-pulse">
              <Clock className="w-12 h-12 text-gray-500 mb-4" />
              <p className="text-sm font-mono text-gray-600">
                Syncing with Server...
              </p>
            </div>
          ) : error || (searchId && !status) ? (
            <div className="p-12 rounded-[40px] border border-dashed border-red-500/20 bg-red-500/5 flex flex-col items-center justify-center text-center">
              <ShieldCheck className="w-12 h-12 text-red-500/40 mb-4" />
              <h4 className="text-white font-bold mb-2">
                Data Tidak Ditemukan
              </h4>
              <p className="text-gray-500 text-xs font-mono">
                {"// Error Code: ASP_NOT_FOUND"}
              </p>
            </div>
          ) : !status ? (
            <div className="h-full min-h-[400px] border-2 border-dashed border-white/10 rounded-[40px] flex flex-col items-center justify-center p-12 text-center opacity-40">
              <MessageSquare className="w-16 h-16 text-gray-600 mb-6" />
              <p className="text-sm font-mono uppercase tracking-widest text-gray-500">
                Menunggu Input Data Tracking
              </p>
            </div>
          ) : (
            <div className="p-8 md:p-12 rounded-[40px] glass-overlay animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 border-b border-white/5 pb-8">
                <div>
                  <p className="text-[9px] font-mono text-[#10b981] uppercase tracking-[0.3em] mb-2 font-bold">
                    Aspiration Record
                  </p>
                  <h2 className="text-2xl font-bold text-white font-sans">
                    {searchId}
                  </h2>
                </div>
                <div className="px-4 py-2 rounded-lg bg-[#12331e]/30 border border-[#10b981]/30 text-[#10b981] text-[10px] font-bold uppercase tracking-widest">
                  Status: {status.status.replace("_", " ")}
                </div>
              </div>

              {/* Progress Tracker */}
              <div className="relative py-8">
                <div className="absolute left-6 top-12 bottom-12 w-px bg-white/5 hidden md:block" />

                <div className="space-y-12 relative z-10">
                  {steps.map((step, idx) => (
                    <div key={idx} className="flex gap-8 group">
                      <div
                        className={`w-12 h-12 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-500
                             ${
                               step.status === "complete"
                                 ? "bg-[#10b981] border-[#10b981] text-[#091c11]"
                                 : step.status === "active"
                                   ? "bg-[#12331e]/40 border-[#10b981] text-[#10b981] animate-pulse"
                                   : "bg-white/5 border-white/10 text-gray-500"
                             }
                           `}
                      >
                        {step.status === "complete" ? (
                          <CheckCircle2 className="w-6 h-6" />
                        ) : (
                          <Clock className="w-5 h-5" />
                        )}
                      </div>
                      <div
                        className={`flex flex-col justify-center ${step.status === "pending" ? "opacity-30" : ""}`}
                      >
                        <h4 className="text-lg font-bold text-white transition-colors group-hover:text-[#10b981]">
                          {step.label}
                        </h4>
                        <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                          {step.date}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Info Box */}
              <div className="mt-12 p-6 rounded-2xl bg-white/5 border border-white/5 flex items-start gap-4">
                <div className="p-3 bg-[#10b981]/10 rounded-xl">
                  <MessageSquare className="w-5 h-5 text-[#10b981]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white mb-2 underline underline-offset-4 decoration-[#10b981]/30">
                    Catatan Petugas:
                  </h4>
                  <p className="text-xs text-gray-400 leading-relaxed italic">
                    &quot;Aspirasi sedang dikoordinasikan dengan pihak birokrat
                    terkait perbaikan fasilitas AC di gedung O1. Mohon
                    kesediaannya menunggu pembaruan selanjutnya.&quot;
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
