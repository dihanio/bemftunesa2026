import React from 'react';
import { FileText } from 'lucide-react';
import Link from 'next/link';

interface DocumentEmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function DocumentEmptyState({
  title = "Belum ada dokumen",
  description = "Dokumen yang Anda buat atau yang membutuhkan persetujuan Anda akan muncul di sini.",
  actionLabel = "Buat Dokumen",
  actionHref,
  onAction,
  icon
}: DocumentEmptyStateProps) {
  const buttonStyle = "inline-flex items-center justify-center px-4 py-2 bg-sage hover:bg-sage/90 text-[#0d1117] text-sm font-medium rounded-lg transition-colors";

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border border-white/5 rounded-2xl bg-white/[0.02]">
      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-white/40">
        {icon || <FileText className="w-8 h-8" />}
      </div>
      <h3 className="text-lg font-medium text-foreground mb-2">{title}</h3>
      <p className="text-sm text-white/50 max-w-md mb-6">{description}</p>
      
      {actionHref ? (
        <Link href={actionHref} className={buttonStyle}>
          {actionLabel}
        </Link>
      ) : onAction ? (
        <button className={buttonStyle} onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
