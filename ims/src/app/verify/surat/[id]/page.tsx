"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import ImsApiService, { type SuratItem } from "@/lib/api";
import {
  FileText,
  Calendar,
  User,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Building2,
  FileDown,
  ShieldCheck,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Surat } from "@/lib/types/surat";

export default function PublicVerifySuratPage() {
  const params = useParams();
  const suratId = params.id as string;

  const [surat, setSurat] = useState<Surat | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const verifyDoc = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);
        const res = await ImsApiService.verifySuratPublic(suratId);
        if (res?.data) {
          setSurat(res.data);
        }
      } catch (err: any) {
        console.error(err);
        setErrorMsg("Dokumen tidak valid atau tidak terdaftar di sistem BEM FT UNESA.");
      } finally {
        setLoading(false);
      }
    };

    if (suratId) {
      verifyDoc();
    }
  }, [suratId]);

  const handleDownloadPdf = async () => {
    if (!surat || !(surat as any).currentVersion?.fileUrl) return;
    try {
      setDownloading(true);
      const url = (surat as any).currentVersion.fileUrl;
      const a = document.createElement('a');
      a.href = url;
      a.download = `${surat.title || 'surat'}.pdf`;
      a.click();
    } catch (err: any) {
      console.error(err);
      alert("Gagal mengunduh PDF: " + err.message);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#091c11] text-[#f5f2eb] flex flex-col items-center justify-center p-6">
        <div className="w-8 h-8 animate-spin rounded-full border-4 border-emerald-500/20 border-t-emerald-500" />
        <span className="text-sm font-medium text-foreground/50 mt-3">Memverifikasi keabsahan dokumen...</span>
      </div>
    );
  }

  const currentVersion = surat ? (surat as any).currentVersion : null;

  return (
    <div className="min-h-screen bg-[#091c11] text-[#f5f2eb] flex flex-col pb-16">
      {/* Public Header */}
      <header className="border-b border-white/5 bg-black/20 backdrop-blur-md py-4 px-6 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center p-1.5 text-xs text-white">
              Logo
            </div>
            <div>
              <span className="text-xs text-emerald-400 font-bold block tracking-wider">SISTEM VALIDASI RESMI</span>
              <span className="text-sm font-extrabold text-white">BEM FT UNESA Digital Ecosystem</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Validation Area */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 pt-8 space-y-6">
        {errorMsg || !surat ? (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-8 text-center max-w-md mx-auto space-y-4 animate-scale-in">
            <XCircle className="w-12 h-12 text-rose-500 mx-auto" />
            <h2 className="text-lg font-bold text-white">Verifikasi Gagal</h2>
            <p className="text-foreground/60 text-sm leading-relaxed">{errorMsg || "Dokumen tidak ditemukan."}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Verification Status Card */}
            <div className="glass-panel border border-white/5 p-6 sm:p-8 rounded-2xl relative overflow-hidden flex flex-col sm:flex-row items-center gap-6">
              {surat.status === "approved" ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
                    <ShieldCheck className="w-10 h-10" />
                  </div>
                  <div className="space-y-1 text-center sm:text-left flex-1">
                    <span className="text-xs font-bold text-emerald-400 block tracking-widest uppercase">TERVERIFIKASI ASLI</span>
                    <h2 className="text-xl font-extrabold text-white">Dokumen Resmi Terbit</h2>
                    <p className="text-xs text-foreground/50 leading-relaxed">
                      Dokumen ini telah disetujui secara digital oleh pejabat berwenang di Badan Eksekutif Mahasiswa Fakultas Teknik UNESA.
                    </p>
                  </div>
                </>
              ) : surat.status === "rejected" ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20 shrink-0">
                    <XCircle className="w-10 h-10" />
                  </div>
                  <div className="space-y-1 text-center sm:text-left flex-1">
                    <span className="text-xs font-bold text-rose-400 block tracking-widest uppercase">TIDAK BERLAKU / DITOLAK</span>
                    <h2 className="text-xl font-extrabold text-white">Dokumen Ditolak</h2>
                    <p className="text-xs text-foreground/50 leading-relaxed">
                      Dokumen ini telah ditolak oleh BPI BEM FT UNESA dan tidak memiliki keabsahan resmi.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0">
                    <AlertTriangle className="w-10 h-10" />
                  </div>
                  <div className="space-y-1 text-center sm:text-left flex-1">
                    <span className="text-xs font-bold text-amber-400 block tracking-widest uppercase">PROSES VERIFIKASI / DRAFT</span>
                    <h2 className="text-xl font-extrabold text-white">Dokumen Draft Belum Disetujui</h2>
                    <p className="text-xs text-foreground/50 leading-relaxed">
                      Dokumen ini masih berstatus draft/review internal dan belum memiliki nomor surat resmi yang valid.
                    </p>
                  </div>
                </>
              )}

              {surat.status === "approved" && currentVersion && (
                <button
                  onClick={handleDownloadPdf}
                  disabled={downloading}
                  className="bg-emerald-500 hover:bg-emerald-600 border border-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 sm:self-center shrink-0 w-full sm:w-auto justify-center"
                >
                  <FileDown className="w-4 h-4" /> {downloading ? "Mengunduh..." : "Unduh PDF (Final)"}
                </button>
              )}
            </div>

            {/* Document Metadata Details Card */}
            <div className="glass-panel border border-white/5 p-6 sm:p-8 rounded-2xl space-y-6">
              <h3 className="text-sm font-bold text-white border-b border-white/5 pb-2">Detail Informasi Dokumen</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5 text-sm">
                <div className="space-y-1">
                  <span className="text-xs text-foreground/45">Nomor Surat</span>
                  <p className="font-mono font-bold text-white">{surat.letterNumber || "Belum diterbitkan"}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-foreground/45">Judul / Perihal</span>
                  <p className="font-semibold text-white">{surat.title}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-foreground/45">Pengirim (Asal)</span>
                  <p className="font-medium text-foreground/80">{surat.sender}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-foreground/45">Penerima (Tujuan)</span>
                  <p className="font-medium text-foreground/80">{surat.recipient}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-foreground/45">Departemen Pengaju</span>
                  <div className="flex items-center gap-2 text-foreground/80 mt-0.5">
                    <Building2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{typeof surat.department === 'object' ? surat.department?.name : surat.department || "BPI / Umum"}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-foreground/45">Dibuat Oleh</span>
                  <div className="flex items-center gap-2 text-foreground/80 mt-0.5">
                    <User className="w-4.5 h-4.5 text-foreground/40 shrink-0" />
                    <span>{surat.submittedBy?.name || "Fungsionaris"}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-foreground/45">Tanggal Disetujui</span>
                  <div className="flex items-center gap-2 text-foreground/80 mt-0.5">
                    <Calendar className="w-4.5 h-4.5 text-foreground/40 shrink-0" />
                    <span>{surat.status === "approved" && surat.approvedBy ? `${formatDate(surat.updatedAt)} oleh ${surat.approvedBy.name}` : "-"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Document PDF Display */}
            {currentVersion && (
              <div className="glass-panel border border-white/5 p-6 rounded-2xl space-y-4">
                <h3 className="text-sm font-bold text-white border-b border-white/5 pb-2">Dokumen Final PDF</h3>
                <div className="w-full aspect-[1/1.414] bg-black/40 rounded-xl border border-white/10 overflow-hidden">
                  <iframe 
                    src={currentVersion.fileUrl} 
                    className="w-full h-full"
                    title="PDF Document"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
