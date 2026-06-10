"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { financeService, RABItem } from "@/lib/api/finance";
import { prokerService } from "@/lib/api/proker";
import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Check,
  X,
  Download,
  FileText,
  ClipboardList,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

export default function ProposalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;
  const { user } = useAuth();

  // Queries
  const { data: proposalResponse, isLoading: isProposalLoading } = useQuery({
    queryKey: ["ims-proposal-detail", id],
    queryFn: async () => {
      const res = await financeService.listProposals();
      const found = res.data.find((p) => p._id === id);
      if (!found) throw new Error("Proposal tidak ditemukan");
      return found;
    },
  });

  const proposal = proposalResponse;

  const { data: prokerResponse } = useQuery({
    queryKey: ["ims-proposal-proker", proposal?.prokerId],
    queryFn: async () => {
      const res = await prokerService.list();
      return res.data.find((p) => p._id === proposal?.prokerId);
    },
    enabled: !!proposal?.prokerId,
  });

  const { data: rabItemsResponse, isLoading: isRabLoading } = useQuery({
    queryKey: ["ims-proposal-rab-items", id],
    queryFn: () => financeService.listRABItems(id),
    enabled: !!id,
  });

  const rabItems = rabItemsResponse?.data || [];

  // Mutations
  const approveMutation = useMutation({
    mutationFn: () => financeService.approveProposal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ims-proposal-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["ims-proposals"] });
      alert("Proposal berhasil disetujui!");
    },
  });

  const updateItemStatusMutation = useMutation({
    mutationFn: ({
      itemId,
      status,
    }: {
      itemId: string;
      status: "Approved" | "Rejected";
    }) => financeService.updateRABItemStatus(itemId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["ims-proposal-rab-items", id],
      });
      alert("Status item berhasil diubah!");
    },
    onError: (err: any) => {
      alert(err.message || "Gagal mengubah status item.");
    },
  });

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

  const getRabItemBadgeColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-emerald-950/20 text-emerald-300 border-emerald-800/40";
      case "Rejected":
        return "bg-red-950/20 text-red-300 border-red-800/40";
      default:
        return "bg-yellow-950/20 text-yellow-300 border-yellow-800/40";
    }
  };

  const isBendahara =
    user?.role === "Bendahara" || user?.role === "Super Admin";

  const totalCalculatedBudget = rabItems.reduce(
    (sum, item) => sum + (item.totalPrice || 0),
    0,
  );

  if (isProposalLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-r-transparent"></div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="text-center py-12 space-y-4">
        <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
        <h2 className="text-xl font-bold">Proposal Tidak Ditemukan</h2>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 ease-out">
      {/* Top Header */}
      <div className="flex flex-col gap-4">
        <Link
          href="/finance"
          className="flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Kembali ke Manajemen
          Keuangan
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                {proposal.title}
              </h1>
              <Badge
                variant="outline"
                className={getStatusColor(proposal.status)}
              >
                {proposal.status}
              </Badge>
            </div>
            <p className="mt-2 text-muted-foreground text-sm flex items-center gap-1.5">
              <ClipboardList className="w-4 h-4 text-accent" /> Program Kerja:{" "}
              {prokerResponse?.title || "Program Kerja Terkait"}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {proposal.fileUrl && (
              <Button
                variant="outline"
                className="border-border/50 bg-card text-white hover:text-white"
                onClick={() => window.open(proposal.fileUrl, "_blank")}
              >
                <Download className="w-4 h-4 mr-2" /> Download Proposal (PDF)
              </Button>
            )}
            {proposal.status === "Submitted" && isBendahara && (
              <>
                <Button
                  variant="outline"
                  className="border-red-800/40 hover:bg-red-950/20 text-red-300 hover:text-red-200"
                  onClick={() => alert("Revisi diajukan!")}
                >
                  <X className="w-4 h-4 mr-2" /> Tolak/Revisi
                </Button>
                <Button
                  className="bg-[#10b981] hover:bg-[#a7f3d0] text-[#091c11] font-bold shadow-lg"
                  onClick={() => approveMutation.mutate()}
                  disabled={approveMutation.isPending}
                >
                  <Check className="w-4 h-4 mr-2" /> Setujui Proposal
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Info card & RAB items */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-white/10 bg-white/5 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-white">
                Keperluan Pengajuan Dana
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed text-sm whitespace-pre-line">
                {proposal.description ||
                  "Tidak ada deskripsi rinci pengajuan dana kegiatan."}
              </p>
            </CardContent>
          </Card>

          {/* Rincian Anggaran Belanja Table with item level approvals */}
          <Card className="border-white/10 bg-white/5 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-white">
                Rincian Anggaran Belanja (RAB)
              </CardTitle>
              <CardDescription className="text-[10px] text-[#a9b49c]">
                Rincian sub-dana pengeluaran kegiatan yang diajukan dengan
                kontrol asisten parsial.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="rounded-md border border-white/5 overflow-hidden">
                <Table>
                  <TableHeader className="border-white/10">
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="text-white text-xs">
                        Nama Barang/Keperluan
                      </TableHead>
                      <TableHead className="text-center text-white text-xs">
                        Qty
                      </TableHead>
                      <TableHead className="text-right text-white text-xs">
                        Satuan
                      </TableHead>
                      <TableHead className="text-right text-white text-xs">
                        Total
                      </TableHead>
                      <TableHead className="text-center text-white text-xs">
                        Status
                      </TableHead>
                      {isBendahara && proposal.status === "Submitted" && (
                        <TableHead className="text-right text-white text-xs">
                          Aksi Asistensi
                        </TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isRabLoading ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-8 text-xs text-[#a9b49c]"
                        >
                          Memuat rincian anggaran...
                        </TableCell>
                      </TableRow>
                    ) : rabItems.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-8 text-xs text-[#a9b49c] italic"
                        >
                          Tidak ada item RAB ditemukan dalam proposal ini.
                        </TableCell>
                      </TableRow>
                    ) : (
                      rabItems.map((item) => (
                        <TableRow
                          key={item._id}
                          className="border-white/5 hover:bg-white/5"
                        >
                          <TableCell className="font-semibold text-white text-xs">
                            {item.itemName}
                          </TableCell>
                          <TableCell className="text-center text-xs text-white">
                            {item.quantity} unit
                          </TableCell>
                          <TableCell className="text-right text-xs text-[#a9b49c]">
                            Rp{" "}
                            {new Intl.NumberFormat("id-ID").format(
                              item.pricePerUnit,
                            )}
                          </TableCell>
                          <TableCell className="text-right text-xs text-white font-bold">
                            Rp{" "}
                            {new Intl.NumberFormat("id-ID").format(
                              item.totalPrice,
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant="outline"
                              className={`text-[8px] py-0 ${getRabItemBadgeColor(item.status)}`}
                            >
                              {item.status === "Planned"
                                ? "Menunggu"
                                : item.status === "Approved"
                                  ? "Setuju"
                                  : "Ditolak"}
                            </Badge>
                          </TableCell>
                          {isBendahara && proposal.status === "Submitted" && (
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1.5">
                                <Button
                                  size="xs"
                                  onClick={() =>
                                    updateItemStatusMutation.mutate({
                                      itemId: item._id,
                                      status: "Approved",
                                    })
                                  }
                                  disabled={updateItemStatusMutation.isPending}
                                  className="h-6 w-6 p-0 bg-emerald-600 hover:bg-emerald-500 text-white"
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="xs"
                                  onClick={() =>
                                    updateItemStatusMutation.mutate({
                                      itemId: item._id,
                                      status: "Rejected",
                                    })
                                  }
                                  disabled={updateItemStatusMutation.isPending}
                                  className="h-6 w-6 p-0 bg-red-600 hover:bg-red-500 text-white"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Ceilings Check */}
        <div className="space-y-6">
          <Card className="border-white/10 bg-white/5 backdrop-blur-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-white flex items-center gap-1">
                <ShieldCheck className="h-4 w-4 text-[#10b981]" />
                Verifikasi Pagu Anggaran
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-[10px] text-[#a9b49c] leading-relaxed">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span>Total RKAT Departemen:</span>
                <span className="font-bold text-white">Rp 15.000.000</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span>Telah Dicairkan:</span>
                <span className="font-bold text-white">Rp 4.500.000</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span>Sisa Alokasi Maks:</span>
                <span className="font-bold text-white">Rp 10.500.000</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2 text-[#a7f3d0] font-bold">
                <span>Total Pengajuan RAB:</span>
                <span>
                  Rp{" "}
                  {new Intl.NumberFormat("id-ID").format(totalCalculatedBudget)}
                </span>
              </div>
              {totalCalculatedBudget <= 10500000 ? (
                <div className="p-3 bg-emerald-950/20 border border-emerald-800/40 text-emerald-200 rounded-lg font-medium text-center text-[10px]">
                  Aman ✓ Alokasi dana tidak melebihi sisa pagu anggaran
                  departemen.
                </div>
              ) : (
                <div className="p-3 bg-red-950/20 border border-red-800/40 text-red-200 rounded-lg font-medium text-center text-[10px]">
                  Peringatan ⚠️ Alokasi dana melebihi sisa pagu anggaran
                  departemen.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
