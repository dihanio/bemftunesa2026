import React from 'react';
import { QuickActionData } from '../../../types/dashboard-domains';
import Link from 'next/link';

interface QuickActionWidgetProps {
  actions: QuickActionData[];
}

export function QuickActionWidget({ actions }: QuickActionWidgetProps) {
  return (
    <div className="p-6 border border-hairline rounded-xl bg-surface-1 shadow-md hover:shadow-lg transition-shadow duration-200 h-full">
      <h4 className="text-sm font-medium text-ink-tertiary mb-5">Aksi Cepat</h4>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {actions.map(action => {
          if (action.actionType === 'link' && action.href) {
            return (
              <Link key={action.id} href={action.href} className="flex flex-col items-center justify-center p-4 border border-hairline rounded-lg bg-surface-2 hover:bg-surface-3 hover:scale-105 hover:shadow-md hover:border-primary/30 transition-all duration-200 text-ink group">
                {/* Real implementation would use an icon library based on action.icon */}
                <span className="material-icons mb-2 text-primary group-hover:scale-110 transition-transform">{action.icon}</span>
                <span className="text-xs text-center font-medium">{action.label}</span>
              </Link>
            );
          }
          return (
            <button key={action.id} className="flex flex-col items-center justify-center p-4 border border-hairline rounded-lg bg-surface-2 hover:bg-surface-3 hover:scale-105 hover:shadow-md hover:border-primary/30 transition-all duration-200 text-ink group">
              <span className="material-icons mb-2 text-primary group-hover:scale-110 transition-transform">{action.icon}</span>
              <span className="text-xs text-center font-medium">{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
