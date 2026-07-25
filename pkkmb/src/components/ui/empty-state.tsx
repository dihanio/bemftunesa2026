import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ElementType;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title = 'BELUM ADA DATA',
  description = 'Data tidak ditemukan atau belum tersedia saat ini.',
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`w-full min-h-[380px] md:min-h-[440px] flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-lg border border-dashed border-[var(--border-default)] bg-[var(--bg-surface)]/60 ${className}`}
    >
      <div className="p-4 bg-[var(--accent-muted)] border border-[var(--accent-glow)] rounded-full text-[var(--accent)] mb-4 shadow-lg shadow-[var(--accent-glow)]">
        <Icon className="h-8 w-8" />
      </div>
      <h4 className="text-sm font-mono font-bold text-[var(--text-primary)] uppercase tracking-wider">
        {title}
      </h4>
      {description && (
        <p className="text-xs text-[var(--text-muted)] max-w-sm mt-1.5 leading-relaxed font-mono">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
