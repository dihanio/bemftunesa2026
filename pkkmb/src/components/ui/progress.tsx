import React from 'react';

interface ProgressProps {
  value: number;
  max?: number;
  showPercent?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Progress({
  value,
  max = 100,
  showPercent = false,
  className = '',
  size = 'md',
}: ProgressProps) {
  const percentage = Math.min(Math.max(0, Math.round((value / max) * 100)), 100);

  const heightClass = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  }[size];

  return (
    <div className={`w-full space-y-1 ${className}`}>
      {showPercent && (
        <div className="flex justify-between items-center text-[10px] font-mono text-[var(--accent)] font-bold">
          <span>PROGRESS</span>
          <span>{percentage}%</span>
        </div>
      )}
      <div className={`w-full bg-[var(--bg-canvas)] border border-[var(--border-default)] rounded-full overflow-hidden p-0.5 ${heightClass}`}>
        <div
          className="bg-gradient-to-r from-[var(--accent)] via-amber-300 to-amber-500 h-full rounded-full transition-all duration-700 shadow-[0_0_12px_rgba(212,175,55,0.4)]"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
