import React, { useEffect, useState } from 'react';
import { Target, TrendingUp, AlertCircle } from 'lucide-react';

export function DepartmentProgress() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // API Call goes here
    setDepartments([]);
    setLoading(false);
  }, []);

  return (
    <div className="glass-subtle border border-sage/10 rounded-2xl p-6 h-full flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Target className="w-4 h-4 text-sage" />
          Progres Departemen
        </h3>
        <span className="text-xs text-foreground/50">Q2 2026</span>
      </div>

      <div className="flex flex-col gap-5 overflow-y-auto pr-2 mt-2 flex-grow">
        {loading ? (
          <div className="text-center py-8 text-foreground/40 text-sm animate-pulse">Memuat data departemen...</div>
        ) : departments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-foreground/40 text-sm gap-2 h-full">
            <Target className="w-8 h-8 text-sage/30" />
            <p>Belum ada data progres departemen.</p>
          </div>
        ) : (
          departments.map((dept, idx) => (
            <div key={idx} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{dept.name}</span>
                <span className="text-xs font-mono font-bold text-sage">{dept.progress}%</span>
              </div>
              <div className="w-full h-2 bg-background/50 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="h-full bg-sage rounded-full transition-all duration-1000" 
                  style={{ width: `${dept.progress}%` }} 
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-foreground/40 mt-1">
                <span>{dept.active} / {dept.total} Proker Berjalan</span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <TrendingUp className="w-3 h-3" /> On Track
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
