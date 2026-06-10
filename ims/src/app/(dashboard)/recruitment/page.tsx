"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@bemft/api-client";
import {
  Users,
  Search,
  Filter,
  FileText,
  Check,
  X as CloseIcon,
  Award,
  FileSignature,
  Smartphone,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sliders,
  Sparkles,
  ExternalLink,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

interface DepartmentInfo {
  _id: string;
  name: string;
  code?: string;
}

interface ProkerInfo {
  _id: string;
  title: string;
  slug?: string;
}

interface Applicant {
  _id: string;
  fullName: string;
  nim: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  applyType?: "Fungsionaris" | "Panitia" | "Magang";
  firstChoiceDeptId?: DepartmentInfo;
  secondChoiceDeptId?: DepartmentInfo;
  firstChoiceProkerId?: ProkerInfo;
  secondChoiceProkerId?: ProkerInfo;
  motivation?: string;
  cvUrl?: string;
  photoUrl?: string;
  portfolioUrl?: string;
  status: "Pending" | "Screening" | "Interview" | "Accepted" | "Rejected";
  createdAt: string;
}

export default function RecruitmentDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [applyTypeFilter, setApplyTypeFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [prokerFilter, setProkerFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Selected Applicant for Evaluation Modal
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(
    null,
  );

  // Evaluation Scores State
  const [scores, setScores] = useState({
    leadership: 80,
    communication: 80,
    technical: 80,
    commitment: 80,
  });
  const [notes, setNotes] = useState("");
  const [evaluationError, setEvaluationError] = useState("");
  const [evaluationSuccess, setEvaluationSuccess] = useState("");

  // Calculate dynamic average score
  const averageScore = Math.round(
    (scores.leadership +
      scores.communication +
      scores.technical +
      scores.commitment) /
      4,
  );

  // Queries
  const { data: applicantsRes, isLoading: isApplicantsLoading } = useQuery<{
    data: Applicant[];
  }>({
    queryKey: ["recruitment-applicants-admin"],
    queryFn: () => apiClient.get("/recruitment/applicants", { limit: 100 }),
  });

  const { data: structureRes } = useQuery<{
    data: { departments: DepartmentInfo[] };
  }>({
    queryKey: ["recruitment-structure-departments"],
    queryFn: () => apiClient.get("/public/structure"),
  });

  const { data: prokerRes } = useQuery<{ data: ProkerInfo[] }>({
    queryKey: ["recruitment-structure-prokers"],
    queryFn: () => apiClient.get("/public/proker", { limit: 100 }),
  });

  const departments = structureRes?.data?.departments || [];
  const prokers = prokerRes?.data || [];
  const applicants = applicantsRes?.data || [];

  // Mutations
  const scoreMutation = useMutation({
    mutationFn: (data: {
      applicantId: string;
      score: number;
      criteria: Record<string, number>;
      notes?: string;
    }) => {
      return apiClient.post("/recruitment/score", data);
    },
  });

  const statusMutation = useMutation({
    mutationFn: (data: { id: string; status: string }) => {
      return apiClient.patch(`/recruitment/applicants/${data.id}/status`, {
        status: data.status,
      });
    },
  });

  const handleScoreChange = (criteria: keyof typeof scores, value: number) => {
    setScores((prev) => ({ ...prev, [criteria]: value }));
    setEvaluationError("");
    setEvaluationSuccess("");
  };

  const handleOpenEvaluation = (applicant: Applicant) => {
    setSelectedApplicant(applicant);
    setScores({
      leadership: 80,
      communication: 80,
      technical: 80,
      commitment: 80,
    });
    setNotes("");
    setEvaluationError("");
    setEvaluationSuccess("");
  };

  const handleSubmitEvaluation = async () => {
    if (!selectedApplicant) return;

    try {
      // 1. Submit interview score
      await scoreMutation.mutateAsync({
        applicantId: selectedApplicant._id,
        score: averageScore,
        criteria: {
          leadership: scores.leadership,
          communication: scores.communication,
          technical: scores.technical,
          commitment: scores.commitment,
        },
        notes: notes || undefined,
      });

      setEvaluationSuccess("Nilai wawancara berhasil disimpan!");
      queryClient.invalidateQueries({
        queryKey: ["recruitment-applicants-admin"],
      });
    } catch (e: any) {
      setEvaluationError(e.message || "Gagal menyimpan skor wawancara.");
    }
  };

  const handleUpdateStatus = async (
    status: "Interview" | "Accepted" | "Rejected",
  ) => {
    if (!selectedApplicant) return;

    try {
      await statusMutation.mutateAsync({
        id: selectedApplicant._id,
        status,
      });

      // Update local modal state immediately
      setSelectedApplicant((prev) => (prev ? { ...prev, status } : null));

      setEvaluationSuccess(`Status pelamar berhasil diubah ke: ${status}`);
      queryClient.invalidateQueries({
        queryKey: ["recruitment-applicants-admin"],
      });
    } catch (e: any) {
      setEvaluationError(e.message || "Gagal memperbarui status pelamar.");
    }
  };

  // Helper stats calculation
  const totalCount = applicants.length;
  const pendingCount = applicants.filter((a) => a.status === "Pending").length;
  const interviewCount = applicants.filter(
    (a) => a.status === "Interview",
  ).length;
  const acceptedCount = applicants.filter(
    (a) => a.status === "Accepted",
  ).length;

  // Filter application list
  const filteredApplicants = applicants.filter((a) => {
    const matchesSearch =
      a.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.nim.includes(searchTerm);
    const matchesApplyType =
      !applyTypeFilter || a.applyType === applyTypeFilter;
    const matchesDept =
      !deptFilter ||
      a.firstChoiceDeptId?._id === deptFilter ||
      a.secondChoiceDeptId?._id === deptFilter;
    const matchesProker =
      !prokerFilter ||
      a.firstChoiceProkerId?._id === prokerFilter ||
      a.secondChoiceProkerId?._id === prokerFilter;
    const matchesStatus = !statusFilter || a.status === statusFilter;
    return (
      matchesSearch &&
      matchesApplyType &&
      matchesDept &&
      matchesProker &&
      matchesStatus
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return (
          <Badge className="bg-amber-950/20 text-amber-200 border-amber-800/40 uppercase text-[9px]">
            Submitted
          </Badge>
        );
      case "Interview":
        return (
          <Badge className="bg-blue-950/20 text-blue-200 border-blue-800/40 uppercase text-[9px]">
            Interview
          </Badge>
        );
      case "Accepted":
        return (
          <Badge className="bg-green-950/20 text-green-200 border-green-800/40 uppercase text-[9px]">
            Accepted
          </Badge>
        );
      case "Rejected":
        return (
          <Badge className="bg-red-950/20 text-red-200 border-red-800/40 uppercase text-[9px]">
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-950/20 text-gray-200 border-gray-800/40 uppercase text-[9px]">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Recruiter Welcome Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-[#10b981]" />
            Evaluasi Open Recruitment (OR) BEM FT 2026
          </h1>
          <p className="text-xs text-[#a9b49c]">
            Tinjau biodata, link portofolio, dan berikan penilaian wawancara
            bagi calon fungsionaris Kabinet Danadyaksa.
          </p>
        </div>
      </div>

      {/* Statistics Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-white/10 bg-white/5 backdrop-blur-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black text-[#a9b49c] uppercase">
              TOTAL PENDAFTAR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-black text-white">{totalCount}</span>
            <p className="text-[9px] text-[#a9b49c] mt-1">
              Calon Mahasiswa terdaftar
            </p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 backdrop-blur-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black text-amber-400 uppercase">
              BELUM DINILAI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-black text-white">
              {pendingCount}
            </span>
            <p className="text-[9px] text-amber-400/70 mt-1">
              Menunggu verifikasi administrasi
            </p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 backdrop-blur-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black text-blue-400 uppercase">
              TAHAP WAWANCARA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-black text-white">
              {interviewCount}
            </span>
            <p className="text-[9px] text-blue-400/70 mt-1">
              Sedang dikoordinasikan jadwalnya
            </p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 backdrop-blur-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black text-[#10b981] uppercase">
              DITERIMA (LOLOS)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-black text-white">
              {acceptedCount}
            </span>
            <p className="text-[9px] text-[#10b981]/70 mt-1">
              Fungsionaris resmi baru kabinet
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <Card className="border-white/10 bg-white/5 backdrop-blur-md">
        <CardHeader className="pb-3 border-b border-white/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-sm font-bold text-white flex items-center gap-1.5">
                <FileSignature className="h-4 w-4 text-[#10b981]" />
                Daftar Calon Fungsionaris Terdaftar
              </CardTitle>
              <CardDescription className="text-[10px] text-[#a9b49c]">
                Kelola seleksi wawancara dan plot status kelolosan
              </CardDescription>
            </div>

            {/* Action Bar Search & Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-48 sm:w-60">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari nama atau NIM..."
                  className="w-full pl-9 pr-4 py-2 bg-black/40 rounded-xl border border-white/10 text-white placeholder-gray-500 text-xs focus:border-[#10b981]/50 focus:outline-none"
                />
              </div>

              <select
                value={applyTypeFilter}
                onChange={(e) => {
                  setApplyTypeFilter(e.target.value);
                  if (e.target.value === "Panitia") setDeptFilter("");
                  if (
                    e.target.value === "Fungsionaris" ||
                    e.target.value === "Magang"
                  )
                    setProkerFilter("");
                }}
                className="px-3 py-2 bg-black/40 rounded-xl border border-white/10 text-white text-xs focus:border-[#10b981]/50 focus:outline-none cursor-pointer"
              >
                <option value="">Semua Jalur</option>
                <option value="Fungsionaris">Fungsionaris BEM</option>
                <option value="Panitia">Kepanitiaan (Event)</option>
                <option value="Magang">Staf Magang</option>
              </select>

              {(!applyTypeFilter || applyTypeFilter === "Fungsionaris") && (
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="px-3 py-2 bg-black/40 rounded-xl border border-white/10 text-white text-xs focus:border-[#10b981]/50 focus:outline-none cursor-pointer"
                >
                  <option value="">Semua Departemen</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} {d.code ? `(${d.code})` : ""}
                    </option>
                  ))}
                </select>
              )}

              {(!applyTypeFilter || applyTypeFilter === "Panitia") && (
                <select
                  value={prokerFilter}
                  onChange={(e) => setProkerFilter(e.target.value)}
                  className="px-3 py-2 bg-black/40 rounded-xl border border-white/10 text-white text-xs focus:border-[#10b981]/50 focus:outline-none cursor-pointer"
                >
                  <option value="">Semua Kepanitiaan</option>
                  {prokers.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              )}

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-black/40 rounded-xl border border-white/10 text-white text-xs focus:border-[#10b981]/50 focus:outline-none cursor-pointer"
              >
                <option value="">Semua Status</option>
                <option value="Pending">Submitted</option>
                <option value="Interview">Interview</option>
                <option value="Accepted">Accepted</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader className="border-white/10">
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-white text-xs">
                  Nama Pelamar
                </TableHead>
                <TableHead className="text-white text-xs font-mono">
                  NIM
                </TableHead>
                <TableHead className="text-white text-xs">Jalur</TableHead>
                <TableHead className="text-white text-xs">Pilihan 1</TableHead>
                <TableHead className="text-white text-xs">Pilihan 2</TableHead>
                <TableHead className="text-white text-xs font-mono">
                  Pendaftaran Pada
                </TableHead>
                <TableHead className="text-white text-xs text-center">
                  Status
                </TableHead>
                <TableHead className="text-white text-xs text-right">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isApplicantsLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-12 text-[#a9b49c] text-xs"
                  >
                    <span className="w-6 h-6 border-2 border-[#10b981] border-t-transparent rounded-full animate-spin inline-block mb-2" />
                    <p className="font-mono uppercase text-[10px]">
                      Menarik berkas pelamar...
                    </p>
                  </TableCell>
                </TableRow>
              ) : filteredApplicants.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-12 text-[#a9b49c] text-xs"
                  >
                    Tidak ada pelamar terdaftar yang memenuhi kriteria
                    pencarian.
                  </TableCell>
                </TableRow>
              ) : (
                filteredApplicants.map((applicant) => (
                  <TableRow
                    key={applicant._id}
                    className="border-white/5 hover:bg-white/2 transition-premium"
                  >
                    <TableCell className="font-semibold text-white text-xs">
                      {applicant.fullName}
                    </TableCell>
                    <TableCell className="font-mono text-[#a9b49c] text-xs">
                      {applicant.nim}
                    </TableCell>
                    <TableCell className="text-xs">
                      {applicant.applyType === "Panitia" ? (
                        <span className="px-2 py-0.5 rounded bg-blue-950/40 text-blue-300 border border-blue-800/30 text-[9px] uppercase font-bold">
                          Kepanitiaan
                        </span>
                      ) : applicant.applyType === "Magang" ? (
                        <span className="px-2 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-800/30 text-[9px] uppercase font-bold">
                          Staf Magang
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-800/30 text-[9px] uppercase font-bold">
                          Fungsionaris
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-white font-medium text-xs">
                      {applicant.applyType === "Panitia" ? (
                        applicant.firstChoiceProkerId?.title ? (
                          <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                            {applicant.firstChoiceProkerId.title}
                          </span>
                        ) : (
                          "-"
                        )
                      ) : applicant.firstChoiceDeptId?.name ? (
                        <span className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                          {applicant.firstChoiceDeptId.name}{" "}
                          {applicant.firstChoiceDeptId.code
                            ? `(${applicant.firstChoiceDeptId.code})`
                            : ""}
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-[#a9b49c] text-xs">
                      {applicant.applyType === "Panitia" ? (
                        applicant.secondChoiceProkerId?.title ? (
                          <span>{applicant.secondChoiceProkerId.title}</span>
                        ) : (
                          <span className="text-white/20 italic">
                            Tidak ada pilihan ke-2
                          </span>
                        )
                      ) : applicant.secondChoiceDeptId?.name ? (
                        <span>
                          {applicant.secondChoiceDeptId.name}{" "}
                          {applicant.secondChoiceDeptId.code
                            ? `(${applicant.secondChoiceDeptId.code})`
                            : ""}
                        </span>
                      ) : (
                        <span className="text-white/20 italic">
                          Tidak ada pilihan ke-2
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-[#a9b49c] text-xs font-mono">
                      {new Date(applicant.createdAt).toLocaleDateString(
                        "id-ID",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        },
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(applicant.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        onClick={() => handleOpenEvaluation(applicant)}
                        className="px-3.5 py-1.5 bg-white/5 border border-white/10 text-white rounded-lg text-[10px] font-bold uppercase hover:bg-[#10b981] hover:text-[#091c11] hover:border-transparent transition-premium cursor-pointer"
                      >
                        Evaluasi
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* EVALUATION INTERACTIVE GLASS MODAL PANEL (Framer Motion) */}
      <AnimatePresence>
        {selectedApplicant && (
          <>
            {/* Backdrop blur overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedApplicant(null)}
              className="fixed inset-0 z-50 bg-[#06130b]/75 backdrop-blur-md flex items-center justify-center p-4"
            >
              {/* Modal Container */}
              <motion.div
                initial={{ scale: 0.95, y: 30, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.95, y: 30, opacity: 0 }}
                onClick={(e) => e.stopPropagation()} // Prevent closing
                className="w-full max-w-4xl bg-[#091c11] border border-white/10 rounded-3xl overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.7)] max-h-[90vh] flex flex-col relative"
              >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/1">
                  <div className="flex flex-col gap-1 text-left">
                    <span className="text-[9px] font-mono text-[#10b981] uppercase tracking-[0.3em]">
                      {"// EVALUATOR REVIEW GATES"}
                    </span>
                    <span className="text-sm font-black text-white">
                      {selectedApplicant.fullName}
                    </span>
                    <span className="text-[10px] font-mono text-gray-400">
                      NIM: {selectedApplicant.nim} | {selectedApplicant.email}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedApplicant(null)}
                    className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white flex items-center justify-center hover:bg-red-500 hover:text-white transition-premium cursor-pointer"
                  >
                    <CloseIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
                  {/* Left Column: Data Diri, Berkas & Motivasi */}
                  <div className="space-y-6">
                    {/* Jalur & Posisi Pilihan */}
                    <div className="p-4 bg-white/2 rounded-2xl border border-white/5 space-y-3">
                      <span className="block text-[8px] font-mono text-[#10b981] uppercase tracking-widest leading-none">
                        Jalur & Pilihan Posisi
                      </span>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-400">
                          Jalur Pendaftaran:
                        </span>
                        {selectedApplicant.applyType === "Panitia" ? (
                          <Badge className="bg-blue-950/40 text-blue-300 border border-blue-800/40 text-[9px] uppercase font-bold">
                            Panitia Kegiatan (Event)
                          </Badge>
                        ) : selectedApplicant.applyType === "Magang" ? (
                          <Badge className="bg-amber-950/40 text-amber-300 border border-amber-800/40 text-[9px] uppercase font-bold">
                            Staf Magang
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-950/40 text-[#10b981] border-emerald-800/40 text-[9px] uppercase font-bold">
                            Fungsionaris BEM
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
                        <div>
                          <span className="block text-[8px] text-gray-500 uppercase tracking-wider mb-1">
                            Pilihan Utama (1)
                          </span>
                          <span className="text-xs font-bold text-white block">
                            {selectedApplicant.applyType === "Panitia"
                              ? selectedApplicant.firstChoiceProkerId?.title ||
                                "-"
                              : selectedApplicant.firstChoiceDeptId?.name ||
                                "-"}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[8px] text-gray-500 uppercase tracking-wider mb-1">
                            Pilihan Cadangan (2)
                          </span>
                          <span className="text-xs font-bold text-white block">
                            {selectedApplicant.applyType === "Panitia"
                              ? selectedApplicant.secondChoiceProkerId
                                  ?.title || (
                                  <span className="text-white/20 italic font-normal">
                                    Tidak ada
                                  </span>
                                )
                              : selectedApplicant.secondChoiceDeptId?.name || (
                                  <span className="text-white/20 italic font-normal">
                                    Tidak ada
                                  </span>
                                )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                        <FileText className="h-4 w-4 text-[#10b981]" />
                        Berkas & Biodata
                      </h3>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-white/2 rounded-xl border border-white/5">
                          <span className="block text-[8px] font-mono text-gray-500 uppercase tracking-widest mb-1">
                            WA / Telepon
                          </span>
                          <a
                            href={`https://wa.me/${selectedApplicant.whatsapp?.replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-xs text-white hover:text-[#10b981] flex items-center gap-1 transition-colors"
                          >
                            <Smartphone className="w-3.5 h-3.5" />
                            {selectedApplicant.whatsapp ||
                              selectedApplicant.phone ||
                              "-"}
                          </a>
                        </div>
                        <div className="p-3 bg-white/2 rounded-xl border border-white/5">
                          <span className="block text-[8px] font-mono text-gray-500 uppercase tracking-widest mb-1">
                            Tautan CV
                          </span>
                          {selectedApplicant.cvUrl ? (
                            <a
                              href={selectedApplicant.cvUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-bold text-[#10b981] hover:text-[#34d399] flex items-center gap-1 transition-colors"
                            >
                              Buka CV <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          ) : (
                            <span className="text-xs text-white/30 italic">
                              No CV Shared
                            </span>
                          )}
                        </div>
                        <div className="p-3 bg-white/2 rounded-xl border border-white/5">
                          <span className="block text-[8px] font-mono text-gray-500 uppercase tracking-widest mb-1">
                            Foto Resmi
                          </span>
                          {selectedApplicant.photoUrl ? (
                            <a
                              href={selectedApplicant.photoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-bold text-[#10b981] hover:text-[#34d399] flex items-center gap-1 transition-colors"
                            >
                              Buka Foto <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          ) : (
                            <span className="text-xs text-white/30 italic">
                              No Photo Shared
                            </span>
                          )}
                        </div>
                        <div className="p-3 bg-white/2 rounded-xl border border-white/5">
                          <span className="block text-[8px] font-mono text-gray-500 uppercase tracking-widest mb-1">
                            Portofolio
                          </span>
                          {selectedApplicant.portfolioUrl ? (
                            <a
                              href={selectedApplicant.portfolioUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-bold text-[#10b981] hover:text-[#34d399] flex items-center gap-1 transition-colors"
                            >
                              Buka Portofolio{" "}
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          ) : (
                            <span className="text-xs text-white/30 italic">
                              No Portfolio
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="block text-[8px] font-mono text-gray-500 uppercase tracking-widest">
                        Pernyataan Motivasi
                      </span>
                      <div className="p-4 bg-black/40 rounded-2xl border border-white/5 max-h-[150px] overflow-y-auto">
                        <p className="text-xs text-gray-300 leading-relaxed font-sans">
                          {selectedApplicant.motivation || (
                            <span className="italic text-white/30">
                              Pelamar tidak menyertakan motivasi tertulis.
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Quick status controls */}
                    <div className="space-y-3 pt-4 border-t border-white/5">
                      <span className="block text-[8px] font-mono text-gray-500 uppercase tracking-widest">
                        Update Gerbang Status
                      </span>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleUpdateStatus("Interview")}
                          disabled={statusMutation.isPending}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-premium cursor-pointer ${
                            selectedApplicant.status === "Interview"
                              ? "bg-blue-600 text-white"
                              : "bg-blue-950/20 text-blue-300 border border-blue-800/40 hover:bg-blue-600 hover:text-white"
                          }`}
                        >
                          Atur Wawancara
                        </button>

                        <button
                          onClick={() => handleUpdateStatus("Accepted")}
                          disabled={statusMutation.isPending}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-premium cursor-pointer ${
                            selectedApplicant.status === "Accepted"
                              ? "bg-[#10b981] text-[#091c11]"
                              : "bg-green-950/20 text-green-300 border border-green-800/40 hover:bg-[#10b981] hover:text-[#091c11]"
                          }`}
                        >
                          Terima (Lolos)
                        </button>

                        <button
                          onClick={() => handleUpdateStatus("Rejected")}
                          disabled={statusMutation.isPending}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-premium cursor-pointer ${
                            selectedApplicant.status === "Rejected"
                              ? "bg-rose-600 text-white"
                              : "bg-rose-950/20 text-rose-300 border border-rose-800/40 hover:bg-rose-600 hover:text-white"
                          }`}
                        >
                          Tolak (Gagal)
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Interview Scoring Sliders */}
                  <div className="space-y-6 lg:border-l lg:border-white/5 lg:pl-8">
                    <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                      <Sliders className="h-4 w-4 text-[#10b981]" />
                      Parameter Skor Wawancara
                    </h3>

                    {/* Scores Sliders Grid */}
                    <div className="space-y-4">
                      {/* Leadership slider */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs font-bold text-white uppercase tracking-wider">
                            Leadership & Teamwork
                          </span>
                          <span className="font-mono text-xs text-[#10b981] font-bold">
                            {scores.leadership} / 100
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={scores.leadership}
                          onChange={(e) =>
                            handleScoreChange(
                              "leadership",
                              parseInt(e.target.value),
                            )
                          }
                          className="w-full accent-[#10b981] bg-white/5 rounded-lg appearance-none h-2"
                        />
                      </div>

                      {/* Communication slider */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs font-bold text-white uppercase tracking-wider">
                            Communication & Public Speaking
                          </span>
                          <span className="font-mono text-xs text-[#10b981] font-bold">
                            {scores.communication} / 100
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={scores.communication}
                          onChange={(e) =>
                            handleScoreChange(
                              "communication",
                              parseInt(e.target.value),
                            )
                          }
                          className="w-full accent-[#10b981] bg-white/5 rounded-lg appearance-none h-2"
                        />
                      </div>

                      {/* Technical slider */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs font-bold text-white uppercase tracking-wider">
                            Technical Skill & Portfolio
                          </span>
                          <span className="font-mono text-xs text-[#10b981] font-bold">
                            {scores.technical} / 100
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={scores.technical}
                          onChange={(e) =>
                            handleScoreChange(
                              "technical",
                              parseInt(e.target.value),
                            )
                          }
                          className="w-full accent-[#10b981] bg-white/5 rounded-lg appearance-none h-2"
                        />
                      </div>

                      {/* Commitment slider */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs font-bold text-white uppercase tracking-wider">
                            Commitment & Attitude
                          </span>
                          <span className="font-mono text-xs text-[#10b981] font-bold">
                            {scores.commitment} / 100
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={scores.commitment}
                          onChange={(e) =>
                            handleScoreChange(
                              "commitment",
                              parseInt(e.target.value),
                            )
                          }
                          className="w-full accent-[#10b981] bg-white/5 rounded-lg appearance-none h-2"
                        />
                      </div>
                    </div>

                    {/* Accumulative Score Display Plate */}
                    <div className="p-4 rounded-2xl bg-white/2 border border-white/5 flex items-center justify-between shadow-xl">
                      <div>
                        <span className="block text-[8px] font-mono text-gray-500 uppercase tracking-widest mb-1">
                          TOTAL AVERAGE SCORE
                        </span>
                        <span className="text-xs text-[#a9b49c]">
                          Rata-rata 4 Aspek Penilaian
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-3xl font-black text-white">
                          {averageScore}
                        </span>
                        <Badge
                          className={`${
                            averageScore >= 80
                              ? "bg-green-950/20 text-[#10b981] border-[#10b981]/25"
                              : averageScore >= 50
                                ? "bg-yellow-950/20 text-yellow-300 border-yellow-800/30"
                                : "bg-red-950/20 text-red-400 border-red-800/30"
                          } border text-xs font-bold`}
                        >
                          {averageScore >= 80
                            ? "A - Optimal"
                            : averageScore >= 50
                              ? "B - Cukup"
                              : "C - Kurang"}
                        </Badge>
                      </div>
                    </div>

                    {/* Interview Notes */}
                    <div className="space-y-2">
                      <span className="block text-[8px] font-mono text-gray-500 uppercase tracking-widest">
                        Catatan Penilai (Notes)
                      </span>
                      <textarea
                        value={notes}
                        onChange={(e) => {
                          setNotes(e.target.value);
                          setEvaluationError("");
                          setEvaluationSuccess("");
                        }}
                        rows={3}
                        placeholder="Tuliskan evaluasi wawancara mengenai potensi, kendala, atau impresi kandidat..."
                        className="w-full px-4 py-3 bg-black/40 rounded-2xl border border-white/10 text-white placeholder-gray-600 text-xs focus:border-[#10b981]/50 focus:outline-none resize-none"
                      />
                    </div>

                    {/* Error or Success notification */}
                    {evaluationError && (
                      <div className="p-3 bg-rose-500/10 border border-rose-500/25 text-rose-400 text-[10px] rounded-xl flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        <span>{evaluationError}</span>
                      </div>
                    )}
                    {evaluationSuccess && (
                      <div className="p-3 bg-green-500/10 border border-[#10b981]/25 text-[#10b981] text-[10px] rounded-xl flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{evaluationSuccess}</span>
                      </div>
                    )}

                    {/* Submit Score Button */}
                    <button
                      onClick={handleSubmitEvaluation}
                      disabled={scoreMutation.isPending}
                      className="w-full py-4 bg-white text-army-dark font-bold rounded-2xl hover:bg-army-accent hover:text-white transition-premium shadow-xl flex items-center justify-center gap-2 text-xs uppercase tracking-wider active:scale-95 disabled:opacity-40 cursor-pointer"
                    >
                      {scoreMutation.isPending ? (
                        <>
                          <span className="w-4 h-4 border-2 border-army-dark border-t-transparent rounded-full animate-spin" />
                          Menyimpan Skor...
                        </>
                      ) : (
                        <>
                          Simpan Evaluasi Wawancara{" "}
                          <Sparkles className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
