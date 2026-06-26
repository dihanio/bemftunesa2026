import React, { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, MapPin, Clock } from 'lucide-react';
// import ImsApiService from '../../../lib/api';

export function AgendaCalendar() {
  const [agenda, setAgenda] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // API Call goes here: ImsApiService.getRapatList()
    // Setting to empty as per NO MOCK DATA policy
    setAgenda([]);
    setLoading(false);
  }, []);

  return (
    <div className="glass-subtle border border-sage/10 rounded-2xl p-6 h-full flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-accent-blue" />
          Agenda Terdekat
        </h3>
        <button className="text-xs text-sage hover:text-sage/80 transition-colors">
          Lihat Semua
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="text-center py-6 text-foreground/40 text-sm animate-pulse">Memuat agenda...</div>
        ) : agenda.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center text-foreground/40 text-sm gap-2">
            <CalendarIcon className="w-8 h-8 text-sage/30" />
            <p>Belum ada agenda terdekat.</p>
          </div>
        ) : (
          agenda.map(item => (
            <div key={item.id} className="flex gap-4 p-3 rounded-xl bg-background/40 border border-white/5 hover:border-sage/20 transition-colors group">
              <div className="flex flex-col items-center justify-center min-w-[50px] px-3 py-2 rounded-lg bg-sage/5 border border-sage/10 group-hover:bg-sage/10 transition-colors">
                <span className="text-xs text-foreground/60 font-medium">Jun</span>
                <span className="text-lg font-bold text-sage leading-none mt-1">
                  {item.date === 'Hari ini' ? new Date().getDate() : item.date === 'Besok' ? new Date().getDate() + 1 : item.date.split(' ')[0]}
                </span>
              </div>
              
              <div className="flex flex-col justify-center">
                <span className="text-sm font-medium text-foreground">{item.title}</span>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-foreground/50">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {item.time}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {item.location}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
