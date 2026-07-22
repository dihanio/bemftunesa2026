import React from 'react';
import { Calendar, Clock } from 'lucide-react';

interface ScheduleItem {
  _id?: string;
  name: string;
  startTime: string;
  location?: string;
}

interface ActivityTimelineProps {
  schedules: ScheduleItem[];
}

export function ActivityTimeline({ schedules }: ActivityTimelineProps) {
  return (
    <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Calendar className="h-5 w-5 text-blue-400" />
        Timeline Kegiatan
      </h3>

      <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
        {schedules.length === 0 ? (
          <div className="text-center py-6 text-foreground/40 text-sm relative z-10">
            Tidak ada kegiatan hari ini.
          </div>
        ) : (
          schedules.map((item, i) => (
            <div key={item._id || i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-black text-slate-300 group-[.is-active]:text-blue-400 group-[.is-active]:border-blue-400/30 group-[.is-active]:bg-blue-400/10 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow">
                <Clock className="h-4 w-4" />
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-white/5 bg-white/5 group-[.is-active]:bg-white/10 group-[.is-active]:border-white/10 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-foreground">{item.name}</span>
                  <span className="text-xs font-semibold text-blue-400">
                    {new Date(item.startTime).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-foreground/60">{item.location}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
