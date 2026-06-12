"use client";

import { useQuery } from "@tanstack/react-query";
import { financeService } from "@/lib/api/finance";
import { prokerService } from "@/lib/api/proker";
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
  FileCheck,
  FileX,
  Download,
  ArrowLeft,
  RefreshCw,
  Eye,
} from "lucide-react";
import Link from "next/link";

export default function LPJPage() {
  const { data: lpjResponse, isLoading: isLpjLoading } = useQuery({
    queryKey: ["ims-lpj"],
    queryFn: () => financeService.listLPJ(),
  });

  const { data: prokerResponse } = useQuery({
    queryKey: ["ims-proker-lpj-lookup"],
    queryFn: () => prokerService.list(),
  });

  const lpjList = lpjResponse?.data || [];
  const prokers = prokerResponse?.data || [];

  const getProkerTitle = (prokerId: string) => {
    return (
      prokers.find((p) => p._id === prokerId)?.title || "Program Kerja Terkait"
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Validated":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
            Valid
          </Badge>
        );
      case "Pending":
        return (
          <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
            Diproses
          </Badge>
        );
      case "Revision":
        return (
          <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">
            Revisi
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-500/10 text-slate-500 border-slate-500/20">
            Draft
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 ease-out">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link
          href="/finance"
          className="flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Kembali ke Keuangan
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Laporan Pertanggungjawaban (LPJ)
            </h1>
            <p className="mt-2 text-muted-foreground text-sm">
              Validasi bukti SPJ, pencocokan alokasi RAB vs Realisasi, dan arsip
              LPJ resmi BEM FT.
            </p>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <Card className="border-border/50 bg-card/40 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Daftar Pengajuan Validasi LPJ</CardTitle>
          <CardDescription>
            Semua berkas laporan pertanggungjawaban kegiatan fungsionaris BEM
            FT.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border/50 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-[350px]">Program Kerja</TableHead>
                  <TableHead>Status Dokumen</TableHead>
                  <TableHead>Tanggal Pengajuan</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLpjLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="h-4 w-48 bg-muted animate-pulse rounded" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-16 bg-muted animate-pulse rounded ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : lpjList.length > 0 ? (
                  lpjList.map((lpj) => (
                    <TableRow
                      key={lpj._id}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      <TableCell className="font-semibold text-foreground">
                        {getProkerTitle(lpj.prokerId)}
                      </TableCell>
                      <TableCell>{getStatusBadge(lpj.status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(lpj.createdAt).toLocaleDateString("id-ID")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {lpj.fileUrl && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-accent"
                              onClick={() => window.open(lpj.fileUrl, "_blank")}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-32 text-center text-muted-foreground italic"
                    >
                      Belum ada laporan pertanggungjawaban (LPJ) yang diajukan.
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
