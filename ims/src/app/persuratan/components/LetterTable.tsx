import React from "react";
import { Calendar, Building, Link as LinkIcon, Edit2, Trash2, FileText } from "lucide-react";
import { LetterData } from "@/types/letter";
import { RequirePermission } from "@/components/authorization/RequirePermission";

interface LetterTableProps {
  letters: LetterData[];
  loading: boolean;
  dssMode: boolean;
  onEdit: (letter: LetterData) => void;
  onDelete: (id: string, subject: string) => void;
}

export function LetterTable({ letters, loading, dssMode, onEdit, onDelete }: LetterTableProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-semantic-success/10 text-semantic-success border-semantic-success/20";
      case "rejected":
        return "bg-surface-2 text-ink-muted border-hairline-strong";
      case "review_kadep":
      case "review_ketua":
        return "bg-surface-2 text-ink-muted border-hairline";
      case "archived":
        return "bg-surface-2 text-ink-muted border-hairline-strong";
      default:
        return "bg-surface-2 text-ink-muted border-hairline";
    }
  };

  const getTypeBadge = (type: string) => {
    return "bg-surface-2 text-ink-muted border-hairline";
  };

  if (loading && letters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-8 h-8 animate-spin rounded-full border-4 border-hairline border-t-sage" />
        <span className="text-sm text-ink-muted">Memuat arsip surat...</span>
      </div>
    );
  }

  if (letters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 border border-dashed border-hairline rounded-xl bg-surface-2 text-ink-muted text-sm gap-2">
        <FileText size={32} className="text-primary/40" />
        <span>Belum ada arsip surat.</span>
      </div>
    );
  }

  return (
    <div className="bg-surface-1 border border-hairline rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-2 text-xs font-bold text-ink-muted uppercase tracking-wider border-b border-hairline">
              <th className="px-6 py-4">Nomor & Perihal</th>
              <th className="px-6 py-4">Jenis</th>
              {dssMode && <th className="px-6 py-4 text-center">Skor Prioritas</th>}
              <th className="px-6 py-4">Pengirim &rarr; Penerima</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline text-sm text-ink-muted">
            {letters.map((letter) => (
              <tr key={letter.id} className="hover:bg-surface-2 transition-all">
                <td className="px-6 py-4 max-w-sm">
                  <div className="flex flex-col">
                    {letter.referenceNumber ? (
                      <span className="font-mono text-xs text-primary font-bold tracking-wide">{letter.referenceNumber}</span>
                    ) : (
                      <span className="font-mono text-[10px] text-ink-muted font-bold italic tracking-wide">Belum Ada Nomor Surat</span>
                    )}
                    <span className="font-semibold text-ink leading-snug mt-1">{letter.subject}</span>
                    <span className="text-[10px] text-ink-muted flex items-center gap-1 mt-2">
                      <Calendar size={10} /> {new Date(letter.createdAt).toLocaleDateString("id-ID", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                      {" • "}
                      <Building size={10} /> {letter.department?.name || "BPI"}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase border ${getTypeBadge(letter.type)}`}>
                    {letter.type}
                  </span>
                </td>
                {dssMode && (
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-primary/10 text-primary border border-hairline font-bold text-sm">
                      {letter.smartScore?.toFixed(3)}
                    </span>
                  </td>
                )}
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1 text-xs text-ink-muted">
                    <span><span className="text-ink-muted font-mono">Dari: </span>{letter.sender}</span>
                    <span><span className="text-ink-muted font-mono">Ke: </span>{letter.recipient}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] border w-max ${getStatusBadge(letter.status)}`}>
                    {letter.status.replace('_', ' ')}
                  </span>
                  {letter.approvalNotes && letter.status === 'rejected' && (
                    <p className="text-[10px] text-red-400 mt-1 line-clamp-1 italic">Catatan: {letter.approvalNotes}</p>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    {letter.documentUrl && (
                      <a
                        href={letter.documentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 hover:bg-blue-500/10 rounded-lg text-blue-400 hover:text-blue-300 transition-all active:scale-90"
                        title="Buka Dokumen (Drive)"
                      >
                        <LinkIcon size={14} />
                      </a>
                    )}
                    <RequirePermission permission="letters:update" fallback={null}>
                      <button
                        onClick={() => onEdit(letter)}
                        className="p-2 hover:bg-primary/10 rounded-lg text-primary hover:text-ink transition-all active:scale-90"
                        title="Edit / Approval"
                      >
                        <Edit2 size={14} />
                      </button>
                    </RequirePermission>
                    <RequirePermission permission="letters:delete" fallback={null}>
                      <button
                        onClick={() => onDelete(letter.id, letter.subject)}
                        className="p-2 hover:bg-red-500/10 rounded-lg text-red-400 hover:text-red-300 transition-all active:scale-90"
                        title="Hapus Arsip"
                      >
                        <Trash2 size={14} />
                      </button>
                    </RequirePermission>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
