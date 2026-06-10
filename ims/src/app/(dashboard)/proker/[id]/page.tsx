"use client";

import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import {
  prokerService,
  Proker,
  Task,
  CashEntry,
  AssetRequest,
  Comment,
  Milestone,
  KpiTarget,
} from "@/lib/api/proker";
import { committeesService } from "@/lib/api/committees";
import { financeService } from "@/lib/api/finance";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  MapPin,
  Wallet,
  Users,
  ArrowLeft,
  Layout,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertTriangle,
  Plus,
  FileText,
  Trash2,
  Edit,
  Banknote,
  Send,
  FolderKanban,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useMemo, useRef } from "react";
import { ProkerFormDialog } from "@/components/proker/proker-form-dialog";
import { KepanitiaanFormDialog } from "@/components/proker/kepanitiaan-form-dialog";
import { motion, AnimatePresence } from "framer-motion";

export default function ProkerDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isKepanitiaanOpen, setIsKepanitiaanOpen] = useState(false);

  // Core database queries
  const { data: prokerResponse, isLoading: isProkerLoading } = useQuery({
    queryKey: ["ims-proker-detail", id],
    queryFn: async () => {
      const res = await prokerService.list();
      const found = res.data.find((p) => p._id === id);
      if (!found) throw new Error("Program kerja tidak ditemukan");
      return found;
    },
  });

  const { data: panitiaResponse, isLoading: isPanitiaLoading } = useQuery({
    queryKey: ["ims-proker-panitia", id],
    queryFn: () => committeesService.getProkerCommittees(id),
    enabled: !!id,
  });

  const { data: proposalResponse, isLoading: isProposalLoading } = useQuery({
    queryKey: ["ims-proker-proposal", id],
    queryFn: () => financeService.listProposals({ prokerId: id }),
    enabled: !!id,
  });

  // DB Mutations
  const updateMutation = useMutation({
    mutationFn: (data: Partial<Proker>) => prokerService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ims-proker-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["ims-proker"] });
      setIsEditDialogOpen(false);
      addSystemLog("Detail program kerja diperbarui di database utama.");
    },
  });

  const assignMemberMutation = useMutation({
    mutationFn: (data: {
      userId: string;
      roleInProker: string;
      division?: string;
    }) => committeesService.assignMember(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ims-proker-panitia", id] });
      addSystemLog("Fungsionaris baru ditugaskan ke dalam kepanitiaan OC.");
    },
  });

  const proker = prokerResponse;
  const committees = panitiaResponse?.data || [];
  const proposals = proposalResponse?.data || [];

  // Local storage management overlay
  const [tasks, setTasks] = useState<Task[]>([]);
  const [ledger, setLedger] = useState<CashEntry[]>([]);
  const [assets, setAssets] = useState<AssetRequest[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  const [lpjChecklist, setLpjChecklist] = useState({
    rundown: false,
    rab: false,
    spj: false,
    presensi: false,
    kwitansi: false,
    dokumentasi: false,
  });

  // Active form modals
  const [showAddTask, setShowAddTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [taskDivision, setTaskDivision] = useState("Acara");
  const [taskPoints, setTaskPoints] = useState(15);
  const [taskDeadline, setTaskDeadline] = useState("");

  const [showAddCash, setShowAddCash] = useState(false);
  const [cashTitle, setCashTitle] = useState("");
  const [cashAmount, setCashAmount] = useState("");
  const [cashType, setCashType] = useState<"Masuk" | "Keluar">("Keluar");
  const [cashNotes, setCashNotes] = useState("");
  const [cashDate, setCashDate] = useState("");

  const [showAddAsset, setShowAddAsset] = useState(false);
  const [assetName, setAssetName] = useState("HT Wireless");
  const [assetQty, setAssetQty] = useState(1);
  const [assetDeadline, setAssetDeadline] = useState("");

  const [newComment, setNewComment] = useState("");
  const logsEndRef = useRef<HTMLDivElement>(null);
  const isLoadedRef = useRef(false);

  // Milestone & KPI states
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [kpiTargets, setKpiTargets] = useState<KpiTarget[]>([]);
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [showAddKpi, setShowAddKpi] = useState(false);
  const [msTitle, setMsTitle] = useState("");
  const [msDesc, setMsDesc] = useState("");
  const [msTargetDate, setMsTargetDate] = useState("");
  const [kpiIndicator, setKpiIndicator] = useState("");
  const [kpiTargetVal, setKpiTargetVal] = useState("");
  const [kpiUnit, setKpiUnit] = useState("orang");
  const [kpiNotes, setKpiNotes] = useState("");

  // Reset loaded reference when ID changes
  useEffect(() => {
    isLoadedRef.current = false;
  }, [id]);

  // Initialize and load from Database (prioritized)
  useEffect(() => {
    if (id && proker && !isLoadedRef.current) {
      isLoadedRef.current = true;

      setTasks(proker.tasks || []);
      setLedger(proker.ledger || []);
      setAssets(proker.assets || []);
      setComments(proker.comments || []);
      setLogs(proker.logs || []);

      // Checklist
      let initialChecklist = {
        rundown: false,
        rab: false,
        spj: false,
        presensi: false,
        kwitansi: false,
        dokumentasi: false,
      };
      if (proker.lpjChecklist && typeof proker.lpjChecklist === "object") {
        initialChecklist = {
          rundown: !!proker.lpjChecklist.rundown,
          rab: !!proker.lpjChecklist.rab,
          spj: !!proker.lpjChecklist.spj,
          presensi: !!proker.lpjChecklist.presensi,
          kwitansi: !!proker.lpjChecklist.kwitansi,
          dokumentasi: !!proker.lpjChecklist.dokumentasi,
        };
      }
      setLpjChecklist(initialChecklist);

      setMilestones(proker.milestones || []);
      setKpiTargets(proker.kpiTargets || []);
    }
  }, [id, proker]);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Helpers
  const addSystemLog = (msg: string) => {
    const time = new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const formatted = `[${time}] ${msg}`;
    const updated = [...logs, formatted].slice(-40);
    setLogs(updated);

    // Asynchronously save to MongoDB
    prokerService.update(id, { logs: updated }).catch((err) => {
      console.error("Failed to sync system logs to MongoDB:", err);
    });
  };

  // State Save helper
  const saveState = (key: string, data: any, stateSetter: any) => {
    stateSetter(data);

    // Map frontend keys to database fields
    const dbKey = key === "kpi" ? "kpiTargets" : key;
    prokerService.update(id, { [dbKey]: data }).catch((err) => {
      console.error(`Failed to sync ${key} to MongoDB:`, err);
    });
  };

  // Dynamic progress bar: calculated automatically based on tasks.
  const calculatedProgress = useMemo(() => {
    if (tasks.length === 0) return proker?.progress || 0;
    const done = tasks.filter((t) => t.status === "Done").length;
    return Math.round((done / tasks.length) * 100);
  }, [tasks, proker?.progress]);

  // Sync automated progress to database if changed
  useEffect(() => {
    if (proker && calculatedProgress !== proker.progress && !isProkerLoading) {
      // Trigger subtle background patch
      prokerService.updateProgress(id, calculatedProgress);
    }
  }, [calculatedProgress, proker, id, isProkerLoading]);

  // Dynamic Workload Ratios
  const getWorkloadRatio = (userId: string) => {
    const activeTasks = tasks.filter(
      (t) => t.assigneeId === userId && t.status !== "Done",
    ).length;
    if (activeTasks === 0)
      return {
        label: "Optimal",
        color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        count: 0,
      };
    if (activeTasks <= 1)
      return {
        label: "Optimal",
        color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        count: activeTasks,
      };
    if (activeTasks <= 3)
      return {
        label: "Warning",
        color: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        count: activeTasks,
      };
    return {
      label: "Overload",
      color: "bg-red-500/10 text-red-400 border-red-500/20",
      count: activeTasks,
    };
  };

  // Dynamic Reward Accumulator
  const getFungsionarisRewards = (userId: string) => {
    return tasks
      .filter((t) => t.assigneeId === userId && t.status === "Done")
      .reduce((sum, t) => sum + (t.points || 0), 0);
  };

  // Cash / Budget calculations
  const cashAnalytics = useMemo(() => {
    const totalAllocated = proker?.budget || 5000000;
    const spent = ledger
      .filter((e) => e.type === "Keluar")
      .reduce((sum, e) => sum + e.amount, 0);
    const income = ledger
      .filter((e) => e.type === "Masuk")
      .reduce((sum, e) => sum + e.amount, 0);
    const balance = totalAllocated - spent + income;
    const absorptionRate =
      totalAllocated > 0 ? Math.round((spent / totalAllocated) * 100) : 0;
    return { totalAllocated, spent, income, balance, absorptionRate };
  }, [ledger, proker?.budget]);

  // Authority & Roles
  const loggedInPanitia = committees.find((item: any) => {
    if (!item.userId) return false;
    const panitiaUserId =
      typeof item.userId === "object" ? item.userId._id : item.userId;
    return panitiaUserId === user?.id;
  }) as any;

  const myOcRole = loggedInPanitia?.role || loggedInPanitia?.position || "";

  const isSC =
    user?.role === "WaKaBEM" ||
    user?.role === "KaBEM" ||
    ((user?.role === "Kadep" || user?.role === "Wakadep") &&
      ((user as any)?.department === proker?.departmentId ||
        (user as any)?.departmentId === proker?.departmentId));

  const isGlobalAdmin = user?.role === "Super Admin";
  const hasEditPermission =
    isGlobalAdmin || isSC || myOcRole === "Ketua Pelaksana";
  const hasProposalPermission =
    isGlobalAdmin ||
    isSC ||
    ["Ketua Pelaksana", "Sekretaris Pelaksana", "Bendahara Pelaksana"].includes(
      myOcRole,
    );

  // Resolve Ketua Pelaksana name from committees roster
  const ketuaPelaksana = useMemo(() => {
    const ketupel = committees.find(
      (c: any) =>
        c.position === "Ketua Pelaksana" || c.role === "Ketua Pelaksana",
    );
    if (!ketupel) return null;
    return typeof ketupel.userId === "object"
      ? ketupel.userId.name
      : ketupel.userName || null;
  }, [committees]);

  if (isProkerLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#10b981] border-r-transparent"></div>
      </div>
    );
  }

  if (!proker) {
    return (
      <div className="text-center py-12 space-y-4">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-xl font-bold">Program Kerja Tidak Ditemukan</h2>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
        </Button>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Planning":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "In Progress":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "Active":
        return "bg-[#10b981]/10 text-[#a7f3d0] border-[#10b981]/20";
      case "Event Finished":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      case "LPJ Revision":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "LPJ Approved":
        return "bg-teal-500/10 text-teal-400 border-teal-500/20";
      case "Completed":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "Archived":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "Cancelled":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  const getDepartmentName = (deptId: string) => {
    switch (deptId) {
      case "1":
        return "Dalam Negeri";
      case "2":
        return "Luar Negeri";
      case "3":
        return "PSDM";
      case "4":
        return "Minat & Bakat";
      case "5":
        return "Sosial & Politik";
      case "6":
        return "Kesejahteraan Mahasiswa";
      case "7":
        return "Komunikasi & Informasi";
      default:
        return "Departemen BEM FT";
    }
  };

  // Form submit handlers
  const handleAddTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: taskTitle.trim(),
      status: "To Do",
      division: taskDivision,
      assigneeId: taskAssignee,
      points: Number(taskPoints) || 10,
      deadline:
        taskDeadline ||
        (proker.startDate
          ? new Date(proker.startDate).toISOString().split("T")[0]
          : ""),
    };

    saveState("tasks", [...tasks, newTask], setTasks);
    addSystemLog(
      `Menambahkan tugas baru: '${newTask.title}' senilai ${newTask.points} Poin.`,
    );

    // Reset fields
    setTaskTitle("");
    setTaskAssignee("");
    setTaskDivision("Acara");
    setTaskPoints(15);
    setTaskDeadline("");
    setShowAddTask(false);
  };

  const handleAddCashSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cashTitle.trim() || !cashAmount) return;

    const entry: CashEntry = {
      id: `cash-${Date.now()}`,
      title: cashTitle.trim(),
      amount: Number(cashAmount),
      type: cashType,
      date: cashDate || new Date().toISOString().split("T")[0],
      notes: cashNotes.trim(),
    };

    saveState("ledger", [...ledger, entry], setLedger);
    addSystemLog(
      `Mencatat keuangan ${entry.type === "Keluar" ? "Pengeluaran" : "Pemasukan"} Rp ${entry.amount.toLocaleString("id-ID")} - '${entry.title}'.`,
    );

    setCashTitle("");
    setCashAmount("");
    setCashNotes("");
    setCashDate("");
    setShowAddCash(false);
  };

  const handleAddAssetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName) return;

    const request: AssetRequest = {
      id: `asset-${Date.now()}`,
      name: assetName,
      quantity: Number(assetQty) || 1,
      status: "Pending",
      deadline:
        assetDeadline ||
        (proker.startDate
          ? new Date(proker.startDate).toISOString().split("T")[0]
          : ""),
    };

    saveState("assets", [...assets, request], setAssets);
    addSystemLog(
      `Mengajukan peminjaman aset BEM: ${request.quantity}x ${request.name}.`,
    );

    setAssetQty(1);
    setAssetDeadline("");
    setShowAddAsset(false);
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const comm: Comment = {
      id: `comm-${Date.now()}`,
      authorName: user?.name || "Fungsionaris BEM",
      content: newComment.trim(),
      date: new Date().toLocaleString("id-ID", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    saveState("comments", [...comments, comm], setComments);
    addSystemLog(
      `Koordinator mempublikasikan catatan koordinasi di forum diskusi.`,
    );
    setNewComment("");
  };

  const toggleChecklistItem = (item: keyof typeof lpjChecklist) => {
    const updated = { ...lpjChecklist, [item]: !lpjChecklist[item] };
    setLpjChecklist(updated);

    // Asynchronously save to MongoDB
    prokerService.update(id, { lpjChecklist: updated }).catch((err) => {
      console.error("Failed to sync checklist to MongoDB:", err);
    });

    addSystemLog(
      `Mengubah kelengkapan berkas LPJ: [${item.toUpperCase()}] menjadi ${updated[item] ? "LENGKAP" : "BELUM LENGKAP"}`,
    );
  };

  // Milestone handlers
  const handleAddMilestoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msTitle.trim()) return;
    const ms: Milestone = {
      id: `ms-${Date.now()}`,
      title: msTitle.trim(),
      description: msDesc.trim(),
      targetDate: msTargetDate,
      completedDate: "",
      status: "Belum Mulai",
    };
    saveState("milestones", [...milestones, ms], setMilestones);
    addSystemLog(`Menambahkan milestone baru: '${ms.title}'.`);
    setMsTitle("");
    setMsDesc("");
    setMsTargetDate("");
    setShowAddMilestone(false);
  };

  const toggleMilestoneStatus = (msId: string) => {
    const statusCycle: Milestone["status"][] = [
      "Belum Mulai",
      "Berjalan",
      "Selesai",
      "Terlambat",
    ];
    const updated = milestones.map((m) => {
      if (m.id !== msId) return m;
      const idx = statusCycle.indexOf(m.status);
      const next = statusCycle[(idx + 1) % statusCycle.length];
      return {
        ...m,
        status: next,
        completedDate:
          next === "Selesai"
            ? new Date().toISOString().split("T")[0]
            : m.completedDate,
      };
    });
    saveState("milestones", updated, setMilestones);
    const ms = updated.find((m) => m.id === msId);
    addSystemLog(
      `Status milestone '${ms?.title}' diubah menjadi [${ms?.status}].`,
    );
  };

  const deleteMilestone = (msId: string) => {
    const ms = milestones.find((m) => m.id === msId);
    saveState(
      "milestones",
      milestones.filter((m) => m.id !== msId),
      setMilestones,
    );
    addSystemLog(`Menghapus milestone: '${ms?.title}'.`);
  };

  // KPI handlers
  const handleAddKpiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kpiIndicator.trim()) return;
    const kpi: KpiTarget = {
      id: `kpi-${Date.now()}`,
      indicator: kpiIndicator.trim(),
      target: Number(kpiTargetVal) || 0,
      actual: 0,
      unit: kpiUnit,
      notes: kpiNotes.trim(),
    };
    saveState("kpi", [...kpiTargets, kpi], setKpiTargets);
    addSystemLog(
      `Menambahkan indikator KPI baru: '${kpi.indicator}' (target: ${kpi.target} ${kpi.unit}).`,
    );
    setKpiIndicator("");
    setKpiTargetVal("");
    setKpiUnit("orang");
    setKpiNotes("");
    setShowAddKpi(false);
  };

  const updateKpiActual = (kpiId: string, actual: number) => {
    const updated = kpiTargets.map((k) =>
      k.id === kpiId ? { ...k, actual } : k,
    );
    saveState("kpi", updated, setKpiTargets);
  };

  const deleteKpi = (kpiId: string) => {
    const kpi = kpiTargets.find((k) => k.id === kpiId);
    saveState(
      "kpi",
      kpiTargets.filter((k) => k.id !== kpiId),
      setKpiTargets,
    );
    addSystemLog(`Menghapus indikator KPI: '${kpi?.indicator}'.`);
  };

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 ease-out">
      {/* Header and Back Button */}
      <div className="flex flex-col gap-4">
        <Link
          href="/proker"
          className="flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Kembali ke Program Kerja
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-extrabold text-white tracking-tight">
                {proker.title}
              </h1>
              <Badge
                variant="outline"
                className={getStatusColor(proker.status)}
              >
                {proker.status}
              </Badge>
              {myOcRole && (
                <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs font-semibold">
                  Panitia: {myOcRole}
                </Badge>
              )}
              {isSC && (
                <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-xs font-semibold">
                  Steering Committee (SC)
                </Badge>
              )}
            </div>
            <p className="mt-2 text-[#c8d2bd] text-sm flex items-center gap-1.5">
              <Layout className="w-4 h-4 text-[#10b981]" /> Penanggung Jawab:
              Departemen {getDepartmentName(proker.departmentId)}
            </p>
          </div>
          {hasEditPermission && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="border-white/10 text-white hover:bg-white/5"
                onClick={() => setIsEditDialogOpen(true)}
              >
                <Edit className="w-4 h-4 mr-2 text-[#10b981]" /> Edit Detail
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Hand Operations Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Deskripsi & Progress */}
          <Card className="border-white/10 bg-white/5 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-white font-black">
                Deskripsi Kegiatan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-[#c8d2bd] leading-relaxed text-sm whitespace-pre-line">
                {proker.description ||
                  "Tidak ada deskripsi lengkap tersedia untuk program kerja ini."}
              </p>

              {/* Dynamic automated progress ring */}
              <div className="space-y-2 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#a9b49c] font-medium flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-[#10b981]" /> Progres
                    Kegiatan Operasional (Automatisasi Tugas)
                  </span>
                  <span className="font-bold text-white">
                    {calculatedProgress}%
                  </span>
                </div>
                <div className="h-2.5 w-full bg-white/8 overflow-hidden rounded-full border border-white/10">
                  <div
                    className="h-full bg-[#10b981] rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                    style={{ width: `${calculatedProgress}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* KPI & Metrics Dashboard */}
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            {(() => {
              const totalTasks = tasks.length;
              const doneTasks = tasks.filter((t) => t.status === "Done").length;
              const taskRate =
                totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

              const checkedItems =
                Object.values(lpjChecklist).filter(Boolean).length;
              const totalChecklist = Object.values(lpjChecklist).length;
              const lpjRate = Math.round((checkedItems / totalChecklist) * 100);

              const approvedAssets = assets.filter(
                (a) => a.status === "Disetujui",
              ).length;
              const assetRate =
                assets.length > 0
                  ? Math.round((approvedAssets / assets.length) * 100)
                  : 0;

              const daysLeft = proker.startDate
                ? Math.max(
                    0,
                    Math.ceil(
                      (new Date(proker.startDate).getTime() - Date.now()) /
                        (1000 * 60 * 60 * 24),
                    ),
                  )
                : null;

              const totalPoints = tasks.reduce(
                (s, t) => s + (t.points || 0),
                0,
              );
              const earnedPoints = tasks
                .filter((t) => t.status === "Done")
                .reduce((s, t) => s + (t.points || 0), 0);

              const kpis = [
                {
                  label: "Penyelesaian Tugas",
                  value: `${doneTasks}/${totalTasks}`,
                  sub: `${taskRate}%`,
                  color:
                    taskRate >= 70
                      ? "text-emerald-400"
                      : taskRate >= 40
                        ? "text-amber-400"
                        : "text-red-400",
                },
                {
                  label: "Penyerapan Anggaran",
                  value: `${cashAnalytics.absorptionRate}%`,
                  sub: `Rp ${(cashAnalytics.spent / 1000000).toFixed(1)}jt`,
                  color:
                    cashAnalytics.absorptionRate <= 80
                      ? "text-emerald-400"
                      : "text-amber-400",
                },
                {
                  label: "Jumlah Panitia OC",
                  value: `${committees.length}`,
                  sub: "Fungsionaris aktif",
                  color: "text-blue-400",
                },
                {
                  label: "Kesiapan Aset",
                  value: `${approvedAssets}/${assets.length}`,
                  sub: `${assetRate}% disetujui`,
                  color:
                    assetRate >= 80 ? "text-emerald-400" : "text-amber-400",
                },
                {
                  label: "Kelengkapan LPJ",
                  value: `${checkedItems}/${totalChecklist}`,
                  sub: `${lpjRate}% lengkap`,
                  color:
                    lpjRate === 100
                      ? "text-emerald-400"
                      : lpjRate >= 50
                        ? "text-amber-400"
                        : "text-red-400",
                },
                {
                  label:
                    daysLeft !== null && daysLeft > 0
                      ? "Hari Menuju H"
                      : "Status Waktu",
                  value:
                    daysLeft !== null
                      ? daysLeft > 0
                        ? `H-${daysLeft}`
                        : "H-Day / Lewat"
                      : "TBA",
                  sub:
                    daysLeft !== null && daysLeft > 0
                      ? "hari tersisa"
                      : "tanggal belum diatur",
                  color:
                    daysLeft !== null && daysLeft > 7
                      ? "text-emerald-400"
                      : daysLeft !== null && daysLeft > 0
                        ? "text-amber-400"
                        : "text-red-400",
                },
              ];

              return kpis.map((kpi, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-white/8 bg-white/3 p-3.5 space-y-1.5 hover:bg-white/5 transition-all"
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#a9b49c] leading-tight">
                    {kpi.label}
                  </p>
                  <p className={`text-xl font-black ${kpi.color} leading-none`}>
                    {kpi.value}
                  </p>
                  <p className="text-[10px] text-[#a9b49c] font-medium">
                    {kpi.sub}
                  </p>
                </div>
              ));
            })()}
          </div>

          {/* Sub-panels using Navigation Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid grid-cols-4 sm:grid-cols-7 w-full h-auto p-1 bg-white/4 border border-white/10 rounded-xl overflow-x-auto">
              <TabsTrigger
                value="overview"
                className="text-xs py-2 rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white"
              >
                Info
              </TabsTrigger>
              <TabsTrigger
                value="panitia"
                className="text-xs py-2 rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white"
              >
                Panitia
              </TabsTrigger>
              <TabsTrigger
                value="tasks"
                className="text-xs py-2 rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white"
              >
                Tugas
              </TabsTrigger>
              <TabsTrigger
                value="finance"
                className="text-xs py-2 rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white"
              >
                Buku Kas
              </TabsTrigger>
              <TabsTrigger
                value="assets"
                className="text-xs py-2 rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white"
              >
                Aset
              </TabsTrigger>
              <TabsTrigger
                value="lpj"
                className="text-xs py-2 rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white"
              >
                LPJ
              </TabsTrigger>
              <TabsTrigger
                value="diskusi"
                className="text-xs py-2 rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white"
              >
                Diskusi
              </TabsTrigger>
            </TabsList>

            {/* Overview / Info Tab */}
            <TabsContent value="overview" className="space-y-6 mt-4">
              {/* Informasi Pelaksanaan */}
              <Card className="border-white/10 bg-white/5 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-white">
                    Informasi Pelaksanaan
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6 sm:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs text-[#a9b49c]">
                        Periode Pelaksanaan
                      </p>
                      <p className="text-sm font-semibold text-white mt-0.5">
                        {proker.startDate
                          ? new Date(proker.startDate).toLocaleDateString(
                              "id-ID",
                              {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              },
                            )
                          : "TBA"}
                        {proker.endDate
                          ? ` s/d ${new Date(proker.endDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`
                          : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs text-[#a9b49c]">
                        Alokasi Anggaran (RAB)
                      </p>
                      <p className="text-sm font-semibold text-white mt-0.5">
                        {proker.budget
                          ? new Intl.NumberFormat("id-ID", {
                              style: "currency",
                              currency: "IDR",
                              maximumFractionDigits: 0,
                            }).format(proker.budget)
                          : "Rp 0"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs text-[#a9b49c]">
                        Lokasi Pelaksanaan
                      </p>
                      <p className="text-sm font-semibold text-white mt-0.5">
                        {proker.location || "TBA"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs text-[#a9b49c]">
                        Ketua Pelaksana (Ketupel)
                      </p>
                      <p className="text-sm font-semibold text-white mt-0.5">
                        {ketuaPelaksana || "Belum ditentukan"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Milestone Timeline */}
              <Card className="border-white/10 bg-white/5 backdrop-blur-md">
                <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-white/5">
                  <div>
                    <CardTitle className="text-white">
                      Milestone & Timeline
                    </CardTitle>
                    <CardDescription className="text-[#a9b49c]">
                      {milestones.filter((m) => m.status === "Selesai").length}/
                      {milestones.length} milestone selesai — klik status untuk
                      mengubah.
                    </CardDescription>
                  </div>
                  {hasEditPermission && (
                    <Button
                      size="sm"
                      className="bg-white text-[#091c11] hover:bg-[#a7f3d0] gap-1.5 h-9 font-bold rounded-lg cursor-pointer"
                      onClick={() => setShowAddMilestone(!showAddMilestone)}
                    >
                      <Plus className="w-4 h-4" /> Tambah
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="pt-4 space-y-1">
                  {/* Milestone progress summary bar */}
                  {milestones.length > 0 && (
                    <div className="mb-4 space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-[#a9b49c]">
                        <span>Progress Timeline</span>
                        <span className="font-bold text-white">
                          {Math.round(
                            (milestones.filter((m) => m.status === "Selesai")
                              .length /
                              milestones.length) *
                              100,
                          )}
                          %
                        </span>
                      </div>
                      <div className="flex gap-1 h-2">
                        {milestones.map((m) => (
                          <div
                            key={m.id}
                            className={`flex-1 rounded-full transition-colors ${
                              m.status === "Selesai"
                                ? "bg-emerald-500"
                                : m.status === "Berjalan"
                                  ? "bg-amber-500 animate-pulse"
                                  : m.status === "Terlambat"
                                    ? "bg-red-500"
                                    : "bg-white/10"
                            }`}
                            title={m.title}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add milestone form */}
                  <AnimatePresence>
                    {showAddMilestone && (
                      <motion.form
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        onSubmit={handleAddMilestoneSubmit}
                        className="overflow-hidden"
                      >
                        <div className="p-4 rounded-xl border border-dashed border-white/15 bg-white/3 space-y-3 mb-4">
                          <input
                            placeholder="Nama Milestone *"
                            value={msTitle}
                            onChange={(e) => setMsTitle(e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-[#a9b49c] outline-none focus:border-[#10b981]"
                          />
                          <input
                            placeholder="Deskripsi singkat"
                            value={msDesc}
                            onChange={(e) => setMsDesc(e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-[#a9b49c] outline-none focus:border-[#10b981]"
                          />
                          <div className="flex gap-2">
                            <input
                              type="date"
                              value={msTargetDate}
                              onChange={(e) => setMsTargetDate(e.target.value)}
                              className="flex-1 p-2.5 rounded-lg border border-white/10 bg-white/5 text-sm text-white outline-none focus:border-[#10b981]"
                            />
                            <Button
                              type="submit"
                              size="sm"
                              className="bg-[#10b981] hover:bg-[#059669] text-white h-10 px-6 font-bold rounded-lg cursor-pointer"
                            >
                              Simpan
                            </Button>
                          </div>
                        </div>
                      </motion.form>
                    )}
                  </AnimatePresence>

                  {/* Milestone list */}
                  <div className="relative">
                    {/* Vertical timeline line */}
                    <div className="absolute left-[15px] top-4 bottom-4 w-px bg-white/10" />

                    <div className="space-y-0">
                      {milestones
                        .sort(
                          (a, b) =>
                            new Date(a.targetDate).getTime() -
                            new Date(b.targetDate).getTime(),
                        )
                        .map((ms, index) => {
                          const statusConfig = {
                            Selesai: {
                              dot: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]",
                              badge:
                                "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                            },
                            Berjalan: {
                              dot: "bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.4)]",
                              badge:
                                "bg-amber-500/10 text-amber-400 border-amber-500/20",
                            },
                            Terlambat: {
                              dot: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]",
                              badge:
                                "bg-red-500/10 text-red-400 border-red-500/20",
                            },
                            "Belum Mulai": {
                              dot: "bg-white/20",
                              badge:
                                "bg-white/5 text-[#a9b49c] border-white/10",
                            },
                          };
                          const cfg = statusConfig[ms.status];

                          return (
                            <div
                              key={ms.id}
                              className="relative flex items-start gap-4 py-3 group"
                            >
                              {/* Timeline dot */}
                              <div
                                className={`relative z-10 w-[10px] h-[10px] rounded-full mt-1.5 shrink-0 ${cfg.dot} ring-2 ring-[#0a1f13]`}
                                style={{ marginLeft: "10px" }}
                              />

                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <p
                                      className={`text-sm font-bold ${ms.status === "Selesai" ? "text-[#a9b49c] line-through" : "text-white"}`}
                                    >
                                      {index + 1}. {ms.title}
                                    </p>
                                    {ms.description && (
                                      <p className="text-xs text-[#a9b49c] mt-0.5 leading-relaxed">
                                        {ms.description}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                      <span className="text-[10px] text-[#a9b49c]">
                                        Target:{" "}
                                        {ms.targetDate
                                          ? new Date(
                                              ms.targetDate,
                                            ).toLocaleDateString("id-ID", {
                                              day: "numeric",
                                              month: "short",
                                              year: "numeric",
                                            })
                                          : "TBA"}
                                      </span>
                                      {ms.completedDate && (
                                        <span className="text-[10px] text-emerald-400">
                                          Selesai:{" "}
                                          {new Date(
                                            ms.completedDate,
                                          ).toLocaleDateString("id-ID", {
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric",
                                          })}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                      onClick={() =>
                                        toggleMilestoneStatus(ms.id)
                                      }
                                      className="cursor-pointer"
                                    >
                                      <Badge
                                        variant="outline"
                                        className={`${cfg.badge} text-[10px] cursor-pointer hover:opacity-80 transition-opacity`}
                                      >
                                        {ms.status}
                                      </Badge>
                                    </button>
                                    {hasEditPermission && (
                                      <button
                                        onClick={() => deleteMilestone(ms.id)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/10 rounded cursor-pointer"
                                      >
                                        <Trash2 className="w-3 h-3 text-red-400" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {milestones.length === 0 && (
                    <p className="text-sm text-[#a9b49c] text-center py-6">
                      Belum ada milestone. Tambahkan untuk memulai tracking.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Target Capaian (KPI) */}
              <Card className="border-white/10 bg-white/5 backdrop-blur-md">
                <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-white/5">
                  <div>
                    <CardTitle className="text-white">
                      Target Capaian (KPI)
                    </CardTitle>
                    <CardDescription className="text-[#a9b49c]">
                      Indikator kunci terukur untuk evaluasi keberhasilan
                      program kerja.
                    </CardDescription>
                  </div>
                  {hasEditPermission && (
                    <Button
                      size="sm"
                      className="bg-white text-[#091c11] hover:bg-[#a7f3d0] gap-1.5 h-9 font-bold rounded-lg cursor-pointer"
                      onClick={() => setShowAddKpi(!showAddKpi)}
                    >
                      <Plus className="w-4 h-4" /> Tambah KPI
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  {/* Add KPI form */}
                  <AnimatePresence>
                    {showAddKpi && (
                      <motion.form
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        onSubmit={handleAddKpiSubmit}
                        className="overflow-hidden"
                      >
                        <div className="p-4 rounded-xl border border-dashed border-white/15 bg-white/3 space-y-3 mb-4">
                          <input
                            placeholder="Nama Indikator KPI *"
                            value={kpiIndicator}
                            onChange={(e) => setKpiIndicator(e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-[#a9b49c] outline-none focus:border-[#10b981]"
                          />
                          <div className="grid grid-cols-3 gap-2">
                            <input
                              type="number"
                              placeholder="Target"
                              value={kpiTargetVal}
                              onChange={(e) => setKpiTargetVal(e.target.value)}
                              className="p-2.5 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-[#a9b49c] outline-none focus:border-[#10b981]"
                            />
                            <select
                              value={kpiUnit}
                              onChange={(e) => setKpiUnit(e.target.value)}
                              className="p-2.5 rounded-lg border border-white/10 bg-white/5 text-sm text-white outline-none focus:border-[#10b981] cursor-pointer"
                            >
                              <option value="orang">Orang</option>
                              <option value="%">Persen (%)</option>
                              <option value="buah">Buah</option>
                              <option value="hari">Hari</option>
                              <option value="jam">Jam</option>
                              <option value="kegiatan">Kegiatan</option>
                            </select>
                            <input
                              placeholder="Catatan"
                              value={kpiNotes}
                              onChange={(e) => setKpiNotes(e.target.value)}
                              className="p-2.5 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-[#a9b49c] outline-none focus:border-[#10b981]"
                            />
                          </div>
                          <Button
                            type="submit"
                            size="sm"
                            className="bg-[#10b981] hover:bg-[#059669] text-white h-9 px-6 font-bold rounded-lg cursor-pointer"
                          >
                            Simpan KPI
                          </Button>
                        </div>
                      </motion.form>
                    )}
                  </AnimatePresence>

                  {/* KPI list */}
                  {kpiTargets.map((kpi) => {
                    const pct =
                      kpi.target > 0
                        ? Math.min(
                            100,
                            Math.round((kpi.actual / kpi.target) * 100),
                          )
                        : 0;
                    const isAchieved = pct >= 100;
                    const barColor = isAchieved
                      ? "bg-emerald-500"
                      : pct >= 60
                        ? "bg-amber-500"
                        : "bg-red-500";

                    return (
                      <div
                        key={kpi.id}
                        className="p-3.5 rounded-xl border border-white/8 bg-white/3 group hover:bg-white/5 transition-all"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-white">
                              {kpi.indicator}
                            </p>
                            {kpi.notes && (
                              <p className="text-[10px] text-[#a9b49c] mt-0.5">
                                {kpi.notes}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`text-xs font-black ${isAchieved ? "text-emerald-400" : pct >= 60 ? "text-amber-400" : "text-red-400"}`}
                            >
                              {pct}%
                            </span>
                            {hasEditPermission && (
                              <button
                                onClick={() => deleteKpi(kpi.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/10 rounded cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3 text-red-400" />
                              </button>
                            )}
                          </div>
                        </div>
                        {/* Progress bar */}
                        <div className="h-1.5 w-full bg-white/8 overflow-hidden rounded-full mb-2">
                          <div
                            className={`h-full ${barColor} rounded-full transition-all duration-500`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-[#a9b49c]">
                            Target: {kpi.target} {kpi.unit}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-[#a9b49c]">
                              Aktual:
                            </span>
                            <input
                              type="number"
                              value={kpi.actual || ""}
                              onChange={(e) =>
                                updateKpiActual(
                                  kpi.id,
                                  Number(e.target.value) || 0,
                                )
                              }
                              placeholder="0"
                              className="w-16 text-right text-xs font-bold text-white bg-white/5 border border-white/10 rounded px-1.5 py-0.5 outline-none focus:border-[#10b981]"
                            />
                            <span className="text-[10px] text-[#a9b49c]">
                              {kpi.unit}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {kpiTargets.length === 0 && (
                    <p className="text-sm text-[#a9b49c] text-center py-6">
                      Belum ada indikator KPI. Tambahkan untuk memulai
                      pengukuran.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Scrolling Activity log box */}
              <Card className="border-white/10 bg-white/5 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-sm text-white font-bold flex items-center gap-2">
                    <FolderKanban className="h-4 w-4 text-[#10b981]" />
                    Audit Log Operasional Kegiatan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-32 overflow-y-auto bg-black/60 rounded-xl border border-white/5 p-3.5 font-mono text-[10px] leading-relaxed text-[#71d39b] space-y-1.5 custom-scrollbar">
                    {logs.map((log, index) => (
                      <div key={index}>{log}</div>
                    ))}
                    <div ref={logsEndRef} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Kepanitiaan Tab */}
            <TabsContent value="panitia" className="space-y-6 mt-4">
              <Card className="border-white/10 bg-white/5 backdrop-blur-md">
                <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-white/5">
                  <div>
                    <CardTitle className="text-white">
                      Struktur Kepanitiaan (OC)
                    </CardTitle>
                    <CardDescription className="text-[#a9b49c]">
                      Daftar fungsionaris aktif yang bertugas beserta analisis
                      performa.
                    </CardDescription>
                  </div>
                  {hasEditPermission && (
                    <Button
                      size="sm"
                      className="bg-white text-[#091c11] hover:bg-[#a7f3d0] gap-1.5 h-9 font-bold rounded-lg cursor-pointer"
                      onClick={() => setIsKepanitiaanOpen(true)}
                    >
                      <Plus className="w-4 h-4" /> Tambah Anggota
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="pt-4">
                  {isPanitiaLoading ? (
                    <div className="space-y-3">
                      <div className="h-12 bg-white/5 animate-pulse rounded" />
                      <div className="h-12 bg-white/5 animate-pulse rounded" />
                    </div>
                  ) : committees.length > 0 ? (
                    <div className="divide-y divide-white/5">
                      {committees.map((item: any) => {
                        const uid =
                          typeof item.userId === "object"
                            ? item.userId._id
                            : item.userId;
                        const name =
                          typeof item.userId === "object"
                            ? item.userId.name
                            : item.userName || "Panitia";
                        const workload = getWorkloadRatio(uid);
                        const pointsEarned = getFungsionarisRewards(uid);

                        return (
                          <div
                            key={item._id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full border border-[#10b981]/25 bg-[#10b981]/12 text-[#a7f3d0] flex items-center justify-center font-bold text-xs uppercase">
                                {name.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-white leading-none">
                                  {name}
                                </p>
                                <p className="text-xs text-[#a9b49c] mt-1.5">
                                  {item.division
                                    ? `Divisi ${item.division}`
                                    : "Pengarah Teknis"}{" "}
                                  •{" "}
                                  <span className="italic font-bold text-white">
                                    {item.position || item.role || "Staff"}
                                  </span>
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3.5 self-end sm:self-center">
                              {/* Accumulated Points indicator */}
                              <Badge className="bg-[#10b981]/10 text-[#a7f3d0] border-[#10b981]/20 font-bold text-[10px]">
                                {pointsEarned} Pts Diperoleh
                              </Badge>

                              {/* Workload assessment badge */}
                              <Badge
                                variant="outline"
                                className={`font-bold text-[10px] uppercase border ${workload.color}`}
                              >
                                Workload: {workload.label} ({workload.count}{" "}
                                Aktif)
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-[#a9b49c] text-sm italic">
                      Struktur panitia pelaksana belum dibentuk. Silakan tambah
                      anggota.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tugas & Rundown (Kanban Board) */}
            <TabsContent value="tasks" className="space-y-6 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">
                    Board Tugas Operasional
                  </h2>
                  <p className="text-xs text-[#a9b49c] mt-0.5">
                    Kelola koordinasi taktis dan rundown kerja per divisi.
                  </p>
                </div>
                <Button
                  onClick={() => setShowAddTask(true)}
                  className="bg-white text-[#091c11] hover:bg-[#a7f3d0] h-9 font-bold text-xs rounded-lg cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Tugas
                </Button>
              </div>

              {/* Kanban lanes */}
              <div className="grid gap-4 md:grid-cols-3">
                {/* Lane 1: To Do */}
                <div className="rounded-xl border border-white/5 bg-white/2 p-3 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-xs font-black uppercase text-[#a9b49c]">
                      Belum Dimulai (To Do)
                    </span>
                    <Badge
                      variant="secondary"
                      className="bg-white/5 text-[#a9b49c]"
                    >
                      {tasks.filter((t) => t.status === "To Do").length}
                    </Badge>
                  </div>
                  <div className="space-y-2.5">
                    {tasks
                      .filter((t) => t.status === "To Do")
                      .map((task) => (
                        <div
                          key={task.id}
                          className="rounded-lg border border-white/8 bg-white/3 p-3.5 space-y-3 hover:border-white/15 transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <Badge className="bg-white/10 text-white border-white/10 text-[9px] font-bold uppercase">
                              {task.division}
                            </Badge>
                            <span className="text-[9px] text-[#ff7a7a] font-bold">
                              ★ {task.points} Poin
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-white leading-tight">
                            {task.title}
                          </h4>
                          <div className="flex items-center justify-between pt-2 border-t border-white/5">
                            <span className="text-[9px] text-[#a9b49c]">
                              Selesai: {task.deadline}
                            </span>
                            <button
                              onClick={() => {
                                const updated = tasks.map((t) =>
                                  t.id === task.id
                                    ? { ...t, status: "In Progress" as const }
                                    : t,
                                );
                                saveState("tasks", updated, setTasks);
                                addSystemLog(
                                  `Tugas '${task.title}' dipindahkan ke In Progress.`,
                                );
                              }}
                              className="text-[9px] font-bold text-[#10b981] hover:underline cursor-pointer"
                            >
                              Mulai Kerja →
                            </button>
                          </div>
                        </div>
                      ))}
                    {tasks.filter((t) => t.status === "To Do").length === 0 && (
                      <div className="text-center py-6 text-[10px] text-[#a9b49c] italic">
                        Tidak ada tugas
                      </div>
                    )}
                  </div>
                </div>

                {/* Lane 2: In Progress */}
                <div className="rounded-xl border border-[#f0c36a]/20 bg-white/2 p-3 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-xs font-black uppercase text-[#f0c36a]">
                      Sedang Dikerjakan
                    </span>
                    <Badge
                      variant="secondary"
                      className="bg-[#f0c36a]/15 text-[#f0c36a]"
                    >
                      {tasks.filter((t) => t.status === "In Progress").length}
                    </Badge>
                  </div>
                  <div className="space-y-2.5">
                    {tasks
                      .filter((t) => t.status === "In Progress")
                      .map((task) => (
                        <div
                          key={task.id}
                          className="rounded-lg border border-[#f0c36a]/20 bg-white/3 p-3.5 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <Badge className="bg-white/10 text-white border-white/10 text-[9px] font-bold uppercase">
                              {task.division}
                            </Badge>
                            <span className="text-[9px] text-[#f0c36a] font-bold">
                              ★ {task.points} Poin
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-white leading-tight">
                            {task.title}
                          </h4>
                          <div className="flex items-center justify-between pt-2 border-t border-white/5">
                            <span className="text-[9px] text-[#a9b49c]">
                              Deadline: {task.deadline}
                            </span>
                            <button
                              onClick={() => {
                                const updated = tasks.map((t) =>
                                  t.id === task.id
                                    ? { ...t, status: "Done" as const }
                                    : t,
                                );
                                saveState("tasks", updated, setTasks);
                                addSystemLog(
                                  `Tugas '${task.title}' berhasil diselesaikan secara penuh.`,
                                );
                              }}
                              className="text-[9px] font-bold text-emerald-400 hover:underline cursor-pointer"
                            >
                              ✓ Tandai Selesai
                            </button>
                          </div>
                        </div>
                      ))}
                    {tasks.filter((t) => t.status === "In Progress").length ===
                      0 && (
                      <div className="text-center py-6 text-[10px] text-[#a9b49c] italic">
                        Tidak ada tugas aktif
                      </div>
                    )}
                  </div>
                </div>

                {/* Lane 3: Done */}
                <div className="rounded-xl border border-[#10b981]/20 bg-white/2 p-3 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-xs font-black uppercase text-[#10b981]">
                      Selesai (Done)
                    </span>
                    <Badge
                      variant="secondary"
                      className="bg-[#10b981]/15 text-[#10b981]"
                    >
                      {tasks.filter((t) => t.status === "Done").length}
                    </Badge>
                  </div>
                  <div className="space-y-2.5">
                    {tasks
                      .filter((t) => t.status === "Done")
                      .map((task) => (
                        <div
                          key={task.id}
                          className="rounded-lg border border-[#10b981]/20 bg-[#091c11]/10 p-3.5 space-y-3 opacity-80"
                        >
                          <div className="flex items-center justify-between">
                            <Badge className="bg-[#10b981]/10 text-[#a7f3d0] border-[#10b981]/20 text-[9px] font-bold uppercase">
                              {task.division}
                            </Badge>
                            <span className="text-[9px] text-emerald-400 font-bold">
                              ✓ Terverifikasi
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-white line-through leading-tight">
                            {task.title}
                          </h4>
                          <div className="flex items-center justify-between pt-2 border-t border-white/5">
                            <span className="text-[9px] text-[#a9b49c]">
                              Selesai pada deadline
                            </span>
                            <button
                              onClick={() => {
                                const updated = tasks.filter(
                                  (t) => t.id !== task.id,
                                );
                                saveState("tasks", updated, setTasks);
                                addSystemLog(
                                  `Menghapus tugas terverifikasi: '${task.title}'.`,
                                );
                              }}
                              className="text-[9px] font-bold text-red-400 hover:text-red-300 cursor-pointer"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      ))}
                    {tasks.filter((t) => t.status === "Done").length === 0 && (
                      <div className="text-center py-6 text-[10px] text-[#a9b49c] italic">
                        Belum ada tugas selesai
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Buku Kas & Anggaran */}
            <TabsContent value="finance" className="space-y-6 mt-4">
              {/* Cash Analytics Header Widgets */}
              <div className="grid gap-4 sm:grid-cols-3">
                <Card className="border-white/5 bg-white/3">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[#a9b49c]">Total Anggaran</p>
                      <h4 className="text-lg font-black text-white mt-1">
                        Rp{" "}
                        {cashAnalytics.totalAllocated.toLocaleString("id-ID")}
                      </h4>
                    </div>
                    <div className="h-9 w-9 rounded-lg bg-white/5 flex items-center justify-center text-white">
                      <Banknote className="h-4.5 w-4.5" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-white/5 bg-white/3">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[#a9b49c]">Kas Terpakai</p>
                      <h4 className="text-lg font-black text-red-400 mt-1">
                        Rp {cashAnalytics.spent.toLocaleString("id-ID")}
                      </h4>
                    </div>
                    <div className="h-9 w-9 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400">
                      <TrendingUp className="h-4.5 w-4.5 rotate-180" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-white/5 bg-white/3">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[#a9b49c]">Sisa Anggaran</p>
                      <h4 className="text-lg font-black text-emerald-400 mt-1">
                        Rp {cashAnalytics.balance.toLocaleString("id-ID")}
                      </h4>
                    </div>
                    <div className="h-9 w-9 rounded-lg bg-[#10b981]/10 flex items-center justify-center text-[#a7f3d0]">
                      <CheckCircle className="h-4.5 w-4.5" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Progress and Ledger Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs font-bold text-[#a9b49c] mb-1">
                    <span>
                      PERSENTASE PENYERAPAN ANGGARAN (BUDGET ABSORPTION)
                    </span>
                    <span className="text-white">
                      {cashAnalytics.absorptionRate}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-white/8 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#10b981] rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(cashAnalytics.absorptionRate, 100)}%`,
                      }}
                    />
                  </div>
                </div>

                <Button
                  onClick={() => setShowAddCash(true)}
                  className="bg-white text-[#091c11] hover:bg-[#a7f3d0] h-9 font-bold text-xs rounded-lg cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Catat Keuangan
                </Button>
              </div>

              {/* Ledger list */}
              <Card className="border-white/10 bg-white/5 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-sm text-white font-bold">
                    Buku Kas & Log Transaksi Pelaksana
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto rounded-lg border border-white/5">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-white/4 text-[#a9b49c] font-black uppercase border-b border-white/5">
                          <th className="p-3">Tanggal</th>
                          <th className="p-3">Transaksi</th>
                          <th className="p-3">Tipe</th>
                          <th className="p-3">Nominal</th>
                          <th className="p-3">Catatan</th>
                          <th className="p-3 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-[#c8d2bd]">
                        {ledger.map((entry) => (
                          <tr
                            key={entry.id}
                            className="hover:bg-white/2 transition-colors"
                          >
                            <td className="p-3 font-mono">{entry.date}</td>
                            <td className="p-3 font-bold text-white">
                              {entry.title}
                            </td>
                            <td className="p-3">
                              <Badge
                                className={
                                  entry.type === "Masuk"
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                    : "bg-red-500/10 text-red-400 border-red-500/20"
                                }
                              >
                                {entry.type}
                              </Badge>
                            </td>
                            <td
                              className={`p-3 font-bold ${entry.type === "Keluar" ? "text-red-400" : "text-emerald-400"}`}
                            >
                              Rp {entry.amount.toLocaleString("id-ID")}
                            </td>
                            <td className="p-3 italic text-white/60">
                              {entry.notes || "-"}
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => {
                                  const updated = ledger.filter(
                                    (item) => item.id !== entry.id,
                                  );
                                  saveState("ledger", updated, setLedger);
                                  addSystemLog(
                                    `Menghapus log transaksi keuangan: '${entry.title}'.`,
                                  );
                                }}
                                className="h-6 w-6 rounded hover:bg-red-500/10 text-red-400 flex items-center justify-center ml-auto cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {ledger.length === 0 && (
                          <tr>
                            <td
                              colSpan={6}
                              className="p-8 text-center text-[#a9b49c] italic"
                            >
                              Belum ada catatan transaksi kas.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Peminjaman Aset */}
            <TabsContent value="assets" className="space-y-6 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">
                    Peminjaman Aset BEM
                  </h2>
                  <p className="text-xs text-[#a9b49c] mt-0.5">
                    Ajukan dan monitor status pinjaman logistik & peralatan
                    sekretariat BEM.
                  </p>
                </div>
                <Button
                  onClick={() => setShowAddAsset(true)}
                  className="bg-white text-[#091c11] hover:bg-[#a7f3d0] h-9 font-bold text-xs rounded-lg cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Ajukan Pinjaman
                </Button>
              </div>

              {/* Roster of active requested tools */}
              <div className="grid gap-4 sm:grid-cols-2">
                {assets.map((req) => (
                  <Card
                    key={req.id}
                    className="border-white/10 bg-white/4 hover:bg-white/6 transition-all"
                  >
                    <CardContent className="p-4 flex items-center justify-between gap-3">
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-white truncate">
                            {req.name}
                          </h4>
                          <Badge
                            variant="secondary"
                            className="bg-white/5 text-white py-0 h-5 px-2 font-mono"
                          >
                            {req.quantity} Pcs
                          </Badge>
                        </div>
                        <p className="text-[10px] text-[#a9b49c]">
                          Digunakan s/d:{" "}
                          <strong className="text-white font-mono">
                            {req.deadline}
                          </strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <Badge
                          className={
                            req.status === "Disetujui"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : req.status === "Ditolak"
                                ? "bg-red-500/10 text-red-400 border-red-500/20"
                                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          }
                        >
                          {req.status}
                        </Badge>

                        <button
                          onClick={() => {
                            const updated = assets.filter(
                              (item) => item.id !== req.id,
                            );
                            saveState("assets", updated, setAssets);
                            addSystemLog(
                              `Membatalkan pengajuan aset: '${req.name}'.`,
                            );
                          }}
                          className="h-7 w-7 rounded-lg border border-white/5 bg-white/5 text-red-400 hover:bg-red-500/10 flex items-center justify-center cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {assets.length === 0 && (
                  <div className="sm:col-span-2 text-center py-10 rounded-xl border border-dashed border-white/10 text-[#a9b49c] italic text-xs">
                    Belum ada pengajuan peminjaman aset sekretariat untuk proker
                    ini.
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Kelengkapan LPJ Checklist */}
            <TabsContent value="lpj" className="space-y-6 mt-4">
              <Card className="border-white/10 bg-white/5 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-white font-black">
                    Standardisasi Administrasi & Checklist LPJ
                  </CardTitle>
                  <CardDescription className="text-[#a9b49c]">
                    Lengkapi syarat administrasi wajib agar laporan
                    pertanggungjawaban dapat di-ACC oleh BPI.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div
                      onClick={() => toggleChecklistItem("rundown")}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${lpjChecklist.rundown ? "border-emerald-500/40 bg-[#10b981]/5 text-white" : "border-white/10 bg-white/2 text-[#a9b49c] hover:bg-white/4"}`}
                    >
                      <div className="space-y-1">
                        <p className="text-xs font-bold">
                          Rundown & Evaluasi Acara
                        </p>
                        <p className="text-[10px] opacity-70">
                          Runtutan rundown realisasi riil.
                        </p>
                      </div>
                      <CheckCircle
                        className={`h-5 w-5 shrink-0 ${lpjChecklist.rundown ? "text-emerald-400" : "opacity-20"}`}
                      />
                    </div>

                    <div
                      onClick={() => toggleChecklistItem("rab")}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${lpjChecklist.rab ? "border-emerald-500/40 bg-[#10b981]/5 text-white" : "border-white/10 bg-white/2 text-[#a9b49c] hover:bg-white/4"}`}
                    >
                      <div className="space-y-1">
                        <p className="text-xs font-bold">RAB Laporan Riil</p>
                        <p className="text-[10px] opacity-70">
                          Kesesuaian RAB rencana vs kas keluar.
                        </p>
                      </div>
                      <CheckCircle
                        className={`h-5 w-5 shrink-0 ${lpjChecklist.rab ? "text-emerald-400" : "opacity-20"}`}
                      />
                    </div>

                    <div
                      onClick={() => toggleChecklistItem("spj")}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${lpjChecklist.spj ? "border-emerald-500/40 bg-[#10b981]/5 text-white" : "border-white/10 bg-white/2 text-[#a9b49c] hover:bg-white/4"}`}
                    >
                      <div className="space-y-1">
                        <p className="text-xs font-bold">
                          Surat Pertanggungjawaban (SPJ)
                        </p>
                        <p className="text-[10px] opacity-70">
                          Dokumen tanda tangan resmi ketupel & BPH.
                        </p>
                      </div>
                      <CheckCircle
                        className={`h-5 w-5 shrink-0 ${lpjChecklist.spj ? "text-emerald-400" : "opacity-20"}`}
                      />
                    </div>

                    <div
                      onClick={() => toggleChecklistItem("presensi")}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${lpjChecklist.presensi ? "border-emerald-500/40 bg-[#10b981]/5 text-white" : "border-white/10 bg-white/2 text-[#a9b49c] hover:bg-white/4"}`}
                    >
                      <div className="space-y-1">
                        <p className="text-xs font-bold">
                          Presensi Kehadiran Peserta
                        </p>
                        <p className="text-[10px] opacity-70">
                          Arsip absensi scan QR atau data manual.
                        </p>
                      </div>
                      <CheckCircle
                        className={`h-5 w-5 shrink-0 ${lpjChecklist.presensi ? "text-emerald-400" : "opacity-20"}`}
                      />
                    </div>

                    <div
                      onClick={() => toggleChecklistItem("kwitansi")}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${lpjChecklist.kwitansi ? "border-emerald-500/40 bg-[#10b981]/5 text-white" : "border-white/10 bg-white/2 text-[#a9b49c] hover:bg-white/4"}`}
                    >
                      <div className="space-y-1">
                        <p className="text-xs font-bold">
                          Bukti Nota & Kwitansi Belanja
                        </p>
                        <p className="text-[10px] opacity-70">
                          Unggahan lampiran kuitansi keuangan lengkap.
                        </p>
                      </div>
                      <CheckCircle
                        className={`h-5 w-5 shrink-0 ${lpjChecklist.kwitansi ? "text-emerald-400" : "opacity-20"}`}
                      />
                    </div>

                    <div
                      onClick={() => toggleChecklistItem("dokumentasi")}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${lpjChecklist.dokumentasi ? "border-emerald-500/40 bg-[#10b981]/5 text-white" : "border-white/10 bg-white/2 text-[#a9b49c] hover:bg-white/4"}`}
                    >
                      <div className="space-y-1">
                        <p className="text-xs font-bold">
                          Dokumentasi Acara (Foto/Video)
                        </p>
                        <p className="text-[10px] opacity-70">
                          Bukti visual pelaksanaan proker di lapangan.
                        </p>
                      </div>
                      <CheckCircle
                        className={`h-5 w-5 shrink-0 ${lpjChecklist.dokumentasi ? "text-emerald-400" : "opacity-20"}`}
                      />
                    </div>
                  </div>

                  {/* Warning banner if not all checked */}
                  {Object.values(lpjChecklist).some((v) => v === false) ? (
                    <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-[#f0c36a] text-xs flex items-start gap-2.5">
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400 animate-pulse" />
                      <div>
                        <strong>LPJ Administrasi Belum Lengkap:</strong> Masih
                        terdapat dokumen wajib yang belum lengkap. Pastikan
                        semua checklist di atas dicentang untuk menyelesaikan
                        alur birokrasi pertanggungjawaban BEM FT.
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-xs flex items-start gap-2.5">
                      <CheckCircle className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
                      <div>
                        <strong>Administrasi Selesai!</strong> Seluruh
                        kelengkapan berkas wajib telah divalidasi. LKM-TD siap
                        diverifikasi oleh Steering Committee dan di-lock secara
                        permanen.
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Kolom Diskusi & Feed Koordinasi */}
            <TabsContent value="diskusi" className="space-y-6 mt-4">
              <Card className="border-white/10 bg-white/5 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-white font-black">
                    Feed Diskusi & Koordinasi Panitia
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Create Comment Form */}
                  <form onSubmit={handlePostComment} className="flex gap-2">
                    <input
                      required
                      placeholder="Tulis instruksi evaluasi atau catatan koordinasi panitia..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="flex-1 h-10 px-3.5 bg-white/8 border border-white/10 rounded-lg text-white placeholder-[#a9b49c]/50 text-xs outline-none focus:ring-1 focus:ring-[#10b981]"
                    />
                    <Button
                      type="submit"
                      className="bg-white text-[#091c11] hover:bg-[#a7f3d0] h-10 font-bold px-4 rounded-lg flex items-center justify-center shrink-0 cursor-pointer"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>

                  {/* Comment list */}
                  <div className="space-y-4 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                    {comments.map((comm) => (
                      <div
                        key={comm.id}
                        className="p-3.5 rounded-xl border border-white/5 bg-white/3 space-y-2.5 animate-in slide-in-from-bottom-2 duration-300"
                      >
                        <div className="flex items-center justify-between text-[10px] text-[#a9b49c]">
                          <span className="font-black text-white">
                            {comm.authorName}
                          </span>
                          <span>{comm.date}</span>
                        </div>
                        <p className="text-xs text-[#c8d2bd] leading-relaxed font-medium">
                          {comm.content}
                        </p>
                      </div>
                    ))}
                    {comments.length === 0 && (
                      <div className="text-center py-8 text-[#a9b49c] italic text-xs">
                        Belum ada diskusi koordinasi yang dimulai. Silakan kirim
                        pesan pertama Anda.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Info Box */}
        <div className="space-y-6">
          {/* SC Authority Panel: Visible to admin or SC only */}
          {(isGlobalAdmin || isSC) && (
            <Card className="border-[#10b981]/30 bg-[#10b981]/5 backdrop-blur-sm shadow-[0_0_24px_rgba(16,185,129,0.06)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-white flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-[#10b981]" />
                  Kontrol Lifecycle & Otorisasi SC
                </CardTitle>
                <CardDescription className="text-[10px] text-[#a9b49c]">
                  Kelola transisi status kepanitiaan dan pembekuan (freeze)
                  program kerja.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-col gap-2">
                  {proker.status === "Planning" && (
                    <button
                      onClick={() => {
                        updateMutation.mutate({
                          status: "Active",
                          progress: 30,
                        });
                        addSystemLog(
                          "Steering Committee menyetujui RAB & Proposal. Eksekusi proker AKTIF.",
                        );
                      }}
                      className="w-full inline-flex justify-center rounded-lg bg-[#10b981] hover:bg-[#a7f3d0] text-[#091c11] font-bold text-xs py-2.5 transition-colors cursor-pointer"
                      disabled={updateMutation.isPending}
                    >
                      Mulai Eksekusi (Aktifkan)
                    </button>
                  )}
                  {(proker.status === "Planning" ||
                    proker.status === "Active" ||
                    proker.status === "In Progress") && (
                    <button
                      onClick={() => {
                        updateMutation.mutate({
                          status: "Event Finished",
                          progress: 70,
                        });
                        addSystemLog(
                          "Kegiatan puncak selesai dilaksanakan. Menunggu penyusunan berkas LPJ.",
                        );
                      }}
                      className="w-full inline-flex justify-center rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2.5 transition-colors cursor-pointer"
                      disabled={updateMutation.isPending}
                    >
                      Selesaikan Acara (LPJ Pending)
                    </button>
                  )}
                  {proker.status === "Event Finished" && (
                    <>
                      <button
                        onClick={() => {
                          updateMutation.mutate({
                            status: "LPJ Revision",
                            progress: 80,
                          });
                          addSystemLog(
                            "Steering Committee mengembalikan LPJ ke panitia untuk REVISI berkas.",
                          );
                        }}
                        className="w-full inline-flex justify-center rounded-lg bg-orange-655 hover:bg-orange-600 text-white font-bold text-xs py-2.5 transition-colors mb-1 cursor-pointer"
                        disabled={updateMutation.isPending}
                      >
                        Kembalikan untuk Revisi LPJ
                      </button>
                      <button
                        onClick={() => {
                          updateMutation.mutate({
                            status: "LPJ Approved",
                            progress: 95,
                          });
                          addSystemLog(
                            "Laporan Pertanggungjawaban disetujui penuh oleh BPH.",
                          );
                        }}
                        className="w-full inline-flex justify-center rounded-lg bg-green-600 hover:bg-green-500 text-white font-bold text-xs py-2.5 transition-colors cursor-pointer"
                        disabled={updateMutation.isPending}
                      >
                        Setujui LPJ (Siap Arsip)
                      </button>
                    </>
                  )}
                  {proker.status === "LPJ Revision" && (
                    <button
                      onClick={() => {
                        updateMutation.mutate({
                          status: "LPJ Approved",
                          progress: 95,
                        });
                        addSystemLog(
                          "Revisi kelengkapan berkas disetujui. LPJ SAH.",
                        );
                      }}
                      className="w-full inline-flex justify-center rounded-lg bg-green-600 hover:bg-green-500 text-white font-bold text-xs py-2.5 transition-colors cursor-pointer"
                      disabled={updateMutation.isPending}
                    >
                      Setujui Revisi & LPJ
                    </button>
                  )}
                  {proker.status === "LPJ Approved" && (
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            "Apakah Anda yakin ingin membekukan dan mengarsipkan kepanitiaan ini secara permanen?",
                          )
                        ) {
                          updateMutation.mutate({
                            status: "Archived",
                            progress: 100,
                          });
                          addSystemLog(
                            "Kepanitiaan dibekukan dan arsip proker disimpan permanen.",
                          );
                        }
                      }}
                      className="w-full inline-flex justify-center rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs py-2.5 transition-colors cursor-pointer"
                      disabled={updateMutation.isPending}
                    >
                      Arsipkan & Bekukan (Freeze)
                    </button>
                  )}
                  {proker.status !== "Archived" &&
                    proker.status !== "Cancelled" && (
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              "Apakah Anda yakin ingin membatalkan program kerja ini?",
                            )
                          ) {
                            updateMutation.mutate({
                              status: "Cancelled",
                              progress: 0,
                            });
                            addSystemLog(
                              "PROGRAM KERJA BATAL/CANCELLED DARI KABINET.",
                            );
                          }
                        }}
                        className="w-full inline-flex justify-center rounded-lg bg-red-650 hover:bg-red-600 text-white font-bold text-xs py-2.5 transition-colors mt-2 cursor-pointer"
                        disabled={updateMutation.isPending}
                      >
                        Batalkan Kegiatan
                      </button>
                    )}
                  {proker.status === "Archived" && (
                    <div className="text-center py-2.5 px-3 border border-purple-500/20 bg-purple-500/10 rounded text-[11px] text-purple-200 font-semibold uppercase font-mono tracking-wider">
                      Arsip Beku
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timeline Milestones Checklist */}
          <Card className="border-white/10 bg-white/5 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-white">Milestone & Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative border-l border-white/10 pl-4 space-y-5 text-xs text-[#c8d2bd]">
                <div className="relative">
                  <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  <p className="font-bold text-white leading-none">
                    Planning & Proposal
                  </p>
                  <p className="text-[10px] text-[#a9b49c] mt-1.5 leading-normal">
                    Langkah awal perancangan RAB & kepanitiaan
                  </p>
                </div>
                <div className="relative">
                  <div
                    className={`absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full ${calculatedProgress >= 40 ? "bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.8)]" : "bg-white/10 border border-white/10"}`}
                  />
                  <p className="font-bold text-white leading-none">
                    Approval & Pendanaan
                  </p>
                  <p className="text-[10px] text-[#a9b49c] mt-1.5 leading-normal">
                    Pencairan dana anggaran oleh Bendahara BEM
                  </p>
                </div>
                <div className="relative">
                  <div
                    className={`absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full ${calculatedProgress >= 70 ? "bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.8)]" : "bg-white/10 border border-white/10"}`}
                  />
                  <p className="font-bold text-white leading-none">
                    Eksekusi Kegiatan
                  </p>
                  <p className="text-[10px] text-[#a9b49c] mt-1.5 leading-normal">
                    Pelaksanaan acara utama program kerja
                  </p>
                </div>
                <div className="relative">
                  <div
                    className={`absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full ${calculatedProgress === 100 ? "bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.8)]" : "bg-white/10 border border-white/10"}`}
                  />
                  <p className="font-bold text-white leading-none">
                    Penyusunan LPJ
                  </p>
                  <p className="text-[10px] text-[#a9b49c] mt-1.5 leading-normal">
                    Pelaporan pertanggungjawaban & arsip
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Database Form Dialogs */}
      <ProkerFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSubmit={(data) => updateMutation.mutate(data)}
        initialData={proker}
        isLoading={updateMutation.isPending}
      />

      <KepanitiaanFormDialog
        open={isKepanitiaanOpen}
        onOpenChange={setIsKepanitiaanOpen}
        onSubmit={async (data) => {
          await assignMemberMutation.mutateAsync(data);
        }}
        isLoading={assignMemberMutation.isPending}
      />

      {/* Dynamic Popups / Modals */}
      {/* 1. Modal: Tambah Tugas */}
      <AnimatePresence>
        {showAddTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md rounded-xl border border-white/10 bg-[#091c11] p-6 shadow-2xl space-y-4"
            >
              <h3 className="text-base font-bold text-white border-b border-white/5 pb-2">
                Tambah Tugas Taktis
              </h3>
              <form
                onSubmit={handleAddTaskSubmit}
                className="space-y-3.5 text-xs text-[#c8d2bd]"
              >
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black tracking-wider text-[#a9b49c]">
                    Nama Tugas / Rundown
                  </label>
                  <input
                    required
                    placeholder="Contoh: Booking Ruang Auditorium"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="w-full h-10 px-3 bg-white/8 border border-white/10 rounded-lg text-white outline-none focus:ring-1 focus:ring-[#10b981]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-black tracking-wider text-[#a9b49c]">
                      Divisi Pelaksana
                    </label>
                    <select
                      value={taskDivision}
                      onChange={(e) => setTaskDivision(e.target.value)}
                      className="w-full h-10 px-3 bg-white/8 border border-white/10 rounded-lg text-white outline-none focus:ring-1 focus:ring-[#10b981]"
                    >
                      <option className="bg-[#091c11]" value="Acara">
                        Divisi Acara
                      </option>
                      <option className="bg-[#091c11]" value="Humas">
                        Divisi Humas
                      </option>
                      <option className="bg-[#091c11]" value="PDD">
                        Divisi PDD
                      </option>
                      <option className="bg-[#091c11]" value="Konsumsi">
                        Divisi Konsumsi
                      </option>
                      <option className="bg-[#091c11]" value="Perlengkapan">
                        Divisi Perlengkapan
                      </option>
                      <option className="bg-[#091c11]" value="Keamanan">
                        Divisi Keamanan
                      </option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-black tracking-wider text-[#a9b49c]">
                      Bobot Poin (Rewards)
                    </label>
                    <input
                      required
                      type="number"
                      value={taskPoints}
                      onChange={(e) => setTaskPoints(Number(e.target.value))}
                      className="w-full h-10 px-3 bg-white/8 border border-white/10 rounded-lg text-white outline-none focus:ring-1 focus:ring-[#10b981]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black tracking-wider text-[#a9b49c]">
                    Tugaskan Ke Anggota Panitia
                  </label>
                  <select
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    className="w-full h-10 px-3 bg-white/8 border border-white/10 rounded-lg text-white outline-none focus:ring-1 focus:ring-[#10b981]"
                  >
                    <option className="bg-[#091c11] text-[#a9b49c]" value="">
                      -- Pilih Anggota --
                    </option>
                    {committees.map((item: any) => {
                      const uid =
                        typeof item.userId === "object"
                          ? item.userId._id
                          : item.userId;
                      const name =
                        typeof item.userId === "object"
                          ? item.userId.name
                          : item.userName || "Panitia";
                      return (
                        <option
                          key={item._id}
                          className="bg-[#091c11] text-white"
                          value={uid}
                        >
                          {name} ({item.position || item.role})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black tracking-wider text-[#a9b49c]">
                    Deadline Penyelesaian
                  </label>
                  <input
                    required
                    type="date"
                    value={taskDeadline}
                    onChange={(e) => setTaskDeadline(e.target.value)}
                    className="w-full h-10 px-3 bg-white/8 border border-white/10 rounded-lg text-white outline-none focus:ring-1 focus:ring-[#10b981]"
                  />
                </div>

                <div className="pt-3 border-t border-white/5 flex justify-end gap-2 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setShowAddTask(false)}
                    className="h-9 px-4 rounded-lg hover:bg-white/5 text-white cursor-pointer"
                  >
                    Batal
                  </button>
                  <Button
                    type="submit"
                    className="bg-[#10b981] hover:bg-[#a7f3d0] text-[#091c11] h-9 px-4 rounded-lg cursor-pointer"
                  >
                    Simpan Tugas
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Modal: Catat Keuangan */}
      <AnimatePresence>
        {showAddCash && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md rounded-xl border border-white/10 bg-[#091c11] p-6 shadow-2xl space-y-4"
            >
              <h3 className="text-base font-bold text-white border-b border-white/5 pb-2">
                Catat Arus Kas Pelaksana
              </h3>
              <form
                onSubmit={handleAddCashSubmit}
                className="space-y-3.5 text-xs text-[#c8d2bd]"
              >
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black tracking-wider text-[#a9b49c]">
                    Keterangan Transaksi
                  </label>
                  <input
                    required
                    placeholder="Contoh: Belanja Konsumsi Snack Pembuka"
                    value={cashTitle}
                    onChange={(e) => setCashTitle(e.target.value)}
                    className="w-full h-10 px-3 bg-white/8 border border-white/10 rounded-lg text-white outline-none focus:ring-1 focus:ring-[#10b981]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-black tracking-wider text-[#a9b49c]">
                      Nominal Pembayaran (Rp)
                    </label>
                    <input
                      required
                      type="number"
                      placeholder="Jumlah"
                      value={cashAmount}
                      onChange={(e) => setCashAmount(e.target.value)}
                      className="w-full h-10 px-3 bg-white/8 border border-white/10 rounded-lg text-white outline-none focus:ring-1 focus:ring-[#10b981]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-black tracking-wider text-[#a9b49c]">
                      Jenis Transaksi
                    </label>
                    <select
                      value={cashType}
                      onChange={(e) => setCashType(e.target.value as any)}
                      className="w-full h-10 px-3 bg-white/8 border border-white/10 rounded-lg text-white outline-none focus:ring-1 focus:ring-[#10b981]"
                    >
                      <option className="bg-[#091c11]" value="Keluar">
                        Pengeluaran (Kas Keluar)
                      </option>
                      <option className="bg-[#091c11]" value="Masuk">
                        Pemasukan (Dana Cair/Kas Masuk)
                      </option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black tracking-wider text-[#a9b49c]">
                    Tanggal Transaksi
                  </label>
                  <input
                    required
                    type="date"
                    value={cashDate}
                    onChange={(e) => setCashDate(e.target.value)}
                    className="w-full h-10 px-3 bg-white/8 border border-white/10 rounded-lg text-white outline-none focus:ring-1 focus:ring-[#10b981]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black tracking-wider text-[#a9b49c]">
                    Catatan / Lampiran Nota
                  </label>
                  <input
                    placeholder="Contoh: Nota fisik dipegang oleh Bendahara Panitia"
                    value={cashNotes}
                    onChange={(e) => setCashNotes(e.target.value)}
                    className="w-full h-10 px-3 bg-white/8 border border-white/10 rounded-lg text-white outline-none focus:ring-1 focus:ring-[#10b981]"
                  />
                </div>

                <div className="pt-3 border-t border-white/5 flex justify-end gap-2 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setShowAddCash(false)}
                    className="h-9 px-4 rounded-lg hover:bg-white/5 text-white cursor-pointer"
                  >
                    Batal
                  </button>
                  <Button
                    type="submit"
                    className="bg-[#10b981] hover:bg-[#a7f3d0] text-[#091c11] h-9 px-4 rounded-lg cursor-pointer"
                  >
                    Catat Pengeluaran
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Modal: Ajukan Peminjaman Aset */}
      <AnimatePresence>
        {showAddAsset && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md rounded-xl border border-white/10 bg-[#091c11] p-6 shadow-2xl space-y-4"
            >
              <h3 className="text-base font-bold text-white border-b border-white/5 pb-2">
                Ajukan Pinjam Aset Sekretariat
              </h3>
              <form
                onSubmit={handleAddAssetSubmit}
                className="space-y-3.5 text-xs text-[#c8d2bd]"
              >
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] uppercase font-black tracking-wider text-[#a9b49c]">
                      Nama Barang
                    </label>
                    <select
                      value={assetName}
                      onChange={(e) => setAssetName(e.target.value)}
                      className="w-full h-10 px-3 bg-white/8 border border-white/10 rounded-lg text-white outline-none focus:ring-1 focus:ring-[#10b981]"
                    >
                      <option className="bg-[#091c11]" value="HT Wireless">
                        HT Wireless (Kabel/Walkie)
                      </option>
                      <option className="bg-[#091c11]" value="LCD Proyektor">
                        LCD Proyektor (Epson)
                      </option>
                      <option
                        className="bg-[#091c11]"
                        value="Sound System Portable"
                      >
                        Sound System Portable
                      </option>
                      <option
                        className="bg-[#091c11]"
                        value="Kabel Roll Outdoor"
                      >
                        Kabel Roll Outdoor (20m)
                      </option>
                      <option className="bg-[#091c11]" value="Megaphone Toa">
                        Megaphone Toa (Aksi)
                      </option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-black tracking-wider text-[#a9b49c]">
                      Jumlah
                    </label>
                    <input
                      required
                      type="number"
                      value={assetQty}
                      onChange={(e) => setAssetQty(Number(e.target.value))}
                      className="w-full h-10 px-3 bg-white/8 border border-white/10 rounded-lg text-white outline-none focus:ring-1 focus:ring-[#10b981]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black tracking-wider text-[#a9b49c]">
                    Tanggal Pengembalian
                  </label>
                  <input
                    required
                    type="date"
                    value={assetDeadline}
                    onChange={(e) => setAssetDeadline(e.target.value)}
                    className="w-full h-10 px-3 bg-white/8 border border-white/10 rounded-lg text-white outline-none focus:ring-1 focus:ring-[#10b981]"
                  />
                </div>

                <div className="pt-3 border-t border-white/5 flex justify-end gap-2 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setShowAddAsset(false)}
                    className="h-9 px-4 rounded-lg hover:bg-white/5 text-white cursor-pointer"
                  >
                    Batal
                  </button>
                  <Button
                    type="submit"
                    className="bg-[#10b981] hover:bg-[#a7f3d0] text-[#091c11] h-9 px-4 rounded-lg cursor-pointer"
                  >
                    Kirim Pengajuan
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
