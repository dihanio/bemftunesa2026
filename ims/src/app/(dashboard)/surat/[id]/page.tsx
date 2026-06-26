"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import DashboardShell from "@/components/DashboardShell";
import { SuratApi } from "@/lib/api/surat";
import { Surat } from "@/lib/types/surat";
import { DocumentState, WorkflowAction } from "@/lib/types/document";
import { DocumentStatusBadge } from "@/components/document/DocumentStatusBadge";
import { DocumentTimeline } from "@/components/document/DocumentTimeline";
import { DocumentActions } from "@/components/document/DocumentActions";
import ImsApiService from "@/lib/api";
import { FormFileUpload } from "@/components/ui/FormFileUpload";
import {
  FileText,
  Calendar,
  User,
  ArrowLeft,
  Download,
  Check,
  X,
  Clock,
  AlertTriangle,
  Building2,
  ExternalLink,
  ChevronRight,
  Trash2,
  Edit,
  QrCode,
  Upload,
  History,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

const TYPE_MAP: Record<string, { label: string; bg: string; text: string; border: string }> = {
  incoming: {
    label: "Surat Masuk",
    bg: "bg-accent-blue/15",
    text: "text-accent-blue",
    border: "border-accent-blue/20",
  },
  outgoing: {
    label: "Surat Keluar",
    bg: "bg-sage/15",
    text: "text-sage",
    border: "border-sage/20",
  },
};

const CATEGORY_MAP: Record<string, { label: string; bg: string; text: string; border: string }> = {
  internal: {
    label: "Internal (FT/UNESA)",
    bg: "bg-purple-500/15",
    text: "text-purple-400",
    border: "border-purple-500/20",
  },
  external: {
    label: "Eksternal",
    bg: "bg-amber-500/15",
    text: "text-amber-400",
    border: "border-amber-500/20",
  },
};

export default function SuratDetailPage() {
  const router = useRouter();
  const params = useParams();
  const suratId = params.id as string;

  const [surat, setSurat] = useState<Surat | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dynamicActions, setDynamicActions] = useState<any[]>([]);
  const [currentStageInfo, setCurrentStageInfo] = useState<any>(null);

  // Modals state
  const [showActionModal, setShowActionModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<any>(null);
  const [commentInput, setCommentInput] = useState("");

  // Version upload state
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [versionFile, setVersionFile] = useState<File | null>(null);
  const [versionType, setVersionType] = useState("review");
  const [versionNotes, setVersionNotes] = useState("");
  const [uploadingVersion, setUploadingVersion] = useState(false);
  const [documentVersions, setDocumentVersions] = useState<any[]>([]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      
      const profileRes = await (await import('@/lib/api')).default.getProfile();
      if (profileRes?.data) {
        setProfile(profileRes.data);
      }
      
      const res = await SuratApi.getDetail(suratId);
      if (res?.data) {
        setSurat(res.data);
      }

      // Fetch dynamic available actions from the Workflow Platform
      const actionsRes = await SuratApi.getAvailableActions(suratId);
      if (actionsRes?.data) {
        setDynamicActions(actionsRes.data.actions || []);
        setCurrentStageInfo({
          stageId: actionsRes.data.currentStageId,
          stageName: actionsRes.data.currentStageName,
          currentState: actionsRes.data.currentState,
        });
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Gagal memuat detail surat.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (suratId) {
      fetchDetail();
    }
  }, [suratId]);

  const handleDynamicAction = (actionDef: any) => {
    setCommentInput("");
    if (actionDef.requiresComment) {
      setPendingAction(actionDef);
      setShowActionModal(true);
    } else {
      executeAction(actionDef.action);
    }
  };

  const executeAction = async (action: string, comment?: string) => {
    try {
      setActionLoading(true);
      setErrorMsg(null);
      await SuratApi.executeWorkflowAction(suratId, action, comment);
      // Refresh everything after action
      await fetchDetail();
      setShowActionModal(false);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || err.message || "Gagal menjalankan aksi.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pendingAction?.requiresComment && !commentInput.trim()) {
      setErrorMsg("Harap isi catatan/alasan.");
      return;
    }
    await executeAction(pendingAction.action, commentInput);
  };

  const handleDelete = async () => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus surat draft ini secara permanen?")) {
      return;
    }
    try {
      setActionLoading(true);
      setErrorMsg(null);
      await SuratApi.delete(suratId);
      router.push("/surat");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Gagal menghapus surat.");
      setActionLoading(false);
    }
  };

  const handleUploadVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!versionFile) {
      setErrorMsg("Pilih file PDF terlebih dahulu.");
      return;
    }
    try {
      setUploadingVersion(true);
      setErrorMsg(null);
      const uploadRes = await ImsApiService.uploadFile(versionFile);
      const fileUrl = uploadRes.data?.url || "";
      if (!fileUrl) throw new Error("Upload gagal.");

      await SuratApi.uploadVersion(suratId, {
        fileUrl,
        fileSize: versionFile.size,
        mimeType: versionFile.type,
        versionType,
        notes: versionNotes,
      });

      setShowVersionModal(false);
      setVersionFile(null);
      setVersionNotes("");
      await fetchDetail();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Gagal mengunggah versi baru.");
    } finally {
      setUploadingVersion(false);
    }
  };

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex flex-col items-center justify-center py-32 gap-3 max-w-6xl mx-auto w-full">
          <div className="w-8 h-8 animate-spin rounded-full border-4 border-sage/20 border-t-sage" />
          <span className="text-sm font-medium text-foreground/50">Memuat detail surat...</span>
        </div>
      </DashboardShell>
    );
  }

  if (!surat) {
    return (
      <DashboardShell>
        <div className="flex flex-col items-center justify-center py-32 gap-4 max-w-6xl mx-auto w-full animate-fade-in">
          <AlertTriangle className="w-12 h-12 text-rose-500" />
          <h2 className="text-xl font-bold text-white">Surat Tidak Ditemukan</h2>
          <p className="text-foreground/50 text-sm">Surat yang Anda cari tidak tersedia atau tidak dapat diakses.</p>
          <Link
            href="/surat"
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl text-sm font-medium border border-white/10 text-white transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar
          </Link>
        </div>
      </DashboardShell>
    );
  }

  const roleObj = typeof profile?.role === "object" ? profile?.role : null;
  const roleSlug = profile?.activeContext?.role?.slug || roleObj?.slug || (typeof profile?.role === "string" ? profile.role : "staf");
  
  const currentState = currentStageInfo?.currentState || surat.workflowInstance?.currentState || DocumentState.DRAFT;
  const currentStageId = currentStageInfo?.stageId || 'draft';
  const isCreator = surat.submittedBy?._id === profile?.id;

  const handleAction = (action: WorkflowAction) => {
    const actionDef = dynamicActions.find(a => a.action === action);
    if (actionDef) {
      handleDynamicAction(actionDef);
    }
  };

  const typeInfo = TYPE_MAP[surat.type] || { label: surat.type, bg: "bg-white/10", text: "text-white", border: "border-white/25" };
  const catInfo = CATEGORY_MAP[surat.category] || { label: surat.category, bg: "bg-white/10", text: "text-white", border: "border-white/25" };

  const getActionStyle = (action: string) => {
    const upper = action.toUpperCase();
    if (upper === 'SUBMIT') return 'bg-sage hover:bg-sage/90 text-white border-sage/50 shadow-md shadow-sage/20';
    if (upper === 'APPROVE') return 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/10';
    if (upper === 'REJECT') return 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/20';
    if (upper === 'REQUEST_REVISION') return 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border-orange-500/20';
    if (upper === 'PUBLISH') return 'bg-sage hover:bg-sage/90 text-white border-sage/50';
    if (upper === 'CANCEL') return 'bg-white/5 hover:bg-white/10 text-foreground/70 border-white/10';
    return 'bg-white/5 hover:bg-white/10 text-white border-white/10';
  };

  const originUrl = typeof window !== "undefined" ? window.location.origin : "https://bemft-unesa.com";
  const validationUrl = `${originUrl}/verify/surat/${surat._id}`;

  // Assume we won't show the full HTML right now because backend generates it on the fly or we fetch it via export
  // But for preview purposes we might have a preview endpoint. For now, we omit the bodyHtml.

  return (
    <DashboardShell>
      <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full pb-12 animate-fade-in">
        {/* Breadcrumb / Back button */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-foreground/50">
            <Link href="/surat" className="hover:text-white transition-colors">Persuratan</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-white max-w-[200px] truncate">{surat.title}</span>
          </div>
          <Link
            href="/surat"
            className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:border-white/20 text-foreground/75 hover:text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali
          </Link>
        </div>

        {errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl flex items-start gap-3 text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>{errorMsg}</p>
          </div>
        )}

        {/* Title Section */}
        <div className="glass-panel border border-white/5 p-6 sm:p-8 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-3 z-10">
            <div className="flex flex-wrap items-center gap-2.5">
              <DocumentStatusBadge state={currentState} />
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${typeInfo.bg} ${typeInfo.text} ${typeInfo.border}`}>
                {typeInfo.label}
              </span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${catInfo.bg} ${catInfo.text} ${catInfo.border}`}>
                {catInfo.label}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-snug">
              {surat.title}
            </h1>
            <div className="text-sm font-mono text-foreground/60 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>No. Surat: <span className="text-white">{surat.letterNumber || "Belum diterbitkan"}</span></span>
            </div>
          </div>

          {/* Large Action Buttons on Header */}
          <div className="flex flex-wrap gap-3 z-10 md:self-center shrink-0">
            <button
              onClick={() => setShowVersionModal(true)}
              className="bg-sage/10 hover:bg-sage/20 border border-sage/20 text-sage px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4" /> Upload Versi Baru
            </button>

           {/* Edit Button for creator */}
            {(currentStageId === 'draft' || currentState === DocumentState.DRAFT) && isCreator && (
              <button
                onClick={() => router.push(`/surat/${suratId}/edit`)}
                disabled={actionLoading}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Edit className="w-4 h-4" /> Edit Dokumen
              </button>
            )}

            {/* Delete draft option */}
            {((currentStageId === 'draft' || currentState === DocumentState.DRAFT) && (isCreator || roleSlug === "super-admin")) && (
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" /> Hapus Draft
              </button>
            )}

            {/* Dynamic Workflow Actions from Workflow Platform */}
            {dynamicActions.map((actionDef) => (
              <button
                key={actionDef.action}
                onClick={() => handleDynamicAction(actionDef)}
                disabled={actionLoading}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 border ${getActionStyle(actionDef.action)}`}
              >
                {actionDef.name}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Detailed Info (Left Panel) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Meta Information */}
            <div className="glass-panel border border-white/5 p-6 rounded-2xl space-y-6">
              <h2 className="text-md font-bold text-white border-b border-white/5 pb-3">Informasi Surat</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                <div className="space-y-1">
                  <span className="text-xs text-foreground/45">Pengirim (Asal)</span>
                  <p className="text-sm font-semibold text-white">{surat.sender}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-foreground/45">Penerima (Tujuan)</span>
                  <p className="text-sm font-semibold text-white">{surat.recipient}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-foreground/45">Departemen Pengaju</span>
                  <div className="flex items-center gap-2 text-sm font-semibold text-white mt-0.5">
                    <Building2 className="w-4 h-4 text-sage shrink-0" />
                    <span>{typeof surat.department === 'object' ? surat.department?.name : surat.department || "BPI / Umum"}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-foreground/45">Dibuat Oleh</span>
                  <div className="flex items-center gap-2 text-sm font-semibold text-white mt-0.5">
                    <User className="w-4.5 h-4.5 text-foreground/40 shrink-0" />
                    <span>{surat.submittedBy?.name || "Fungsionaris"}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-foreground/45">Tanggal Pengajuan</span>
                  <div className="flex items-center gap-2 text-sm text-foreground/80 mt-0.5">
                    <Calendar className="w-4.5 h-4.5 text-foreground/40 shrink-0" />
                    <span>{formatDate(surat.createdAt)}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-foreground/45">Terakhir Diperbarui</span>
                  <div className="flex items-center gap-2 text-sm text-foreground/80 mt-0.5">
                    <Clock className="w-4.5 h-4.5 text-foreground/40 shrink-0" />
                    <span>{formatDate(surat.updatedAt)}</span>
                  </div>
                </div>
              </div>

              {/* Removed SuratEditor preview since bodyHtml is now generated dynamic via backend /export */}
            </div>

            {/* Document Versions Timeline */}
            <div className="glass-panel border border-white/5 p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h2 className="text-md font-bold text-white flex items-center gap-2"><History className="w-4 h-4 text-sage" /> Versi Dokumen</h2>
              </div>

              {(surat as any).currentVersion ? (
                <div className="space-y-3">
                  {/* Current version card */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-sage/5 border border-sage/20 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-sage/10 text-sage flex items-center justify-center border border-sage/20">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate max-w-sm">
                          Versi {(surat as any).currentVersion?.versionNumber || 1}
                          <span className="ml-2 text-xs font-medium text-sage px-2 py-0.5 rounded-full bg-sage/10 border border-sage/20">
                            {(surat as any).currentVersion?.versionType || 'draft'}
                          </span>
                          <span className="ml-1 text-xs font-medium text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">Aktif</span>
                        </p>
                        <p className="text-xs text-foreground/45 mt-0.5">
                          {(surat as any).currentVersion?.mimeType || 'application/pdf'} &middot; {((surat as any).currentVersion?.fileSize || 0) > 0 ? `${Math.round(((surat as any).currentVersion.fileSize) / 1024)} KB` : ''}
                        </p>
                        {(surat as any).currentVersion?.notes && (
                          <p className="text-xs text-foreground/60 mt-1 italic">&ldquo;{(surat as any).currentVersion.notes}&rdquo;</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={(surat as any).currentVersion?.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Preview
                      </a>
                      <a
                        href={(surat as any).currentVersion?.fileUrl}
                        download
                        className="bg-sage hover:bg-sage/90 border border-sage/50 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center text-center text-foreground/45 bg-black/10">
                  <FileText className="w-10 h-10 text-foreground/30 mb-2" />
                  <span className="text-sm font-semibold">Belum ada file PDF diunggah</span>
                  <span className="text-xs mt-1">Upload versi pertama menggunakan tombol di atas</span>
                </div>
              )}
            </div>

            {/* Summary */}
            {(surat as any).summary && (
              <div className="glass-panel border border-white/5 p-6 rounded-2xl space-y-3">
                <h2 className="text-md font-bold text-white border-b border-white/5 pb-3">Ringkasan Surat</h2>
                <p className="text-sm text-foreground/70 leading-relaxed whitespace-pre-wrap">{(surat as any).summary}</p>
              </div>
            )}
          </div>

          {/* Timeline & Status Sidebar (Right Panel) */}
          <div className="space-y-6">
            {/* TTE Validasi Box (Right Sidebar if Approved) */}
            {currentState === DocumentState.APPROVED && (
              <div className="glass-panel border border-[#10b981]/20 p-6 rounded-2xl space-y-4 bg-emerald-950/20 text-center relative overflow-hidden">
                <div className="absolute top-2 right-2 text-emerald-500/20">
                  <QrCode className="w-20 h-20" />
                </div>
                <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20 relative z-10">
                  <Check className="w-6 h-6" />
                </div>
                <div className="space-y-1 relative z-10">
                  <h3 className="text-sm font-extrabold text-white">TTE Terverifikasi</h3>
                  <p className="text-xs text-foreground/60 leading-relaxed">
                    Surat ini telah diverifikasi dan disetujui resmi.
                  </p>
                </div>
              </div>
            )}

            <div className="glass-panel border border-white/5 p-6 rounded-2xl space-y-6">
              <h2 className="text-md font-bold text-white border-b border-white/5 pb-3">Riwayat Workflow</h2>
              <DocumentTimeline history={surat.workflowInstance?.history || []} />
            </div>
          </div>
        </div>
      </div>

      {/* GENERIC ACTION MODAL */}
      {showActionModal && pendingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel border border-white/10 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-md font-bold text-white flex items-center gap-2">
                Konfirmasi Aksi: {pendingAction.name}
              </h3>
              <button
                onClick={() => setShowActionModal(false)}
                className="text-foreground/50 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleModalSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white block">
                  {pendingAction.requiresComment ? "Catatan / Alasan*" : "Catatan Tambahan (Opsional)"}
                </label>
                <textarea
                  placeholder="Masukkan catatan..."
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl glass-subtle border border-white/10 text-sm text-white placeholder:text-foreground/30 focus:outline-none focus:border-sage/40 h-28 resize-none"
                  required={pendingAction.requiresComment}
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowActionModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 border ${getActionStyle(pendingAction.action)}`}
                >
                  {actionLoading ? "Memproses..." : pendingAction.name}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPLOAD VERSION MODAL */}
      {showVersionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel border border-white/10 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-md font-bold text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-sage" /> Upload Versi Baru
              </h3>
              <button
                onClick={() => setShowVersionModal(false)}
                className="text-foreground/50 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadVersion} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white block">Tipe Versi*</label>
                <select
                  value={versionType}
                  onChange={(e) => setVersionType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl glass-subtle border border-white/10 text-sm text-white focus:outline-none focus:border-sage/40 bg-transparent"
                >
                  <option value="review" className="bg-[#1a1a2e]">Review</option>
                  <option value="numbered" className="bg-[#1a1a2e]">Setelah Penomoran</option>
                  <option value="internal_signed" className="bg-[#1a1a2e]">TTD Internal</option>
                  <option value="final_external" className="bg-[#1a1a2e]">PDF Final (TTD Pembina/Dekan)</option>
                </select>
              </div>

              <FormFileUpload
                label="File PDF*"
                accept="application/pdf"
                uploading={uploadingVersion}
                fileName={versionFile?.name}
                onFileSelect={(f) => setVersionFile(f)}
                onClear={() => setVersionFile(null)}
                helperText="Maksimal 5MB. Hanya format .pdf"
              />

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white block">Catatan (Opsional)</label>
                <textarea
                  placeholder="Keterangan perubahan..."
                  value={versionNotes}
                  onChange={(e) => setVersionNotes(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl glass-subtle border border-white/10 text-sm text-white placeholder:text-foreground/30 focus:outline-none focus:border-sage/40 h-20 resize-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowVersionModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={uploadingVersion || !versionFile}
                  className="bg-sage hover:bg-sage/90 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 border border-sage/50"
                >
                  {uploadingVersion ? "Mengunggah..." : "Upload"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
