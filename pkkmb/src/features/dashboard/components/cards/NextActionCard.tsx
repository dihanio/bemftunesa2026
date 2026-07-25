import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface NextActionProps {
  action: string | null;
}

export function NextActionCard({ action }: NextActionProps) {
  if (!action) return null;

  return (
    <div className="surface-card p-6 relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-[var(--accent-muted)] rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--accent-muted)] border border-[var(--accent-glow)] text-[var(--accent)] text-[10px] font-mono font-bold uppercase tracking-wider rounded">
          <Sparkles className="h-3 w-3 text-[var(--accent)]" /> SELANJUTNYA
        </div>

        <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] leading-relaxed">
          {action}
        </h3>

        <div className="flex flex-wrap gap-3 pt-1">
          <Link
            href="/dashboard/tasks"
            className="btn-accent inline-flex items-center gap-2 px-4 py-2 font-mono text-xs uppercase tracking-wider cursor-pointer"
          >
            <span>Buka Penugasan</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/dashboard/attendance"
            className="btn-secondary-custom inline-flex items-center gap-2 px-4 py-2 font-mono text-xs uppercase tracking-wider cursor-pointer"
          >
            <span>Presensi Sekarang</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
