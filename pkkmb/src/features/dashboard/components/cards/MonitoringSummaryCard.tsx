import React from 'react';
import { Users, UserCheck, UserX, AlertTriangle } from 'lucide-react';

interface MonitoringSummaryProps {
  stats: {
    totalMaba: number;
    present: number;
    late: number;
    absent: number;
  };
}

export function MonitoringSummaryCard({ stats }: MonitoringSummaryProps) {
  return (
    <div className="surface-card p-6 space-y-4">
      <h3 className="text-xs font-mono font-bold text-[var(--accent)] uppercase tracking-wider border-b border-[var(--border-subtle)] pb-3">
        MONITORING KELOMPOK & KEHADIRAN MAHASISWA
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] flex flex-col items-center justify-center text-center">
          <Users className="h-6 w-6 text-[var(--accent)] mb-2" />
          <div className="text-2xl font-mono font-bold text-[var(--text-primary)]">
            {stats.totalMaba}
          </div>
          <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider mt-1">
            Total Maba Terdaftar
          </div>
        </div>

        <div className="p-4 rounded-lg bg-[var(--semantic-success)]/10 border border-[var(--semantic-success)]/30 flex flex-col items-center justify-center text-center">
          <UserCheck className="h-6 w-6 text-[var(--semantic-success)] mb-2" />
          <div className="text-2xl font-mono font-bold text-[var(--semantic-success)]">
            {stats.present}
          </div>
          <div className="text-[10px] font-mono text-[var(--semantic-success)] uppercase tracking-wider mt-1">
            Hadir Hari Ini
          </div>
        </div>

        <div className="p-4 rounded-lg bg-[var(--semantic-warning)]/10 border border-[var(--semantic-warning)]/30 flex flex-col items-center justify-center text-center">
          <AlertTriangle className="h-6 w-6 text-[var(--semantic-warning)] mb-2" />
          <div className="text-2xl font-mono font-bold text-[var(--semantic-warning)]">
            {stats.late}
          </div>
          <div className="text-[10px] font-mono text-[var(--semantic-warning)] uppercase tracking-wider mt-1">
            Terlambat
          </div>
        </div>

        <div className="p-4 rounded-lg bg-[var(--semantic-danger)]/10 border border-[var(--semantic-danger)]/30 flex flex-col items-center justify-center text-center">
          <UserX className="h-6 w-6 text-[var(--semantic-danger)] mb-2" />
          <div className="text-2xl font-mono font-bold text-[var(--semantic-danger)]">
            {stats.absent}
          </div>
          <div className="text-[10px] font-mono text-[var(--semantic-danger)] uppercase tracking-wider mt-1">
            Belum Presensi
          </div>
        </div>
      </div>
    </div>
  );
}
