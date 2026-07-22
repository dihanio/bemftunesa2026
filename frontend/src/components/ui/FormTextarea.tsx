"use client";

import React from "react";

interface FormTextareaProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  rows?: number;
  className?: string;
}

export function FormTextarea({
  label,
  name,
  value,
  onChange,
  placeholder,
  required,
  error,
  helperText,
  rows = 4,
  className = "",
}: FormTextareaProps) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label htmlFor={name} className="text-xs font-medium uppercase tracking-wider text-foreground/60">
        {label}
        {required && <span className="text-rose-400 ml-1">*</span>}
      </label>
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className={`w-full px-4.5 py-3 rounded-xl bg-black/5 dark:bg-slate-800/60 border ${
          error ? "border-rose-500/60 focus:border-rose-500" : "border-accent-blue/15 focus:border-accent-blue/40"
        } text-sm text-foreground placeholder:text-foreground/40 focus:outline-none transition-colors resize-none`}
      />
      {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
      {!error && helperText && <p className="text-xs text-foreground/40 mt-1">{helperText}</p>}
    </div>
  );
}
