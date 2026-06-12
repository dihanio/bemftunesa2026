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
  Move,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRef } from "react";

export default function SuratDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;
  const constraintsRef = useRef<HTMLDivElement>(null);

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

  const assistMutation = useMutation({
    mutationFn: (documentNumber: string) => documentsService.assistDocument(id, documentNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ims-document-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["ims-documents"] });
      alert("Nomor surat berhasil diberikan!");
    },
  });

  const uploadFinalMutation = useMutation({
    mutationFn: (finalFileUrl: string) => documentsService.uploadFinal(id, finalFileUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ims-document-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["ims-documents"] });
      alert("Surat final berhasil diunggah!");
    },
  });

  const accSekretarisMutation = useMutation({
    mutationFn: () => documentsService.accSekretaris(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ims-document-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["ims-documents"] });
      alert("Surat berhasil di-ACC Sekretaris!");
    },
  });

  const signMutation = useMutation({
    mutationFn: (payload: { signatureX: number; signatureY: number }) => documentsService.signDocument(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ims-document-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["ims-documents"] });
      alert("Surat berhasil disetujui & ditandatangani!");
    },
  });

  const doc = documentResponse?.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Approved":
      case "Selesai":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
            {status}
          </Badge>
        );
      case "Pending":
      case "Menunggu TTD Ketua":
        return (
          <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">
            Menunggu TTD
          </Badge>
        );
      case "Menunggu ACC Sekretaris":
        return (
          <Badge className="bg-indigo-500/10 text-indigo-500 border-indigo-500/20">
            Menunggu ACC Sekum
          </Badge>
        );
      case "Revisi Nomor Surat":
        return (
          <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
            Upload Final
          </Badge>
        );
      case "Menunggu Asistensi":
        return (
          <Badge className="bg-violet-500/10 text-violet-500 border-violet-500/20">
            Asistensi Kestari
          </Badge>
        );
      case "Rejected":
      case "Ditolak":
        return (
          <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
            Ditolak
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-500/10 text-slate-500 border-slate-500/20">
            {status || "Draft"}
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
          </div>
        </div>
      </div>

      {/* Main Grid Detail */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Letter Preview Box */}
        <Card 
          ref={constraintsRef}
          className="lg:col-span-2 border-border/50 bg-card p-10 font-serif text-[#0f172a] shadow-xl min-h-[700px] border-t-8 border-t-accent relative overflow-hidden"
        >
          <div className="mb-10 text-center border-b-4 border-double border-foreground pb-6">
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

            <div className="mt-8 text-justify leading-relaxed whitespace-pre-wrap min-h-[300px]">
              {doc.finalFileUrl ? (
                <div className="flex flex-col items-center justify-center h-full space-y-4">
                  <FileText className="w-16 h-16 text-muted-foreground" />
                  <p className="text-muted-foreground">Dokumen PDF Final telah diunggah.</p>
                  <Button variant="outline" asChild>
                    <a href={doc.finalFileUrl} target="_blank" rel="noreferrer">
                      <Printer className="w-4 h-4 mr-2" /> Buka PDF Final
                    </a>
                  </Button>
                </div>
              ) : doc.draftFileUrl ? (
                <div className="flex flex-col items-center justify-center h-full space-y-4">
                  <FileText className="w-16 h-16 text-muted-foreground" />
                  <p className="text-muted-foreground">Draft Dokumen PDF telah diunggah.</p>
                  <Button variant="outline" asChild>
                    <a href={doc.draftFileUrl} target="_blank" rel="noreferrer">
                      <Printer className="w-4 h-4 mr-2" /> Buka Draft PDF
                    </a>
                  </Button>
                </div>
              ) : (
                <p className="text-muted-foreground text-center italic mt-10">Isi surat belum tersedia / belum diunggah.</p>
              )}
            </div>

            {/* Signature Block */}
            <motion.div 
              className="absolute right-10 bottom-10 z-10 cursor-grab active:cursor-grabbing hover:bg-accent/5 p-4 rounded-xl border border-transparent hover:border-accent/30 transition-colors"
              drag 
              dragConstraints={constraintsRef}
              dragElastic={0.1}
              dragMomentum={false}
              whileDrag={{ scale: 1.05, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" }}
            >
              <div className="text-center w-56 flex flex-col items-center">
                <p className="text-sm">Mengetahui,</p>
                <p className="font-bold mt-1 text-sm">Ketua BEM FT UNESA</p>
                <div className="h-24 w-40 flex flex-col items-center justify-center my-3 border-2 border-dashed border-border/80 bg-background/50 rounded-lg text-xs font-semibold relative group backdrop-blur-sm">
                  {(doc.status === "Approved" || doc.status === "Selesai") ? (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-emerald-600 font-black border-4 border-emerald-600 rounded-full px-6 py-2 rotate-[-15deg] uppercase text-xl tracking-widest opacity-80 mix-blend-multiply">
                        DISETUJUI
                      </div>
                    </div>
                  ) : (
                    <>
                      <Move className="w-5 h-5 text-muted-foreground mb-1 opacity-50 group-hover:text-accent transition-colors" />
                      <span className="text-muted-foreground text-center px-2">
                        Geser kotak ini untuk<br/>posisi Tanda Tangan
                      </span>
                    </>
                  )}
                </div>
                <p className="font-bold underline text-sm">AEC Danadyaksa</p>
                <p className="text-xs mt-0.5">NIM. 22050974001</p>
              </div>
            </motion.div>
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
              {(doc.status === "Approved" || doc.status === "Selesai") && (
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
