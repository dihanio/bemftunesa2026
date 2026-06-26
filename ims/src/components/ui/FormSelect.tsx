"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

interface FormSelectOption {
  value: string;
  label: string;
}

interface FormSelectProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: FormSelectOption[];
  placeholder?: string;
  required?: boolean;
  error?: string;
  className?: string;
}

export function FormSelect({
  label,
  name,
  value,
  onChange,
  options,
  placeholder = "Pilih opsi...",
  required,
  error,
  className = "",
}: FormSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((o) => o.value === value);

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label className="text-sm font-medium text-foreground/70">
        {label}
        {required && <span className="text-rose-400 ml-1">*</span>}
      </label>
      <div ref={wrapperRef} className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full px-4 py-3 rounded-xl glass-subtle border ${
            error ? "border-rose-500/50 focus:border-rose-500" : "border-sage/10 focus:border-sage/40 focus:bg-sage/5"
          } text-sm text-left focus:outline-none transition-all duration-200 flex items-center justify-between gap-2 cursor-pointer shadow-sm`}
        >
          <span className={selectedOption ? "text-foreground" : "text-foreground/25"}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-foreground/40 transition-transform duration-200 shrink-0 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1.5 z-50 glass-active backdrop-blur-xl border border-sage/10 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2.5 text-sm text-left flex items-center justify-between gap-2 hover:bg-sage/10 cursor-pointer transition-colors ${
                  value === option.value ? "text-sage" : "text-foreground/80"
                }`}
              >
                {option.label}
                {value === option.value && <Check className="w-4 h-4 text-sage" />}
              </button>
            ))}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
    </div>
  );
}
