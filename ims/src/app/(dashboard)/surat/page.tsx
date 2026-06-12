"use client";

import { useQuery } from "@tanstack/react-query";
import { documentsService } from "@/lib/api/documents";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  Plus,
  Search,
  FileText,
  FilePlus2,
  FileCheck2,
  FileX2,
  Download,
  Eye,
  Stamp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function SuratPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["ims-documents", typeFilter],
    queryFn: () =>
      documentsService.list(typeFilter !== "all" ? { type: typeFilter } : {}),
  });

  const documents = data?.data || [];

  const filteredDocs = documents.filter((doc) =>
    doc.title.toLowerCase().includes(search.toLowerCase()),
  );

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "Approved":
      case "Selesai":
        return {
          color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
          icon: <FileCheck2 className="w-3 h-3 mr-1" />,
          label: status,
        };
      case "Pending":
      case "Menunggu TTD Ketua":
        return {
          color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
          icon: <Stamp className="w-3 h-3 mr-1" />,
          label: "Menunggu TTD",
        };
      case "Menunggu ACC Sekretaris":
        return {
          color: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
          icon: <FileText className="w-3 h-3 mr-1" />,
          label: "Menunggu ACC Sekum",
        };
      case "Revisi Nomor Surat":
        return {
          color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
          icon: <FilePlus2 className="w-3 h-3 mr-1" />,
          label: "Upload Final",
        };
      case "Menunggu Asistensi":
        return {
          color: "bg-violet-500/10 text-violet-500 border-violet-500/20",
          icon: <Search className="w-3 h-3 mr-1" />,
          label: "Asistensi Kestari",
        };
      case "Rejected":
      case "Ditolak":
        return {
          color: "bg-red-500/10 text-red-500 border-red-500/20",
          icon: <FileX2 className="w-3 h-3 mr-1" />,
          label: "Ditolak",
        };
      default:
        return {
          color: "bg-slate-500/10 text-slate-500 border-slate-500/20",
          icon: <FilePlus2 className="w-3 h-3 mr-1" />,
          label: status || "Draft",
        };
    }
  };

  const getTypeLabel = (type: string) => {
    return type || "Lainnya";
  };

  const docTypes = ["Semua", "Surat Masuk", "Surat Keluar", "Proposal", "LPJ", "Lainnya"];

  // Stats
  const totalDocs = documents.length;
  const approvedDocs = documents.filter((d) => ["Approved", "Selesai"].includes(d.status)).length;
  const pendingDocs = documents.filter((d) => ["Pending", "Menunggu TTD Ketua", "Menunggu ACC Sekretaris", "Menunggu Asistensi", "Revisi Nomor Surat"].includes(d.status)).length;
  const draftDocs = documents.filter((d) => d.status === "Draft").length;

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 ease-out">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Persuratan & Arsip Digital
          </h1>
          <p className="mt-2 text-muted-foreground">
            Buat, kelola, dan arsipkan surat resmi BEM FT UNESA dengan penomoran
            otomatis.
          </p>
        </div>
        <Button
          onClick={() => router.push("/surat/new")}
          className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
        >
          <Plus className="w-4 h-4" />
          Buat Surat Baru
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: "Total Surat",
            value: totalDocs,
            icon: FileText,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
          },
          {
            title: "Disetujui",
            value: approvedDocs,
            icon: FileCheck2,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
          },
          {
            title: "Menunggu TTD",
            value: pendingDocs,
            icon: Stamp,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
          },
          {
            title: "Draft",
            value: draftDocs,
            icon: FilePlus2,
            color: "text-slate-500",
            bg: "bg-slate-500/10",
          },
        ].map((stat, i) => (
          <Card
            key={i}
            className="border-border/50 bg-card/40 backdrop-blur-sm"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-8 w-12 bg-muted animate-pulse rounded" />
              ) : (
                <div className="text-2xl font-bold text-foreground">
                  {stat.value}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter + Table */}
      <Card className="border-border/50 bg-card/40 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-accent" />
                  Arsip Persuratan
                </CardTitle>
                <CardDescription>
                  Semua dokumen surat resmi yang tercatat dalam sistem.
                </CardDescription>
              </div>
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Cari surat..."
                  className="pl-10 bg-background/50"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="flex bg-muted/30 p-1 rounded-lg border border-border/50 w-fit">
              {docTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    typeFilter === type
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border/50 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-[350px]">Judul Surat</TableHead>
                  <TableHead>Jenis</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="h-4 w-48 bg-muted animate-pulse rounded" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-20 bg-muted animate-pulse rounded" />
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
                ) : filteredDocs.length > 0 ? (
                  filteredDocs.map((doc) => {
                    const statusConfig = getStatusConfig(doc.status);
                    return (
                      <TableRow
                        key={doc._id}
                        className="hover:bg-muted/20 transition-colors"
                      >
                        <TableCell className="font-medium">
                          {doc.title}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="bg-accent/5 text-xs"
                          >
                            {getTypeLabel(doc.type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={statusConfig.color}
                          >
                            {statusConfig.icon}
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(doc.createdAt).toLocaleDateString("id-ID")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={() => router.push(`/surat/${doc._id}`)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-accent"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-32 text-center text-muted-foreground italic"
                    >
                      {search
                        ? "Tidak ada surat yang cocok dengan pencarian."
                        : "Belum ada surat yang tercatat."}
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
