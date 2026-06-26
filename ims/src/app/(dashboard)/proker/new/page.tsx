"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import ImsApiService from "@/lib/api";
import { FormInput, FormSelect, FormTextarea } from "@/components/ui";
import { ArrowLeft, Save, Briefcase, CheckCircle2, AlertCircle } from "lucide-react";

interface DepartmentOption {
  _id: string;
  name: string;
}

interface MemberOption {
  _id: string;
  name: string;
  email: string;
}

export default function NewProkerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Context
  const [cabinetPeriod, setCabinetPeriod] = useState("");
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [members, setMembers] = useState<MemberOption[]>([]);

  // Form
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [picId, setPicId] = useState("");
  const [targetOutput, setTargetOutput] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [estimatedBudget, setEstimatedBudget] = useState("");
  const [fundingStatus, setFundingStatus] = useState("belum_diajukan");

  useEffect(() => {
    const fetchContext = async () => {
      try {
        setProfileLoading(true);
        const profileRes = await ImsApiService.getProfile();
        if (profileRes?.data) {
          const periodId = profileRes.data.activeContext?.periodId || "";
          setCabinetPeriod(periodId);

          // Pre-select department if kadep
          const deptId = profileRes.data.departmentId || "";
          if (deptId) setDepartmentId(deptId);
        }

        // Load departments
        const deptRes = await ImsApiService.getDepartments();
        if (deptRes?.data) setDepartments(deptRes.data);

        // Load members for PIC picker
        const membersRes = await ImsApiService.getUsers();
        if (membersRes?.data) setMembers(membersRes.data);
      } catch (err) {
        console.error("Failed to load context:", err);
        setErrorMsg("Gagal memuat data. Silakan coba refresh halaman.");
      } finally {
        setProfileLoading(false);
      }
    };
    fetchContext();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg("Judul program kerja wajib diisi.");
      return;
    }
    if (!departmentId) {
      setErrorMsg("Departemen wajib dipilih.");
      return;
    }
    if (!cabinetPeriod) {
      setErrorMsg("Periode kabinet tidak aktif. Hubungi Super Admin.");
      return;
    }
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      setErrorMsg("Tanggal selesai harus setelah tanggal mulai.");
      return;
    }
    const budget = estimatedBudget ? Number(estimatedBudget) : 0;
    if (budget < 0) {
      setErrorMsg("Anggaran tidak boleh negatif.");
      return;
    }

    try {
      setLoading(true);
      await ImsApiService.createProker({
        title: title.trim(),
        category: category.trim() || undefined,
        description: description.trim() || undefined,
        cabinetPeriod,
        department: departmentId,
        pic: picId || undefined,
        targetOutput: targetOutput.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        estimatedBudget: budget,
        fundingStatus,
      } as any);
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Gagal menyimpan program kerja.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <DashboardShell>
        <div className="max-w-md mx-auto w-full pb-12 animate-fade-in pt-12">
          <div className="glass-panel border border-white/5 p-8 sm:p-12 rounded-2xl text-center space-y-6 animate-scale-in">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">Proker Berhasil Dibuat!</h2>
              <p className="text-foreground/50 text-sm">
                Program kerja telah disimpan dengan status &quot;Direncanakan&quot;. Anda dapat mengubah progres dan status dari halaman detail.
              </p>
            </div>
            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setTitle("");
                  setCategory("");
                  setDescription("");
                  setTargetOutput("");
                  setStartDate("");
                  setEndDate("");
                  setEstimatedBudget("");
                  setPicId("");
                  setSuccess(false);
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 hover:text-white transition-all text-xs font-semibold text-foreground/75 cursor-pointer"
              >
                Buat Proker Lain
              </button>
              <button
                onClick={() => router.push("/proker")}
                className="flex-1 px-4 py-2.5 rounded-xl bg-sage text-white hover:bg-sage/90 transition-all text-xs font-semibold shadow-md shadow-sage/10 cursor-pointer"
              >
                Ke Daftar Proker
              </button>
            </div>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-6 max-w-4xl mx-auto w-full pb-12 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/proker")}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 flex items-center justify-center text-foreground/75 hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-sage" /> Tambah Program Kerja
            </h1>
            <p className="text-foreground/50 text-xs mt-0.5">Lengkapi data proker baru untuk kabinet aktif</p>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl flex items-start gap-3 text-sm animate-fade-in">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>{errorMsg}</p>
          </div>
        )}

        {profileLoading ? (
          <div className="glass-subtle border border-white/5 p-8 rounded-2xl flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-8 h-8 animate-spin rounded-full border-4 border-sage/20 border-t-sage" />
            <span className="text-sm text-foreground/50">Memuat formulir...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Info Utama */}
            <div className="glass-panel border border-white/5 p-6 sm:p-8 rounded-2xl space-y-5">
              <h3 className="text-sm font-bold text-white border-b border-white/5 pb-2">Informasi Proker</h3>

              <FormInput
                label="Judul Program Kerja*"
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Misal: Workshop UI/UX Design"
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput
                  label="Kategori"
                  name="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Misal: Workshop, Seminar, Lomba"
                />

                <FormSelect
                  label="Departemen*"
                  name="department"
                  value={departmentId}
                  onChange={(val) => setDepartmentId(val)}
                  options={departments.map((d) => ({ value: d._id, label: d.name }))}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormSelect
                  label="Penanggung Jawab (PIC)"
                  name="pic"
                  value={picId}
                  onChange={(val) => setPicId(val)}
                  options={[
                    { value: "", label: "— Belum ditentukan —" },
                    ...members.map((m) => ({ value: m._id, label: `${m.name} (${m.email})` })),
                  ]}
                />

                <FormSelect
                  label="Status Pendanaan"
                  name="fundingStatus"
                  value={fundingStatus}
                  onChange={(val) => setFundingStatus(val)}
                  options={[
                    { value: "belum_diajukan", label: "Belum Diajukan" },
                    { value: "diajukan", label: "Sudah Diajukan" },
                    { value: "disetujui", label: "Dana Disetujui" },
                    { value: "ditolak", label: "Dana Ditolak" },
                  ]}
                />
              </div>

              <FormTextarea
                label="Deskripsi"
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Gambaran singkat tentang program kerja ini..."
              />

              <FormInput
                label="Target Output / Capaian"
                name="targetOutput"
                value={targetOutput}
                onChange={(e) => setTargetOutput(e.target.value)}
                placeholder="Misal: 50 peserta, 1 modul pelatihan"
              />
            </div>

            {/* Jadwal & Anggaran */}
            <div className="glass-panel border border-white/5 p-6 sm:p-8 rounded-2xl space-y-5">
              <h3 className="text-sm font-bold text-white border-b border-white/5 pb-2">Jadwal & Anggaran</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput
                  label="Tanggal Mulai"
                  name="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <FormInput
                  label="Tanggal Selesai"
                  name="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                />
              </div>

              <FormInput
                label="Estimasi Anggaran (Rp)"
                name="estimatedBudget"
                type="number"
                value={estimatedBudget}
                onChange={(e) => setEstimatedBudget(e.target.value)}
                placeholder="0"
                min="0"
              />
            </div>

            {/* Actions */}
            <div className="pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => router.push("/proker")}
                className="px-5 py-2.5 rounded-xl hover:bg-white/5 text-sm font-medium transition-colors text-white cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-sage text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-sage/90 disabled:opacity-50 transition-colors shadow-lg shadow-sage/20 border border-sage/50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Simpan Proker
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </DashboardShell>
  );
}
