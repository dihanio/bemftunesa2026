import React from 'react';
import { StatData } from '../../../types/dashboard-domains';

interface StatWidgetProps {
  data: StatData;
}

export function StatWidget({ data }: StatWidgetProps) {
  const { label, value, trend, trendDirection, color = 'primary' } = data;

  const colorClasses = {
    primary: 'bg-primary-50 text-primary-600',
    success: 'bg-green-50 text-green-600',
    warning: 'bg-orange-50 text-orange-600',
    danger: 'bg-red-50 text-red-600',
  };

  const trendColor = trendDirection === 'up' ? 'text-green-600' : trendDirection === 'down' ? 'text-red-600' : 'text-zinc-500';

  return (
    <div className="p-6 border border-hairline rounded-xl bg-surface-1 shadow-md hover:shadow-lg hover:scale-[1.02] hover:border-primary/20 transition-all duration-200 flex flex-col justify-between h-full cursor-pointer">
      <h4 className="text-sm font-medium text-ink-tertiary mb-3">{label}</h4>
      <div className="flex items-end justify-between">
        <span className="text-3xl font-bold tracking-tight text-ink">{value}</span>
        {trend !== undefined && (
          <span className={`text-xs font-semibold ${trendColor} transition-colors`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
    </div>
  );
}
