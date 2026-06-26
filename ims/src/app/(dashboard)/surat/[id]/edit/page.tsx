"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import ImsApiService from "@/lib/api";
import { FormInput, FormSelect, FormTextarea } from "@/components/ui";
import { ArrowLeft, Save, AlertCircle, FileDown } from "lucide-react";
import SuratEditor from "@/components/surat/SuratEditor";
import { exportSuratToPdf } from "@/lib/export-pdf";

export default function EditSuratPage() {
  const router = useRouter();
  const params = useParams();
  const suratId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"incoming" | "outgoing">("incoming");
  const [category, setCategory] = useState<"internal" | "external">("internal");
  const [sender, setSender] = useState("");
  const [recipient, setRecipient] = useState("");
  const [notes, setNotes] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");

  useEffect(() => {
    const fetchSuratData = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);
        
        const res = await ImsApiService.getSuratDetail(suratId);
        if (res?.data) {
          const s = res.data;
          // Guard: edit is only allowed for drafts
          if (s.status !== "draft") {
            setErrorMsg("Hanya surat berstatus draft yang dapat diedit.");
            return;
          }
          setTitle(s.title);
          setType(s.type);
          setCategory(s.category);
          setSender(s.sender);
          setRecipient(s.recipient);
          setNotes(s.notes || "");
          setBodyHtml(s.bodyHtml || "");
        }
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message || "Gagal memuat detail surat.");
      } finally {
        setLoading(false);
      }
    };

    if (suratId) {
      fetchSuratData();
    }
  }, [suratId]);

  const handleExportPreview = async () => {
    try {
      await exportSuratToPdf(bodyHtml, title || "Draft Surat BEM FT");
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Gagal mengekspor PDF: " + err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !sender || !recipient) {
      setErrorMsg("Mohon lengkapi semua kolom wajib (Judul, Pengirim, Penerima).");
      return;
    }

    try {
      setSaving(true);
      setErrorMsg(null);

      const payload = {
        title,
        type,
        category,
        sender,
        recipient,
        notes,
        bodyHtml,
      };

      const res = await ImsApiService.updateSurat(suratId, payload);
      if (res) {
        router.push(`/surat/${suratId}`);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Gagal memperbarui surat. Silakan coba kembali.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardShell>
      <div className="space-y-6 max-w-5xl mx-auto w-full pb-12 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/surat/${suratId}`)}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 flex items-center justify-center text-foreground/75 hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Edit Dokumen Surat</h1>
            <p className="text-foreground/50 text-xs mt-0.5">Perbarui metadata dan sesuaikan isi dokumen draft</p>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl flex items-start gap-3 text-sm animate-fade-in">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>{errorMsg}</p>
          </div>
        )}

        {loading ? (
          <div className="glass-subtle border border-white/5 p-8 rounded-2xl flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-8 h-8 animate-spin rounded-full border-4 border-sage/20 border-t-sage" />
            <span className="text-sm text-foreground/50">Memuat surat...</span>
          </div>
        ) : (
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
                label="Keterangan / Catatan Tambahan"
                name="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Deskripsi singkat isi surat atau keperluan tambahan..."
              />
            </div>

            <div className="glass-panel border border-white/5 p-6 sm:p-8 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h3 className="text-sm font-bold text-white">2. Isi Dokumen Surat (A4)</h3>
                <button
                  type="button"
                  onClick={handleExportPreview}
                  className="text-xs text-sage hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                >
                  <FileDown className="w-3.5 h-3.5" /> Export PDF (Preview)
                </button>
              </div>

              {/* Tiptap Editor */}
              <SuratEditor content={bodyHtml} onChange={setBodyHtml} />
            </div>

            {/* Actions */}
            <div className="pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => router.push(`/surat/${suratId}`)}
                className="px-5 py-2.5 rounded-xl hover:bg-white/5 text-sm font-medium transition-colors text-white cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-sage text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-sage/90 disabled:opacity-50 transition-colors shadow-lg shadow-sage/20 border border-sage/50 flex items-center justify-center gap-2 cursor-pointer"
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
          </form>
        )}
      </div>
    </DashboardShell>
  );
}
