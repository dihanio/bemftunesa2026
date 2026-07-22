"use client";

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, Suspense, useCallback } from "react";
import DashboardShell from "@/components/DashboardShell";
import { CustomSelect } from "@/components/ui/CustomSelect";
import ImsApiService, { ApplicantData, ApplicantStats, API_BASE_URL } from "@/lib/api";
import { useSearchParams, useRouter } from "next/navigation";
import { Users, Search, Download, Eye, Calendar, UserCheck, UserX, FileText, X, Check, Activity, Clock, FileBadge, Info, ChevronLeft, CalendarPlus, ClipboardCheck } from "lucide-react";
import Link from "next/link";

function ApplicantsPageContent() {
  const searchParams = useSearchParams();
  const recruitmentId = searchParams.get("id");
  const router = useRouter();

  const [stats, setStats] = useState<ApplicantStats | null>(null);
  const [applicants, setApplicants] = useState<ApplicantData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [positionFilter, setPositionFilter] = useState("");
  const [dssMode, setDssMode] = useState(false);

  // Modal State
  const [selectedApplicant, setSelectedApplicant] = useState<ApplicantData | null>(null);
  const [modalMode, setModalMode] = useState<"detail" | "status" | "interview" | "score" | "final">("detail");

  // Forms
  const [statusForm, setStatusForm] = useState({ status: "", notes: "" });
  const [interviewForm, setInterviewForm] = useState({ scheduledAt: "", location: "", interviewerName: "" });
  const [scoreForm, setScoreForm] = useState({
    communication: 0, motivation: 0, teamwork: 0, leadership: 0, technical: 0, notes: ""
  });
  const [finalForm, setFinalForm] = useState({ notes: "" });

  const loadData = useCallback(async () => {
    if (!recruitmentId) return;
    try {
      setLoading(true);
      setError(null);
      
      const statsRes = await ImsApiService.getApplicantStats(recruitmentId);
      if (statsRes?.data) setStats(statsRes.data);

      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);
      if (positionFilter) params.append("positionChoice", positionFilter);

      const appRes = await ImsApiService.getApplicants(recruitmentId, params.toString());
      if (appRes?.data) setApplicants(appRes.data);
    } catch (err: unknown) {
      console.error("Failed to load applicants:", err);
      setError("Gagal memuat data pendaftar.");
    } finally {
      setLoading(false);
    }
  }, [recruitmentId, search, statusFilter, positionFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadData, recruitmentId, search, statusFilter, positionFilter]);

  const handleExport = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/applicant/${recruitmentId}/export?format=csv`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error("Gagal export CSV");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `applicants_${recruitmentId}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Gagal mengekspor CSV");
    }
  };

  const handleOpenModal = (app: ApplicantData) => {
    setSelectedApplicant(app);
    setModalMode("detail");
    setSuccess(null);
    setError(null);
  };

  const closeModal = () => {
    setSelectedApplicant(null);
  };

  const goBackToDetail = () => setModalMode("detail");

  const openStatusChange = () => {
    setStatusForm({ status: selectedApplicant?.status || "", notes: "" });
    setModalMode("status");
  };

  const openInterviewSchedule = () => {
    setInterviewForm({
      scheduledAt: selectedApplicant?.interview?.scheduledAt ? new Date(selectedApplicant.interview.scheduledAt).toISOString().slice(0,16) : "",
      location: selectedApplicant?.interview?.location || "",
      interviewerName: selectedApplicant?.interview?.interviewerName || ""
    });
    setModalMode("interview");
  };

  const openInterviewScore = () => {
    const s = selectedApplicant?.interview?.scoring;
    setScoreForm({
      communication: s?.communication || 0,
      motivation: s?.motivation || 0,
      teamwork: s?.teamwork || 0,
      leadership: s?.leadership || 0,
      technical: s?.technical || 0,
      notes: selectedApplicant?.interview?.notes || ""
    });
    setModalMode("score");
  };

  const openFinalResult = () => {
    setFinalForm({ notes: "" });
    setModalMode("final");
  };

  const submitStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApplicant) return;
    try {
      const res = await ImsApiService.updateApplicantStatus(selectedApplicant._id, statusForm);
      setSelectedApplicant(res.data);
      setSuccess("Status berhasil diubah.");
      loadData();
      goBackToDetail();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || (err as Error)?.message || "Gagal mengubah status.");
    }
  };

  const submitInterviewSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApplicant) return;
    try {
      const res = await ImsApiService.scheduleInterview(selectedApplicant._id, interviewForm);
      setSelectedApplicant(res.data);
      setSuccess("Jadwal interview berhasil diatur.");
      loadData();
      goBackToDetail();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || (err as Error)?.message || "Gagal mengatur jadwal interview.");
    }
  };

  const submitInterviewScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApplicant) return;
    try {
      const res = await ImsApiService.submitInterviewResult(selectedApplicant._id, {
        scoring: {
          communication: Number(scoreForm.communication),
          motivation: Number(scoreForm.motivation),
          teamwork: Number(scoreForm.teamwork),
          leadership: Number(scoreForm.leadership),
          technical: Number(scoreForm.technical)
        },
        notes: scoreForm.notes
      });
      setSelectedApplicant(res.data);
      setSuccess("Nilai interview berhasil disimpan.");
      loadData();
      goBackToDetail();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || (err as Error)?.message || "Gagal menyimpan nilai.");
    }
  };

  const submitFinalResult = async (status: string) => {
    if (!selectedApplicant) return;
    try {
      const res = await ImsApiService.setFinalResult(selectedApplicant._id, {
        status, notes: finalForm.notes
      });
      setSelectedApplicant(res.data);
      setSuccess(`Hasil akhir berhasil ditetapkan: ${status}`);
      loadData();
      goBackToDetail();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || (err as Error)?.message || "Gagal menetapkan hasil.");
    }
  };

  if (!recruitmentId) {
    return (
      <DashboardShell>
        <div className="p-6">
          <p className="text-red-400">ID Oprec tidak ditemukan.</p>
          <Link href="/oprec" className="text-primary mt-4 inline-block hover:underline">Kembali ke Oprec</Link>
        </div>
      </DashboardShell>
    );
  }

  const statusColors: Record<string, string> = {
    submitted: "bg-surface-2 text-ink-muted border-hairline",
    reviewing: "bg-surface-2 text-ink-muted border-hairline-strong",
    passed_review: "bg-surface-2 text-ink-muted border-hairline",
    failed_review: "bg-surface-2 text-ink-muted border-hairline-strong",
    interview_scheduled: "bg-surface-2 text-ink-muted border-hairline",
    interviewed: "bg-surface-2 text-ink-muted border-hairline-strong",
    accepted: "bg-semantic-success/10 text-semantic-success border-semantic-success/20",
    rejected: "bg-surface-2 text-ink-muted border-hairline-strong",
    withdrawn: "bg-surface-2 text-ink-muted border-hairline"
  };

  const statusLabels: Record<string, string> = {
    submitted: "Masuk", reviewing: "Sedang Direview", passed_review: "Lolos Berkas",
    failed_review: "Gagal Berkas", interview_scheduled: "Jadwal Wawancara",
    interviewed: "Sudah Wawancara", accepted: "Diterima", rejected: "Ditolak", withdrawn: "Mundur"
  };

  return (
    <DashboardShell allowedRoles={['super-admin', 'kabem', 'wakabem', 'sekretaris', 'sekretaris-umum', 'sekretaris-administrasi', 'sekretaris-kegiatan']}>
      <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-hairline pb-6">
          <div className="flex items-center gap-4">
            <Link href="/oprec" className="p-2 bg-surface-2 hover:bg-primary/10 rounded-xl transition-colors">
              <ChevronLeft size={20} className="text-primary" />
            </Link>
            <div>
              <h1 className="text-3xl font-extrabold text-ink tracking-tight">Kelola Pendaftar</h1>
              <p className="text-sm text-ink-muted mt-1">
                Review, atur jadwal wawancara, dan nilai pendaftar.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setDssMode(!dssMode)}
              className={`flex items-center gap-2 border font-semibold px-4 py-2.5 rounded-xl transition-all active:scale-95 text-sm ${dssMode ? 'bg-accent-gold text-ink border-accent-gold' : 'bg-surface-2 border-accent-gold/50 text-accent-gold hover:bg-accent-gold/10'}`}
              title="Rekomendasi Pintar: Urutkan berdasarkan Skor Tertinggi"
            >
              <Activity size={16} />
              Rekomendasi Pintar
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 bg-surface-2 border border-hairline hover:border-hairline text-primary hover:text-ink font-semibold px-4 py-2.5 rounded-xl transition-all active:scale-95 text-sm"
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {[
              { label: "Total", val: stats.total, color: "text-blue-400" },
              { label: "Menunggu", val: stats.waiting_review, color: "text-purple-400" },
              { label: "Lolos Berkas", val: stats.passed_review, color: "text-emerald-400" },
              { label: "Gagal Berkas", val: stats.failed_review, color: "text-red-400" },
              { label: "Jadwal", val: stats.interview_scheduled, color: "text-yellow-400" },
              { label: "Diwawancara", val: stats.interviewed, color: "text-indigo-400" },
              { label: "Diterima", val: stats.accepted, color: "text-green-400" },
              { label: "Ditolak", val: stats.rejected, color: "text-gray-400" },
            ].map((s, i) => (
              <div key={i} className="bg-surface-1 p-4 rounded-xl border border-hairline flex flex-col items-center justify-center text-center">
                <span className={`text-2xl font-bold ${s.color}`}>{s.val}</span>
                <span className="text-[10px] text-ink-muted uppercase tracking-wider font-bold mt-1">{s.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted w-4 h-4" />
            <input
              type="text"
              placeholder="Cari nama atau NIM..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-2 border border-hairline rounded-xl pl-10 pr-4 py-2.5 text-sm text-ink focus:outline-none focus:border-hairline focus:ring-1 focus:ring-sage transition-all"
            />
          </div>
          <div className="w-full md:w-48 relative z-20">
            <CustomSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: "", label: "Semua Status" },
                ...Object.entries(statusLabels).map(([k, v]) => ({ value: k, label: v }))
              ]}
              className="bg-surface-2 border border-hairline rounded-xl py-2.5 text-sm text-ink focus:border-hairline"
            />
          </div>
          <input
            type="text"
            placeholder="Filter Posisi"
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
            className="w-full md:w-48 bg-surface-2 border border-hairline rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-hairline focus:ring-1 focus:ring-sage transition-all"
          />
        </div>

        {/* Table */}
        <div className="bg-surface-1 border border-hairline rounded-xl overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-ink-muted">Memuat pendaftar...</div>
          ) : applicants.length === 0 ? (
            <div className="p-8 text-center text-ink-muted">Tidak ada pendaftar yang cocok dengan filter.</div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-surface-2 text-ink-muted border-b border-hairline">
                <tr>
                  <th className="px-6 py-4 font-bold">Pendaftar</th>
                  <th className="px-6 py-4 font-bold">NIM / Dept</th>
                  <th className="px-6 py-4 font-bold">Posisi</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                  <th className="px-6 py-4 text-center font-bold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {(dssMode ? [...applicants].sort((a,b) => (b.interview?.scoring?.finalScore || 0) - (a.interview?.scoring?.finalScore || 0)) : applicants).map((app) => (
                  <tr key={app._id} className={`border-b border-hairline hover:bg-primary/10 transition-colors ${dssMode && (app.interview?.scoring?.finalScore || 0) >= 80 ? 'bg-accent-gold/5' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="font-bold text-ink flex items-center gap-2">
                        {app.name} 
                        {dssMode && (app.interview?.scoring?.finalScore || 0) >= 80 && <span className="px-1.5 py-0.5 bg-accent-gold text-ink text-[9px] rounded uppercase font-black">Rekomendasi</span>}
                      </div>
                      <div className="text-xs text-ink-muted">{app.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono text-primary">{app.nim}</div>
                      <div className="text-xs text-ink-muted">{app.department} &apos;{app.batch}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium bg-surface-2 inline-block px-2 py-1 rounded-full border border-hairline">
                        {app.positionChoice}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase border inline-block w-max ${statusColors[app.status] || "text-ink-muted border-hairline"}`}>
                          {statusLabels[app.status] || app.status}
                        </span>
                        {dssMode && app.interview?.scoring?.finalScore !== undefined && (
                          <span className="text-[10px] font-bold text-accent-gold">
                            Skor: {app.interview.scoring.finalScore.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleOpenModal(app)}
                        className="p-2 hover:bg-primary/10 rounded-lg text-primary transition-all inline-flex items-center gap-2"
                        title="Detail Pendaftar"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Detail & Action Modal */}
      {selectedApplicant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-surface-1 border border-hairline rounded-xl w-full max-w-3xl overflow-hidden animate-fade-in bg-surface-1-dark bg-opacity-95 my-8">
            <div className="px-6 py-4 border-b border-hairline flex justify-between items-center bg-surface-2 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                {modalMode !== "detail" && (
                  <button onClick={goBackToDetail} className="p-1 hover:bg-primary/10 rounded-md text-primary transition-colors">
                    <ChevronLeft size={20} />
                  </button>
                )}
                <h2 className="text-lg font-bold text-ink">
                  {modalMode === "detail" ? "Detail Pendaftar" :
                   modalMode === "status" ? "Ubah Status" :
                   modalMode === "interview" ? "Jadwalkan Wawancara" :
                   modalMode === "score" ? "Nilai Wawancara" : "Keputusan Akhir"}
                </h2>
              </div>
              <button
                onClick={closeModal}
                className="text-ink-muted hover:text-ink p-1 transition-colors rounded-lg hover:bg-red-500/20"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
              {error && (
                <div className="mb-4 flex items-start gap-3 p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-sm">
                  <Info size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div className="mb-4 flex items-start gap-3 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-sm">
                  <Check size={16} className="mt-0.5 shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              {modalMode === "detail" && (
                <div className="flex flex-col gap-6">
                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 pb-4 border-b border-hairline">
                    <button onClick={openStatusChange} className="flex items-center gap-2 px-3 py-1.5 bg-surface-2 hover:bg-surface-2 border border-hairline rounded-lg text-xs font-semibold text-ink transition-all">
                      <Activity size={14} className="text-primary" /> Ubah Status
                    </button>
                    <button onClick={openInterviewSchedule} className="flex items-center gap-2 px-3 py-1.5 bg-surface-2 hover:bg-surface-2 border border-yellow-500/30 rounded-lg text-xs font-semibold text-ink transition-all">
                      <CalendarPlus size={14} className="text-yellow-400" /> Jadwal Wawancara
                    </button>
                    <button onClick={openInterviewScore} className="flex items-center gap-2 px-3 py-1.5 bg-surface-2 hover:bg-surface-2 border border-indigo-500/30 rounded-lg text-xs font-semibold text-ink transition-all">
                      <ClipboardCheck size={14} className="text-indigo-400" /> Nilai Wawancara
                    </button>
                    <button onClick={openFinalResult} className="flex items-center gap-2 px-3 py-1.5 bg-primary text-ink hover:bg-primary-hover rounded-lg text-xs font-bold transition-all ml-auto">
                      <FileBadge size={14} /> Keputusan Akhir
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Col: Info */}
                    <div className="flex flex-col gap-4">
                      <div>
                        <h3 className="text-2xl font-bold text-ink">{selectedApplicant.name}</h3>
                        <div className="text-primary font-mono text-sm">{selectedApplicant.nim} • {selectedApplicant.department} &apos;{selectedApplicant.batch}</div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-1 rounded uppercase border ${statusColors[selectedApplicant.status] || "text-ink-muted border-hairline"}`}>
                          {statusLabels[selectedApplicant.status] || selectedApplicant.status}
                        </span>
                        <span className="text-xs bg-surface-2 border border-hairline px-2 py-1 rounded text-ink-muted">
                          Posisi: <span className="font-bold text-primary">{selectedApplicant.positionChoice}</span>
                        </span>
                      </div>

                      <div className="space-y-2 mt-2 text-sm">
                        <div className="flex justify-between border-b border-hairline pb-1">
                          <span className="text-ink-muted">Email</span>
                          <span className="text-ink">{selectedApplicant.email}</span>
                        </div>
                        <div className="flex justify-between border-b border-hairline pb-1">
                          <span className="text-ink-muted">Telepon</span>
                          <span className="text-ink">{selectedApplicant.phone || "-"}</span>
                        </div>
                        {selectedApplicant.cv?.url && (
                          <div className="flex justify-between border-b border-hairline pb-1">
                            <span className="text-ink-muted">CV</span>
                            <a href={selectedApplicant.cv.url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline flex items-center gap-1">
                              Lihat CV <FileText size={12} />
                            </a>
                          </div>
                        )}
                        {selectedApplicant.portfolioUrl && (
                          <div className="flex justify-between border-b border-hairline pb-1">
                            <span className="text-ink-muted">Portofolio</span>
                            <a href={selectedApplicant.portfolioUrl} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">Link</a>
                          </div>
                        )}
                      </div>

                      {selectedApplicant.motivation && (
                        <div className="bg-surface-2 p-3 rounded-xl border border-hairline mt-2">
                          <h4 className="text-xs font-bold text-ink-muted uppercase mb-1">Motivasi</h4>
                          <p className="text-sm text-ink-muted leading-relaxed italic">&quot;{selectedApplicant.motivation}&quot;</p>
                        </div>
                      )}
                    </div>

                    {/* Right Col: Timeline & Interview */}
                    <div className="flex flex-col gap-6 border-l border-hairline pl-6">
                      {/* Interview Info */}
                      {selectedApplicant.interview && (selectedApplicant.interview.scheduledAt || selectedApplicant.interview.scoring) && (
                        <div>
                          <h4 className="text-sm font-bold text-primary flex items-center gap-2 mb-3">
                            <Clock size={16} /> Data Wawancara
                          </h4>
                          <div className="bg-surface-2 p-4 rounded-xl border border-hairline text-sm space-y-2">
                            {selectedApplicant.interview.scheduledAt && (
                              <>
                                <div><span className="text-ink-muted">Jadwal:</span> {new Date(selectedApplicant.interview.scheduledAt).toLocaleString("id-ID")}</div>
                                <div><span className="text-ink-muted">Lokasi:</span> {selectedApplicant.interview.location}</div>
                                <div><span className="text-ink-muted">Pewawancara:</span> {selectedApplicant.interview.interviewerName || "-"}</div>
                              </>
                            )}
                            {selectedApplicant.interview.scoring && (
                              <div className="mt-4 pt-3 border-t border-hairline">
                                <div className="text-xs font-bold text-ink-muted mb-2">HASIL PENILAIAN</div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>Komunikasi: <span className="font-bold text-primary">{selectedApplicant.interview.scoring.communication}</span></div>
                                  <div>Motivasi: <span className="font-bold text-primary">{selectedApplicant.interview.scoring.motivation}</span></div>
                                  <div>Teamwork: <span className="font-bold text-primary">{selectedApplicant.interview.scoring.teamwork}</span></div>
                                  <div>Leadership: <span className="font-bold text-primary">{selectedApplicant.interview.scoring.leadership}</span></div>
                                  <div>Teknis: <span className="font-bold text-primary">{selectedApplicant.interview.scoring.technical}</span></div>
                                </div>
                                <div className="mt-2 text-sm font-bold text-emerald-400">
                                  Skor Akhir: {selectedApplicant.interview.scoring.finalScore?.toFixed(2)}
                                </div>
                                {selectedApplicant.interview.notes && (
                                  <div className="mt-2 text-xs text-ink-muted italic border-l-2 border-hairline pl-2">
                                    &quot;{selectedApplicant.interview.notes}&quot;
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Status History */}
                      <div>
                        <h4 className="text-sm font-bold text-primary flex items-center gap-2 mb-3">
                          <Activity size={16} /> Riwayat Status
                        </h4>
                        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-sage/20 before:to-transparent">
                          {selectedApplicant.statusHistory.map((hist, idx) => (
                            <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                              <div className="flex items-center justify-center w-4 h-4 rounded-full border-2 border-hairline bg-surface-1-dark shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2" />
                              <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded-xl bg-surface-2 border border-hairline">
                                <div className="flex items-center justify-between mb-1">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${statusColors[hist.status] || "text-ink-muted border border-hairline"}`}>
                                    {statusLabels[hist.status] || hist.status}
                                  </span>
                                  <time className="text-[10px] text-ink-muted">{new Date(hist.updatedAt).toLocaleDateString("id-ID")}</time>
                                </div>
                                {hist.notes && <p className="text-xs text-ink-muted mt-1">{hist.notes}</p>}
                                {hist.updatedBy && <p className="text-[9px] text-ink-muted mt-1">By: {hist.updatedBy.name}</p>}
                              </div>
                            </div>
                          )).reverse()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Form Modes */}
              {modalMode === "status" && (
                <form onSubmit={submitStatusChange} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-ink-muted uppercase tracking-wider">Status Baru</label>
                    <div className="relative w-full z-20">
                      <CustomSelect
                        value={statusForm.status}
                        onChange={(val) => setStatusForm({ ...statusForm, status: val })}
                        options={[
                          { value: "", label: "Pilih Status..." },
                          ...Object.entries(statusLabels).map(([k, v]) => ({ value: k, label: v }))
                        ]}
                        className="bg-surface-2 border border-hairline rounded-xl py-2.5 text-sm text-ink focus:border-hairline"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-ink-muted uppercase tracking-wider">Catatan Tambahan (Opsional)</label>
                    <textarea
                      value={statusForm.notes}
                      onChange={(e) => setStatusForm({ ...statusForm, notes: e.target.value })}
                      className="bg-surface-2 border border-hairline rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-hairline focus:ring-1 focus:ring-sage resize-none"
                      rows={3}
                      placeholder="Alasan perubahan status..."
                    />
                  </div>
                  <button type="submit" className="bg-primary hover:bg-primary-hover text-ink font-bold py-2.5 rounded-xl transition-all active:scale-95 text-sm mt-2">
                    Simpan Perubahan
                  </button>
                </form>
              )}

              {modalMode === "interview" && (
                <form onSubmit={submitInterviewSchedule} className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-ink-muted uppercase tracking-wider">Waktu & Tanggal</label>
                      <input
                        type="datetime-local"
                        value={interviewForm.scheduledAt}
                        onChange={(e) => setInterviewForm({ ...interviewForm, scheduledAt: e.target.value })}
                        className="bg-surface-2 border border-hairline rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-hairline color-scheme-dark"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-ink-muted uppercase tracking-wider">Lokasi / Link Meeting</label>
                      <input
                        type="text"
                        value={interviewForm.location}
                        onChange={(e) => setInterviewForm({ ...interviewForm, location: e.target.value })}
                        className="bg-surface-2 border border-hairline rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-hairline"
                        placeholder="Ruang 1 / Zoom Link"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-ink-muted uppercase tracking-wider">Nama Pewawancara (Opsional)</label>
                    <input
                      type="text"
                      value={interviewForm.interviewerName}
                      onChange={(e) => setInterviewForm({ ...interviewForm, interviewerName: e.target.value })}
                      className="bg-surface-2 border border-hairline rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-hairline"
                      placeholder="Budi dkk"
                    />
                  </div>
                  <button type="submit" className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2.5 rounded-xl transition-all active:scale-95 text-sm mt-2">
                    Simpan Jadwal
                  </button>
                </form>
              )}

              {modalMode === "score" && (
                <form onSubmit={submitInterviewScore} className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { key: "communication", label: "Komunikasi (0-100)" },
                      { key: "motivation", label: "Motivasi (0-100)" },
                      { key: "teamwork", label: "Teamwork (0-100)" },
                      { key: "leadership", label: "Leadership (0-100)" },
                      { key: "technical", label: "Teknis (0-100)" },
                    ].map((f) => (
                      <div key={f.key} className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-ink-muted uppercase tracking-wider">{f.label}</label>
                        <input
                          type="number"
                          min="0" max="100"
                          value={scoreForm[f.key as keyof typeof scoreForm]}
                          onChange={(e) => setScoreForm({ ...scoreForm, [f.key]: e.target.value })}
                          className="bg-surface-2 border border-hairline rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-hairline"
                          required
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col gap-1.5 mt-2">
                    <label className="text-xs font-bold text-ink-muted uppercase tracking-wider">Catatan Penilaian (Kelebihan/Kekurangan)</label>
                    <textarea
                      value={scoreForm.notes}
                      onChange={(e) => setScoreForm({ ...scoreForm, notes: e.target.value })}
                      className="bg-surface-2 border border-hairline rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-hairline resize-none"
                      rows={4}
                      placeholder="Aktif berorganisasi, komunikatif, namun..."
                    />
                  </div>
                  <button type="submit" className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2.5 rounded-xl transition-all active:scale-95 text-sm mt-2">
                    Simpan Penilaian
                  </button>
                </form>
              )}

              {modalMode === "final" && (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-ink-muted uppercase tracking-wider">Catatan Akhir (Opsional)</label>
                    <textarea
                      value={finalForm.notes}
                      onChange={(e) => setFinalForm({ notes: e.target.value })}
                      className="bg-surface-2 border border-hairline rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-hairline resize-none"
                      rows={3}
                      placeholder="Diterima karena nilai sangat baik..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => submitFinalResult("rejected")}
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 hover:border-red-500 font-bold py-3 rounded-xl transition-all active:scale-95 text-sm flex items-center justify-center gap-2"
                    >
                      <UserX size={18} /> Tolak Pendaftar
                    </button>
                    <button
                      onClick={() => submitFinalResult("accepted")}
                      className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition-all active:scale-95 text-sm flex items-center justify-center gap-2"
                    >
                      <UserCheck size={18} /> Terima Pendaftar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

export default function ApplicantsPage() {
  return (
    <Suspense fallback={
      <DashboardShell>
        <div className="flex flex-col items-center justify-center py-40 gap-4">
          <div className="w-10 h-10 animate-spin rounded-full border-4 border-hairline border-t-sage" />
          <span className="text-sm text-ink-muted">Memuat dashboard...</span>
        </div>
      </DashboardShell>
    }>
      <ApplicantsPageContent />
    </Suspense>
  );
}
