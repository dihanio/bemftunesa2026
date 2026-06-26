import React from 'react';
import { Timer, CalendarDays } from 'lucide-react';

export function EventCountdown() {
  return (
    <div className="glass-active border border-sage/20 rounded-2xl p-6 h-full flex flex-col justify-between overflow-hidden relative group">
      {/* Background Decor */}
      <div className="absolute -right-8 -top-8 w-32 h-32 bg-sage/10 rounded-full blur-2xl group-hover:bg-sage/20 transition-all duration-500" />
      
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2 text-sage">
          <CalendarDays className="w-5 h-5" />
          <span className="font-semibold text-sm tracking-wider uppercase">Hari Pelaksanaan</span>
        </div>
        <div className="bg-sage/20 text-sage p-2 rounded-xl backdrop-blur-md">
          <Timer className="w-5 h-5 animate-pulse" />
        </div>
      </div>

      <div className="flex flex-col items-center justify-center py-12 relative z-10 flex-grow">
        <CalendarDays className="w-10 h-10 text-sage/30 mb-3" />
        <span className="text-sm text-foreground/50">Belum ada acara besar dalam waktu dekat.</span>
      </div>
    </div>
  );
}
