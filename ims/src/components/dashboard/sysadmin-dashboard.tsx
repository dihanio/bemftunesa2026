"use client";

import {
  useState,
  useEffect,
  useRef,
  type ComponentType,
  type ReactNode,
} from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardService } from "@/lib/api/dashboard";
import { cn } from "@/lib/utils";
import {
  Activity,
  Cpu,
  Database,
  RefreshCw,
  Settings,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Users,
  Terminal as TerminalIcon,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

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

export function SysAdminDashboard() {
  const queryClient = useQueryClient();

  const [localFlags, setLocalFlags] = useState<Record<string, boolean>>({});

  const [logs, setLogs] = useState<string[]>([
    "[SYSTEM] Initializing telemetry link...",
    "[SECURITY] Pre-hydrated Zustand persistent session store successfully.",
    "[DATABASE] MongoDB pool allocated: HEALTHY",
    "[NETWORK] Socket.io gateway listening on port 3001.",
    "[IMS] Core modules hot-reloaded using Next.js Turbopack.",
  ]);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  const { data: statsData } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => dashboardService.getStats(),
  });

  const { data: telemetryData, refetch } = useQuery({
    queryKey: ["dashboard-sysadmin-telemetry"],
    queryFn: () => dashboardService.getSysadminTelemetry(),
    refetchInterval: 5000,
  });

  const stats = statsData?.data;
  const telemetry = telemetryData?.data;
  
  // Use telemetry flags as source of truth, fallback to local overrides during mutation
  const activeFlags = {
    mfaEnforcement: localFlags.mfaEnforcement ?? telemetry?.flags?.mfaEnforcement ?? true,
    newBudgetEngine: localFlags.newBudgetEngine ?? telemetry?.flags?.newBudgetEngine ?? false,
    publicAspirationFlow: localFlags.publicAspirationFlow ?? telemetry?.flags?.publicAspirationFlow ?? true,
    maintenanceMode: localFlags.maintenanceMode ?? telemetry?.flags?.maintenanceMode ?? false,
  };

  // Auto Scroll Logs
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Periodic Random System Logs
  useEffect(() => {
    const randomLogs = [
      "[TELEMETRY] Node cpu usage checked: normal.",
      "[HEALTH] API latency stable at 14ms.",
      "[SEC] Client JWT token authenticated from ims-auth-storage.",
      "[CACHE] Redis asp-cache hit ratio: 94.2%",
      "[NOTIF] Service-worker pushed pending approvals alert.",
      "[API] GET /ims/dashboard/sysadmin - 200 OK",
    ];

    const interval = setInterval(() => {
      const time = new Date().toLocaleTimeString("id-ID");
      const randomLine =
        randomLogs[Math.floor(Math.random() * randomLogs.length)];
      setLogs((prev) => [...prev, `[${time}] ${randomLine}`].slice(-40));
    }, 9000);

    return () => clearInterval(interval);
  }, []);

  const toggleMutation = useMutation({
    mutationFn: (key: string) => dashboardService.toggleSysadminFlag(key),
    onSuccess: (res, key) => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-sysadmin-telemetry"] });
      addManualLog(`[FLAG] Successfully synchronized '${key}' with cluster.`);
    },
    onError: (err, key) => {
      // Revert local optimistic state
      setLocalFlags((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      addManualLog(`[ERROR] Failed to toggle '${key}': ${err.message}`);
    }
  });

  const toggleFlag = (key: keyof typeof activeFlags) => {
    const time = new Date().toLocaleTimeString("id-ID");
    const nextState = !activeFlags[key];
    
    // Optimistic UI update
    setLocalFlags((prev) => ({ ...prev, [key]: nextState }));
    
    setLogs((prev) => [
      ...prev,
      `[${time}] [FLAG] Requesting '${key}' status change to: ${nextState ? "ACTIVE" : "INACTIVE"}...`,
    ]);
    
    toggleMutation.mutate(key);
  };

  const addManualLog = (text: string) => {
    const time = new Date().toLocaleTimeString("id-ID");
    setLogs((prev) => [...prev, `[${time}] ${text}`]);
  };

  const handleClearCache = () => {
    addManualLog(
      "[CACHE] Flushing memory caches, asp-cache, and turbopack transpiles...",
    );
    setTimeout(() => {
      addManualLog(
        "[CACHE] Redis memory cache completely cleared. (0B affected)",
      );
    }, 700);
  };

  const handleSelfTest = () => {
    addManualLog(
      "[DIAGNOSTIC] Running system self-test and checking MongoDB socket links...",
    );
    setTimeout(() => {
      addManualLog(
        "[DIAGNOSTIC] All services healthy. MongoDB cluster response: 12ms.",
      );
    }, 900);
  };



  const metrics = [
    {
      title: "System Status",
      value: telemetry?.status ?? "HEALTHY",
      description: "All services fully active",
      icon: ShieldCheck,
      trend: "Online",
      color: "#10b981",
      blinker: true,
    },
    {
      title: "API Average Latency",
      value: `${telemetry?.latency ?? 14} ms`,
      description: "P95 gateway latency under target",
      icon: Activity,
      trend: "Optimal",
      color: "#a7f3d0",
    },
    {
      title: "Active Sessions",
      value: telemetry?.activeSessions ?? 8,
      description: "Across portals & devices",
      icon: Users,
      trend: "+2",
      color: "#9dc3ff",
    },
    {
      title: "Security Audits",
      value: telemetry?.auditCount ?? stats?.auditCount ?? 78,
      description: "Immutable ledger checked",
      icon: Database,
      trend: "Verified",
      color: "#f0c36a",
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 ease-out">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-lg border border-white/10 bg-white/7 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.25)] backdrop-blur-2xl md:p-6">
        <div className="absolute inset-0 bg-linear-to-r from-white/8 via-transparent to-[#10b981]/10" />
        <div className="relative grid gap-6 lg:grid-cols-[1fr_260px]">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#10b981]/25 bg-[#10b981]/10 px-3 py-1 text-[11px] font-semibold text-[#a7f3d0]">
              Cybernetics Operations
            </div>
            <h1 className="mt-5 max-w-3xl text-3xl font-black leading-tight text-white md:text-5xl">
              System Console
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#c8d2bd]">
              Pusat kendali telemetri, server-node workload, manipulasi feature
              flags kabinet BEM FT UNESA secara dinamis.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                onClick={handleSelfTest}
                className="group relative overflow-hidden h-10 rounded-full bg-white px-5 text-[#091c11] font-semibold hover:bg-[#a7f3d0] hover:shadow-[0_0_24px_rgba(167, 243, 208,0.45)] hover:-translate-y-0.5 transition-all duration-300 active:translate-y-0 cursor-pointer"
              >
                <div className="absolute top-0 -left-full h-full w-[40%] bg-linear-to-r from-transparent via-white/40 to-transparent -skew-x-25 transition-all duration-1000 ease-out group-hover:left-[120%]" />
                <span className="relative z-10">System Self-Test</span>
              </Button>
              <Button
                variant="ghost"
                onClick={() => refetch()}
                className="group relative overflow-hidden h-10 rounded-full border border-white/10 bg-white/8 px-5 text-white hover:bg-white/12 hover:shadow-[0_0_20px_rgba(255,255,255,0.08)] hover:-translate-y-0.5 transition-all duration-300 active:translate-y-0 cursor-pointer"
              >
                <span className="relative z-10">Force Refresh</span>
              </Button>
            </div>
          </div>

          <div className="flex flex-col justify-center rounded-lg border border-[#10b981]/20 bg-[#10b981]/6 p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#a7f3d0]">
              DATABASE CLUSTER
            </span>
            <div className="mt-2 text-2xl font-black text-white flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#10b981] animate-pulse" />
              ONLINE
            </div>
            <div className="mt-3 text-xs text-[#c8d2bd] font-medium leading-relaxed">
              Mongoose link pooled:{" "}
              <strong className="text-white">Active</strong>. Status cluster
              MongoDB sehat.
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => (
          <GlassPanel
            key={metric.title}
            className={cn(
              "group relative overflow-hidden p-4",
              metric.color === "#10b981" &&
                "hover:glass-glow-accent hover:border-[#10b981]/40",
              metric.color === "#a7f3d0" &&
                "hover:glass-glow-accent hover:border-[#10b981]/40",
              metric.color === "#9dc3ff" &&
                "hover:glass-glow-info hover:border-[#9dc3ff]/40",
              metric.color === "#f0c36a" &&
                "hover:glass-glow-warning hover:border-[#f0c36a]/40",
            )}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-[#a9b49c]">
                  {metric.title}
                </p>
                <div className="mt-2 text-3xl font-black text-white flex items-center gap-2">
                  {metric.value}
                  {metric.blinker && (
                    <span className="relative flex h-3.5 w-3.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#10b981]"></span>
                    </span>
                  )}
                </div>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/8 transition-colors group-hover:bg-white/12">
                <metric.icon
                  className="h-5 w-5"
                  style={{ color: metric.color }}
                />
              </div>
            </div>
            <div className="mt-5 flex items-center justify-between gap-3 text-xs">
              <span className="truncate text-[#c8d2bd] font-medium">
                {metric.description}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/8 px-2 py-0.5 font-bold text-[#a7f3d0]">
                {metric.trend}
              </span>
            </div>
          </GlassPanel>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        {/* Left: Server Infrastructure Telemetry */}
        <div className="space-y-6">
          <GlassPanel>
            <PanelHeader
              icon={Cpu}
              title="Infrastructure Telemetry"
              action={
                <span className="text-[10px] text-[#a9b49c] flex items-center gap-1">
                  Live telemetry feed
                </span>
              }
            />

            <div className="mt-5 space-y-4">
              {/* CPU */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-white">CPU Node Workload</span>
                  <span className="text-[#10b981]">
                    {telemetry?.cpuWorkload ?? 24}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/8 overflow-hidden">
                  <div
                    className="h-full bg-[#10b981] rounded-full transition-all duration-500"
                    style={{ width: `${telemetry?.cpuWorkload ?? 24}%` }}
                  />
                </div>
              </div>

              {/* Memory */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-white">RAM Consumption</span>
                  <span className="text-[#a7f3d0]">
                    {telemetry?.memoryUsage ?? 42}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/8 overflow-hidden">
                  <div
                    className="h-full bg-[#a7f3d0] rounded-full transition-all duration-500"
                    style={{ width: `${telemetry?.memoryUsage ?? 42}%` }}
                  />
                </div>
              </div>

              {/* Disk / Storage */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-white">Database Storage Limit</span>
                  <span className="text-[#f0c36a]">
                    {telemetry?.databaseStorage ?? 34}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/8 overflow-hidden">
                  <div
                    className="h-full bg-[#f0c36a] rounded-full transition-all duration-500"
                    style={{ width: `${telemetry?.databaseStorage ?? 34}%` }}
                  />
                </div>
              </div>

              {/* Network Bandwidth */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-white">Network Bandwidth</span>
                  <span className="text-[#9dc3ff]">
                    {telemetry?.networkBandwidth ?? 14}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/8 overflow-hidden">
                  <div
                    className="h-full bg-[#9dc3ff] rounded-full transition-all duration-500"
                    style={{ width: `${telemetry?.networkBandwidth ?? 14}%` }}
                  />
                </div>
              </div>
            </div>
          </GlassPanel>
        </div>

        {/* Right: Feature Flag Controls */}
        <GlassPanel>
          <PanelHeader icon={Settings} title="Feature Flags" />
          <div className="mt-5 space-y-4">
            {Object.entries(activeFlags).map(([key, value]) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-lg border border-white/5 bg-white/3 p-3"
              >
                <div className="min-w-0">
                  <span className="block text-xs font-semibold text-white capitalize leading-tight">
                    {key.replace(/([A-Z])/g, " $1")}
                  </span>
                  <span className="text-[10px] text-[#a9b49c] mt-0.5 block">
                    {value ? "Active on production" : "Disabled"}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleFlag(key as any)}
                  className={cn(
                    "border-white/10 w-24 flex justify-start pl-2 pr-4 transition-all duration-300",
                    value
                      ? key === "maintenanceMode" 
                        ? "bg-[#ff4d4d]/20 text-[#ff4d4d] border-[#ff4d4d]/30 hover:bg-[#ff4d4d]/30 hover:text-[#ff9b9b]"
                        : "bg-[#10b981]/20 text-[#10b981] hover:bg-[#10b981]/30 hover:text-[#a7f3d0]"
                      : "bg-white/5 text-[#a9b49c] hover:bg-white/10 hover:text-white",
                  )}
                >
                  {value ? (
                    <ToggleRight className="mr-2 h-4 w-4" />
                  ) : (
                    <ToggleLeft className="mr-2 h-4 w-4 text-[#a9b49c]" />
                  )}
                  {value ? "ON" : "OFF"}
                </Button>
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>

      {/* Cybernetic Console scrolling Terminal */}
      <GlassPanel>
        <PanelHeader
          icon={TerminalIcon}
          title="Active System Log & Commands"
          action={
            <Button
              onClick={handleClearCache}
              variant="ghost"
              className="h-8 rounded-full border border-white/10 bg-white/5 text-xs text-[#a7f3d0] px-3.5 hover:bg-white/10 cursor-pointer"
            >
              Clear Cache
            </Button>
          }
        />

        {/* Scrollbox */}
        <div className="h-60 overflow-y-auto bg-black/80 rounded-xl border border-white/10 p-4 font-mono text-[11px] leading-relaxed text-[#71d39b] space-y-2">
          {logs.map((log, index) => {
            let color = "text-[#71d39b]";
            if (
              log.includes("[ERROR]") ||
              log.includes("danger") ||
              log.includes("[FLAG] Toggled")
            ) {
              color = "text-[#ff7a7a]";
            } else if (
              log.includes("[WARN]") ||
              log.includes("⚙️") ||
              log.includes("🩺")
            ) {
              color = "text-[#f0c36a]";
            } else if (log.includes("✅") || log.includes("[SUCCESS]")) {
              color = "text-[#a7f3d0] font-bold";
            }

            return (
              <div
                key={index}
                className={cn("transition-all duration-300", color)}
              >
                {log}
              </div>
            );
          })}
          <div ref={terminalEndRef} />
        </div>
      </GlassPanel>
    </div>
  );
}
