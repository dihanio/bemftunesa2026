"use client";

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'lg',
}: DialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  }[maxWidth];

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Container Card */}
      <div
        role="dialog"
        aria-modal="true"
        data-lenis-prevent="true"
        className={`relative z-10 w-full ${maxWidthClass} max-h-[90vh] flex flex-col bg-[var(--bg-surface-elevated)] border border-[var(--border-emphasis)] rounded-xl shadow-2xl animate-scale-in text-[var(--text-primary)] my-auto overflow-hidden`}
      >
        {/* Header Section */}
        {(title || description) && (
          <div className="p-5 md:p-6 border-b border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] shrink-0 flex items-start justify-between gap-4">
            <div className="space-y-1 min-w-0 flex-1">
              {title && (
                <h3 className="text-sm md:text-base font-mono font-bold text-[var(--accent)] uppercase tracking-wider leading-snug">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/10 rounded-lg transition-colors outline-none focus:ring-2 focus:ring-[var(--accent)] cursor-pointer shrink-0"
              aria-label="Tutup modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Scrollable Form Body */}
        <div className="p-5 md:p-6 overflow-y-auto overscroll-contain space-y-4 flex-1">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
