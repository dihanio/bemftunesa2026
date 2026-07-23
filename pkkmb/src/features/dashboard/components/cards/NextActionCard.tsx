import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface NextActionProps {
  action: string | null;
}

export function NextActionCard({ action }: NextActionProps) {
  if (!action) return null;

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <AlertTriangle className="h-24 w-24" />
      </div>
      <div className="relative z-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold mb-3 uppercase tracking-wider">
          <AlertTriangle className="h-3.5 w-3.5" /> Next Action
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2 leading-tight">
          {action}
        </h3>
        <div className="flex gap-3 mt-4">
          <Link href="/dashboard/tasks" className="btn-primary text-sm px-5 py-2.5">
            Lihat Penugasan
          </Link>
          <Link href="/dashboard/attendance" className="btn-secondary text-sm px-5 py-2.5 bg-white/5">
            Presensi Sekarang
          </Link>
        </div>
      </div>
    </div>
  );
}
