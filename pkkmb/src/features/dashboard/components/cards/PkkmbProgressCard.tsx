import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ProgressProps {
  progress: {
    percent: number;
    hasGroup: boolean;
    hasAttendedAny: boolean;
    hasSubmittedTask: boolean;
  };
}

export function PkkmbProgressCard({ progress }: ProgressProps) {
  return (
    <div className="surface-card p-6">
      {/* Title Header */}
      <div className="flex items-center justify-between mb-4 border-b border-[var(--border-subtle)] pb-3">
        <h3 className="text-xs font-mono font-bold text-[var(--accent)] uppercase tracking-wider">
          PROGRES PKKMB
        </h3>
        <span className="text-xs font-mono font-bold text-[var(--accent)] bg-[var(--accent-muted)] border border-[var(--accent-glow)] px-2.5 py-0.5 rounded">
          {progress.percent}%
        </span>
      </div>

      {/* Custom Animated Progress Bar */}
      <div className="mb-6">
        <Progress value={progress.percent} />
      </div>

      {/* 4 Step Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Step 1: Profil */}
        <div className="p-3 rounded bg-[var(--accent-muted)] border border-[var(--accent-glow)] text-[var(--accent)] flex flex-col items-center justify-center text-center gap-1.5">
          <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" />
          <span className="text-[10px] font-mono uppercase tracking-wider font-bold">
            01 &middot; PROFIL LENGKAP
          </span>
        </div>

        {/* Step 2: Kelompok */}
        <div
          className={`p-3 rounded border flex flex-col items-center justify-center text-center gap-1.5 transition-all ${
            progress.hasGroup
              ? 'bg-[var(--accent-muted)] border-[var(--accent-glow)] text-[var(--accent)]'
              : 'bg-white/[0.02] border-[var(--border-subtle)] text-[var(--text-muted)]'
          }`}
        >
          {progress.hasGroup ? (
            <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" />
          ) : (
            <Circle className="h-4 w-4 text-[var(--text-muted)]" />
          )}
          <span className="text-[10px] font-mono uppercase tracking-wider font-bold">
            02 &middot; KELOMPOK
          </span>
        </div>

        {/* Step 3: Presensi */}
        <div
          className={`p-3 rounded border flex flex-col items-center justify-center text-center gap-1.5 transition-all ${
            progress.hasAttendedAny
              ? 'bg-[var(--accent-muted)] border-[var(--accent-glow)] text-[var(--accent)]'
              : 'bg-white/[0.02] border-[var(--border-subtle)] text-[var(--text-muted)]'
          }`}
        >
          {progress.hasAttendedAny ? (
            <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" />
          ) : (
            <Circle className="h-4 w-4 text-[var(--text-muted)]" />
          )}
          <span className="text-[10px] font-mono uppercase tracking-wider font-bold">
            03 &middot; PRESENSI
          </span>
        </div>

        {/* Step 4: Tugas */}
        <div
          className={`p-3 rounded border flex flex-col items-center justify-center text-center gap-1.5 transition-all ${
            progress.hasSubmittedTask
              ? 'bg-[var(--accent-muted)] border-[var(--accent-glow)] text-[var(--accent)]'
              : 'bg-white/[0.02] border-[var(--border-subtle)] text-[var(--text-muted)]'
          }`}
        >
          {progress.hasSubmittedTask ? (
            <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" />
          ) : (
            <Circle className="h-4 w-4 text-[var(--text-muted)]" />
          )}
          <span className="text-[10px] font-mono uppercase tracking-wider font-bold">
            04 &middot; PENUGASAN
          </span>
        </div>
      </div>
    </div>
  );
}
