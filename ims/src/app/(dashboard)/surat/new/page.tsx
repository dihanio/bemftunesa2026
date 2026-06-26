"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import ImsApiService from "@/lib/api";
import { FormInput, FormSelect, FormTextarea } from "@/components/ui";
import { ArrowLeft, Save, FileText, ArrowRight, CheckCircle2, FileDown, AlertCircle } from "lucide-react";
import TemplatePicker from "@/components/surat/TemplatePicker";
import { type SuratTemplate } from "@/lib/surat-templates";
import { FormFileUpload } from "@/components/ui/FormFileUpload";

export default function NewSuratPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [cabinetPeriod, setCabinetPeriod] = useState("");
  const [department, setDepartment] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"incoming" | "outgoing">("incoming");
  const [category, setCategory] = useState<"internal" | "external">("internal");
  const [sender, setSender] = useState("");
  const [recipient, setRecipient] = useState("");
  const [notes, setNotes] = useState("");
  const [summary, setSummary] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<SuratTemplate | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setProfileLoading(true);
        const res = await ImsApiService.getProfile();
        if (res?.data) {
          const cabinetPeriodId = res.data.cabinetPeriod || res.data.activeContext?.periodId || "";
          const departmentId = res.data.department || res.data.departmentId || "";
          setCabinetPeriod(cabinetPeriodId);
          setDepartment(departmentId);
        }
      } catch (err) {
        console.error("Failed to load user profile:", err);
        setErrorMsg("Gagal memuat profil pengguna. Silakan coba login kembali.");
      } finally {
        setProfileLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSelectTemplate = (template: SuratTemplate) => {
    setSelectedTemplate(template);
    setTitle(template.name);
    // Default outgoing for most surat
    setType("outgoing");
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !sender || !recipient) {
      setErrorMsg("Mohon lengkapi semua kolom wajib (Judul, Pengirim, Penerima).");
      return;
    }
    // Note: cabinetPeriod is now optional on the backend to accommodate Super Admins or missing config
    // if (!cabinetPeriod) {
    //   setErrorMsg("Periode Kabinet tidak aktif. Silakan hubungi Super Admin.");
    //   return;
    // }
    if (!file) {
      setErrorMsg("Mohon unggah file PDF surat Anda.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);

      setUploadingFile(true);
      const uploadRes = await ImsApiService.uploadFile(file);
      const fileUrl = uploadRes.data?.url || "";
      setUploadingFile(false);

      if (!fileUrl) {
        throw new Error("Gagal mendapatkan URL file setelah unggah.");
      }

      // Hardcode default workflow id for now (in a real app you'd select this or it comes from backend)
      const defaultWorkflowId = "default-surat-workflow-id"; // Will be ignored by backend anyway which uses default

      const payload = {
        title,
        type,
        category,
        sender,
        recipient,
        templateId: selectedTemplate?.id || "blank",
        departmentId: department,
        cabinetPeriodId: cabinetPeriod,
        summary,
        fileUrl,
        fileSize: file.size,
        mimeType: file.type,
        workflowDefinitionId: defaultWorkflowId
      };

      const res = await ImsApiService.createSurat(payload as any);
      if (res) {
        setStep(3);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Gagal menyimpan surat. Silakan periksa koneksi Anda.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardShell>
      <div className="space-y-6 max-w-5xl mx-auto w-full pb-12 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3">
          {step === 2 && (
            <button
              onClick={() => setStep(1)}
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 flex items-center justify-center text-foreground/75 hover:text-white transition-all cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          {step === 1 && (
            <button
              onClick={() => router.push("/surat")}
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 flex items-center justify-center text-foreground/75 hover:text-white transition-all cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-white">Registrasi Dokumen Baru</h1>
            <p className="text-foreground/50 text-xs mt-0.5">
              {step === 1 && "Langkah 1: Pilih Kategori/Template Dokumen"}
              {step === 2 && `Langkah 2: Lengkapi metadata & unggah PDF dokumen (${selectedTemplate?.name})`}
              {step === 3 && "Langkah 3: Registrasi Berhasil"}
            </p>
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
          <>
            {/* STEP 1: PICK TEMPLATE */}
            {step === 1 && (
              <div className="glass-panel border border-white/5 p-6 rounded-2xl space-y-4">
                <h2 className="text-md font-bold text-white px-4">Pilih Kategori Dokumen</h2>
                <TemplatePicker onSelect={handleSelectTemplate} />
              </div>
            )}

            {/* STEP 2: EDIT METADATA & CONTENT */}
            {step === 2 && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="glass-panel border border-white/5 p-6 sm:p-8 rounded-2xl space-y-5">
                  <h3 className="text-sm font-bold text-white border-b border-white/5 pb-2">1. Metadata Surat</h3>
                  
                  <FormInput
                    label="Judul / Perihal Surat*"
                    name="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Misal: Undangan Rapat Koordinasi Kabinet"
                    required
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormSelect
                      label="Jenis Surat*"
                      name="type"
                      value={type}
                      onChange={(val) => setType(val as any)}
                      options={[
                        { value: "incoming", label: "Surat Masuk" },
                        { value: "outgoing", label: "Surat Keluar" },
                      ]}
                      required
                    />

                    <FormSelect
                      label="Klasifikasi*"
                      name="category"
                      value={category}
                      onChange={(val) => setCategory(val as any)}
                      options={[
                        { value: "internal", label: "Internal (FT/UNESA)" },
                        { value: "external", label: "Eksternal" },
                      ]}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormInput
                      label="Pengirim (Asal)*"
                      name="sender"
                      value={sender}
                      onChange={(e) => setSender(e.target.value)}
                      placeholder="Nama Instansi/Pengirim"
                      required
                    />

                    <FormInput
                      label="Penerima (Tujuan)*"
                      name="recipient"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      placeholder="Nama Instansi/Tujuan"
                      required
                    />
                  </div>

                  <FormTextarea
                    label="Ringkasan Isi Surat"
                    name="summary"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Tuliskan ringkasan singkat dari isi surat..."
                  />
                  
                  <FormTextarea
                    label="Keterangan / Catatan Tambahan"
                    name="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Catatan tambahan untuk reviewer..."
                  />
                </div>

                <div className="glass-panel border border-white/5 p-6 sm:p-8 rounded-2xl space-y-4">
                  <div className="flex flex-col border-b border-white/5 pb-4">
                    <h3 className="text-sm font-bold text-white mb-1">2. Unggah Dokumen Surat (PDF)</h3>
                    <p className="text-xs text-foreground/60">
                      Silakan ketik dokumen menggunakan Microsoft Word atau Google Docs (berdasarkan template), lalu ekspor ke PDF dan unggah di sini.
                    </p>
                    {selectedTemplate?.googleDriveUrl && (
                      <div className="mt-3">
                        <a 
                          href={selectedTemplate.googleDriveUrl}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-sage hover:underline flex items-center gap-1 font-semibold bg-sage/10 w-fit px-3 py-1.5 rounded-lg border border-sage/20"
                        >
                          <FileText className="w-3.5 h-3.5" /> Buka Template di Google Drive
                        </a>
                      </div>
                    )}
                  </div>

                  <FormFileUpload
                    label=""
                    accept="application/pdf"
                    uploading={uploadingFile}
                    fileName={file?.name}
                    onFileSelect={(f) => setFile(f)}
                    onClear={() => setFile(null)}
                    helperText="Maksimal ukuran file 5MB. Hanya format .pdf"
                  />
                </div>

                {/* Actions */}
                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-5 py-2.5 rounded-xl hover:bg-white/5 text-sm font-medium transition-colors text-white cursor-pointer"
                  >
                    Ganti Template
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
                        Simpan sebagai Draft
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: SUCCESS */}
            {step === 3 && (
              <div className="glass-panel border border-white/5 p-8 sm:p-12 rounded-2xl text-center max-w-md mx-auto space-y-6 animate-scale-in">
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-white">Registrasi Surat Berhasil!</h2>
                  <p className="text-foreground/50 text-sm">
                    Surat telah tersimpan sebagai draft di arsip kabinet. Anda dapat mengirim review persetujuan dari halaman detail.
                  </p>
                </div>
                <div className="pt-4 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      setTitle("");
                      setSender("");
                      setRecipient("");
                      setNotes("");
                      setSummary("");
                      setFile(null);
                      setStep(1);
                    }}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 hover:text-white transition-all text-xs font-semibold text-foreground/75 cursor-pointer"
                  >
                    Buat Surat Lain
                  </button>
                  <button
                    onClick={() => router.push("/surat")}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-sage text-white hover:bg-sage/90 transition-all text-xs font-semibold shadow-md shadow-sage/10 cursor-pointer"
                  >
                    Ke Daftar Surat
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardShell>
  );
}
