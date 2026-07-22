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
    <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
      <h3 className="text-lg font-bold mb-4">Monitoring Kelompok</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center justify-center text-center">
          <Users className="h-6 w-6 text-blue-400 mb-2" />
          <div className="text-2xl font-bold">{stats.totalMaba}</div>
          <div className="text-xs text-foreground/60">Total Maba</div>
        </div>
        
        <div className="p-4 rounded-xl bg-sage/5 border border-sage/10 flex flex-col items-center justify-center text-center">
          <UserCheck className="h-6 w-6 text-sage mb-2" />
          <div className="text-2xl font-bold text-sage">{stats.present}</div>
          <div className="text-xs text-sage/70">Hadir</div>
        </div>

        <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex flex-col items-center justify-center text-center">
          <AlertTriangle className="h-6 w-6 text-amber-500 mb-2" />
          <div className="text-2xl font-bold text-amber-500">{stats.late}</div>
          <div className="text-xs text-amber-500/70">Terlambat</div>
        </div>

        <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 flex flex-col items-center justify-center text-center">
          <UserX className="h-6 w-6 text-red-400 mb-2" />
          <div className="text-2xl font-bold text-red-400">{stats.absent}</div>
          <div className="text-xs text-red-400/70">Alpha / Izin</div>
        </div>
      </div>
    </div>
  );
}
