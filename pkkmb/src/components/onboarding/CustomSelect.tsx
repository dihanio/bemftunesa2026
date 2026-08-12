"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";

export interface CustomSelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  ariaLabel?: string;
}

/**
 * Dropdown custom mengikuti tema gelap-emas onboarding (pola yang sama dengan
 * dropdown "Hubungan dengan Mahasiswa" di HealthStep). Bukan <select> native
 * agar tampilan konsisten di mobile maupun desktop.
 */
export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Pilih opsi",
  disabled = false,
  ariaLabel,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((o) => !o)}
        className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-white bg-white/5 border border-white/10 rounded-xl transition-colors focus:outline-none focus:border-gold-500 cursor-pointer ${
          disabled ? "opacity-50 cursor-not-allowed" : "hover:border-white/20"
        }`}
      >
        <span className={`text-left truncate ${selected ? "text-white" : "text-white/40"}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-white/40 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="listbox"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-1 z-50 bg-[#111] border border-white/10 rounded-xl overflow-hidden shadow-2xl"
          >
            <div className="max-h-52 overflow-y-auto custom-scrollbar" data-lenis-prevent>
              {options.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  role="option"
                  aria-selected={value === o.value}
                  onClick={() => {
                    onChange(o.value);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-2.5 text-left text-sm cursor-pointer transition-colors flex items-center justify-between gap-2 ${
                    value === o.value
                      ? "bg-gold-500/10 text-gold-500 font-bold"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="truncate">{o.label}</span>
                  {value === o.value && <Check className="w-4 h-4 text-gold-500 shrink-0" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
