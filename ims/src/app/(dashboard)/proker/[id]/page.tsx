"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import DashboardShell from "@/components/DashboardShell";
import ImsApiService, { type ProkerItem, type UserProfile } from "@/lib/api";
import {
  Briefcase, Calendar, Building2, User, ArrowLeft, ChevronRight,
  AlertTriangle, Clock, Trash2, Save, Target, DollarSign,
} from "lucide-react";
import { formatDate, formatRupiah } from "@/lib/utils";
import { StatusBadge } from "@/components/ui";

const STATUS_MAP: Record<string, { label: string; bg: string; text: string; border: string }> = {
  planned: { label: "Direncanakan", bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/20" },
  ongoing: { label: "Berjalan", bg: "bg-accent-blue/10", text: "text-accent-blue", border: "border-accent-blue/20" },
  completed: { label: "Selesai", bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
  cancelled: { label: "Dibatalkan", bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20" },
};

export default function ProkerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const prokerId = params.id as string;

  const [proker, setProker] = useState<ProkerItem | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Editable fields
  const [editStatus, setEditStatus] = useState("");
  const [editProgress, setEditProgress] = useState(0);
  const [editNotes, setEditNotes] = useState("");

  const fetchDetail = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const profileRes = await ImsApiService.getProfile();
      if (profileRes?.data) setProfile(profileRes.data);

      const res = await ImsApiService.getProkerDetail(prokerId);
      if (res?.data) {
        setProker(res.data);
        setEditStatus(res.data.status);
        setEditProgress(res.data.progress);
        setEditNotes(res.data.evaluationNotes || "");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Gagal memuat detail proker.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (prokerId) fetchDetail();
  }, [prokerId]);

  // Role resolution
  const roleSlug =
    profile?.activeContext?.role?.slug ||
    (typeof profile?.role === "object" ? (profile.role as any)?.slug : profile?.role) ||
    "staf";
  const userId = profile?.id;

  // Permission: can edit if super-admin, kabem, PIC, or kadep of same dept
  const canEdit =
    ["super-admin", "kabem"].includes(roleSlug) ||
    (proker?.pic && proker.pic._id === userId) ||
    (roleSlug === "kadep" && profile?.departmentId && proker?.department?._id === profile.departmentId);
  const canDelete = ["super-admin", "kabem"].includes(roleSlug);

  const handleSave = async () => {
    try {
      setSaving(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const progress = Math.max(0, Math.min(100, editProgress));
      await ImsApiService.updateProker(prokerId, {
        status: editStatus,
        progress,
        evaluationNotes: editNotes || undefined,
      } as any);

      setSuccessMsg("Progres berhasil diperbarui!");
      // Refresh
      const res = await ImsApiService.getProkerDetail(prokerId);
      if (res?.data) {
        setProker(res.data);
        setEditStatus(res.data.status);
        setEditProgress(res.data.progress);
        setEditNotes(res.data.evaluationNotes || "");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Gagal memperbarui proker.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus proker ini?")) return;
    try {
      setSaving(true);
      await ImsApiService.deleteProker(prokerId);
      router.push("/proker");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Gagal menghapus proker.");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex flex-col items-center justify-center py-32 gap-3 max-w-6xl mx-auto w-full">
          <div className="w-8 h-8 animate-spin rounded-full border-4 border-sage/20 border-t-sage" />
          <span className="text-sm font-medium text-foreground/50">Memuat detail proker...</span>
        </div>
      </DashboardShell>
    );
  }

  if (!proker) {
    return (
      <DashboardShell>
        <div className="flex flex-col items-center justify-center py-32 gap-4 max-w-6xl mx-auto w-full animate-fade-in">
          <AlertTriangle className="w-12 h-12 text-rose-500" />
          <h2 className="text-xl font-bold text-white">Proker Tidak Ditemukan</h2>
          <p className="text-foreground/50 text-sm">Program kerja yang Anda cari tidak tersedia.</p>
          <Link
            href="/proker"
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl text-sm font-medium border border-white/10 text-white transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar
          </Link>
        </div>
      </DashboardShell>
    );
  }

  const statusInfo = STATUS_MAP[proker.status] || STATUS_MAP.planned;
  const progressColor =
    proker.progress >= 100 ? "bg-emerald-500" : proker.progress >= 50 ? "bg-sage" : "bg-accent-blue";

  return (
    <DashboardShell>
      <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full pb-12 animate-fade-in">
        {/* Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-foreground/50">
            <Link href="/proker" className="hover:text-white transition-colors">Program Kerja</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-white max-w-[200px] truncate">{proker.title}</span>
          </div>
          <Link
            href="/proker"
            className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:border-white/20 text-foreground/75 hover:text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali
          </Link>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl flex items-start gap-3 text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>{errorMsg}</p>
          </div>
        )}
        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl flex items-start gap-3 text-sm animate-fade-in">
            <Save className="w-5 h-5 shrink-0 mt-0.5" />
            <p>{successMsg}</p>
          </div>
        )}

        {/* Header Card */}
        <div className="glass-panel border border-white/5 p-6 sm:p-8 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-3 z-10">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}>
                {statusInfo.label}
              </span>
              {proker.category && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border bg-purple-500/15 text-purple-400 border-purple-500/20">
                  {proker.category}
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-snug">
              {proker.title}
            </h1>
            {/* Progress Bar */}
            <div className="flex items-center gap-3 max-w-xs">
              <div className="flex-1 h-2.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                  style={{ width: `${Math.min(proker.progress, 100)}%` }}
                />
              </div>
              <span className="text-sm font-bold text-white tabular-nums">{proker.progress}%</span>
            </div>
          </div>

          {/* Delete button */}
          <div className="flex flex-wrap gap-3 z-10 md:self-center shrink-0">
            {canDelete && (
              <button
                onClick={handleDelete}
                disabled={saving}
                className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" /> Hapus
              </button>
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Detail Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel border border-white/5 p-6 rounded-2xl space-y-6">
              <h2 className="text-md font-bold text-white border-b border-white/5 pb-3">Informasi Program</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                <div className="space-y-1">
                  <span className="text-xs text-foreground/45">Departemen</span>
                  <div className="flex items-center gap-2 text-sm font-semibold text-white mt-0.5">
                    <Building2 className="w-4 h-4 text-sage shrink-0" />
                    <span>{proker.department?.name || "BPI / Umum"}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-foreground/45">Penanggung Jawab (PIC)</span>
                  <div className="flex items-center gap-2 text-sm font-semibold text-white mt-0.5">
                    <User className="w-4 h-4 text-foreground/40 shrink-0" />
                    <span>{proker.pic?.name || "Belum ditentukan"}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-foreground/45">Tanggal Mulai</span>
                  <div className="flex items-center gap-2 text-sm text-foreground/80 mt-0.5">
                    <Calendar className="w-4 h-4 text-foreground/40 shrink-0" />
                    <span>{proker.startDate ? formatDate(proker.startDate) : "Belum ditentukan"}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-foreground/45">Tanggal Selesai</span>
                  <div className="flex items-center gap-2 text-sm text-foreground/80 mt-0.5">
                    <Clock className="w-4 h-4 text-foreground/40 shrink-0" />
                    <span>{proker.endDate ? formatDate(proker.endDate) : "Belum ditentukan"}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-foreground/45">Estimasi Anggaran</span>
                  <div className="flex items-center gap-2 text-sm font-semibold text-white mt-0.5">
                    <DollarSign className="w-4 h-4 text-foreground/40 shrink-0" />
                    <span>{proker.estimatedBudget ? formatRupiah(proker.estimatedBudget) : "-"}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-foreground/45">Status Pendanaan</span>
                  <p className="text-sm font-semibold text-white mt-0.5 capitalize">
                    {proker.fundingStatus?.replace(/_/g, " ") || "-"}
                  </p>
                </div>
              </div>

              {proker.targetOutput && (
                <div className="space-y-1.5 pt-3 border-t border-white/5">
                  <span className="text-xs text-foreground/45 flex items-center gap-1">
                    <Target className="w-3.5 h-3.5" /> Target Output / Capaian
                  </span>
                  <p className="text-sm text-foreground/80 bg-white/5 border border-white/10 rounded-xl p-3.5 leading-relaxed whitespace-pre-line">
                    {proker.targetOutput}
                  </p>
                </div>
              )}

              {proker.description && (
                <div className="space-y-1.5 pt-3 border-t border-white/5">
                  <span className="text-xs text-foreground/45">Deskripsi</span>
                  <p className="text-sm text-foreground/80 bg-white/5 border border-white/10 rounded-xl p-3.5 leading-relaxed whitespace-pre-line">
                    {proker.description}
                  </p>
                </div>
              )}

              {proker.evaluationNotes && !canEdit && (
                <div className="space-y-1.5 pt-3 border-t border-white/5">
                  <span className="text-xs text-foreground/45">Catatan Evaluasi</span>
                  <p className="text-sm text-foreground/80 bg-white/5 border border-white/10 rounded-xl p-3.5 leading-relaxed whitespace-pre-line">
                    {proker.evaluationNotes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Status & Progress Editor */}
          <div className="space-y-6">
            {canEdit ? (
              <div className="glass-panel border border-white/5 p-6 rounded-2xl space-y-5">
                <h2 className="text-md font-bold text-white border-b border-white/5 pb-3">Update Progres</h2>

                {/* Status Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground/70">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl glass-subtle border border-sage/10 focus:border-sage/40 focus:bg-sage/5 text-sm text-foreground focus:outline-none transition-all duration-200 shadow-sm"
                  >
                    <option value="planned">Direncanakan</option>
                    <option value="ongoing">Berjalan</option>
                    <option value="completed">Selesai</option>
                    <option value="cancelled">Dibatalkan</option>
                  </select>
                </div>

                {/* Progress Slider */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground/70">
                    Progress: <span className="text-white font-bold">{editProgress}%</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={editProgress}
                    onChange={(e) => setEditProgress(Number(e.target.value))}
                    className="w-full h-2 bg-white/5 rounded-full appearance-none cursor-pointer accent-sage"
                  />
                  <div className="flex justify-between text-[10px] text-foreground/30 px-0.5">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Evaluation Notes */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground/70">Catatan Evaluasi</label>
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Catatan perkembangan atau evaluasi..."
                    className="w-full px-4 py-3 rounded-xl glass-subtle border border-sage/10 focus:border-sage/40 focus:bg-sage/5 text-sm text-foreground placeholder:text-foreground/25 focus:outline-none transition-all duration-200 shadow-sm h-24 resize-none"
                  />
                </div>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full bg-sage text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-sage/90 disabled:opacity-50 transition-colors shadow-lg shadow-sage/20 border border-sage/50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Simpan Perubahan
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="glass-panel border border-white/5 p-6 rounded-2xl space-y-4">
                <h2 className="text-md font-bold text-white border-b border-white/5 pb-3">Status Program</h2>
                <div className="text-center py-4 space-y-3">
                  <StatusBadge label={statusInfo.label} colorClass={`${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`} />
                  <div className="flex items-center gap-3 max-w-xs mx-auto">
                    <div className="flex-1 h-2.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                        style={{ width: `${Math.min(proker.progress, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-white tabular-nums">{proker.progress}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="glass-panel border border-white/5 p-6 rounded-2xl space-y-4">
              <h2 className="text-md font-bold text-white border-b border-white/5 pb-3">Riwayat</h2>
              <div className="space-y-3">
                <div className="space-y-0.5">
                  <span className="text-xs text-foreground/45">Dibuat</span>
                  <p className="text-sm text-foreground/80">{proker.createdAt ? formatDate(proker.createdAt) : "-"}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-xs text-foreground/45">Terakhir Diperbarui</span>
                  <p className="text-sm text-foreground/80">{proker.updatedAt ? formatDate(proker.updatedAt) : "-"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
