"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { documentsService, Document } from "@/lib/api/documents";
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
  ArrowLeft,
  Check,
  X,
  Printer,
  Stamp,
  FileText,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

export default function SuratDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const { data: documentResponse, isLoading } = useQuery({
    queryKey: ["ims-document-detail", id],
    queryFn: () => documentsService.getById(id),
    enabled: !!id,
  });

  const approveMutation = useMutation({
    mutationFn: () => documentsService.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ims-document-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["ims-documents"] });
      alert("Surat berhasil disetujui!");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => documentsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ims-documents"] });
      router.push("/surat");
    },
  });

  const doc = documentResponse?.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
            Disetujui
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">
            Menunggu TTD
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
            Ditolak
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

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-r-transparent"></div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="text-center py-12 space-y-4">
        <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
        <h2 className="text-xl font-bold">Surat Tidak Ditemukan</h2>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 ease-out">
      {/* Top Breadcrumbs */}
      <div className="flex flex-col gap-4">
        <Link
          href="/surat"
          className="flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Kembali ke Persuratan
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                {doc.title}
              </h1>
              {getStatusBadge(doc.status)}
            </div>
            <p className="mt-2 text-muted-foreground text-sm flex items-center gap-1.5">
              <Stamp className="w-4 h-4 text-accent" /> Jenis Dokumen:{" "}
              {doc.type.replace("_", " ").toUpperCase()}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              className="border-border/50 bg-card"
              onClick={() => window.print()}
            >
              <Printer className="w-4 h-4 mr-2" /> Cetak Surat
            </Button>
            {doc.status === "pending" && (
              <>
                <Button
                  variant="outline"
                  className="border-danger/30 hover:bg-danger/10 text-danger hover:text-danger"
                  onClick={() => {
                    if (confirm("Apakah Anda yakin ingin menolak surat ini?")) {
                      deleteMutation.mutate();
                    }
                  }}
                  disabled={deleteMutation.isPending}
                >
                  <X className="w-4 h-4 mr-2" /> Tolak
                </Button>
                <Button
                  className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg"
                  onClick={() => approveMutation.mutate()}
                  disabled={approveMutation.isPending}
                >
                  <Check className="w-4 h-4 mr-2" /> TTD & Setujui
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid Detail */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Letter Preview Box */}
        <Card className="lg:col-span-2 border-border/50 bg-card p-10 font-serif text-[#0f172a] shadow-xl min-h-[700px] border-t-8 border-t-accent">
          {/* Letter Head */}
          <div className="text-center border-b-4 border-double border-foreground pb-4 mb-6">
            <h2 className="text-lg font-extrabold uppercase">
              Badan Eksekutif Mahasiswa
            </h2>
            <h3 className="text-md font-bold uppercase">Fakultas Teknik</h3>
            <h4 className="text-sm uppercase tracking-wide">
              Universitas Negeri Surabaya
            </h4>
            <p className="text-[10px] text-muted-foreground mt-1">
              Gedung E1 Kampus Ketintang, Surabaya | Email: bemft@unesa.ac.id
            </p>
          </div>

          <div className="space-y-6 text-sm leading-relaxed">
            <div className="flex justify-between">
              <div>
                <p>
                  <span className="font-bold">Nomor:</span>{" "}
                  B/014/BEMFT-UNESA/V/2026
                </p>
                <p>
                  <span className="font-bold">Lampiran:</span> -
                </p>
                <p>
                  <span className="font-bold">Perihal:</span> {doc.title}
                </p>
              </div>
              <div className="text-right">
                <p>
                  Surabaya,{" "}
                  {new Date(doc.createdAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            <div>
              <p>Kepada Yth.</p>
              <p className="font-bold">Fungsionaris BEM FT UNESA</p>
              <p>di Tempat</p>
            </div>

            <div className="whitespace-pre-line min-h-[300px]">
              {doc.content}
            </div>

            {/* Signature Block */}
            <div className="flex justify-end pt-12">
              <div className="text-center w-48">
                <p>Mengetahui,</p>
                <p className="font-bold mt-1">Ketua BEM FT UNESA</p>
                <div className="h-16 flex items-center justify-center my-2 border border-border/50 rounded-lg text-xs font-semibold">
                  {doc.status === "approved" ? (
                    <div className="text-emerald-600 font-bold border-2 border-emerald-600 rounded-full px-4 py-1 rotate-12 uppercase scale-90">
                      Disetujui
                    </div>
                  ) : (
                    <span className="text-muted-foreground italic text-[10px]">
                      Menunggu Tanda Tangan
                    </span>
                  )}
                </div>
                <p className="font-bold underline">AEC Danadyaksa</p>
                <p className="text-[10px]">NIM. 22050974001</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Status Tracker */}
        <div className="space-y-6">
          <Card className="border-border/50 bg-card/40 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Arsip Digital Log</CardTitle>
              <CardDescription>
                Jejak autentikasi dokumen di blockchain internal.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs text-muted-foreground leading-relaxed">
              <div>
                <p className="font-bold text-foreground">Dibuat Oleh:</p>
                <p>{doc.createdBy || "Fungsionaris BEM FT"}</p>
                <p>{new Date(doc.createdAt).toLocaleString("id-ID")}</p>
              </div>
              {doc.status === "approved" && (
                <div>
                  <p className="font-bold text-foreground">
                    Ditandatangani secara digital:
                  </p>
                  <p>Ketua BEM FT (AEC Danadyaksa)</p>
                  <p>
                    {doc.approvedAt
                      ? new Date(doc.approvedAt).toLocaleString("id-ID")
                      : new Date().toLocaleString("id-ID")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
