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
      <label className="text-sm font-medium text-foreground/70">
        {label}
      </label>
      {fileName ? (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl glass-subtle border border-sage/20 shadow-sm">
          <FileText className="w-4 h-4 text-sage shrink-0" />
          <span className="text-sm text-foreground truncate flex-1">{fileName}</span>
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="p-1 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
            >
              <X className="w-4 h-4 text-foreground/40" />
            </button>
          )}
        </div>
      ) : (
        <label
          className={`flex flex-col items-center justify-center gap-2 px-4 py-6 rounded-xl border border-dashed ${
            error ? "border-rose-500/50 bg-rose-500/5" : "border-sage/20 hover:border-sage/40 bg-sage/5 hover:bg-sage/10 glass-subtle"
          } cursor-pointer transition-all duration-200`}
        >
          {uploading ? (
            <>
              <Loader2 className="w-5 h-5 text-sage animate-spin" />
              <span className="text-sm text-foreground/30">Mengunggah...</span>
            </>
          ) : (
            <>
              <Upload className="w-5 h-5 text-foreground/30" />
              <span className="text-sm text-foreground/30">Klik untuk memilih file</span>
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
