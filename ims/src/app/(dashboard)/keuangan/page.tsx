"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { financeService, Proposal } from "@/lib/api/finance";
import { prokerService } from "@/lib/api/proker";
import { dashboardService } from "@/lib/api/dashboard";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Eye,
  FileText,
  TrendingUp,
  Wallet,
  Coins,
  Receipt,
  AlertTriangle,
  Lock,
  ShieldCheck,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ProposalFormDialog } from "@/components/finance/proposal-form-dialog";
import { useAuth } from "@/hooks/useAuth";

export default function FinancePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Determine access level: BPH-level roles see everything, others see only their department
  const isBPH = useMemo(() => {
    const role = user?.role;
    return (
      role === "Super Admin" ||
      role === "Admin Sistem" ||
      role === "System Administrator" ||
      role === "KaBEM" ||
      role === "WaKaBEM" ||
      role === "Bendahara" ||
      role === "Sekretaris"
    );
  }, [user?.role]);

  const isBPI = isBPH; // BPI is the executive group in BEM FT structure

  const userDeptId = user?.departmentId || user?.department || null;

  const { data: proposalResponse, isLoading: isProposalsLoading } = useQuery({
    queryKey: ["ims-proposals"],
    queryFn: () => financeService.listProposals(),
  });

  const { data: prokerResponse } = useQuery({
    queryKey: ["ims-prokers-lookup-finance"],
    queryFn: () => prokerService.list(),
  });

  const { data: deptAllocationRes, isLoading: isDeptLoading } = useQuery({
    queryKey: ["dept-allocations"],
    queryFn: () => dashboardService.getDepartmentAllocation(),
  });

  const { data: spjResponse, isLoading: isLedgerLoading } = useQuery({
    queryKey: ["ims-spj-ledger"],
    queryFn: () => financeService.listSPJ(),
  });

  const allProposals = proposalResponse?.data || [];
  const prokers = prokerResponse?.data || [];
  const allocations = deptAllocationRes?.data || [];
  const allLedgerEntries = spjResponse?.data || [];

  // Build a lookup: prokerId -> departmentId
  const prokerDeptMap = useMemo(() => {
    const map: Record<string, string> = {};
    prokers.forEach((p) => {
      map[p._id] = p.departmentId;
    });
    return map;
  }, [prokers]);

  // Filter proposals by department scope
  const proposals = useMemo(() => {
    if (isBPH) return allProposals;
    if (!userDeptId) return allProposals; // Fallback: show all if dept unknown
    return allProposals.filter((prop) => {
      const prokerDeptId = prokerDeptMap[prop.prokerId];
      return prokerDeptId === userDeptId;
    });
  }, [allProposals, isBPH, userDeptId, prokerDeptMap]);

  // Filter ledger by department scope (SPJ entries are linked to prokerId)
  const ledgerEntries = useMemo(() => {
    if (isBPH) return allLedgerEntries;
    if (!userDeptId) return allLedgerEntries;
    return allLedgerEntries.filter((tx: any) => {
      const prokerDeptId = prokerDeptMap[tx.prokerId];
      return prokerDeptId === userDeptId;
    });
  }, [allLedgerEntries, isBPH, userDeptId, prokerDeptMap]);

  // Filter RKAT allocations: only show user's own department
  const visibleAllocations = useMemo(() => {
    if (isBPH) return allocations;
    if (!userDeptId) return [];
    return allocations.filter((a) => a.departmentId === userDeptId);
  }, [allocations, isBPH, userDeptId]);

  const getProkerTitle = (prokerId: string) => {
    return (
      prokers.find((p) => p._id === prokerId)?.title || "Program Kerja Terkait"
    );
  };

  const createMutation = useMutation({
    mutationFn: (newProposal: Partial<Proposal>) =>
      financeService.createProposal(newProposal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ims-proposals"] });
      setIsFormOpen(false);
      alert("Proposal berhasil diajukan!");
    },
  });

  const filteredProposals = proposals.filter((prop) =>
    prop.title.toLowerCase().includes(search.toLowerCase()),
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "Submitted":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "Revision":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  // Soft overspending warnings computation (only for visible allocations)
  const warningDepts = visibleAllocations.filter(
    (dept) => dept.usagePercent >= 85,
  );

  // Stats (scoped to visible proposals only) — use actual proker budgets, not hardcoded multiplier
  const totalBudgetProposed = useMemo(() => {
    const prokerIdsInScope = new Set(proposals.map((p) => p.prokerId));
    return prokers
      .filter((p) => prokerIdsInScope.has(p._id))
      .reduce((sum, p) => sum + (p.budget || 0), 0);
  }, [proposals, prokers]);

  const approvedBudget = useMemo(() => {
    const approvedProkerIds = new Set(
      proposals.filter((p) => p.status === "Approved").map((p) => p.prokerId),
    );
    return prokers
      .filter((p) => approvedProkerIds.has(p._id))
      .reduce((sum, p) => sum + (p.budget || 0), 0);
  }, [proposals, prokers]);

  const pendingProposalsCount = proposals.filter(
    (p) => p.status === "Submitted",
  ).length;

  // Derive department name dynamically from allocation data or proker data
  const scopeDeptName = useMemo(() => {
    if (!userDeptId) return null;
    // Try from allocation data first (has departmentName)
    const fromAlloc = allocations.find((a) => a.departmentId === userDeptId);
    if (fromAlloc) return fromAlloc.departmentName;
    // Fallback: use user.department field if it's a string name
    if (user?.department && user.department !== userDeptId)
      return user.department;
    return "Departemen Anda";
  }, [userDeptId, allocations, user?.department]);

  return (
    <>
      <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 ease-out print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-2">
              <Coins className="h-7 w-7 text-[#10b981]" />
              Transparansi & Anggaran Keuangan
            </h1>
            <p className="mt-1 text-xs text-[#a9b49c]">
              Kelola pagu RKAT, pencairan proposal dana kegiatan, dan asistensi
              validasi SPJ.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => window.print()}
              className="border-white/10 bg-white/5 text-white gap-2 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              Cetak PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/finance/lpj")}
              className="border-white/10 bg-white/5 text-white gap-2 cursor-pointer"
            >
              <Receipt className="w-4 h-4" />
              Manajemen LPJ
            </Button>
            <Button
              onClick={() => setIsFormOpen(true)}
              className="bg-[#10b981] hover:bg-[#a7f3d0] text-[#091c11] gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Ajukan Proposal
            </Button>
          </div>
        </div>

        {/* Department Scope Indicator */}
        {isBPH ? (
          <div className="p-3.5 rounded-xl border border-[#10b981]/20 bg-[#10b981]/5 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#10b981]/10">
              <ShieldCheck className="h-4 w-4 text-[#10b981]" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">
                Akses Keuangan Penuh — BPH / Admin
              </p>
              <p className="text-[10px] text-[#a9b49c] mt-0.5">
                Anda memiliki akses melihat data keuangan seluruh departemen BEM
                FT UNESA.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl border border-blue-500/20 bg-blue-500/5 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Building2 className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">
                Scope Departemen: {scopeDeptName || "Tidak Diketahui"}
              </p>
              <p className="text-[10px] text-[#a9b49c] mt-0.5">
                Anda hanya dapat melihat data keuangan program kerja milik
                departemen Anda. Hubungi BPH untuk akses lintas departemen.
              </p>
            </div>
          </div>
        )}

        {/* Dynamic Overspending Alert Banner */}
        {warningDepts.length > 0 && (
          <Alert className="border-yellow-800/40 bg-yellow-950/20 text-yellow-200 space-y-1">
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
            <AlertTitle className="font-bold text-white text-xs">
              Peringatan Overspending Anggaran!
            </AlertTitle>
            <AlertDescription className="text-[11px] leading-relaxed text-[#a9b49c]">
              {isBPH ? "Beberapa departemen" : "Departemen Anda"} terdeteksi
              telah menggunakan &gt;= 85% pagu rencana anggarannya:
              <ul className="list-disc list-inside mt-1 font-mono text-yellow-300">
                {warningDepts.map((d) => (
                  <li key={d.departmentId}>
                    Departemen {d.departmentName} ({d.department}) :{" "}
                    {d.usagePercent}% terpakai
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Widgets */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: isBPH
                ? "Total Anggaran Diajukan"
                : `Anggaran Diajukan (${scopeDeptName || "Dept"})`,
              value: new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                maximumFractionDigits: 0,
              }).format(totalBudgetProposed),
              icon: Coins,
              color: "text-blue-400",
              bg: "bg-blue-950/20 border-blue-800/20",
            },
            {
              title: isBPH
                ? "Anggaran Dicairkan"
                : `Dicairkan (${scopeDeptName || "Dept"})`,
              value: new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                maximumFractionDigits: 0,
              }).format(approvedBudget),
              icon: Wallet,
              color: "text-emerald-400",
              bg: "bg-emerald-950/20 border-emerald-800/20",
            },
            {
              title: "Proposal Menunggu Validasi",
              value: `${pendingProposalsCount} Pengajuan`,
              icon: FileText,
              color: "text-amber-400",
              bg: "bg-amber-950/20 border-amber-800/20",
            },
          ].map((stat, i) => (
            <Card
              key={i}
              className={`border bg-white/5 backdrop-blur-md ${stat.bg}`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-bold text-[#a9b49c]">
                  {stat.title}
                </CardTitle>
                <div className="p-1.5 rounded bg-white/5">
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                {isProposalsLoading ? (
                  <div className="h-8 w-24 bg-white/5 animate-pulse rounded" />
                ) : (
                  <div className="text-2xl font-black text-white">
                    {stat.value}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Department RKAT Allocation Monitor — BPH sees all, others see own dept only */}
        {(isBPH || visibleAllocations.length > 0) && (
          <Card className="border-white/10 bg-white/5 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-white flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-[#10b981]" />
                {isBPH
                  ? "Alokasi Anggaran Seluruh Departemen (RKAT)"
                  : `Alokasi Anggaran — Dept. ${scopeDeptName}`}
              </CardTitle>
              <CardDescription className="text-[10px] text-[#a9b49c]">
                {isBPH
                  ? "Presentasi penggunaan anggaran oleh masing-masing departemen penanggung jawab"
                  : "Presentasi penggunaan anggaran departemen Anda"}
              </CardDescription>
            </CardHeader>
            <CardContent
              className={`grid gap-4 ${isBPH ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-1 max-w-md"}`}
            >
              {isDeptLoading ? (
                <p className="text-xs text-[#a9b49c]">Memuat data RKAT...</p>
              ) : visibleAllocations.length === 0 ? (
                <p className="text-xs text-[#a9b49c] italic">
                  Data alokasi departemen tidak tersedia.
                </p>
              ) : (
                visibleAllocations.map((alloc) => (
                  <div
                    key={alloc.departmentId}
                    className="p-3.5 rounded-lg border border-white/5 bg-white/5 space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-black text-white">
                          {alloc.departmentName}
                        </p>
                        <p className="text-[9px] text-[#a9b49c]">
                          {alloc.department}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[9px] ${
                          alloc.usagePercent >= 85
                            ? "bg-red-950/20 text-red-300 border-red-800/40"
                            : "bg-[#10b981]/10 text-white border-white/10"
                        }`}
                      >
                        {alloc.usagePercent}% Terpakai
                      </Badge>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 overflow-hidden rounded-full">
                      <div
                        className={`h-full rounded-full ${alloc.usagePercent >= 85 ? "bg-red-500" : "bg-[#10b981]"}`}
                        style={{ width: `${alloc.usagePercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-[#a9b49c]">
                      <span>
                        Realisasi: Rp{" "}
                        {new Intl.NumberFormat("id-ID").format(
                          alloc.approvedAmount,
                        )}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {/* Grid: Proposal & Ledger */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: Proposals */}
          <Card className="lg:col-span-2 border-white/10 bg-white/5 backdrop-blur-md">
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-sm font-bold text-white flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-[#10b981]" />
                    {isBPH
                      ? "Semua Pengajuan Proposal Anggaran"
                      : `Proposal Anggaran — Dept. ${scopeDeptName}`}
                  </CardTitle>
                  <CardDescription className="text-[10px] text-[#a9b49c]">
                    {isBPH
                      ? "Status validasi proposal dan alokasi dana kegiatan seluruh BEM"
                      : "Status validasi proposal dan alokasi dana kegiatan departemen Anda"}
                  </CardDescription>
                </div>
                <div className="relative max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#a9b49c]" />
                  <Input
                    placeholder="Cari proposal..."
                    className="pl-8 bg-white/5 border-white/10 text-xs text-white"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="border-white/10">
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-white text-xs">
                      Judul Proposal
                    </TableHead>
                    <TableHead className="text-white text-xs">
                      Program Kerja
                    </TableHead>
                    <TableHead className="text-white text-xs">Status</TableHead>
                    <TableHead className="text-white text-xs text-right">
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isProposalsLoading ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center py-8 text-xs text-[#a9b49c]"
                      >
                        Memuat...
                      </TableCell>
                    </TableRow>
                  ) : filteredProposals.length > 0 ? (
                    filteredProposals.map((prop) => (
                      <TableRow
                        key={prop._id}
                        className="border-white/5 hover:bg-white/5"
                      >
                        <TableCell className="font-semibold text-white text-xs">
                          {prop.title}
                        </TableCell>
                        <TableCell className="text-xs text-[#a9b49c]">
                          {getProkerTitle(prop.prokerId)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-[9px] ${getStatusColor(prop.status)}`}
                          >
                            {prop.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-[#a9b49c] hover:text-white"
                              onClick={() =>
                                router.push(`/finance/proposal/${prop._id}`)
                              }
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="h-32 text-center text-[#a9b49c] text-xs italic"
                      >
                        {search
                          ? "Tidak ada proposal yang cocok dengan pencarian."
                          : isBPH
                            ? "Belum ada proposal yang diajukan."
                            : `Belum ada proposal dari Departemen ${scopeDeptName}.`}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Right: Append-Only Immutable Transaction Ledger */}
          <Card className="border-white/10 bg-white/5 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-white flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-[#10b981]" />
                {isBPH
                  ? "Buku Besar Ledger (Append-Only)"
                  : `Ledger — Dept. ${scopeDeptName}`}
              </CardTitle>
              <CardDescription className="text-[10px] text-[#a9b49c]">
                {isBPH
                  ? "Log transaksi pengeluaran (SPJ) bersifat permanen & audit-safe."
                  : "Log transaksi pengeluaran departemen Anda."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[480px] overflow-y-auto">
              {isLedgerLoading ? (
                <p className="text-xs text-[#a9b49c]">
                  Memuat log transaksi...
                </p>
              ) : ledgerEntries.length === 0 ? (
                <div className="text-center py-12 text-[#a9b49c] text-xs italic border border-dashed border-white/5 rounded-lg bg-white/5">
                  {isBPH
                    ? "Belum ada transaksi terekam dalam ledger."
                    : `Belum ada transaksi dari Departemen ${scopeDeptName}.`}
                </div>
              ) : (
                ledgerEntries.map((tx: any) => (
                  <div
                    key={tx._id}
                    className="p-3 rounded-lg border border-white/5 bg-[#091c11] space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-1.5">
                        <Lock className="h-3 w-3 text-emerald-400" />
                        <span className="text-[10px] font-black text-white truncate max-w-[120px]">
                          {tx.description}
                        </span>
                      </div>
                      <span className="text-[11px] font-black text-red-400">
                        -Rp {new Intl.NumberFormat("id-ID").format(tx.amount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[9px] text-[#a9b49c]">
                      <span>
                        {new Date(
                          tx.transactionDate || tx.createdAt,
                        ).toLocaleDateString("id-ID")}
                      </span>
                      {tx.receiptUrl && (
                        <a
                          href={tx.receiptUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-400 hover:underline"
                        >
                          Bukti Receipt
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <ProposalFormDialog
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSubmit={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
        />
      </div>

      {/* ================= PRINT REPORT LAYOUT ================= */}
      <div className="hidden print:block bg-white text-black p-8 font-serif leading-relaxed text-sm w-full min-h-screen">
        {/* Kop Surat BEM FT UNESA */}
        <div className="text-center border-b-4 border-double border-black pb-4 mb-6">
          <h2 className="text-sm font-bold uppercase tracking-wider">
            KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI
          </h2>
          <h2 className="text-xs font-bold uppercase">
            UNIVERSITAS NEGERI SURABAYA
          </h2>
          <h2 className="text-xs font-bold uppercase">FAKULTAS TEKNIK</h2>
          <h1 className="text-lg font-black uppercase my-1 tracking-wide">
            BADAN EKSEKUTIF MAHASISWA
          </h1>
          <p className="text-[9px] italic text-gray-600">
            Sekretariat: Gedung Kemahasiswaan FT UNESA, Kampus Ketintang,
            Surabaya 60231 | Email: bemft@unesa.ac.id
          </p>
        </div>

        {/* Judul Laporan */}
        <div className="text-center mb-6">
          <h3 className="text-sm font-bold uppercase underline">
            LAPORAN REKAPITULASI KEUANGAN & ANGGARAN
          </h3>
          <p className="text-[10px] text-gray-700 mt-1">
            Kabinet Danadyaksa 2026 — BEM FT UNESA
          </p>
        </div>

        {/* Metadata */}
        <table className="w-full text-[11px] mb-6 border-none">
          <tbody>
            <tr>
              <td className="font-bold py-1 w-32 text-left">Lingkup Data</td>
              <td className="py-1 text-left">
                :{" "}
                {isBPI
                  ? "BEM FT UNESA (Seluruh Departemen)"
                  : `Departemen ${scopeDeptName || "Tidak Diketahui"}`}
              </td>
              <td className="font-bold py-1 w-32 text-right">Tanggal Cetak</td>
              <td className="py-1 pl-2 text-left">
                :{" "}
                {new Date().toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </td>
            </tr>
            <tr>
              <td className="font-bold py-1 text-left">Dicetak Oleh</td>
              <td className="py-1 text-left">
                : {user?.name || "Fungsionaris BEM"} (
                {user?.role || "Fungsionaris"})
              </td>
              <td className="font-bold py-1 w-32 text-right">Status Akun</td>
              <td className="py-1 pl-2 text-left">: Aktif / Terverifikasi</td>
            </tr>
          </tbody>
        </table>

        {/* Ringkasan Anggaran */}
        <div className="mb-6">
          <h4 className="font-bold text-[11px] uppercase bg-gray-100 p-1.5 mb-2 border border-gray-300">
            I. Ringkasan Pagu Anggaran (RKAT)
          </h4>
          <table className="w-full text-[11px] border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50 text-center font-bold">
                <th className="border border-gray-300 p-2">
                  Rencana Anggaran (Proposed)
                </th>
                <th className="border border-gray-300 p-2">
                  Pagu Disetujui (Approved)
                </th>
                <th className="border border-gray-300 p-2">
                  Total Dana Terserap (Used/SPJ)
                </th>
                <th className="border border-gray-300 p-2">
                  Sisa Anggaran Tersedia
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="text-center font-bold">
                <td className="border border-gray-300 p-2">
                  Rp{" "}
                  {new Intl.NumberFormat("id-ID").format(totalBudgetProposed)}
                </td>
                <td className="border border-gray-300 p-2">
                  Rp {new Intl.NumberFormat("id-ID").format(approvedBudget)}
                </td>
                <td className="border border-gray-300 p-2">
                  Rp{" "}
                  {new Intl.NumberFormat("id-ID").format(
                    ledgerEntries.reduce(
                      (sum, tx) => sum + (tx.amount || 0),
                      0,
                    ),
                  )}
                </td>
                <td className="border border-gray-300 p-2 text-emerald-700">
                  Rp{" "}
                  {new Intl.NumberFormat("id-ID").format(
                    Math.max(
                      0,
                      approvedBudget -
                        ledgerEntries.reduce(
                          (sum, tx) => sum + (tx.amount || 0),
                          0,
                        ),
                    ),
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Daftar Proposal */}
        <div className="mb-6 break-inside-avoid">
          <h4 className="font-bold text-[11px] uppercase bg-gray-100 p-1.5 mb-2 border border-gray-300">
            II. Rekapitulasi Proposal Kegiatan & Anggaran
          </h4>
          <table className="w-full text-[11px] border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50 text-left font-bold">
                <th className="border border-gray-300 p-2 w-8 text-center">
                  No
                </th>
                <th className="border border-gray-300 p-2">Judul Proposal</th>
                <th className="border border-gray-300 p-2">
                  Program Kerja Terkait
                </th>
                <th className="border border-gray-300 p-2 w-28 text-center">
                  Status
                </th>
                <th className="border border-gray-300 p-2 w-32 text-right">
                  Pagu RKAT
                </th>
              </tr>
            </thead>
            <tbody>
              {proposals.length > 0 ? (
                proposals.map((prop, idx) => {
                  const prokerObj = prokers.find(
                    (p) => p._id === prop.prokerId,
                  );
                  return (
                    <tr key={prop._id}>
                      <td className="border border-gray-300 p-2 text-center">
                        {idx + 1}
                      </td>
                      <td className="border border-gray-300 p-2 font-bold">
                        {prop.title}
                      </td>
                      <td className="border border-gray-300 p-2">
                        {prokerObj?.title || "Umum / Pengurus Inti"}
                      </td>
                      <td className="border border-gray-300 p-2 text-center">
                        {prop.status}
                      </td>
                      <td className="border border-gray-300 p-2 text-right">
                        Rp{" "}
                        {new Intl.NumberFormat("id-ID").format(
                          prokerObj?.budget || 0,
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="border border-gray-300 p-4 text-center italic text-gray-500"
                  >
                    Tidak ada pengajuan proposal.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Buku Besar Kas / SPJ */}
        <div className="mb-8 break-inside-avoid">
          <h4 className="font-bold text-[11px] uppercase bg-gray-100 p-1.5 mb-2 border border-gray-300">
            III. Buku Besar Realisasi Pembelanjaan (Ledger SPJ)
          </h4>
          <table className="w-full text-[11px] border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50 text-left font-bold">
                <th className="border border-gray-300 p-2 w-8 text-center">
                  No
                </th>
                <th className="border border-gray-300 p-2">
                  Deskripsi Transaksi SPJ
                </th>
                <th className="border border-gray-300 p-2">Terkait Proker</th>
                <th className="border border-gray-300 p-2 w-28 text-center">
                  Tanggal Transaksi
                </th>
                <th className="border border-gray-300 p-2 w-32 text-right">
                  Jumlah Realisasi
                </th>
              </tr>
            </thead>
            <tbody>
              {ledgerEntries.length > 0 ? (
                ledgerEntries.map((tx: any, idx: number) => (
                  <tr key={tx._id}>
                    <td className="border border-gray-300 p-2 text-center">
                      {idx + 1}
                    </td>
                    <td className="border border-gray-300 p-2 font-bold">
                      {tx.description}
                    </td>
                    <td className="border border-gray-300 p-2">
                      {getProkerTitle(tx.prokerId)}
                    </td>
                    <td className="border border-gray-300 p-2 text-center">
                      {new Date(
                        tx.transactionDate || tx.createdAt,
                      ).toLocaleDateString("id-ID")}
                    </td>
                    <td className="border border-gray-300 p-2 text-right text-red-600 font-bold">
                      -Rp {new Intl.NumberFormat("id-ID").format(tx.amount)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="border border-gray-300 p-4 text-center italic text-gray-500"
                  >
                    Belum ada catatan realisasi transaksi (SPJ).
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Tanda Tangan */}
        <div className="flex justify-between text-xs mt-12 break-inside-avoid">
          <div className="text-center w-48">
            <p>Mengetahui,</p>
            <p className="font-bold">Ketua BEM FT UNESA</p>
            <div className="h-16 flex items-center justify-center">
              <span className="text-[10px] text-gray-400 italic">
                [Tanda Tangan Elektronik]
              </span>
            </div>
            <p className="font-bold underline">Diha Anfeu Nio Julaynda</p>
            <p className="text-[9px]">NIM. 23051204212</p>
          </div>
          <div className="text-center w-48">
            <p>
              Surabaya,{" "}
              {new Date().toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
            <p className="font-bold">Bendahara Umum BEM FT</p>
            <div className="h-16 flex items-center justify-center">
              <span className="text-[10px] text-gray-400 italic">
                [Tanda Tangan Elektronik]
              </span>
            </div>
            <p className="font-bold underline">Elok Faiqoh</p>
            <p className="text-[9px]">NIM. 23051204291</p>
          </div>
        </div>
      </div>
    </>
  );
}
