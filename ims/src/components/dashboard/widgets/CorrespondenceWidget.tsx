import React from 'react';
import { Mail, ArrowUpRight, ArrowDownLeft, FileCheck } from 'lucide-react';

export function CorrespondenceWidget({ metrics }: { metrics?: any }) {
  const stats = [
    { label: 'Surat Masuk', value: metrics?.incomingMail || 0, icon: ArrowDownLeft, color: 'text-accent-blue', bg: 'bg-accent-blue/10' },
    { label: 'Surat Keluar', value: metrics?.outgoingMail || 0, icon: ArrowUpRight, color: 'text-sage', bg: 'bg-sage/10' },
    { label: 'Pending Draft', value: metrics?.pendingDrafts || 0, icon: FileCheck, color: 'text-accent-gold', bg: 'bg-accent-gold/10' },
  ];

  return (
    <div className="glass-subtle border border-sage/10 rounded-2xl p-6 h-full flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Mail className="w-4 h-4 text-foreground/70" />
          Status Persuratan
        </h3>
        <button className="text-xs bg-white/5 hover:bg-white/10 px-2 py-1 rounded transition-colors text-foreground/70">
          Kelola
        </button>
      </div>

      <div className="flex flex-col gap-3 flex-grow justify-center">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-background/30 border border-white/5 hover:bg-background/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${stat.bg} ${stat.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-foreground/80">{stat.label}</span>
              </div>
              <span className="text-lg font-mono font-bold text-foreground">{stat.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
