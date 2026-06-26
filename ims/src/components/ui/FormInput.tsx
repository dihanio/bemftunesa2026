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
  min?: string;
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
  min,
}: FormInputProps) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label htmlFor={name} className="text-sm font-medium text-foreground/70">
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
          min={min}
          className={`w-full ${Icon ? "pl-10" : "px-4"} py-3 rounded-xl glass-subtle border ${
            error ? "border-rose-500/50 focus:border-rose-500" : "border-sage/10 focus:border-sage/40 focus:bg-sage/5"
          } text-sm text-foreground placeholder:text-foreground/25 focus:outline-none transition-all duration-200 shadow-sm`}
        />
      </div>
      {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
      {!error && helperText && <p className="text-xs text-foreground/40 mt-1">{helperText}</p>}
    </div>
  );
}
