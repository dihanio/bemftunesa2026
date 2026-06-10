"use client";

import Link from "next/link";
import {
  Calendar,
  Layers,
  ArrowUpRight,
  Target,
  CheckCircle2,
  Activity,
  AlertCircle,
} from "lucide-react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { useProkerDetail } from "@/hooks/useProker";
import { use } from "react";

export default function ProkerDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { data: prokerData, isLoading, error } = useProkerDetail(slug);
  const item = prokerData?.data;

  if (isLoading) {
    return (
      <div className="pt-44 pb-24 px-6 max-w-5xl mx-auto animate-pulse">
        <div className="h-6 w-32 bg-white/5 rounded mb-8" />
        <div className="flex flex-col md:flex-row gap-12">
          <div className="md:w-2/3 space-y-8">
            <div className="h-12 w-full bg-white/5 rounded" />
            <div className="h-24 w-full bg-white/5 rounded-2xl" />
            <div className="h-64 w-full bg-white/5 rounded-3xl" />
          </div>
          <div className="md:w-1/3 space-y-6">
            <div className="h-40 w-full bg-white/5 rounded-2xl" />
            <div className="h-40 w-full bg-white/5 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="pt-40 pb-24 px-6 max-w-xl mx-auto text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-8">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">
          Program Tidak Ditemukan
        </h1>
        <p className="text-gray-400 mb-12">
          Inisiatif strategis yang Anda cari mungkin telah selesai atau
          dipindahkan ke arsip kabinet.
        </p>
        <Link
          href="/proker"
          className="px-8 py-4 bg-white text-[#091c11] font-bold rounded-full hover:bg-army-accent transition-all"
        >
          Kembali ke Roadmap Proker
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-48 pb-24 px-6 max-w-7xl mx-auto relative z-10">
      <Breadcrumbs
        items={[
          { label: "Initiatives", href: "/proker" },
          { label: "Strategic Detail", isCurrent: true },
        ]}
        id={`PID_${item._id.slice(-6).toUpperCase()}`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Essential Info */}
        <div className="lg:col-span-8 space-y-12">
          <header>
            <div className="flex items-center gap-4 mb-6">
              <span
                className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-widest border
                  ${item.status === "Upcoming" || item.status === "Ongoing" ? "bg-[#10b981]/20 text-[#10b981] border-[#10b981]/40" : "bg-white/5 text-gray-500 border-white/10"}
                `}
              >
                {item.status}
              </span>
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                PID: {item._id.slice(-8).toUpperCase()}
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-8 font-sans leading-tight">
              {item.title}
            </h1>
            <div className="p-8 rounded-[32px] bg-white/[0.02] border border-white/10 backdrop-blur-sm">
              <p className="text-gray-300 leading-relaxed text-lg italic">
                {item.description}
              </p>
            </div>
          </header>

          {/* Performance & Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 rounded-3xl border border-white/5 bg-[#0a2214]/40">
              <div className="flex items-center gap-3 mb-6 text-[#10b981]">
                <Target className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-widest">
                  Target Capaian
                </span>
              </div>
              <div className="flex items-end gap-2 mb-4">
                <span className="text-5xl font-bold text-white">
                  {item.progress || 0}
                </span>
                <span className="text-gray-500 font-mono text-xl mb-1">%</span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#10b981] transition-all duration-1000"
                  style={{ width: `${item.progress || 0}%` }}
                />
              </div>
            </div>

            <div className="p-8 rounded-3xl border border-white/5 bg-[#0a2214]/40">
              <div className="flex items-center gap-3 mb-6 text-[#10b981]">
                <Activity className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-widest">
                  Status Pelaksanaan
                </span>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Tahapan Saat Ini</span>
                  <span className="text-white font-bold">{item.status}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Health Check</span>
                  <span className="text-[#10B981] font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Stable
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Detail Content */}
          <div className="prose prose-invert prose-emerald max-w-none text-gray-300 leading-relaxed py-8">
            <h3 className="text-2xl font-bold text-white mb-6">
              Detail Strategis
            </h3>
            <p>
              Program kerja ini merupakan salah satu inisiatif unggulan yang
              dirancang untuk memberikan dampak positif berkelanjutan bagi
              seluruh mahasiswa Teknik UNESA. Setiap tahapan pelaksanaan diawasi
              secara ketat untuk memastikan standar kualitas dan transparansi
              tetap terjaga.
            </p>
            <p>
              Inovasi yang diusung dalam program ini mencakup integrasi sistem
              digital, kolaborasi lintas kementerian, serta orientasi pada
              solusi nyata terhadap tantangan yang dihadapi mahasiswa teknik di
              era transformasi digital ini.
            </p>
          </div>
        </div>

        {/* Right Column: Sidebar Meta */}
        <div className="lg:col-span-4 space-y-8">
          <div className="p-8 rounded-[40px] bg-white/[0.03] border border-white/10 backdrop-blur-md sticky top-32">
            <div className="space-y-10">
              {/* Department Owner */}
              <div>
                <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-4">
                  Penanggung Jawab
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#12331e]/30 border border-[#10b981]/20 flex items-center justify-center">
                    <Layers className="w-6 h-6 text-[#10b981]" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm leading-tight">
                      {item.departmentId?.name || "BEM FT UNESA"}
                    </h4>
                    <p className="text-[9px] text-gray-500 uppercase tracking-wider mt-1">
                      Sinergi Cabinet 2026
                    </p>
                  </div>
                </div>
              </div>

              {/* Timeline Meta */}
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" /> Tanggal Mulai
                  </p>
                  <p className="text-sm font-bold text-white">
                    {item.startDate
                      ? new Date(item.startDate).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "TBA"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" /> Estimasi Selesai
                  </p>
                  <p className="text-sm font-bold text-white">
                    {item.endDate
                      ? new Date(item.endDate).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "TBA"}
                  </p>
                </div>
              </div>

              {/* CTA */}
              <button className="w-full py-4 bg-white text-[#091c11] font-bold rounded-2xl hover:bg-army-accent hover:text-white transition-all shadow-xl flex items-center justify-center gap-2 group">
                Hubungi Dept Terkait{" "}
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
