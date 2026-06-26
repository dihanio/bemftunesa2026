import React from 'react';
import { Info, TrendingUp, AlertCircle } from 'lucide-react';

export function ExecutiveSummary({ title, metrics }: { title?: string, metrics?: any }) {
  const overallProgress = metrics?.prokerCompletion || '0%';
  const criticalIssues = metrics?.problematicProker || 0;

  return (
    <div className="glass-subtle border border-sage/10 rounded-2xl p-6 h-full flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Info className="w-4 h-4 text-accent-blue" />
          {title || "Ringkasan Eksekutif"}
        </h3>
      </div>
      
      <p className="text-sm text-foreground/60 leading-relaxed">
        {metrics?.role === 'superadmin' ? 'Sistem berjalan normal. Pantau penggunaan resource.' :
         metrics?.role === 'ketua_bem' ? 'Beberapa program kerja perlu perhatian khusus.' :
         'Berikut adalah ringkasan kinerja departemen Anda saat ini.'}
      </p>

      <div className="mt-auto grid grid-cols-2 gap-4 pt-4">
        <div className="bg-sage/5 rounded-xl p-3 border border-sage/10">
          <div className="text-xs text-foreground/40 mb-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-sage" />
            Overall Progress
          </div>
          <div className="text-lg font-mono font-bold text-sage">{overallProgress}</div>
        </div>
        <div className="bg-rose-500/5 rounded-xl p-3 border border-rose-500/10">
          <div className="text-xs text-foreground/40 mb-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-rose-400" />
            Isu Kritis
          </div>
          <div className="text-lg font-mono font-bold text-rose-400">{criticalIssues}</div>
        </div>
      </div>
    </div>
  );
}
