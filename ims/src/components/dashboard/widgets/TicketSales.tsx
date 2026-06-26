import React, { useEffect, useState } from 'react';
import { Ticket, TrendingUp, AlertCircle } from 'lucide-react';

export function TicketSales() {
  const [ticketData, setTicketData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // API Call goes here
    setTicketData(null);
    setLoading(false);
  }, []);

  const soldPercent = ticketData && ticketData.total > 0 ? Math.round((ticketData.sold / ticketData.total) * 100) : 0;

  return (
    <div className="glass-subtle border border-sage/10 rounded-2xl p-6 h-full flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Ticket className="w-4 h-4 text-emerald-400" />
          Penjualan Tiket
        </h3>
        <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md">
          <TrendingUp className="w-3 h-3" /> +12 hari ini
        </span>
      </div>

      {loading ? (
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center py-8 text-foreground/40 text-sm animate-pulse">Memuat data tiket...</div>
        </div>
      ) : !ticketData ? (
        <div className="flex-grow flex flex-col items-center justify-center text-center text-foreground/40 text-sm gap-2">
          <Ticket className="w-8 h-8 text-emerald-400/30" />
          <p>Belum ada penjualan tiket aktif.</p>
        </div>
      ) : (
        <>
          <div className="flex gap-4">
            {/* Circle Progress */}
            <div className="w-24 h-24 shrink-0 relative flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                <circle 
                  cx="50" cy="50" r="45" fill="none" stroke="#10b981" strokeWidth="8" 
                  strokeDasharray={`${2 * Math.PI * 45}`} 
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - soldPercent/100)}`} 
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold font-mono text-foreground">{soldPercent}%</span>
                <span className="text-[10px] text-foreground/50">Terjual</span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-col justify-center gap-3 flex-grow">
              <div className="flex flex-col">
                <span className="text-xs text-foreground/40">Total Penjualan</span>
                <span className="text-lg font-bold text-foreground font-mono">
                  {ticketData.sold} <span className="text-xs font-normal text-foreground/40 font-sans">/ {ticketData.total}</span>
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-foreground/40">Pendapatan</span>
                <span className="text-sm font-bold text-emerald-400 font-mono">{ticketData.revenue}</span>
                <span className="text-[10px] text-foreground/40 font-mono">Target: {ticketData.target}</span>
              </div>
            </div>
          </div>

          <div className="mt-2 flex flex-col gap-2">
            {ticketData.types.map((type: any, i: number) => (
              <div key={i} className="flex flex-col gap-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-foreground/70">{type.name}</span>
                  <span className="font-mono">{type.sold}/{type.total}</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${type.percent === 100 ? 'bg-sage' : 'bg-emerald-400'}`} 
                    style={{ width: `${type.percent}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
