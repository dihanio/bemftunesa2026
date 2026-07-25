"use client";

import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, X, RefreshCw, Loader2, AlertTriangle } from 'lucide-react';

interface FileUploadProps {
  accept?: string;
  onFileSelect: (file: File) => void;
  previewUrl?: string | null;
  onRemove?: () => void;
  disabled?: boolean;
  loading?: boolean;
  error?: string;
  label?: string;
  helperText?: string;
}

export function FileUpload({
  accept = 'image/*',
  onFileSelect,
  previewUrl,
  onRemove,
  disabled = false,
  loading = false,
  error,
  label = 'UPLOAD PAS FOTO',
  helperText = 'Format JPG, PNG, WebP (Maksimal 500 KB)',
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !loading) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || loading) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-2 w-full">
      {label && (
        <label className="block text-[11px] font-mono font-bold text-[var(--accent)] uppercase tracking-wider">
          {label}
        </label>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        disabled={disabled || loading}
        className="hidden"
      />

      {previewUrl ? (
        /* Preview & Management State */
        <div className="flex items-center justify-between p-3 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded text-xs font-mono">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded bg-black/40 border border-[var(--accent-glow)] overflow-hidden shrink-0 relative flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="Preview Foto" className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0">
              <div className="text-[var(--text-primary)] font-bold truncate">Pas Foto Terpilih</div>
              <div className="text-[10px] text-[var(--semantic-success)] flex items-center gap-1">
                ✓ Siap dioptimasi & diunggah
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={disabled || loading}
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-[var(--accent)] hover:bg-[var(--accent-muted)] border border-[var(--accent-glow)] rounded transition-all flex items-center gap-1.5 text-[10px] uppercase font-bold"
              title="Ganti foto"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Ganti</span>
            </button>
            {onRemove && (
              <button
                type="button"
                disabled={disabled || loading}
                onClick={onRemove}
                className="p-2 text-[var(--semantic-danger)] hover:bg-red-500/10 border border-red-500/30 rounded transition-all text-[10px] uppercase font-bold"
                title="Hapus foto"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Dropzone State */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && !loading && fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded transition-all cursor-pointer text-center ${
            disabled
              ? 'opacity-50 cursor-not-allowed border-[var(--border-subtle)] bg-transparent'
              : isDragging
              ? 'border-[var(--accent)] bg-[var(--accent-muted)] scale-[0.99]'
              : error
              ? 'border-[var(--semantic-danger)] bg-red-500/5'
              : 'border-[var(--border-default)] hover:border-[var(--accent)] hover:bg-white/[0.02] bg-[var(--bg-surface)]'
          }`}
        >
          {loading ? (
            <div className="flex flex-col items-center gap-2 text-[var(--accent)]">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-xs font-mono uppercase tracking-wider">Memproses Foto...</span>
            </div>
          ) : (
            <>
              <div className="p-3 bg-[var(--accent-muted)] rounded-full text-[var(--accent)] mb-2">
                <UploadCloud className="h-6 w-6" />
              </div>
              <p className="text-xs font-mono font-bold text-[var(--text-primary)] uppercase tracking-wider">
                PILIH FOTO ATAU TARIK KE SINI
              </p>
              <p className="text-[10px] font-mono text-[var(--text-muted)] mt-1">{helperText}</p>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="text-[10px] font-mono text-[var(--semantic-danger)] flex items-center gap-1">
          <AlertTriangle className="h-3 w-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
