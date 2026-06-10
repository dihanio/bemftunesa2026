"use client";

import {
  useMemo,
  useState,
  type ComponentType,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import {
  dashboardService,
  type Activity,
  type AgendaItem,
} from "@/lib/api/dashboard";
import { financeService } from "@/lib/api/finance";
import { prokerService } from "@/lib/api/proker";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileCheck2,
  CalendarDays,
  AlertTriangle,
  Award,
  Wallet,
  CheckCircle,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Loader2,
  Users,
  LineChart,
  PieChart,
  BarChart3,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  CircleDollarSign,
  X,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Budget details
type BudgetPoint = {
  month: string;
  planned: number;
  used: number;
  approved: number;
};

// Premium Panel wrapper
function GlassPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className={cn(
        "relative overflow-hidden rounded-lg border border-white/10 bg-white/7 p-4 shadow-[0_20px_70px_rgba(0,0,0,0.22)] backdrop-blur-2xl md:p-5",
        className,
      )}
    >
      {children}
    </motion.section>
  );
}

// PanelHeader component
function PanelHeader({
  icon: Icon,
  title,
  action,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#10b981]/25 bg-[#10b981]/12">
          <Icon className="h-4 w-4 text-[#a7f3d0]" />
        </div>
        <h2 className="truncate text-sm font-bold text-white">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function KabemDashboard() {
  const { user, activeRole } = useAuth();
  const [budgetMode, setBudgetMode] = useState<"used" | "planned" | "approved">(
    "used",
  );
  const [activeBudgetIndex, setActiveBudgetIndex] = useState(
    new Date().getMonth(),
  );
  const [selectedStage, setSelectedStage] = useState("Active");

  // Executive-level full queries
  const { data: statsData, isLoading: isStatsLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => dashboardService.getStats(),
  });

  const { data: activitiesData, isLoading: isActivitiesLoading } = useQuery({
    queryKey: ["dashboard-activities"],
    queryFn: () => dashboardService.getActivities(6),
  });

  const { data: agendaData, isLoading: isAgendaLoading } = useQuery({
    queryKey: ["dashboard-agenda"],
    queryFn: () => dashboardService.getAgenda(4),
  });

  const { data: budgetData } = useQuery({
    queryKey: ["dashboard-monthly-budget"],
    queryFn: () => dashboardService.getMonthlyBudget(),
  });

  const { data: lifecycleData, isLoading: isLifecycleLoading } = useQuery({
    queryKey: ["dashboard-lifecycle"],
    queryFn: () => dashboardService.getLifecycle(),
  });

  const { data: allocationData, isLoading: isAllocationLoading } = useQuery({
    queryKey: ["dashboard-allocation"],
    queryFn: () => dashboardService.getDepartmentAllocation(),
  });

  const { data: workloadData, isLoading: isWorkloadLoading } = useQuery({
    queryKey: ["dashboard-workload"],
    queryFn: () => dashboardService.getWorkload(),
  });

  const { data: risksData, isLoading: isRisksLoading } = useQuery({
    queryKey: ["dashboard-risks"],
    queryFn: () => dashboardService.getRisks(),
  });

  const { data: proposalsData, isLoading: isProposalsLoading } = useQuery({
    queryKey: ["dashboard-pending-proposals"],
    queryFn: () => financeService.listProposals({ status: "Submitted" }),
  });

  const { data: prokersData, isLoading: isProkersLoading } = useQuery({
    queryKey: ["dashboard-prokers"],
    queryFn: () => prokerService.list({ limit: 100 }),
  });

  const stats = statsData?.data;
  const activities = activitiesData?.data || [];
  const agenda = agendaData?.data || [];
  const lifecycle = lifecycleData?.data || [];
  const allocation = allocationData?.data || [];
  const workload = workloadData?.data || [];
  const risks = risksData?.data || [];
  const pendingProposals = proposalsData?.data || [];
  const prokers = prokersData?.data || [];

  const remainingBudget = stats?.remainingBudget ?? 0;
  const usedBudget = stats?.usedBudget ?? 0;
  const totalBudget = remainingBudget + usedBudget;
  const percentUsed =
    totalBudget > 0 ? Math.round((usedBudget / totalBudget) * 100) : 0;

  useMemo(() => {
    if (
      lifecycle.length > 0 &&
      !lifecycle.some((item) => item.label === selectedStage)
    ) {
      setSelectedStage(lifecycle[0].label);
    }
  }, [lifecycle, selectedStage]);

  const budget = useMemo(() => {
    const apiBudget = budgetData?.data;
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Agu",
      "Sep",
      "Okt",
      "Nov",
      "Des",
    ];

    if (Array.isArray(apiBudget) && apiBudget.length > 0) {
      return apiBudget.map((item: any, index: number) => ({
        month: item.month || months[index % 12],
        planned: Number(item.planned ?? 0),
        used: Number(item.used ?? item.amount ?? 0),
        approved: Number(item.approved ?? 0),
      }));
    }

    return months.map((month) => ({
      month,
      planned: 0,
      used: 0,
      approved: 0,
    }));
  }, [budgetData?.data]);

  const activeBudget = budget[Math.min(activeBudgetIndex, budget.length - 1)] ||
    budget[budget.length - 1] || {
      month: "",
      planned: 0,
      used: 0,
      approved: 0,
    };

  const metrics = [
    {
      title: "Total Proker",
      value: stats?.totalProker ?? "0",
      description: `${stats?.activeProker ?? 0} proker sedang berjalan`,
      icon: KanbanSquareIcon,
      trend: stats?.activeProker ? "+1" : "0",
      color: "#10b981",
    },
    {
      title: "Realisasi Anggaran",
      value: `${percentUsed}%`,
      description: `${percentUsed}% dana terpakai`,
      icon: Wallet,
      trend: "0%",
      color: "#9dc3ff",
    },
    {
      title: "Pending Approvals",
      value: pendingProposals.length,
      description: "Menunggu persetujuan Anda",
      icon: FileCheck2,
      trend: pendingProposals.length > 0 ? `+${pendingProposals.length}` : "0",
      color: "#f0c36a",
      alert: pendingProposals.length > 0,
    },
    {
      title: "Total Fungsionaris",
      value: stats?.activeCommittees ?? "78",
      description: "Pengurus BEM FT Aktif",
      icon: Users,
      trend: "0",
      color: "#a7f3d0",
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 ease-out">
      {/* KaBEM Executive Welcome Banner */}
      <section className="relative overflow-hidden rounded-lg border border-white/10 bg-white/7 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.25)] backdrop-blur-2xl md:p-6">
        <div className="absolute inset-0 bg-linear-to-r from-white/8 via-transparent to-[#10b981]/10" />
        <div className="relative grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#10b981]/25 bg-[#10b981]/10 px-3 py-1 text-[11px] font-semibold text-[#a7f3d0]">
              <Sparkles className="h-3.5 w-3.5" />
              Presidential Command Center
            </div>
            <h1 className="mt-5 max-w-3xl text-3xl font-black leading-tight text-white md:text-5xl">
              Selamat memimpin, {user?.name?.split(" ")[0] || "KaBEM"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#c8d2bd]">
              Ruang kendali eksekutif untuk memantau performa departemen,
              anggaran program kerja, persetujuan proposal (RAB), dan sinyal
              risiko organisasi.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                onClick={() => {
                  const element = document.getElementById("action-center");
                  if (element) element.scrollIntoView({ behavior: "smooth" });
                }}
                className="group relative overflow-hidden h-10 rounded-full bg-white px-5 text-[#091c11] font-semibold hover:bg-[#a7f3d0] hover:shadow-[0_0_24px_rgba(167, 243, 208,0.45)] hover:-translate-y-0.5 transition-all duration-300 active:translate-y-0 cursor-pointer"
              >
                <div className="absolute top-0 -left-full h-full w-[40%] bg-linear-to-r from-transparent via-white/40 to-transparent -skew-x-25 transition-all duration-1000 ease-out group-hover:left-[120%]" />
                <FileCheck2 className="relative z-10 h-4 w-4" />
                <span className="relative z-10">
                  Persetujuan Proposal ({pendingProposals.length})
                </span>
              </Button>
              <Button
                variant="ghost"
                onClick={() => (window.location.href = "/meetings")}
                className="group relative overflow-hidden h-10 rounded-full border border-white/10 bg-white/8 px-5 text-white hover:bg-white/12 hover:shadow-[0_0_20px_rgba(255,255,255,0.08)] hover:-translate-y-0.5 transition-all duration-300 active:translate-y-0 cursor-pointer"
              >
                <div className="absolute top-0 -left-full h-full w-[40%] bg-linear-to-r from-transparent via-white/20 to-transparent -skew-x-25 transition-all duration-1000 ease-out group-hover:left-[120%]" />
                <CalendarDays className="relative z-10 h-4 w-4" />
                <span className="relative z-10">Lihat Agenda</span>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SignalTile
              label="Proposal Pending"
              value={pendingProposals.length}
              icon={FileCheck2}
              tone="warning"
            />
            <SignalTile
              label="Remaining Budget"
              value={formatCompactIdr(remainingBudget)}
              icon={CircleDollarSign}
              tone="success"
            />
            <SignalTile
              label="Program Kerja Aktif"
              value={stats?.activeProker ?? 0}
              icon={ShieldCheck}
              tone="accent"
            />
            <SignalTile
              label="Audit Logs Checked"
              value={stats?.auditCount ?? 0}
              icon={TrendingUp}
              tone="info"
            />
          </div>
        </div>
      </section>

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric, index) => (
          <MetricCard
            key={metric.title}
            metric={metric}
            index={index}
            loading={isStatsLoading}
          />
        ))}
      </div>

      {(isStatsLoading || isActivitiesLoading || isAgendaLoading) && (
        <div className="inline-flex items-center gap-2 rounded-full border border-[#10b981]/20 bg-[#10b981]/10 px-3 py-1.5 text-xs text-[#a7f3d0]">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Sinkronisasi komprehensif data eksekutif...
        </div>
      )}

      {/* Primary Analytics Section */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.85fr)]">
        <GlassPanel className="min-h-[420px]">
          <PanelHeader
            icon={LineChart}
            title="Arus Anggaran Kabinet"
            action={
              <div className="flex rounded-full border border-white/10 bg-white/6 p-1">
                {(["used", "planned", "approved"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setBudgetMode(mode)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                      budgetMode === mode
                        ? "bg-white text-[#091c11]"
                        : "text-[#b8c4aa] hover:text-white",
                    )}
                  >
                    {modeLabel[mode]}
                  </button>
                ))}
              </div>
            }
          />
          <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_210px]">
            <BudgetLineChart
              data={budget}
              mode={budgetMode}
              activeIndex={Math.min(activeBudgetIndex, budget.length - 1)}
              onActiveIndex={setActiveBudgetIndex}
            />
            <div className="rounded-lg border border-white/10 bg-[#091c11]/50 p-4">
              <div className="text-xs font-semibold uppercase text-[#10b981]">
                {activeBudget.month}
              </div>
              <div className="mt-2 text-2xl font-black text-white">
                {formatCompactIdr(activeBudget[budgetMode])}
              </div>
              <div className="mt-4 space-y-3">
                <MiniStat
                  label="Direncanakan"
                  value={formatCompactIdr(activeBudget.planned)}
                />
                <MiniStat
                  label="Diserap"
                  value={formatCompactIdr(activeBudget.used)}
                />
                <MiniStat
                  label="Disetujui"
                  value={formatCompactIdr(activeBudget.approved)}
                />
              </div>
            </div>
          </div>
        </GlassPanel>

        <GlassPanel className="relative">
          <PanelHeader icon={PieChart} title="Lifecycle Proker" />
          <LifecycleDonut
            data={lifecycle}
            selected={selectedStage}
            onSelect={setSelectedStage}
            loading={isLifecycleLoading}
            prokers={prokers}
            isProkersLoading={isProkersLoading}
          />
        </GlassPanel>
      </div>

      {/* Middle Analytics Section */}
      <div className="grid gap-5 xl:grid-cols-3">
        <GlassPanel>
          <PanelHeader icon={BarChart3} title="Alokasi Departemen" />
          <AllocationBars items={allocation} loading={isAllocationLoading} />
        </GlassPanel>

        <GlassPanel>
          <PanelHeader icon={Users} title="Workload Matrix Departemen" />
          <WorkloadMatrix items={workload} loading={isWorkloadLoading} />
        </GlassPanel>

        <GlassPanel>
          <PanelHeader icon={CalendarDays} title="Agenda Terdekat" />
          <AgendaList items={agenda} loading={isAgendaLoading} />
        </GlassPanel>
      </div>

      {/* Executive Action & Risk Center */}
      <div
        id="action-center"
        className="grid gap-5 xl:grid-cols-[1fr_minmax(320px,420px)]"
      >
        {/* Left: Pending Approposals Action required */}
        <GlassPanel>
          <PanelHeader
            icon={FileCheck2}
            title="Action Required: Persetujuan Proposal"
          />
          <div className="mt-5 space-y-3">
            {isProposalsLoading ? (
              <SkeletonRows count={3} />
            ) : pendingProposals.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {pendingProposals.map((proposal) => (
                  <div
                    key={proposal._id}
                    className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col gap-2 hover:bg-white/8 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white truncate max-w-[170px]">
                        {proposal.title}
                      </span>
                      <span className="rounded bg-[#f0c36a]/10 px-2 py-0.5 text-[9px] font-bold text-[#f0c36a] uppercase">
                        {proposal.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#c8d2bd] font-medium">
                      Versi RAB: v{proposal.version}
                    </p>
                    <div className="mt-2 flex items-center justify-between border-t border-white/5 pt-2 text-[10px] text-[#a9b49c]">
                      <span>
                        Diajukan:{" "}
                        {new Date(proposal.createdAt).toLocaleDateString(
                          "id-ID",
                        )}
                      </span>
                      <button
                        onClick={() =>
                          (window.location.href = `/finance/proposal/${proposal._id}`)
                        }
                        className="font-bold text-[#10b981] flex items-center gap-1 hover:text-white"
                      >
                        Review <ArrowUpRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-sm text-[#a9b49c] flex flex-col items-center justify-center gap-3">
                <CheckCircle className="h-10 w-10 text-[#71d39b]/60" />
                <p>
                  Semua pengajuan proposal telah berhasil ditinjau. Kerja bagus!
                </p>
              </div>
            )}
          </div>
        </GlassPanel>

        {/* Right: Risk Signals */}
        <GlassPanel>
          <PanelHeader icon={AlertTriangle} title="Sinyal Risiko Organisasi" />
          <div className="mt-5 space-y-3">
            {isRisksLoading ? (
              <SkeletonRows count={4} />
            ) : risks.length > 0 ? (
              risks.map((risk: any, i: number) => (
                <RiskRow
                  key={i}
                  label={risk.label}
                  value={risk.value}
                  status={risk.status}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/5 py-8 text-center">
                <ShieldCheck className="h-8 w-8 text-[#71d39b]" />
                <p className="mt-2 text-xs text-[#71d39b]">
                  Seluruh operasional berjalan aman & stabil
                </p>
              </div>
            )}
          </div>
        </GlassPanel>
      </div>

      {/* Activity Logs */}
      <GlassPanel>
        <PanelHeader icon={TrendingUp} title="Aktivitas Fungsionaris Terkini" />
        <ActivityFeed items={activities} loading={isActivitiesLoading} />
      </GlassPanel>
    </div>
  );
}

// Subcomponents definitions (Self-contained to ensure seamless layout stability)

const modeLabel = {
  used: "Serapan",
  planned: "Rencana",
  approved: "Approved",
};

function SignalTile({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  icon: ComponentType<{ className?: string }>;
  tone: "success" | "warning" | "accent" | "info";
}) {
  const colors = {
    success: "text-[#71d39b] bg-[#71d39b]/10 border-[#71d39b]/20",
    warning: "text-[#f0c36a] bg-[#f0c36a]/10 border-[#f0c36a]/20",
    accent: "text-[#a7f3d0] bg-[#10b981]/10 border-[#10b981]/20",
    info: "text-[#9dc3ff] bg-[#9dc3ff]/10 border-[#9dc3ff]/20",
  };

  return (
    <div className={cn("rounded-lg border p-4", colors[tone])}>
      <Icon className="h-4 w-4" />
      <div className="mt-4 text-2xl font-black text-white">{value}</div>
      <div className="mt-1 text-xs font-medium text-[#c8d2bd]">{label}</div>
    </div>
  );
}

function MetricCard({
  metric,
  index,
  loading,
}: {
  metric: {
    title: string;
    value: string | number;
    description: string;
    icon: ComponentType<{ className?: string; style?: CSSProperties }>;
    trend: string;
    color: string;
    alert?: boolean;
  };
  index: number;
  loading: boolean;
}) {
  const glowClass = useMemo(() => {
    switch (metric.color) {
      case "#10b981":
      case "#a7f3d0":
        return "hover:glass-glow-accent hover:border-[#10b981]/40";
      case "#f0c36a":
        return "hover:glass-glow-warning hover:border-[#f0c36a]/40";
      case "#9dc3ff":
        return "hover:glass-glow-info hover:border-[#9dc3ff]/40";
      default:
        return "hover:glass-glow-accent hover:border-[#10b981]/40";
    }
  }, [metric.color]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "card-premium group relative overflow-hidden p-4",
        glowClass,
        metric.alert &&
          "border-yellow-500/30 bg-yellow-500/5 shadow-[0_0_15px_rgba(240,195,106,0.05)]",
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-[#a9b49c]">{metric.title}</p>
          {loading ? (
            <div className="mt-3 h-8 w-24 animate-pulse rounded bg-white/10" />
          ) : (
            <div className="mt-2 text-3xl font-black text-white">
              {metric.value}
            </div>
          )}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/8 transition-colors group-hover:bg-white/12">
          <metric.icon className="h-5 w-5" style={{ color: metric.color }} />
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between gap-3">
        <span className="truncate text-xs text-[#c8d2bd]">
          {metric.description}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-white/8 px-2 py-1 text-xs font-bold text-[#a7f3d0]">
          <TrendingUp className="h-3 w-3" />
          {metric.trend}
        </span>
      </div>
    </motion.div>
  );
}

function KanbanSquareIcon({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M8 7v7" />
      <path d="M12 7v10" />
      <path d="M16 7v4" />
    </svg>
  );
}

function BudgetLineChart({
  data,
  mode,
  activeIndex,
  onActiveIndex,
}: {
  data: BudgetPoint[];
  mode: "used" | "planned" | "approved";
  activeIndex: number;
  onActiveIndex: (index: number) => void;
}) {
  const values = data.map((point) => point[mode]);
  const max = Math.max(
    ...data.flatMap((point) => [point.planned, point.used, point.approved]),
    1,
  );
  const width = 620;
  const height = 260;
  const padX = 34;
  const padY = 26;
  const chartWidth = width - padX * 2;
  const chartHeight = height - padY * 2;
  const points = values.map((value, index) => {
    const x = padX + (index / Math.max(1, data.length - 1)) * chartWidth;
    const y = padY + chartHeight - (value / max) * chartHeight;
    return { x, y, value, month: data[index].month };
  });
  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  return (
    <div className="min-w-0">
      <div className="relative aspect-16/7 min-h-[250px] overflow-hidden rounded-lg border border-white/10 bg-[#091c11]/50">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-full w-full"
          role="img"
          aria-label="Grafik arus anggaran"
        >
          <defs>
            <linearGradient id="budgetFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.34" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 1, 2, 3].map((line) => {
            const y = padY + (line / 3) * chartHeight;
            return (
              <line
                key={line}
                x1={padX}
                x2={width - padX}
                y1={y}
                y2={y}
                stroke="rgba(255,255,255,0.08)"
              />
            );
          })}
          <path
            d={`${path} L ${width - padX} ${height - padY} L ${padX} ${height - padY} Z`}
            fill="url(#budgetFill)"
          />
          <path
            d={path}
            fill="none"
            stroke="#a7f3d0"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {points.map((point, index) => (
            <g key={point.month}>
              <rect
                x={point.x - 28}
                y={padY}
                width="56"
                height={chartHeight}
                fill="transparent"
                onMouseEnter={() => onActiveIndex(index)}
              />
              <circle
                cx={point.x}
                cy={point.y}
                r={index === activeIndex ? 7 : 4}
                fill={index === activeIndex ? "#ffffff" : "#10b981"}
                stroke="#091c11"
                strokeWidth="3"
              />
              <text
                x={point.x}
                y={height - 8}
                textAnchor="middle"
                fill="#a9b49c"
                fontSize="13"
              >
                {point.month}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

function LifecycleDonut({
  data,
  selected,
  onSelect,
  loading,
  prokers = [],
  isProkersLoading = false,
}: {
  data: { label: string; value: number; color: string }[];
  selected: string;
  onSelect: (stage: string) => void;
  loading: boolean;
  prokers?: any[];
  isProkersLoading?: boolean;
}) {
  const [showOverlay, setShowOverlay] = useState(false);

  if (loading) {
    return (
      <div className="mt-6 flex h-48 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#10b981]" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="mt-6 flex flex-col items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/5 py-8 text-center">
        <PieChart className="h-8 w-8 text-[#a9b49c]/50" />
        <p className="mt-2 text-xs text-[#a9b49c]">Tidak ada data proker</p>
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);

  // Calculate segments and their offsets/dashes
  let offset = 0;
  let selectedOffset = 0;
  let selectedDash = 0;

  const segments = data.map((stage) => {
    const dash = total > 0 ? (stage.value / total) * 263.89 : 0;
    const currentOffset = offset;
    offset += dash;

    if (stage.label === selected) {
      selectedOffset = currentOffset;
      selectedDash = dash;
    }

    return {
      ...stage,
      dash,
      offset: currentOffset,
    };
  });

  const selectedItem =
    data.find((stage) => stage.label === selected) || data[0];

  // Filter prokers for selected stage
  const filteredProkers = prokers.filter((p) => {
    return p.status?.toLowerCase() === selected.toLowerCase();
  });

  const handleSelectSegment = (label: string) => {
    onSelect(label);
    setShowOverlay(true);
  };

  return (
    <div className="relative mt-6">
      <div className="grid gap-5 sm:grid-cols-[180px_1fr] xl:grid-cols-1">
        <div className="relative mx-auto h-44 w-44">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
            <defs>
              <filter
                id="donut-glow"
                x="-20%"
                y="-20%"
                width="140%"
                height="140%"
              >
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <circle
              cx="60"
              cy="60"
              r="42"
              fill="none"
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="12"
            />
            {/* Draw base segments */}
            {segments.map((stage) => (
              <circle
                key={stage.label}
                cx="60"
                cy="60"
                r="42"
                fill="none"
                stroke={stage.color}
                strokeWidth={selected === stage.label ? 16 : 10}
                strokeDasharray={`${stage.dash} 263.89`}
                strokeDashoffset={-stage.offset}
                strokeLinecap="round"
                className="cursor-pointer transition-all duration-300 hover:stroke-[14px]"
                onClick={() => handleSelectSegment(stage.label)}
              />
            ))}

            {/* Selected segment rendered last with extra stroke and glow effect for overlaying effect */}
            {selectedItem && selectedDash > 0 && (
              <motion.circle
                key={`active-${selected}`}
                initial={{ strokeWidth: 10 }}
                animate={{ strokeWidth: 18 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                cx="60"
                cy="60"
                r="42"
                fill="none"
                stroke={selectedItem.color}
                strokeWidth={18}
                strokeDasharray={`${selectedDash} 263.89`}
                strokeDashoffset={-selectedOffset}
                strokeLinecap="round"
                filter="url(#donut-glow)"
                className="cursor-pointer transition-all duration-300"
                onClick={() => setShowOverlay(true)}
              />
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-3xl font-black text-white">
              {selectedItem?.value ?? 0}
            </span>
            <span className="mt-1 text-[11px] font-bold uppercase tracking-wider text-[#a9b49c]">
              {selectedItem?.label}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowOverlay(true);
              }}
              className="pointer-events-auto mt-1 rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-bold text-white hover:bg-[#10b981] hover:text-[#091c11] transition-colors"
            >
              Lihat Proker
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {data.map((stage) => (
            <button
              key={stage.label}
              type="button"
              onClick={() => handleSelectSegment(stage.label)}
              className={cn(
                "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors",
                selected === stage.label
                  ? "border-[#10b981]/35 bg-white/10 text-white font-bold"
                  : "border-white/10 bg-white/5 text-[#b8c4aa] hover:bg-white/8",
              )}
            >
              <span className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: stage.color }}
                />
                {stage.label}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-bold">{stage.value}</span>
                <span className="text-xs text-[#a9b49c]/70 hover:text-white transition-colors">
                  →
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* DETAILED OVERLAY: SLIDES IN FRONT OF THE CHART */}
      <AnimatePresence>
        {showOverlay && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute inset-x-[-12px] inset-y-[-12px] z-30 flex flex-col rounded-xl border border-white/12 bg-[#091c11]/98 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-3xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full animate-pulse"
                  style={{ backgroundColor: selectedItem?.color }}
                />
                <h3 className="text-sm font-bold text-white">
                  Proker: <span className="text-[#a7f3d0]">{selected}</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowOverlay(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-[#c8d2bd] hover:bg-white/10 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* List */}
            <div className="mt-4 flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
              {isProkersLoading ? (
                <div className="flex h-32 items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-[#10b981]" />
                </div>
              ) : filteredProkers.length > 0 ? (
                filteredProkers.map((proker) => (
                  <div
                    key={proker._id}
                    className="group relative overflow-hidden rounded-xl border border-white/8 bg-white/4 p-4 transition-all hover:bg-white/7 hover:border-white/15"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-white group-hover:text-[#a7f3d0] transition-colors leading-tight">
                          {proker.title}
                        </h4>
                        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[#a9b49c]">
                          <span className="rounded bg-[#10b981]/10 px-1.5 py-0.5 text-[9px] font-bold text-[#a7f3d0] uppercase border border-[#10b981]/20">
                            PROKER
                          </span>
                          <span>•</span>
                          <span>Progress: {proker.progress}%</span>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          (window.location.href = `/proker/${proker._id}`)
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[#a7f3d0] opacity-80 hover:opacity-100 hover:bg-[#10b981] hover:text-[#091c11] transition-all"
                        title="Kelola Proker"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Progress Bar inside Card */}
                    <div className="mt-4">
                      <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${proker.progress}%`,
                            backgroundColor: selectedItem?.color || "#10b981",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center text-xs text-[#a9b49c]">
                  <PieChart className="h-8 w-8 text-white/20 mb-2" />
                  <p>Tidak ada program kerja aktif di status ini</p>
                </div>
              )}
            </div>

            {/* Bottom count info */}
            <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-[11px] text-[#a9b49c]">
              <span>Total di status ini:</span>
              <span className="font-bold text-white">
                {filteredProkers.length} program kerja
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AllocationBars({
  items,
  loading,
}: {
  items: { department: string; usagePercent: number }[];
  loading: boolean;
}) {
  const colors = [
    "#10b981",
    "#a7f3d0",
    "#f0c36a",
    "#71d39b",
    "#9dc3ff",
    "#ff7a7a",
  ];

  if (loading) {
    return <SkeletonRows count={5} />;
  }

  if (!items || items.length === 0) {
    return (
      <div className="mt-6 flex flex-col items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/5 py-8 text-center">
        <BarChart3 className="h-8 w-8 text-[#a9b49c]/50" />
        <p className="mt-2 text-xs text-[#a9b49c]">Tidak ada data alokasi</p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {items.map((item, index) => (
        <div key={item.department}>
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-semibold text-white">{item.department}</span>
            <span className="text-[#a9b49c]">{item.usagePercent}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-white/8">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(item.usagePercent, 100)}%`,
                background: colors[index % colors.length],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function WorkloadMatrix({
  items,
  loading,
}: {
  items: {
    department: string;
    members: number;
    assignments: number;
    loadScore: number;
    risk: string;
  }[];
  loading: boolean;
}) {
  if (loading) {
    return <SkeletonRows count={5} />;
  }

  if (!items || items.length === 0) {
    return (
      <div className="mt-6 flex flex-col items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/5 py-8 text-center">
        <Users className="h-8 w-8 text-[#a9b49c]/50" />
        <p className="mt-2 text-xs text-[#a9b49c]">Tidak ada data workload</p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {items.map((row) => (
        <div key={row.department} className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-white">{row.department}</span>
            <span className="text-[#a9b49c]">
              {row.assignments} tugas / {row.members} fungsionaris (
              {row.loadScore}%)
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-white/8">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${row.loadScore}%`,
                background: matrixColor(row.loadScore),
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function AgendaList({
  items,
  loading,
}: {
  items: AgendaItem[];
  loading: boolean;
}) {
  if (loading) {
    return <SkeletonRows count={4} />;
  }

  if (items.length === 0) {
    return (
      <div className="mt-5 flex flex-col items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/5 py-8 text-center">
        <CalendarDays className="h-8 w-8 text-[#a9b49c]/50" />
        <p className="mt-2 text-xs text-[#a9b49c]">Tidak ada agenda terdekat</p>
      </div>
    );
  }

  return (
    <div className="mt-5 space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="rounded-lg border border-white/10 bg-white/5 p-3 transition-colors hover:bg-white/8"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white">{item.title}</h3>
              <p className="mt-1 text-xs text-[#a9b49c]">
                {item.date} - {item.time}
              </p>
            </div>
            <Clock className="h-4 w-4 text-[#10b981]" />
          </div>
          <div className="mt-3 text-xs font-semibold text-[#a7f3d0]">
            {item.location}
          </div>
        </div>
      ))}
    </div>
  );
}

function ActivityFeed({
  items,
  loading,
}: {
  items: Activity[];
  loading: boolean;
}) {
  if (loading) {
    return <SkeletonRows count={5} />;
  }

  if (items.length === 0) {
    return (
      <div className="mt-5 flex flex-col items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/5 py-8 text-center">
        <TrendingUp className="h-8 w-8 text-[#a9b49c]/50" />
        <p className="mt-2 text-xs text-[#a9b49c]">
          Tidak ada aktivitas terbaru
        </p>
      </div>
    );
  }

  return (
    <div className="mt-5 space-y-3">
      {items.map((activity) => (
        <div
          key={activity.id}
          className="flex gap-3 rounded-lg border border-white/10 bg-white/5 p-3"
        >
          <div
            className={cn(
              "mt-1 h-2.5 w-2.5 rounded-full",
              activityColor(activity.type),
            )}
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-white">
              <span className="font-bold">{activity.user}</span>{" "}
              <span className="text-[#c8d2bd]">{activity.action}</span>
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#a9b49c]">
              <span>{activity.target}</span>
              <span>{activity.timestamp}</span>
            </div>
          </div>
          <ArrowUpRight className="h-4 w-4 text-[#10b981]" />
        </div>
      ))}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 pb-2 last:border-0 last:pb-0">
      <span className="text-xs text-[#a9b49c]">{label}</span>
      <span className="text-xs font-bold text-white">{value}</span>
    </div>
  );
}

function RiskRow({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status: "success" | "warning" | "danger";
}) {
  const Icon = status === "success" ? CheckCircle2 : AlertTriangle;
  const tone = {
    success: "text-[#71d39b] bg-[#71d39b]/10",
    warning: "text-[#f0c36a] bg-[#f0c36a]/10",
    danger: "text-[#ff7a7a] bg-[#ff7a7a]/10",
  }[status];

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg",
            tone,
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <span className="truncate text-sm font-semibold text-white">
          {label}
        </span>
      </div>
      <span className="shrink-0 text-xs font-bold text-[#c8d2bd]">{value}</span>
    </div>
  );
}

function SkeletonRows({ count }: { count: number }) {
  return (
    <div className="mt-5 space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="h-16 animate-pulse rounded-lg bg-white/8" />
      ))}
    </div>
  );
}

function formatCompactIdr(value: number) {
  if (value >= 1000000000) {
    return `Rp ${(value / 1000000000).toFixed(1)} M`;
  }

  if (value >= 1000000) {
    return `Rp ${(value / 1000000).toFixed(1)} jt`;
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function matrixColor(value: number) {
  if (value >= 85) return "rgba(255, 122, 122, 0.75)";
  if (value >= 70) return "rgba(240, 195, 106, 0.75)";
  return "rgba(16, 185, 129, 0.75)";
}

function activityColor(type: Activity["type"]) {
  if (type === "success") return "bg-[#71d39b]";
  if (type === "upload") return "bg-[#9dc3ff]";
  if (type === "alert") return "bg-[#f0c36a]";
  return "bg-[#10b981]";
}
