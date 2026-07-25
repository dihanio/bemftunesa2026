"use client";

import React, { useState, createContext, useContext, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toast: (options: Omit<ToastMessage, 'id'>) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ type, title, message, duration = 4000 }: Omit<ToastMessage, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type, title, message, duration }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback(
    (message: string, title?: string) => toast({ type: 'success', message, title }),
    [toast]
  );
  const error = useCallback(
    (message: string, title?: string) => toast({ type: 'error', message, title }),
    [toast]
  );
  const warning = useCallback(
    (message: string, title?: string) => toast({ type: 'warning', message, title }),
    [toast]
  );
  const info = useCallback(
    (message: string, title?: string) => toast({ type: 'info', message, title }),
    [toast]
  );

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((item) => (
          <ToastItem key={item.id} item={item} onClose={() => removeToast(item.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

function ToastItem({ item, onClose }: { item: ToastMessage; onClose: () => void }) {
  const icons = {
    success: <CheckCircle2 className="h-4 w-4 text-[var(--semantic-success)] shrink-0" />,
    error: <AlertCircle className="h-4 w-4 text-[var(--semantic-danger)] shrink-0" />,
    warning: <AlertTriangle className="h-4 w-4 text-[var(--semantic-warning)] shrink-0" />,
    info: <Info className="h-4 w-4 text-[var(--semantic-info)] shrink-0" />,
  };

  const borders = {
    success: 'border-[var(--semantic-success)]/40 bg-[var(--bg-surface-elevated)]',
    error: 'border-[var(--semantic-danger)]/40 bg-[var(--bg-surface-elevated)]',
    warning: 'border-[var(--semantic-warning)]/40 bg-[var(--bg-surface-elevated)]',
    info: 'border-[var(--semantic-info)]/40 bg-[var(--bg-surface-elevated)]',
  };

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 p-3.5 border rounded shadow-2xl backdrop-blur-md animate-scale-in text-xs font-mono transition-all ${
        borders[item.type]
      }`}
    >
      <div className="mt-0.5">{icons[item.type]}</div>
      <div className="flex-1 min-w-0">
        {item.title && (
          <div className="font-bold text-[var(--text-primary)] uppercase tracking-wider mb-0.5">
            {item.title}
          </div>
        )}
        <div className="text-[var(--text-secondary)] leading-relaxed">{item.message}</div>
      </div>
      <button
        onClick={onClose}
        className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-0.5 rounded transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
