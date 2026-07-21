"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { AlertTriangle } from "lucide-react";

interface ConfirmationOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'warning' | 'danger' | 'info';
}

interface ConfirmationContextType {
  confirm: (options: ConfirmationOptions | string) => Promise<boolean>;
}

const ConfirmationContext = createContext<ConfirmationContextType | undefined>(undefined);

export function ConfirmationProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmationOptions>({ message: "" });
  const [resolveRef, setResolveRef] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opt: ConfirmationOptions | string) => {
    return new Promise<boolean>((resolve) => {
      setResolveRef(() => resolve);
      if (typeof opt === "string") {
        setOptions({ message: opt, title: "Konfirmasi Tindakan", confirmLabel: "Ya, Lanjutkan", cancelLabel: "Batal", type: "warning" });
      } else {
        setOptions({
          title: opt.title || "Konfirmasi Tindakan",
          message: opt.message,
          confirmLabel: opt.confirmLabel || "Ya, Lanjutkan",
          cancelLabel: opt.cancelLabel || "Batal",
          type: opt.type || "warning"
        });
      }
      setIsOpen(true);
    });
  }, []);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    if (resolveRef) resolveRef(false);
  }, [resolveRef]);

  const handleConfirm = useCallback(() => {
    setIsOpen(false);
    if (resolveRef) resolveRef(true);
  }, [resolveRef]);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleCancel();
      } else if (e.key === "Enter") {
        e.preventDefault();
        handleConfirm();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleCancel, handleConfirm]);

  const getThemeClass = () => {
    switch (options.type) {
      case 'danger':
        return {
          iconBg: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
          confirmBtn: 'bg-rose-500 hover:bg-rose-600 text-white -rose-500/20 border-rose-600/10'
        };
      case 'info':
        return {
          iconBg: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
          confirmBtn: 'bg-blue-500 hover:bg-blue-600 text-white -blue-500/20 border-blue-600/10'
        };
      case 'warning':
      default:
        return {
          iconBg: 'bg-amber-500/10 border-amber-500/20 text-amber-500',
          confirmBtn: 'bg-amber-500 hover:bg-amber-600 text-white -amber-500/20 border-amber-600/10'
        };
    }
  };

  const theme = getThemeClass();

  return (
    <ConfirmationContext.Provider value={{ confirm }}>
      {children}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
          <div className="glass-overlay border border-white/10 rounded-xl p-6 max-w-md w-full flex flex-col gap-6 transform scale-100 transition-all duration-300">
            <div className="flex gap-4 items-start">
              <div className={`p-3 rounded-full border shrink-0 ${theme.iconBg}`}>
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-base font-bold text-foreground">
                  {options.title}
                </h3>
                <p className="text-sm text-foreground/75 leading-relaxed">
                  {options.message}
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-foreground/60 hover:bg-white/5 transition-all cursor-pointer border border-transparent"
              >
                {options.cancelLabel}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer border ${theme.confirmBtn}`}
              >
                {options.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmationContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmationProvider");
  }
  return context;
}
