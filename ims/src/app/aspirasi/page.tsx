"use client";

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from "react";
import DashboardShell from "@/components/DashboardShell";
import { CustomSelect } from "@/components/ui/CustomSelect";
import ImsApiService from "@/lib/api";
import {
  MessageSquare,
  Search,
  Filter,
  Info,
  Calendar,
  ChevronDown,
  CheckCircle,
  AlertTriangle,
  User,
  Clock,
  Send,
  Building,
  Trash2,
  Edit2,
} from "lucide-react";
import { useConfirm } from "@/components/ui/CustomConfirm";

interface Submitter {
  _id: string;
  name: string;
  email: string;
}

interface Department {
  _id: string;
  name: string;
  isActive?: boolean;
}

interface AspirationItem {
  _id: string;
  title: string;
  description: string;
  type: string;
  urgency: "low" | "medium" | "high" | "urgent";
  status: "new" | "processing" | "resolved" | "rejected";
  isAnonymous: boolean;
  submitter?: Submitter;
  assignedDepartment?: Department;
  officialResponse?: string;
  dateSubmitted: string;
  targetResponseDate: string;
  firstResponseDate?: string;
  resolutionDate?: string;
  cabinetPeriod: string;
  sawScore?: number;
}

export default function AspirasiMahasiswaPage() {
  const { confirm } = useConfirm();
  const [aspirations, setAspirations] = useState<AspirationItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dssMode, setDssMode] = useState(false);
  const [sawResults, setSawResults] = useState<{ aspiration: AspirationItem; score: number }[]>([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedUrgency, setSelectedUrgency] = useState("");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AspirationItem | null>(null);
  const [formData, setFormData] = useState({
    status: "new" as "new" | "processing" | "resolved" | "rejected",
    assignedDepartment: "",
    officialResponse: "",
  });

  const loadDepartments = async () => {
    try {
      const res = await ImsApiService.getDepartments<Department>();
      if (res?.data) {
        setDepartments(res.data.filter((d) => d.isActive));
      }
    } catch (err) {
      console.error("Failed to load departments:", err);
    }
  };

  const loadAspirations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (dssMode) {
        const res = await ImsApiService.getAspirationSawPriority<{ aspiration: AspirationItem; score: number }[]>("2026");
        if (res?.data) {
          // Flatten SAW response to match AspirationItem interface but with score
          const mappedData = res.data.map((item) => ({
            ...item.aspiration,
            sawScore: item.score
          }));
          setAspirations(mappedData);
          setSawResults(res.data);
        }
      } else {
        const res = await ImsApiService.getAspirations<AspirationItem>(
          selectedStatus || undefined,
          selectedUrgency || undefined,
          "2026",
        );
        if (res?.data) {
          setAspirations(res.data);
        }
      }
    } catch (err: unknown) {
      console.error("Failed to load aspirations:", err);
      setError("Gagal memuat daftar aspirasi mahasiswa.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  useEffect(() => {
    loadAspirations();
  }, [selectedStatus, selectedUrgency, dssMode]);

  // Client-side search
  const filteredAspirations = aspirations.filter((asp) => {
    const query = searchQuery.toLowerCase();
    return (
      asp.title.toLowerCase().includes(query) ||
      asp.description.toLowerCase().includes(query) ||
      (!asp.isAnonymous && asp.submitter?.name && asp.submitter.name.toLowerCase().includes(query))
    );
  });

  const handleOpenRespond = (asp: AspirationItem) => {
    setEditingItem(asp);
    setFormData({
      status: asp.status,
      assignedDepartment: asp.assignedDepartment?._id || "",
      officialResponse: asp.officialResponse || "",
    });
    setModalOpen(true);
    setError(null);
  };

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setError(null);
    setSuccess(null);

    const payload = {
      status: formData.status,
      assignedDepartment: formData.assignedDepartment || null,
      officialResponse: formData.officialResponse || undefined,
    };

    try {
      await ImsApiService.updateAspiration(editingItem._id, payload);
      setSuccess("Tanggapan resmi aspirasi berhasil disimpan.");
      setModalOpen(false);
      loadAspirations();
    } catch (err: unknown) {
      console.error("Failed to save response:", err);
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || (err as Error)?.message || "Gagal menyimpan tanggapan.");
    }
  };

  const handleDelete = async (id: string, title: string) => {
    const confirmed = await confirm({
      title: "Hapus Aspirasi",
      message: `Apakah Anda yakin ingin menghapus aspirasi "${title}"?`,
      type: "danger",
      confirmLabel: "Ya, Hapus"
    });
    if (!confirmed) return;
    setError(null);
    setSuccess(null);

    try {
      await ImsApiService.deleteAspiration(id);
      setSuccess("Aspirasi berhasil dihapus.");
      loadAspirations();
    } catch (err: unknown) {
      console.error("Delete error:", err);
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || (err as Error)?.message || "Gagal menghapus aspirasi.");
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case "urgent":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "high":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "medium":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      default:
        return "bg-surface-2 text-ink-muted border-foreground/10";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "resolved":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "rejected":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "processing":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      default:
        return "bg-surface-2 text-ink-muted border-foreground/10";
    }
  };

  const isSlaBreached = (targetStr: string, status: string) => {
    if (status === "resolved" || status === "rejected") return false;
    return new Date(targetStr) < new Date();
  };

  return (
    <DashboardShell>
      <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-hairline pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-ink tracking-tight">Aspirasi Mahasiswa</h1>
            <p className="text-sm text-ink-muted mt-1">
              Dengar, kelola, disposisi, dan berikan tanggapan resmi atas keluhan, saran, maupun aspirasi civitas akademika.
            </p>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="flex items-start gap-3 p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-sm">
            <Info size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-start gap-3 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-sm">
            <CheckCircle size={16} className="mt-0.5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 bg-surface-2 p-4 rounded-xl border border-hairline">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-3.5 text-ink-muted" size={16} />
            <input
              type="text"
              placeholder="Cari aspirasi berdasarkan judul, konten, atau pengirim..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-2 border border-hairline rounded-xl pl-10 pr-4 py-2.5 text-sm text-ink placeholder-foreground/40 focus:outline-none focus:border-hairline focus:ring-1 focus:ring-sage"
            />
          </div>

          <div className="flex gap-4">
            {/* Status Filter */}
            <div className="w-36 relative z-20">
              <CustomSelect
                value={selectedStatus}
                onChange={setSelectedStatus}
                options={[
                  { value: "", label: "Semua Status" },
                  { value: "new", label: "New" },
                  { value: "processing", label: "Processing" },
                  { value: "resolved", label: "Resolved" },
                  { value: "rejected", label: "Rejected" },
                ]}
                className="bg-surface-2 border border-hairline rounded-xl py-2.5 text-sm text-ink focus:border-hairline"
              />
            </div>

            {/* Urgency Filter */}
            <div className="w-36 relative z-10">
              <CustomSelect
                value={selectedUrgency}
                onChange={setSelectedUrgency}
                options={[
                  { value: "", label: "Semua Urgensi" },
                  { value: "low", label: "Low" },
                  { value: "medium", label: "Medium" },
                  { value: "high", label: "High" },
                  { value: "urgent", label: "Urgent" },
                ]}
                className="bg-surface-2 border border-hairline rounded-xl py-2.5 text-sm text-ink focus:border-hairline"
              />
            </div>
            
            <button
              onClick={() => setDssMode(!dssMode)}
              className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
                dssMode
                  ? "bg-primary text-ink "
                  : "bg-surface-2 border border-hairline text-ink hover:bg-surface-2"
              }`}
            >
              <CheckCircle size={16} />
              Rekomendasi Prioritas
            </button>
          </div>
        </div>

        {/* Content Table */}
        {loading && filteredAspirations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-8 h-8 animate-spin rounded-full border-4 border-hairline border-t-sage" />
            <span className="text-sm text-ink-muted">Memuat aspirasi...</span>
          </div>
        ) : filteredAspirations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-hairline rounded-xl bg-surface-2 text-ink-muted text-sm gap-2">
            <MessageSquare size={32} className="text-primary/40" />
            <span>Belum ada aspirasi terdaftar.</span>
          </div>
        ) : (
          <div className="bg-surface-1 border border-hairline rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-2 text-xs font-bold text-ink-muted uppercase tracking-wider border-b border-hairline">
                    <th className="px-6 py-4">Aspirasi & Pengirim</th>
                    <th className="px-6 py-4">Urgensi</th>
                    {dssMode && <th className="px-6 py-4 text-center">Skor Prioritas</th>}
                    <th className="px-6 py-4">Disposisi Departemen</th>
                    <th className="px-6 py-4">Status & SLA</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline text-sm text-ink-muted">
                  {filteredAspirations.map((asp) => (
                    <tr key={asp._id} className="hover:bg-surface-2 transition-all">
                      <td className="px-6 py-4 max-w-sm">
                        <div className="flex flex-col">
                          <span className="font-semibold text-ink leading-snug">{asp.title}</span>
                          <p className="text-xs text-ink-muted line-clamp-2 mt-1">{asp.description}</p>
                          <span className="text-[10px] text-ink-muted flex items-center gap-1 mt-2">
                            <User size={10} /> {asp.isAnonymous ? "Anonim" : asp.submitter?.name || "Mahasiswa"}
                            {" • "}
                            <Calendar size={10} /> {new Date(asp.dateSubmitted).toLocaleDateString("id-ID", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase border ${getUrgencyBadge(
                            asp.urgency,
                          )}`}
                        >
                          {asp.urgency}
                        </span>
                      </td>
                      {dssMode && (
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-primary/10 text-primary border border-hairline font-bold text-sm">
                            {asp.sawScore?.toFixed(3)}
                          </span>
                        </td>
                      )}
                      <td className="px-6 py-4 text-xs font-semibold text-ink-muted">
                        <span className="flex items-center gap-1.5">
                          <Building size={12} className="text-ink-muted" />
                          {asp.assignedDepartment?.name || "Belum Disposisikan"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 text-xs">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold uppercase border w-max ${getStatusBadge(
                              asp.status,
                            )}`}
                          >
                            {asp.status}
                          </span>
                          {/* SLA Limit check */}
                          {isSlaBreached(asp.targetResponseDate, asp.status) ? (
                            <span className="text-[9px] text-red-400 font-bold uppercase flex items-center gap-1 tracking-wider mt-1">
                              <AlertTriangle size={10} /> SLA Terlewati
                            </span>
                          ) : (
                            <span className="text-[10px] text-ink-muted font-mono mt-1 flex items-center gap-1">
                              <Clock size={10} /> Respon: {new Date(asp.targetResponseDate).toLocaleDateString("id-ID", {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenRespond(asp)}
                            className="p-2 hover:bg-primary/10 rounded-lg text-primary hover:text-ink transition-all active:scale-90"
                            title="Tanggapi Aspirasi"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(asp._id, asp.title)}
                            className="p-2 hover:bg-red-500/10 rounded-lg text-red-400 hover:text-red-300 transition-all active:scale-90"
                            title="Hapus Aspirasi"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tanggapan/Response Modal */}
        {modalOpen && editingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-surface-1 border border-hairline rounded-xl w-full max-w-lg overflow-hidden animate-fade-in bg-surface-1-dark bg-opacity-95 max-h-[90vh] flex flex-col">
              <div className="px-6 py-4 border-b border-hairline flex justify-between items-center bg-surface-2">
                <h2 className="text-lg font-bold text-ink">Detail & Tanggapan Aspirasi</h2>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-ink-muted hover:text-ink text-sm font-semibold p-1"
                >
                  Batal
                </button>
              </div>

              <form onSubmit={handleSubmitResponse} className="p-6 flex flex-col gap-4 overflow-y-auto">
                {/* Information Card */}
                <div className="bg-surface-2 border border-hairline p-4 rounded-xl flex flex-col gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-ink-muted">Pengirim</span>
                    <span className="font-semibold text-ink">
                      {editingItem.isAnonymous ? "Anonim" : editingItem.submitter?.name || "Mahasiswa"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-muted">Urgenitas</span>
                    <span className="font-semibold uppercase text-primary">{editingItem.urgency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-muted">Batas Waktu Tanggapan (SLA)</span>
                    <span className="font-semibold text-ink-muted">
                      {new Date(editingItem.targetResponseDate).toLocaleString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="border-t border-hairline my-1 pt-2">
                    <span className="text-ink-muted uppercase font-bold tracking-wider">Isi Aspirasi:</span>
                    <p className="text-ink mt-1 leading-relaxed text-[13px] bg-surface-1-dark/40 p-2.5 rounded-xl border border-hairline">
                      {editingItem.description}
                    </p>
                  </div>
                </div>

                {/* Disposisi Departemen */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-ink-muted uppercase tracking-wider">
                    Disposisi Departemen Pelaksana
                  </label>
                  <div className="relative w-full z-20">
                    <CustomSelect
                      value={formData.assignedDepartment}
                      onChange={(val) =>
                        setFormData((prev) => ({ ...prev, assignedDepartment: val }))
                      }
                      options={[
                        { value: "", label: "Belum Disposisikan" },
                        ...departments.map((d) => ({ value: d._id, label: d.name }))
                      ]}
                      className="bg-surface-2 border border-hairline rounded-xl py-2.5 text-sm text-ink focus:border-hairline w-full"
                    />
                  </div>
                </div>

                {/* Status */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-ink-muted uppercase tracking-wider">
                    Status Aspirasi
                  </label>
                  <div className="relative w-full z-10">
                    <CustomSelect
                      value={formData.status}
                      onChange={(val) =>
                        setFormData((prev) => ({
                          ...prev,
                          status: val as "new" | "processing" | "resolved" | "rejected",
                        }))
                      }
                      options={[
                        { value: "new", label: "New (Baru Masuk)" },
                        { value: "processing", label: "Processing (Sedang Ditindaklanjuti)" },
                        { value: "resolved", label: "Resolved (Telah Selesai)" },
                        { value: "rejected", label: "Rejected (Ditolak / Selesai Tanpa Aksi)" },
                      ]}
                      className="bg-surface-2 border border-hairline rounded-xl py-2.5 text-sm text-ink focus:border-hairline w-full"
                    />
                  </div>
                </div>

                {/* Official Response */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-ink-muted uppercase tracking-wider">
                    Tanggapan Resmi BEM FT
                  </label>
                  <textarea
                    rows={4}
                    value={formData.officialResponse}
                    onChange={(e) => setFormData((prev) => ({ ...prev, officialResponse: e.target.value }))}
                    placeholder="Tulis balasan resmi atau tindak lanjut dari BEM FT FT UNESA..."
                    className="bg-surface-2 border border-hairline rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-hairline w-full resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="bg-primary hover:bg-primary-hover text-ink font-bold py-3 rounded-xl transition-all active:scale-98 text-sm mt-2 shrink-0 flex items-center justify-center gap-2"
                >
                  <Send size={14} /> Tanggapi Aspirasi
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
