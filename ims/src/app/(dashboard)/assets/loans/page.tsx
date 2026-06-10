"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { assetsService, AssetLoan } from "@/lib/api/assets";
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
  ArrowRightLeft,
  Check,
  X,
  Package,
  Calendar,
  CheckCircle,
  Clock,
  User,
  Undo2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function AssetLoansPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Fetch all loans
  const { data: loansResponse, isLoading } = useQuery({
    queryKey: ["ims-asset-loans"],
    queryFn: () => assetsService.listLoans(),
  });

  const loans = loansResponse?.data || [];

  // Update loan status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({
      loanId,
      status,
    }: {
      loanId: string;
      status: AssetLoan["status"];
    }) => assetsService.updateLoanStatus(loanId, status),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["ims-asset-loans"] });
      setSuccessMsg(res.message || "Status peminjaman berhasil diperbarui!");
      setTimeout(() => setSuccessMsg(""), 4000);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || "Gagal mengubah status peminjaman.");
      setTimeout(() => setErrorMsg(""), 4000);
    },
  });

  const handleUpdateStatus = (loanId: string, status: AssetLoan["status"]) => {
    updateStatusMutation.mutate({ loanId, status });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Requested":
        return (
          <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 gap-1 text-[10px] uppercase font-mono">
            <Clock className="w-3 h-3" /> Diproses
          </Badge>
        );
      case "Approved":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 gap-1 text-[10px] uppercase font-mono">
            <CheckCircle className="w-3 h-3" /> Disetujui
          </Badge>
        );
      case "Borrowed":
        return (
          <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 gap-1 text-[10px] uppercase font-mono">
            <Package className="w-3 h-3" /> Dipinjam
          </Badge>
        );
      case "Returned":
        return (
          <Badge
            variant="outline"
            className="bg-muted/20 text-muted-foreground border-border gap-1 text-[10px] uppercase font-mono"
          >
            <Undo2 className="w-3 h-3" /> Dikembalikan
          </Badge>
        );
      case "Rejected":
        return (
          <Badge className="bg-red-500/10 text-red-400 border-red-500/20 gap-1 text-[10px] uppercase font-mono">
            <X className="w-3 h-3" /> Ditolak
          </Badge>
        );
      default:
        return null;
    }
  };

  const isSecretaryOrAdmin =
    user?.role === "Super Admin" || user?.role === "Sekretaris";

  // Filter loans: regular staff can only see their own loan requests
  const filteredLoans = isSecretaryOrAdmin
    ? loans
    : loans.filter((loan) => {
        const borrower = loan.borrowerId as any;
        return borrower?._id === user?.id;
      });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 ease-out">
      {/* Top Navigation */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push("/assets")}
          className="border-border/50 bg-background/50 hover:bg-muted/20 h-9 w-9"
        >
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </Button>
        <div>
          <span className="text-xs font-semibold text-accent uppercase tracking-wider">
            Inventarisasi & Logistik BEM FT
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight mt-0.5">
            Log Peminjaman Aset
          </h1>
        </div>
      </div>

      {/* Dynamic Notifications */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium flex items-center gap-2">
          <X className="w-4 h-4" />
          {errorMsg}
        </div>
      )}

      {/* Table Card */}
      <Card className="border-border/50 bg-card/40 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-accent" />
            {isSecretaryOrAdmin
              ? "Daftar Semua Permohonan & Log"
              : "Riwayat Peminjaman Saya"}
          </CardTitle>
          <CardDescription>
            {isSecretaryOrAdmin
              ? "Tinjau dan kelola seluruh birokrasi peminjaman barang sekretariat fungsionaris."
              : "Daftar permohonan peminjaman aset yang Anda ajukan untuk kegiatan program kerja."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-border/50 overflow-hidden bg-background/30">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-[200px]">Barang / Aset</TableHead>
                  {isSecretaryOrAdmin && <TableHead>Peminjam</TableHead>}
                  <TableHead className="text-center">Jumlah</TableHead>
                  <TableHead>Tanggal Pinjam</TableHead>
                  <TableHead>Estimasi Kembali</TableHead>
                  <TableHead>Status</TableHead>
                  {isSecretaryOrAdmin && (
                    <TableHead className="text-right">Aksi</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                      </TableCell>
                      {isSecretaryOrAdmin && (
                        <TableCell>
                          <div className="h-4 w-28 bg-muted animate-pulse rounded" />
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="h-4 w-8 bg-muted animate-pulse rounded mx-auto" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                      </TableCell>
                      {isSecretaryOrAdmin && (
                        <TableCell>
                          <div className="h-4 w-12 bg-muted animate-pulse rounded ml-auto" />
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : filteredLoans.length > 0 ? (
                  filteredLoans.map((loan) => {
                    const asset = loan.assetId as any;
                    const borrower = loan.borrowerId as any;

                    return (
                      <TableRow
                        key={loan._id}
                        className="hover:bg-muted/10 transition-colors"
                      >
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-sm text-foreground">
                              {asset?.name || "Aset Terhapus"}
                            </span>
                            <span className="text-[10px] font-mono text-muted-foreground">
                              {asset?.code || "-"}
                            </span>
                          </div>
                        </TableCell>

                        {isSecretaryOrAdmin && (
                          <TableCell>
                            <div className="flex flex-col gap-0.5">
                              <span className="font-semibold text-xs text-foreground">
                                {borrower?.name || "User"}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {borrower?.nim} • {borrower?.role}
                              </span>
                            </div>
                          </TableCell>
                        )}

                        <TableCell className="text-center font-bold text-sm text-foreground">
                          {loan.quantity} unit
                        </TableCell>

                        <TableCell>
                          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-[#10b981]" />
                            {new Date(loan.loanDate).toLocaleDateString(
                              "id-ID",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </span>
                        </TableCell>

                        <TableCell>
                          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-blue-400" />
                            {loan.returnDate ? (
                              new Date(loan.returnDate).toLocaleDateString(
                                "id-ID",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )
                            ) : (
                              <span className="text-muted-foreground italic text-[10px]">
                                Tidak diatur
                              </span>
                            )}
                          </span>
                        </TableCell>

                        <TableCell>{getStatusBadge(loan.status)}</TableCell>

                        {isSecretaryOrAdmin && (
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {loan.status === "Requested" && (
                                <>
                                  <Button
                                    size="icon"
                                    onClick={() =>
                                      handleUpdateStatus(loan._id, "Approved")
                                    }
                                    className="h-8 w-8 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg shrink-0"
                                    title="Setujui Peminjaman"
                                  >
                                    <Check className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    onClick={() =>
                                      handleUpdateStatus(loan._id, "Rejected")
                                    }
                                    className="h-8 w-8 bg-red-500 hover:bg-red-600 text-white rounded-lg shrink-0"
                                    title="Tolak Peminjaman"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                              {loan.status === "Approved" && (
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleUpdateStatus(loan._id, "Borrowed")
                                  }
                                  className="bg-blue-500 hover:bg-blue-600 text-white font-semibold text-xs h-8 px-2.5 rounded-lg shrink-0"
                                >
                                  Diserahkan
                                </Button>
                              )}
                              {loan.status === "Borrowed" && (
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleUpdateStatus(loan._id, "Returned")
                                  }
                                  className="bg-[#10b981] hover:bg-[#10b981]/90 text-white font-semibold text-xs h-8 px-2.5 rounded-lg shrink-0"
                                >
                                  Kembalikan
                                </Button>
                              )}
                              {(loan.status === "Returned" ||
                                loan.status === "Rejected") && (
                                <span className="text-[10px] text-muted-foreground font-mono italic pr-2">
                                  Arsip
                                </span>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={isSecretaryOrAdmin ? 7 : 5}
                      className="h-32 text-center text-muted-foreground italic text-sm"
                    >
                      Tidak ada log peminjaman aset yang tercatat.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
