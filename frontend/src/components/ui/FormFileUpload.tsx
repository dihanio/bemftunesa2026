"use client";

import React, { useRef } from "react";
import { Upload, FileText, X, Loader2 } from "lucide-react";

interface FormFileUploadProps {
  label: string;
  onFileSelect: (file: File) => void;
  accept?: string;
  uploading?: boolean;
  fileName?: string;
  onClear?: () => void;
  error?: string;
  helperText?: string;
}

export function FormFileUpload({
  label,
  onFileSelect,
  accept,
  uploading,
  fileName,
  onClear,
  error,
  helperText,
}: FormFileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium uppercase tracking-wider text-foreground/60">
        {label}
      </label>
      {fileName ? (
        <div className="flex items-center gap-3 px-4.5 py-3 rounded-xl bg-accent-blue/5 border border-accent-blue/15">
          <FileText className="w-4 h-4 text-accent-blue shrink-0" />
          <span className="text-sm text-foreground truncate flex-1">{fileName}</span>
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="p-1 rounded-lg hover:bg-foreground/5 cursor-pointer transition-colors"
            >
              <X className="w-4 h-4 text-foreground/40" />
            </button>
          )}
        </div>
      ) : (
        <label
          className={`flex flex-col items-center justify-center gap-2 px-4 py-6 rounded-xl border border-dashed ${
            error ? "border-rose-500/50 bg-rose-500/5" : "border-accent-blue/20 hover:border-accent-blue/40 bg-slate-800/30"
          } cursor-pointer transition-colors`}
        >
          {uploading ? (
            <>
              <Loader2 className="w-5 h-5 text-accent-blue animate-spin" />
              <span className="text-xs text-foreground/50">Mengunggah...</span>
            </>
          ) : (
            <>
              <Upload className="w-5 h-5 text-foreground/30" />
              <span className="text-xs text-foreground/40">Klik untuk memilih file</span>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleChange}
            className="hidden"
            disabled={uploading}
          />
        </label>
      )}
      {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
      {!error && helperText && <p className="text-xs text-foreground/40 mt-1">{helperText}</p>}
    </div>
  );
}
