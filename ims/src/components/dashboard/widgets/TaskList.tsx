import React, { useEffect, useState } from 'react';
import { ListTodo, Check, Clock, AlertCircle } from 'lucide-react';
// import ImsApiService from '../../../lib/api';

export function TaskList() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // API Call goes here: ImsApiService.getTaskList()
    // For now, adhering to NO MOCK DATA, we set it empty.
    setTasks([]);
    setLoading(false);
  }, []);

  return (
    <div className="glass-subtle border border-sage/10 rounded-2xl p-6 h-full flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <ListTodo className="w-4 h-4 text-accent-blue" />
          Daftar Tugas Anda
        </h3>
        <button className="text-xs bg-sage/10 text-sage hover:bg-sage/20 px-3 py-1 rounded-lg transition-colors font-medium">
          + Tugas
        </button>
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto pr-2">
        {loading ? (
          <div className="text-center py-8 text-foreground/40 text-sm animate-pulse">Memuat daftar tugas...</div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-foreground/40 text-sm gap-2">
            <ListTodo className="w-8 h-8 text-sage/30" />
            <p>Daftar tugas kosong.</p>
            <span className="text-xs">Klik + Tugas untuk menambah tugas baru.</span>
          </div>
        ) : (
          tasks.map(task => (
            <div key={task.id} className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
              task.status === 'completed' ? 'bg-background/20 border-white/5 opacity-60' : 'bg-background/40 border-sage/10 hover:border-sage/30'
            }`}>
              <button className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                task.status === 'completed' ? 'bg-sage border-sage text-black' : 'border-foreground/30 hover:border-sage text-transparent'
              }`}>
                <Check className="w-3.5 h-3.5" />
              </button>
              <div className="flex flex-col gap-1 w-full">
                <span className={`text-sm font-medium ${task.status === 'completed' ? 'line-through text-foreground/50' : 'text-foreground'}`}>
                  {task.title}
                </span>
                <div className="flex items-center justify-between text-xs mt-1">
                  <span className={`flex items-center gap-1 ${task.due === 'Hari ini' || task.due === 'Kemarin' ? 'text-rose-400' : 'text-foreground/40'}`}>
                    <Clock className="w-3 h-3" /> {task.due}
                  </span>
                  {task.status !== 'completed' && (
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                      task.priority === 'high' ? 'bg-rose-500/10 text-rose-400' : 
                      task.priority === 'medium' ? 'bg-accent-gold/10 text-accent-gold' : 
                      'bg-white/5 text-foreground/40'
                    }`}>
                      {task.priority}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
