"use client";

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from "react";
import DashboardShell from "@/components/DashboardShell";
import ImsApiService, { API_BASE_URL } from "@/lib/api";
import { FileText, Plus, Loader2, Calendar, Award, ExternalLink, Edit3, Eye, ClipboardCheck, Download } from "lucide-react";

interface PkkmbAssignment {
  _id: string;
  title: string;
  description: string;
  dueDate: string;
}

interface MabaItem {
  _id: string;
  nim: string;
  name: string;
  kelompok: string;
}

interface PkkmbSubmission {
  _id: string;
  mabaId: MabaItem;
  fileUrl: string;
  status: string;
  grade?: number;
  feedback?: string;
}

export default function PkkmbTugasPage() {
  const [assignments, setAssignments] = useState<PkkmbAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
  });

  // Submissions Modal State
  const [subsModalOpen, setSubsModalOpen] = useState(false);
  const [subsLoading, setSubsLoading] = useState(false);
  const [subsList, setSubsList] = useState<PkkmbSubmission[]>([]);
  const [activeAssignmentId, setActiveAssignmentId] = useState("");
  const [activeAssignmentTitle, setActiveAssignmentTitle] = useState("");

  // Grade Modal State
  const [gradeModalOpen, setGradeModalOpen] = useState(false);
  const [gradingSubId, setGradingSubId] = useState("");
  const [gradingSubName, setGradingSubName] = useState("");
  const [gradeValue, setGradeValue] = useState<number>(100);
  const [gradeFeedback, setGradeFeedback] = useState("");
  const [isGrading, setIsGrading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await ImsApiService.getPkkmbAssignments<PkkmbAssignment>();
      if (res.success && res.data) {
        setAssignments(res.data);
      }
    } catch (err) {
      console.error("Failed to load assignments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setEditingId("");
    // Default due date: tomorrow 23:59
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 0, 0);

    setFormData({
      title: "",
      description: "",
      dueDate: tomorrow.toISOString().substring(0, 16),
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (assignment: PkkmbAssignment) => {
    setIsEditing(true);
    setEditingId(assignment._id);
    setFormData({
      title: assignment.title,
      description: assignment.description,
      dueDate: new Date(assignment.dueDate).toISOString().substring(0, 16),
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      let res: { success?: boolean };
      if (isEditing) {
        res = await ImsApiService.updatePkkmbAssignment(editingId, formData);
      } else {
        res = await ImsApiService.createPkkmbAssignment(formData);
      }

      if (res.success) {
        setModalOpen(false);
        fetchData();
      }
    } catch (err) {
      console.error("Failed to save assignment:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewSubmissions = async (assignment: PkkmbAssignment) => {
    setActiveAssignmentId(assignment._id);
    setActiveAssignmentTitle(assignment.title);
    setSubsModalOpen(true);
    setSubsLoading(true);
    setSubsList([]);

    try {
      const res = await ImsApiService.getPkkmbSubmissions<PkkmbSubmission>(assignment._id);
      if (res.success && res.data) {
        setSubsList(res.data);
      }
    } catch (err) {
      console.error("Failed to load submissions:", err);
    } finally {
      setSubsLoading(false);
    }
  };

  const handleExportCsv = () => {
    fetch(`${API_BASE_URL}/pkkmb/admin/submissions/export/${activeAssignmentId}`, {
      credentials: 'include'
    })
      .then(res => res.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `penugasan-${activeAssignmentId}.csv`;
        a.click();
      });
  };

  const handleOpenGrade = (sub: { _id: string; mabaId?: { name: string }; grade?: number; feedback?: string }) => {
    setGradingSubId(sub._id);
    setGradingSubName(sub.mabaId?.name || "Mahasiswa");
    setGradeValue(sub.grade !== undefined ? sub.grade : 100);
    setGradeFeedback(sub.feedback || "");
    setGradeModalOpen(true);
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGrading(true);

    try {
      const res = await ImsApiService.gradePkkmbSubmission(gradingSubId, {
        grade: Number(gradeValue),
        feedback: gradeFeedback,
      });

      if (res.success) {
        setGradeModalOpen(false);
        // Refresh submission list
        const resSubs = await ImsApiService.getPkkmbSubmissions<PkkmbSubmission>(activeAssignmentId);
        if (resSubs.success && resSubs.data) {
          setSubsList(resSubs.data);
        }
      }
    } catch (err) {
      console.error("Failed to save grade:", err);
    } finally {
      setIsGrading(false);
    }
  };

  const formatDueDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: 'numeric',
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <DashboardShell requirePkkmbAccess>
      <div className="flex flex-col gap-6 p-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl flex items-center gap-2">
              <FileText className="w-8 h-8 text-blue-500" />
              <span>Penugasan PKKMB</span>
            </h1>
            <p className="text-sm text-ink-muted">
              Buat penugasan baru untuk mahasiswa baru, tinjau link berkas pengumpulan, dan lakukan penilaian.
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="btn-primary shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Penugasan</span>
          </button>
        </div>

        {/* Assignments list */}
        {loading ? (
          <div className="w-full py-16 flex flex-col items-center justify-center text-ink-muted">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
            <p className="text-sm">Memuat daftar tugas...</p>
          </div>
        ) : assignments.length === 0 ? (
          <div className="bg-surface-1 border border-hairline rounded-xl p-12 text-center text-ink-muted">
            Belum ada penugasan yang dibuat. Klik tombol di kanan atas untuk membuat tugas baru.
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <div key={assignment._id} className="bg-surface-1 border border-hairline rounded-xl p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-extrabold text-ink">{assignment.title}</h3>
                    <p className="text-xs sm:text-sm text-ink-muted whitespace-pre-line leading-relaxed max-w-3xl">
                      {assignment.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-semibold text-red-500 bg-red-500/10 border border-red-500/20 rounded-full px-3 py-1 shrink-0 h-fit self-start">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Batas: {formatDueDate(assignment.dueDate)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 border-t border-hairline pt-4">
                  <button
                    onClick={() => handleViewSubmissions(assignment)}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-xl bg-surface-2 hover:bg-surface-2 border border-hairline py-2.5 px-4 text-xs font-bold text-ink cursor-pointer transition-all"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Lihat Pengumpulan</span>
                  </button>
                  <button
                    onClick={() => handleOpenEdit(assignment)}
                    className="flex items-center justify-center gap-2 rounded-xl border border-hairline hover:bg-surface-2 p-2.5 text-ink cursor-pointer transition-all"
                    title="Edit Tugas"
                  >
                    <Edit3 className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* FORM MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-surface-1 border border-hairline rounded-xl p-6 sm:p-8 space-y-6 relative">
            <h3 className="text-xl font-extrabold text-ink">
              {isEditing ? "Edit Penugasan" : "Buat Penugasan Baru"}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1.5">
                <label className="field-label">Judul Tugas</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Tugas Resume Materi Ke-FT-an"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="space-y-1.5">
                <label className="field-label">Deskripsi Tugas</label>
                <textarea
                  required
                  placeholder="Tuliskan instruksi tugas secara rinci..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={5}
                  className="input-field resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="field-label">Batas Waktu Pengumpulan (Deadline)</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-hairline">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-secondary text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-primary text-xs"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Simpan Tugas"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUBMISSIONS LIST MODAL */}
      {subsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-5xl h-[80vh] flex flex-col justify-between bg-canvas border border-hairline rounded-xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
            <div className="flex flex-col gap-1 shrink-0">
              <h3 className="text-xl font-extrabold text-ink">Pengumpulan Penugasan Mahasiswa</h3>
              <p className="text-xs text-ink-muted">{activeAssignmentTitle}</p>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto border border-hairline rounded-xl">
              {subsLoading ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-ink-muted">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
                  <p className="text-xs">Memproses data pengumpulan...</p>
                </div>
              ) : subsList.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-ink-muted py-16 text-sm">
                  Belum ada mahasiswa yang mengumpulkan tugas ini.
                </div>
              ) : (
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-hairline bg-surface-2 text-ink-muted font-bold sticky top-0 bg-canvas z-10">
                      <th className="px-4 py-3">NIM</th>
                      <th className="px-4 py-3">Nama</th>
                      <th className="px-4 py-3">Kelompok</th>
                      <th className="px-4 py-3">Link Tugas</th>
                      <th className="px-4 py-3">Nilai</th>
                      <th className="px-4 py-3">Catatan Penilai</th>
                      <th className="px-4 py-3">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {subsList.map((sub) => (
                      <tr key={sub._id} className="hover:bg-surface-2">
                        <td className="px-4 py-3 font-mono font-bold">{sub.mabaId?.nim}</td>
                        <td className="px-4 py-3 font-extrabold">{sub.mabaId?.name}</td>
                        <td className="px-4 py-3 text-ink-muted">{sub.mabaId?.kelompok}</td>
                        <td className="px-4 py-3">
                          <a
                            href={sub.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-blue-400 hover:underline"
                          >
                            <span>Buka Link</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </td>
                        <td className="px-4 py-3">
                          {sub.status === "graded" ? (
                            <span className="inline-flex items-center gap-1 font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-full px-2.5 py-0.5">
                              <Award className="w-3 h-3" />
                              {sub.grade}
                            </span>
                          ) : (
                            <span className="text-ink-muted italic">Belum Dinilai</span>
                          )}
                        </td>
                        <td className="px-4 py-3 max-w-[200px] truncate text-ink-muted" title={sub.feedback || ""}>
                          {sub.feedback || "-"}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleOpenGrade(sub)}
                            className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 py-1.5 px-2.5 font-bold cursor-pointer transition-all text-3xs sm:text-2xs"
                          >
                            <ClipboardCheck className="w-3.5 h-3.5" />
                            <span>Nilai</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between shrink-0 pt-2 border-t border-hairline mt-4 gap-4">
              <div className="text-xs text-ink-muted hidden sm:block">
                Menampilkan {subsList.length} pengumpulan tugas
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleExportCsv}
                  className="flex items-center gap-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 py-2.5 px-4 text-xs font-bold transition-all"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
                <button
                  type="button"
                  onClick={() => setSubsModalOpen(false)}
                  className="rounded-xl border border-hairline hover:bg-surface-2 py-2.5 px-5 text-xs font-bold transition-all text-ink cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GRADING MODAL */}
      {gradeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-surface-1 border border-hairline rounded-xl p-6 sm:p-8 space-y-6 relative">
            <div className="space-y-1">
              <h4 className="text-lg font-extrabold text-ink">Beri Penilaian Tugas</h4>
              <p className="text-xs text-ink-muted">{gradingSubName}</p>
            </div>

            <form onSubmit={handleSaveGrade} className="space-y-4">
              <div className="space-y-1.5">
                <label className="field-label">Nilai (0 - 100)</label>
                <input
                  type="number"
                  required
                  min={0}
                  max={100}
                  value={gradeValue}
                  onChange={(e) => setGradeValue(Number(e.target.value))}
                  className="input-field"
                />
              </div>

              <div className="space-y-1.5">
                <label className="field-label">Catatan Feedback / Koreksi</label>
                <textarea
                  placeholder="Tuliskan catatan perbaikan atau feedback untuk mahasiswa..."
                  value={gradeFeedback}
                  onChange={(e) => setGradeFeedback(e.target.value)}
                  rows={4}
                  className="input-field resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setGradeModalOpen(false)}
                  className="btn-secondary text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isGrading}
                  className="btn-primary text-xs"
                >
                  {isGrading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Simpan Nilai"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
