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
      <label htmlFor={name} className="text-sm font-medium text-foreground/70">
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
        className={`w-full px-4 py-3 rounded-xl glass-subtle border ${
          error ? "border-rose-500/50 focus:border-rose-500" : "border-sage/10 focus:border-sage/40 focus:bg-sage/5"
        } text-sm text-foreground placeholder:text-foreground/25 focus:outline-none transition-all duration-200 resize-none shadow-sm`}
      />
      {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
      {!error && helperText && <p className="text-xs text-foreground/40 mt-1">{helperText}</p>}
    </div>
  );
}
