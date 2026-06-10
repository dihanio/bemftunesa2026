"use client";

import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/lib/api/dashboard";
import {
  Wallet,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  FileCheck2,
  PieChart,
} from "lucide-react";
import { formatCompactIdr } from "@/app/(dashboard)/page";

function GlassPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur-md ${className}`}
    >
      {children}
    </div>
  );
}

export function BendaharaDashboard() {
  const { data: statsData } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => dashboardService.getStats(),
  });

  const { data: budgetData } = useQuery({
    queryKey: ["dashboard-monthly-budget"],
    queryFn: () => dashboardService.getMonthlyBudget(),
  });

  const { data: risksData, isLoading: isRisksLoading } = useQuery({
    queryKey: ["dashboard-risks"],
    queryFn: () => dashboardService.getRisks(),
  });

  const stats = statsData?.data;
  const budget = budgetData?.data || [];
  const risks = risksData?.data || [];

  const remainingBudget = stats?.remainingBudget ?? 0;
  const usedBudget = stats?.usedBudget ?? 0;
  const totalBudget = remainingBudget + usedBudget;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GlassPanel>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#a9b49c]">
              Total Anggaran
            </span>
            <Wallet className="h-4 w-4 text-[#10b981]" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">
              {formatCompactIdr(totalBudget)}
            </span>
          </div>
          <p className="mt-1 text-[10px] text-[#a9b49c]">Total pagu kabinet</p>
        </GlassPanel>

        <GlassPanel>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#a9b49c]">
              Realisasi (SPJ)
            </span>
            <TrendingUp className="h-4 w-4 text-[#71d39b]" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">
              {formatCompactIdr(usedBudget)}
            </span>
          </div>
          <p className="mt-1 text-[10px] text-[#71d39b] font-medium">
            Dana terserap
          </p>
        </GlassPanel>

        <GlassPanel>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#a9b49c]">
              Sisa Anggaran
            </span>
            <PieChart className="h-4 w-4 text-[#9dc3ff]" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">
              {formatCompactIdr(remainingBudget)}
            </span>
          </div>
          <p className="mt-1 text-[10px] text-[#a9b49c]">Belum terpakai</p>
        </GlassPanel>

        <GlassPanel>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#a9b49c]">
              Verifikasi LPJ
            </span>
            <FileCheck2 className="h-4 w-4 text-[#f0c36a]" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">
              {stats?.pendingRAB ?? 0} LPJ
            </span>
          </div>
          <p className="mt-1 text-[10px] text-[#f0c36a] font-medium">
            Menunggu audit bendahara
          </p>
        </GlassPanel>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_360px]">
        {/* Left: Monthly Cashflow Aggregations */}
        <GlassPanel>
          <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/10 pb-4">
            <TrendingUp className="h-4 w-4 text-[#10b981]" />
            Monthly Cashflow Aggregate
          </h2>

          <div className="mt-5 space-y-4">
            {budget.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#a9b49c]">
                Tidak ada data cashflow bulanan
              </div>
            ) : (
              budget.slice(0, 6).map((item) => (
                <div
                  key={item.month}
                  className="rounded-lg border border-white/5 bg-white/3 p-3 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-white font-bold">{item.month}</span>
                    <span className="text-[#a9b49c]">
                      Serapan SPJ: {formatCompactIdr(item.used)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-[#c8d2bd]">
                    <div>Rencana (RAB): {formatCompactIdr(item.planned)}</div>
                    <div>Approved: {formatCompactIdr(item.approved)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassPanel>

        {/* Right: Overspending & Financial Alerts */}
        <GlassPanel>
          <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/10 pb-4">
            <AlertTriangle className="h-4 w-4 text-[#ff7a7a]" />
            Risk & Overspending Checks
          </h2>
          <div className="mt-5 space-y-3">
            {isRisksLoading ? (
              <div className="h-10 animate-pulse rounded-lg bg-white/8" />
            ) : risks.length > 0 ? (
              risks.map((risk, index) => {
                const isDanger = risk.status === "danger";
                return (
                  <div
                    key={index}
                    className={`rounded-lg border p-3 flex gap-3 ${
                      isDanger
                        ? "border-[#ff7a7a]/20 bg-[#ff7a7a]/5"
                        : "border-[#f0c36a]/20 bg-[#f0c36a]/5"
                    }`}
                  >
                    <AlertTriangle
                      className={`h-5 w-5 shrink-0 ${isDanger ? "text-[#ff7a7a]" : "text-[#f0c36a]"}`}
                    />
                    <div className="min-w-0">
                      <span className="block text-xs font-bold text-white">
                        {risk.label}
                      </span>
                      <span className="mt-1 block text-[10px] leading-relaxed text-[#c8d2bd]">
                        {risk.value}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-lg border border-white/10 bg-white/3 p-3 flex gap-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-[#71d39b]" />
                <div className="min-w-0">
                  <span className="block text-xs font-bold text-white">
                    Semua Sistem Aman
                  </span>
                  <span className="mt-1 block text-[10px] leading-relaxed text-[#c8d2bd]">
                    Arus anggaran dan validasi RAB berjalan normal tanpa
                    anomali.
                  </span>
                </div>
              </div>
            )}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
