import React, { useState, useEffect } from "react";
import { Send } from "lucide-react";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { LetterData } from "@/types/letter";

interface LetterFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<LetterData>) => Promise<void>;
  initialData?: LetterData | null;
  isSubmitting: boolean;
}

export function LetterFormModal({ isOpen, onClose, onSubmit, initialData, isSubmitting }: LetterFormModalProps) {
  const isEditing = !!initialData;
  
  const [formData, setFormData] = useState<Partial<LetterData>>({
    type: "outgoing",
    subject: "",
    sender: "BEM FT UNESA",
    recipient: "",
    documentUrl: "",
    status: "draft",
    approvalNotes: "",
    deadlineDate: "",
    impactScale: "internal",
    urgencyLevel: "normal",
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      if (initialData && isOpen) {
        setFormData({
          type: initialData.type,
          subject: initialData.subject,
          sender: initialData.sender,
          recipient: initialData.recipient,
          documentUrl: initialData.documentUrl || "",
          status: initialData.status,
          approvalNotes: initialData.approvalNotes || "",
          deadlineDate: initialData.deadlineDate ? new Date(initialData.deadlineDate).toISOString().split('T')[0] : "",
          impactScale: initialData.impactScale || "internal",
          urgencyLevel: initialData.urgencyLevel || "normal",
        });
      } else if (isOpen) {
        setFormData({
          type: "incoming",
          subject: "",
          sender: "BEM FT UNESA",
          recipient: "",
          documentUrl: "",
          status: "draft",
          approvalNotes: "",
          deadlineDate: "",
          impactScale: "internal",
          urgencyLevel: "normal",
        });
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-1 border border-hairline rounded-xl w-full max-w-lg overflow-hidden animate-fade-in bg-surface-1-dark bg-opacity-95 max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-hairline flex justify-between items-center bg-surface-2">
          <h2 className="text-lg font-bold text-ink">
            {isEditing ? "Detail / Review Surat" : "Catat Surat Baru"}
          </h2>
          <button
            onClick={onClose}
            className="text-ink-muted hover:text-ink text-sm font-semibold p-1"
          >
            Batal
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 overflow-y-auto">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-ink-muted uppercase tracking-wider">Jenis Surat</label>
            <div className="relative w-full z-30">
              <CustomSelect
                value={formData.type || ''}
                onChange={(val) => setFormData((prev) => ({ ...prev, type: val as "incoming" | "outgoing" | "proposal" | "lpj" }))}
                options={[
                  { value: "incoming", label: "Surat Masuk" },
                  { value: "outgoing", label: "Surat Keluar" },
                  { value: "proposal", label: "Proposal" },
                  { value: "lpj", label: "LPJ" },
                ]}
                className="bg-surface-2 border border-hairline rounded-xl py-2.5 text-sm text-ink focus:border-hairline w-full"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-ink-muted uppercase tracking-wider">Perihal / Judul</label>
            <input
              type="text"
              required
              value={formData.subject || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
              className="bg-surface-2 border border-hairline rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-hairline w-full"
              placeholder="Contoh: Undangan Pendelegasian"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-xs font-bold text-ink-muted uppercase tracking-wider">Pengirim</label>
              <input
                type="text"
                required
                value={formData.sender || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, sender: e.target.value }))}
                className="bg-surface-2 border border-hairline rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-hairline w-full"
              />
            </div>
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-xs font-bold text-ink-muted uppercase tracking-wider">Penerima</label>
              <input
                type="text"
                required
                value={formData.recipient || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, recipient: e.target.value }))}
                className="bg-surface-2 border border-hairline rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-hairline w-full"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-ink-muted uppercase tracking-wider">Tautan Google Drive (PDF)</label>
            <input
              type="url"
              value={formData.documentUrl || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, documentUrl: e.target.value }))}
              className="bg-surface-2 border border-hairline rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-hairline w-full"
              placeholder="https://drive.google.com/..."
            />
          </div>

          {/* DSS Metadata Fields */}
          <div className="border-t border-hairline my-1 pt-3">
            <span className="text-[10px] text-ink-muted uppercase font-bold tracking-widest">Informasi Prioritas (Opsional)</span>
          </div>
          <div className="flex gap-4">
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-xs font-bold text-ink-muted uppercase tracking-wider">Deadline Acara</label>
              <input
                type="date"
                value={formData.deadlineDate || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, deadlineDate: e.target.value }))}
                className="bg-surface-2 border border-hairline rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-hairline w-full"
              />
            </div>
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-xs font-bold text-ink-muted uppercase tracking-wider">Skala Dampak</label>
              <div className="relative w-full z-25">
                <CustomSelect
                  value={formData.impactScale || ''}
                  onChange={(val) => setFormData((prev) => ({ ...prev, impactScale: val }))}
                  options={[
                    { value: "internal", label: "Internal" },
                    { value: "fakultas", label: "Fakultas" },
                    { value: "universitas", label: "Universitas" },
                    { value: "eksternal", label: "Eksternal/Nasional" },
                  ]}
                  className="bg-surface-2 border border-hairline rounded-xl py-2.5 text-sm text-ink focus:border-hairline w-full"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-ink-muted uppercase tracking-wider">Tingkat Kepentingan</label>
            <div className="relative w-full z-24">
              <CustomSelect
                value={formData.urgencyLevel || ''}
                onChange={(val) => setFormData((prev) => ({ ...prev, urgencyLevel: val }))}
                options={[
                  { value: "normal", label: "Biasa" },
                  { value: "high", label: "Penting" },
                  { value: "urgent", label: "Sangat Penting / Darurat" },
                ]}
                className="bg-surface-2 border border-hairline rounded-xl py-2.5 text-sm text-ink focus:border-hairline w-full"
              />
            </div>
          </div>

          {isEditing && (
            <>
              <div className="border-t border-hairline my-2"></div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-ink-muted uppercase tracking-wider">
                  Status / Approval (State)
                </label>
                <div className="relative w-full z-20">
                  <CustomSelect
                    value={formData.status || ''}
                    onChange={(val) => setFormData((prev) => ({ ...prev, status: val as "draft" | "review_kadep" | "review_ketua" | "approved" | "rejected" | "archived" }))}
                    options={[
                      { value: "draft", label: "Draft" },
                      { value: "review_kadep", label: "Review Kadep" },
                      { value: "review_ketua", label: "Review BPI/Ketua" },
                      { value: "approved", label: "Disetujui (Cetak Nomor)" },
                      { value: "rejected", label: "Ditolak / Revisi" },
                      { value: "archived", label: "Diarsipkan" },
                    ]}
                    className="bg-surface-2 border border-hairline rounded-xl py-2.5 text-sm text-ink focus:border-hairline w-full"
                  />
                </div>
                {formData.status === 'approved' && formData.type !== 'incoming' && (
                  <span className="text-[10px] text-primary italic px-1">* Sistem akan otomatis men-generate Nomor Surat jika di-Save</span>
                )}
              </div>

              {formData.status === "rejected" && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-red-400/80 uppercase tracking-wider">Catatan Revisi / Penolakan</label>
                  <textarea
                    rows={2}
                    value={formData.approvalNotes || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, approvalNotes: e.target.value }))}
                    className="bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-red-500/50 w-full resize-none"
                  />
                </div>
              )}
            </>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary-hover text-ink font-bold py-3 rounded-xl transition-all active:scale-98 text-sm mt-4 shrink-0 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 animate-spin rounded-full border-2 border-ink border-t-transparent" />
            ) : (
              <>
                <Send size={14} /> {isEditing ? "Simpan Perubahan" : "Simpan Arsip"}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
