"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import ImsApiService from "@/lib/api";
import { FormInput, FormSelect, FormTextarea } from "@/components/ui";
import { ArrowLeft, Save, FileText, ArrowRight, CheckCircle2, AlertCircle, RefreshCw, UploadCloud } from "lucide-react";
import TemplatePicker from "@/components/surat/TemplatePicker";
import { DocumentTemplate } from "@/lib/api/template";
import { FormFileUpload } from "@/components/ui/FormFileUpload";

interface MetadataState {
  title: string;
  type: "incoming" | "outgoing";
  category: "internal" | "external";
  sender: string;
  recipient: string;
  summary: string;
  notes: string;
}

interface SubmissionState {
  loading: boolean;
  errorMsg: string | null;
  draftId: string | null;
  uploading: boolean;
}

export default function NewSuratPage() {
  const router = useRouter();
  
  // UX Steps
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [profileLoading, setProfileLoading] = useState(true);
  
  // User context
  const [cabinetPeriod, setCabinetPeriod] = useState("");
  const [department, setDepartment] = useState("");
  
  // Step 1: Template State
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // Step 2: Metadata & Upload States
  const [metadata, setMetadata] = useState<MetadataState>({
    title: "",
    type: "outgoing",
    category: "internal",
    sender: "",
    recipient: "",
    summary: "",
    notes: ""
  });
  const [file, setFile] = useState<File | null>(null);

  // Submission State
  const [submission, setSubmission] = useState<SubmissionState>({
    loading: false,
    errorMsg: null,
    draftId: null,
    uploading: false,
  });

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
      } finally {
        setProfileLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSelectTemplate = (template: DocumentTemplate | null) => {
    setSelectedTemplate(template);
    setSelectedTemplateId(template ? template._id : 'blank');
    if (template) {
      setMetadata(prev => ({ ...prev, title: template.name, type: "outgoing" }));
    }
    setStep(2);
  };

  const updateMetadata = (key: keyof MetadataState, value: string) => {
    setMetadata(prev => ({ ...prev, [key]: value }));
  };

  const uploadPdfForDraft = async (draftId: string, pdfFile: File) => {
    setSubmission(prev => ({ ...prev, uploading: true, errorMsg: null }));
    try {
      // 1. Upload to storage
      const uploadRes = await ImsApiService.uploadFile(pdfFile);
      const fileUrl = uploadRes.data?.url || "";
      if (!fileUrl) throw new Error("Gagal mendapatkan URL file setelah unggah.");

      // 2. Attach to Surat Draft as DocumentVersion
      await ImsApiService.uploadDocumentVersion(draftId, {
        fileUrl,
        fileSize: pdfFile.size,
        mimeType: pdfFile.type,
        versionType: "draft",
        notes: metadata.notes
      });

      // 3. Success
      setStep(3);
    } catch (err: any) {
      console.error("Upload failed", err);
      setSubmission(prev => ({ 
        ...prev, 
        errorMsg: err.message || "Gagal mengunggah PDF. Draft sudah tersimpan, silakan coba unggah lagi."
      }));
    } finally {
      setSubmission(prev => ({ ...prev, uploading: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!metadata.title || !metadata.sender || !metadata.recipient) {
      setSubmission(prev => ({ ...prev, errorMsg: "Mohon lengkapi semua kolom wajib." }));
      return;
    }
    if (!file) {
      setSubmission(prev => ({ ...prev, errorMsg: "Mohon unggah file PDF surat Anda." }));
      return;
    }

    try {
      setSubmission(prev => ({ ...prev, loading: true, errorMsg: null }));
      
      let draftId = submission.draftId;

      // Jika belum ada draft, buat draft (metadata only)
      if (!draftId) {
        const payload = {
          title: metadata.title,
          type: metadata.type,
          category: metadata.category,
          sender: metadata.sender,
          recipient: metadata.recipient,
          templateId: selectedTemplateId || "blank",
          departmentId: department,
          cabinetPeriodId: cabinetPeriod,
          summary: metadata.summary,
          workflowDefinitionId: "default-surat-workflow-id" // This is fallback if empty
        };
        const draftRes = await ImsApiService.createSurat(payload as any);
        draftId = draftRes.data._id;
        setSubmission(prev => ({ ...prev, draftId }));
      }

      // Upload file untuk draft tersebut
      if (draftId) {
        await uploadPdfForDraft(draftId, file);
      }
    } catch (err: any) {
      console.error(err);
      setSubmission(prev => ({ 
        ...prev, 
        errorMsg: err.message || "Gagal menyimpan draft surat. Silakan periksa koneksi Anda."
      }));
    } finally {
      setSubmission(prev => ({ ...prev, loading: false }));
    }
  };

  const handleRetryUpload = () => {
    if (submission.draftId && file) {
      uploadPdfForDraft(submission.draftId, file);
    }
  };

  return (
    <DashboardShell>
      <div className="space-y-6 max-w-5xl mx-auto w-full pb-12 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3">
          {step === 2 && (
            <button
              onClick={() => {
                if (submission.draftId) {
                  // User already has a draft, warn them before going back
                  if (!confirm("Draft sudah terbuat. Kembali akan membatalkan proses unggah. Yakin?")) return;
                }
                setStep(1);
              }}
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
              {step === 1 && "Langkah 1: Pilih Kategori & Template Dokumen"}
              {step === 2 && "Langkah 2: Lengkapi metadata & unggah PDF dokumen"}
              {step === 3 && "Langkah 3: Registrasi Berhasil"}
            </p>
          </div>
        </div>

        {submission.errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl flex items-start gap-3 text-sm animate-fade-in">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">{submission.errorMsg}</p>
              {submission.draftId && (
                <button 
                  onClick={handleRetryUpload}
                  className="mt-3 px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Coba Unggah Ulang
                </button>
              )}
            </div>
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
                <TemplatePicker 
                  selectedId={selectedTemplateId} 
                  onSelect={handleSelectTemplate} 
                />
              </div>
            )}

            {/* STEP 2: EDIT METADATA & CONTENT */}
            {step === 2 && (
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Info Template yang dipilih */}
                {selectedTemplate && (
                  <div className="glass-panel border border-sage/30 bg-sage/5 p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-sage">{selectedTemplate.name}</h3>
                      <p className="text-xs text-foreground/60 mt-1 max-w-2xl">{selectedTemplate.description}</p>
                    </div>
                    {selectedTemplate.googleDriveUrl && (
                      <a 
                        href={selectedTemplate.googleDriveUrl}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="shrink-0 bg-sage text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-md hover:bg-sage-dark transition-all flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4" /> Buka Template Google Docs
                      </a>
                    )}
                  </div>
                )}

                <div className="glass-panel border border-white/5 p-6 sm:p-8 rounded-2xl space-y-5 relative">
                  {submission.draftId && (
                    <div className="absolute top-0 left-0 w-full h-full bg-background/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-2xl border border-sage/30 p-8 text-center">
                      <CheckCircle2 className="w-12 h-12 text-sage mb-4" />
                      <h3 className="text-lg font-bold text-white mb-2">Draft Berhasil Dibuat</h3>
                      <p className="text-sm text-foreground/70 max-w-md">Metadata dokumen telah tersimpan. Silakan fokus pada proses unggah file di bagian bawah halaman.</p>
                    </div>
                  )}

                  <h3 className="text-sm font-bold text-white border-b border-white/5 pb-2">1. Metadata Surat</h3>
                  
                  <FormInput
                    label="Judul / Perihal Surat*"
                    name="title"
                    value={metadata.title}
                    onChange={(e) => updateMetadata("title", e.target.value)}
                    placeholder="Misal: Undangan Rapat Koordinasi Kabinet"
                    required
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormSelect
                      label="Jenis Surat*"
                      name="type"
                      value={metadata.type}
                      onChange={(val) => updateMetadata("type", val)}
                      options={[
                        { value: "incoming", label: "Surat Masuk" },
                        { value: "outgoing", label: "Surat Keluar" },
                      ]}
                      required
                    />

                    <FormSelect
                      label="Klasifikasi*"
                      name="category"
                      value={metadata.category}
                      onChange={(val) => updateMetadata("category", val)}
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
                      value={metadata.sender}
                      onChange={(e) => updateMetadata("sender", e.target.value)}
                      placeholder="Nama Instansi/Pengirim"
                      required
                    />

                    <FormInput
                      label="Penerima (Tujuan)*"
                      name="recipient"
                      value={metadata.recipient}
                      onChange={(e) => updateMetadata("recipient", e.target.value)}
                      placeholder="Nama Instansi/Tujuan"
                      required
                    />
                  </div>

                  <FormTextarea
                    label="Ringkasan Isi Surat"
                    name="summary"
                    value={metadata.summary}
                    onChange={(e) => updateMetadata("summary", e.target.value)}
                    placeholder="Tuliskan ringkasan singkat dari isi surat..."
                  />
                  
                  <FormTextarea
                    label="Keterangan / Catatan Tambahan"
                    name="notes"
                    value={metadata.notes}
                    onChange={(e) => updateMetadata("notes", e.target.value)}
                    placeholder="Catatan tambahan untuk reviewer..."
                  />
                </div>

                <div className="glass-panel border border-white/5 p-6 sm:p-8 rounded-2xl space-y-4">
                  <div className="flex flex-col border-b border-white/5 pb-4">
                    <h3 className="text-sm font-bold text-white mb-1">2. Unggah Dokumen Surat (PDF)</h3>
                    <p className="text-xs text-foreground/60">
                      Silakan unduh atau ekspor dokumen hasil editan Anda dari Google Docs ke format PDF, lalu unggah di sini.
                    </p>
                  </div>

                  <FormFileUpload
                    label=""
                    accept="application/pdf"
                    uploading={submission.uploading}
                    fileName={file?.name}
                    onFileSelect={(f) => setFile(f)}
                    onClear={() => setFile(null)}
                    helperText="Maksimal ukuran file 5MB. Hanya menerima format .pdf"
                  />
                </div>

                {/* Actions */}
                <div className="pt-4 flex justify-end gap-3">
                  {!submission.draftId && (
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-5 py-2.5 rounded-xl hover:bg-white/5 text-sm font-medium transition-colors text-white cursor-pointer"
                    >
                      Ganti Template
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={submission.loading || submission.uploading}
                    className="bg-sage text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-sage/90 disabled:opacity-50 transition-colors shadow-lg shadow-sage/20 border border-sage/50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {(submission.loading || submission.uploading) ? (
                      <>
                        <div className="w-4 h-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                        {submission.uploading ? 'Mengunggah PDF...' : 'Menyimpan...'}
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Simpan Draft & Unggah PDF
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
                    Surat beserta dokumen PDF-nya telah tersimpan. Anda dapat melihat detailnya di arsip kabinet.
                  </p>
                </div>
                <div className="pt-4 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      setMetadata({
                        title: "", type: "outgoing", category: "internal",
                        sender: "", recipient: "", summary: "", notes: ""
                      });
                      setFile(null);
                      setSubmission({ loading: false, errorMsg: null, draftId: null, uploading: false });
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
