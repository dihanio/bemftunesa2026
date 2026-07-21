"use client";

import React from "react";
import type { LucideIcon } from "lucide-react";

interface FormInputProps {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  icon?: LucideIcon;
  className?: string;
}

export function FormInput({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
  error,
  helperText,
  icon: Icon,
  className = "",
}: FormInputProps) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label htmlFor={name} className="text-xs font-medium uppercase tracking-wider text-foreground/60">
        {label}
        {required && <span className="text-rose-400 ml-1">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
            <Icon className="w-4 h-4 text-foreground/40" />
          </div>
        )}
        <input
          type={type}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full ${Icon ? "pl-10" : "px-4.5"} py-3 rounded-xl bg-slate-800/60 border ${
            error ? "border-rose-500/60 focus:border-rose-500" : "border-accent-blue/15 focus:border-accent-blue/40"
          } text-sm text-foreground placeholder:text-foreground/40 focus:outline-none transition-colors`}
        />
      </div>
      {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
      {!error && helperText && <p className="text-xs text-foreground/40 mt-1">{helperText}</p>}
    </div>
  );
}
