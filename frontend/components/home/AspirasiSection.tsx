"use client";

import Link from "next/link";
import { useStats } from "@/hooks/useStats";

export function AspirasiSection() {
  const { data: statsData } = useStats();
  const fetchedStats = statsData?.data;

  return (
    <section className="w-full max-w-6xl mx-auto py-12 md:py-16 px-4 md:px-6 relative z-10">
      <div className="relative rounded-3xl overflow-hidden bg-linear-to-br from-[#12331e] to-[#0a2214] border border-white/10 shadow-2xl">
        <div className="relative p-8 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="md:w-2/3 w-full text-center md:text-left">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 font-sans leading-tight">
              Suaramu <br />
              <span className="text-[#10b981]">Menentukan Arah</span>
            </h2>
            <p className="text-gray-300 text-lg mb-8 max-w-xl">
              Sampaikan aspirasi Anda untuk kemajuan fakultas.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-8 md:mt-0">
              <Link href="/aspirasi" className="btn-strategic w-full sm:w-auto">
                Sampaikan Aspirasi
              </Link>
              <Link
                href="/aspirasi/track"
                className="btn-tactical w-full sm:w-auto"
              >
                Lacak Aspirasi
              </Link>
            </div>
          </div>

          <div className="w-full md:w-1/3 mt-4 md:mt-0">
            <div className="glass-subtle rounded-2xl p-5 md:p-6">
              <h3 className="text-lg font-bold text-white mb-4 text-center md:text-left">
                Statistik Aspirasi
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <span className="text-gray-400">Total Masuk</span>
                  <span className="text-2xl font-bold text-white">
                    {fetchedStats?.aspirations.total || "0"}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <span className="text-gray-400">Sedang Diproses</span>
                  <span className="text-2xl font-bold text-[#F5A623]">
                    {fetchedStats?.aspirations.pending || "0"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Telah Selesai</span>
                  <span className="text-2xl font-bold text-[#10B981]">
                    {fetchedStats?.aspirations.resolved || "0"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
