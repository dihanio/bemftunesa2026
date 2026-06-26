import React, { useEffect, useState } from 'react';
import { GanttChartSquare, Flag, ArrowRight, AlertCircle } from 'lucide-react';

export function ProjectTimeline() {
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // API call goes here
    setMilestones([]);
    setLoading(false);
  }, []);

  return (
    <div className="glass-subtle border border-sage/10 rounded-2xl p-6 h-full flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <GanttChartSquare className="w-4 h-4 text-accent-gold" />
          Timeline LKMM TD 2026
        </h3>
        <span className="text-xs bg-sage/10 text-sage px-2 py-1 rounded-md font-medium">
          H-9
        </span>
      </div>

      <div className="flex flex-col gap-0 mt-2 flex-grow overflow-y-auto pr-2">
        {loading ? (
          <div className="text-center py-8 text-foreground/40 text-sm animate-pulse">Memuat timeline...</div>
        ) : milestones.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-foreground/40 text-sm gap-2 h-full">
            <GanttChartSquare className="w-8 h-8 text-sage/30" />
            <p>Belum ada milestone proyek.</p>
          </div>
        ) : (
          milestones.map((milestone, i) => (
            <div key={i} className="flex items-stretch group">
              <div className="flex flex-col items-center w-8 shrink-0">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center bg-background z-10 ${
                  milestone.status === 'completed' ? 'border-sage' : 
                  milestone.status === 'active' ? 'border-accent-gold' : 
                  'border-white/10'
                }`}>
                  {milestone.status === 'completed' && <div className="w-1.5 h-1.5 bg-sage rounded-full" />}
                  {milestone.status === 'active' && <div className="w-1.5 h-1.5 bg-accent-gold rounded-full animate-pulse" />}
                </div>
                {i !== milestones.length - 1 && (
                  <div className={`w-0.5 flex-grow my-1 ${
                    milestone.status === 'completed' ? 'bg-sage/50' : 'bg-white/5'
                  }`} />
                )}
              </div>
              
              <div className={`pb-6 pl-2 w-full flex justify-between items-start ${
                milestone.status === 'pending' ? 'opacity-50' : ''
              }`}>
                <div className="flex flex-col">
                  <span className={`text-sm font-medium ${milestone.status === 'active' ? 'text-accent-gold font-bold' : 'text-foreground'}`}>
                    {milestone.name}
                  </span>
                  {milestone.status === 'active' && (
                    <span className="text-xs text-foreground/50 mt-1 flex items-center gap-1">
                      <ArrowRight className="w-3 h-3" /> Tahap saat ini
                    </span>
                  )}
                </div>
                <span className="text-xs font-mono text-foreground/40 mt-0.5">{milestone.date}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
