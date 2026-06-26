import React from 'react';
import { WorkflowHistoryEntry } from '@/lib/types/document';
import { DocumentStatusBadge } from './DocumentStatusBadge';
import { formatDate } from '@/lib/utils';

interface DocumentTimelineProps {
  history: WorkflowHistoryEntry[];
}

function formatTimestamp(dateStr: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return `${formatDate(dateStr)} ${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
}

export function DocumentTimeline({ history }: DocumentTimelineProps) {
  if (!history || history.length === 0) {
    return <div className="text-sm text-white/50 py-4">Belum ada riwayat.</div>;
  }

  const sortedHistory = [...history].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return (
    <div className="relative pl-4 border-l border-white/10 space-y-6">
      {sortedHistory.map((entry, idx) => (
        <div key={idx} className="relative">
          <div className="absolute -left-5 top-1 w-2 h-2 rounded-full bg-sage ring-4 ring-[#0d1117]"></div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">
                {entry.actor?.name || 'Sistem'}
              </span>
              <span className="text-xs text-white/40">
                {formatTimestamp(entry.timestamp)}
              </span>
            </div>
            
            <div className="text-sm text-white/70">
              Melakukan aksi <span className="font-medium text-white">{entry.action}</span>
            </div>
            
            <div className="flex items-center gap-2 mt-1">
              <DocumentStatusBadge state={entry.fromState} />
              <span className="text-white/40 text-xs">➔</span>
              <DocumentStatusBadge state={entry.toState} />
            </div>

            {entry.comment && (
              <div className="mt-2 p-3 rounded-lg bg-white/5 border border-white/10 text-sm italic text-white/80">
                &ldquo;{entry.comment}&rdquo;
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
