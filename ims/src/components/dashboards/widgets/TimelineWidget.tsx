import React from 'react';
import { ActivityData } from '../../../types/dashboard-domains';

interface TimelineWidgetProps {
  activities: ActivityData[];
}

export function TimelineWidget({ activities }: TimelineWidgetProps) {
  return (
    <div className="p-6 border border-hairline rounded-xl bg-surface-1 shadow-md hover:shadow-lg transition-shadow duration-200 h-full">
      <h4 className="text-sm font-medium text-ink mb-6">Aktivitas Terbaru</h4>
      
      <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
        {activities.map((activity, index) => (
          <div key={activity.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            {/* Timeline dot */}
            <div className="flex items-center justify-center w-5 h-5 rounded-full border border-white bg-primary text-white shadow group-hover:scale-125 group-hover:shadow-lg transition-all duration-200 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            </div>
            
            {/* Content box */}
            <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-4 rounded-lg border border-hairline bg-surface-2 shadow-sm hover:shadow-md hover:border-primary/30 hover:scale-[1.02] transition-all duration-200 cursor-pointer">
              <div className="flex items-center justify-between space-x-2 mb-1">
                <div className="font-semibold text-ink text-sm">{activity.actor}</div>
                <time className="text-xs font-medium text-ink-tertiary">
                  {new Date(activity.timestamp).toLocaleDateString()}
                </time>
              </div>
              <div className="text-sm text-ink-secondary">{activity.description}</div>
            </div>
          </div>
        ))}
      </div>
      
      {activities.length === 0 && (
        <div className="text-center text-sm text-ink-tertiary py-8">
          Belum ada aktivitas.
        </div>
      )}
    </div>
  );
}
