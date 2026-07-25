import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({
  message = 'MEMUAT DATA...',
  className = '',
}: LoadingStateProps) {
  return (
    <div
      className={`w-full min-h-[380px] md:min-h-[440px] flex flex-col items-center justify-center p-8 text-[var(--text-muted)] rounded-lg border border-dashed border-[var(--border-subtle)] bg-[var(--bg-surface)]/40 ${className}`}
    >
      <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)] mb-3" />
      <p className="text-xs font-mono tracking-widest uppercase text-[var(--text-secondary)] font-bold">
        {message}
      </p>
    </div>
  );
}
