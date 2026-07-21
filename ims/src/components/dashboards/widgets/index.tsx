import React from 'react';
import { 
  ArrowUpRight, ArrowDownRight, CheckCircle2, Circle, Clock, AlertTriangle, 
  ChevronRight, Calendar, Info
} from 'lucide-react';
import type { StatItem, ActivityItem, TaskItem, AgendaItem } from '../../../types/dashboard-widgets';

// --- STAT CARD ---
export function StatCard({ stat }: { stat: StatItem }) {
  return (
    <div className="bg-surface-1 border border-hairline rounded-xl p-5 flex flex-col hover:border-hairline-strong transition-colors group">
      <span className="text-sm font-medium text-ink-muted mb-2">{stat.label}</span>
      <div className="flex items-end justify-between mt-auto">
        <span className="text-2xl font-extrabold text-ink group-hover:text-primary transition-colors">{stat.value}</span>
        {stat.trend && (
          <div className={`flex items-center text-xs font-semibold ${stat.trend.isPositive ? 'text-semantic-success' : 'text-semantic-danger'}`}>
            {stat.trend.isPositive ? <ArrowUpRight size={14} className="mr-0.5" /> : <ArrowDownRight size={14} className="mr-0.5" />}
            {stat.trend.value}%
          </div>
        )}
      </div>
    </div>
  );
}

// --- QUICK ACTION CARD ---
interface QuickActionProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
}
export function QuickActionCard({ label, icon, onClick, variant = 'outline' }: QuickActionProps) {
  const baseClasses = "flex flex-col items-center justify-center p-4 rounded-xl text-center gap-3 transition-all active:scale-95 cursor-pointer border";
  
  const variants = {
    primary: "bg-primary text-white border-primary-focus hover:bg-primary-hover",
    secondary: "bg-surface-2 text-ink border-transparent hover:bg-surface-3",
    outline: "bg-transparent text-ink border-hairline hover:border-hairline-strong hover:bg-surface-2"
  };

  return (
    <div onClick={onClick} className={`${baseClasses} ${variants[variant]}`}>
      <div className={variant === 'primary' ? 'text-white' : 'text-primary'}>
        {icon}
      </div>
      <span className="text-xs font-semibold">{label}</span>
    </div>
  );
}

// --- TIMELINE / ACTIVITY CARD ---
export function TimelineCard({ activities, title = "Aktivitas Terbaru" }: { activities: ActivityItem[], title?: string }) {
  const getIcon = (type: string) => {
    switch(type) {
      case 'success': return <div className="w-2 h-2 rounded-full bg-semantic-success mt-1.5" />;
      case 'warning': return <div className="w-2 h-2 rounded-full bg-semantic-warning mt-1.5" />;
      case 'danger': return <div className="w-2 h-2 rounded-full bg-semantic-danger mt-1.5" />;
      default: return <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />;
    }
  };

  return (
    <div className="bg-surface-1 border border-hairline rounded-xl overflow-hidden flex flex-col h-full">
      <div className="px-5 py-4 border-b border-hairline flex justify-between items-center bg-surface-2/50">
        <h3 className="font-bold text-sm text-ink">{title}</h3>
      </div>
      <div className="p-5 flex flex-col gap-5 flex-1">
        {activities.length === 0 ? (
          <div className="text-sm text-ink-muted text-center py-4">Belum ada aktivitas.</div>
        ) : (
          activities.map(act => (
            <div key={act.id} className="flex gap-4">
              {getIcon(act.type)}
              <div className="flex flex-col gap-1 flex-1">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-sm font-semibold text-ink leading-tight">{act.title}</span>
                  <span className="text-[10px] font-medium text-ink-muted whitespace-nowrap">{act.timestamp}</span>
                </div>
                <p className="text-xs text-ink-subtle leading-relaxed">{act.description}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// --- TASK CARD ---
export function TaskListWidget({ tasks, title = "Daftar Tugas" }: { tasks: TaskItem[], title?: string }) {
  return (
    <div className="bg-surface-1 border border-hairline rounded-xl overflow-hidden flex flex-col h-full">
      <div className="px-5 py-4 border-b border-hairline flex justify-between items-center bg-surface-2/50">
        <h3 className="font-bold text-sm text-ink">{title}</h3>
        <button className="text-[10px] font-bold text-primary uppercase tracking-wider hover:underline">Lihat Semua</button>
      </div>
      <div className="p-2 flex flex-col flex-1">
        {tasks.length === 0 ? (
          <div className="text-sm text-ink-muted text-center py-6">Semua tugas telah selesai! 🎉</div>
        ) : (
          tasks.map(task => (
            <div key={task.id} className="flex items-center gap-3 p-3 hover:bg-surface-2 rounded-lg cursor-pointer group transition-colors">
              {task.status === 'completed' ? (
                <CheckCircle2 size={18} className="text-semantic-success shrink-0" />
              ) : task.status === 'in-progress' ? (
                <Clock size={18} className="text-semantic-warning shrink-0" />
              ) : (
                <Circle size={18} className="text-ink-muted shrink-0 group-hover:text-primary transition-colors" />
              )}
              <div className="flex flex-col flex-1 min-w-0">
                <span className={`text-sm font-medium truncate ${task.status === 'completed' ? 'text-ink-subtle line-through' : 'text-ink'}`}>
                  {task.title}
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${task.deadline.toLowerCase() === 'hari ini' ? 'bg-semantic-danger/10 text-semantic-danger' : 'bg-surface-3 text-ink-muted'}`}>
                    {task.deadline}
                  </span>
                  {task.assignee && <span className="text-[10px] text-ink-subtle truncate">→ {task.assignee}</span>}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// --- AGENDA CARD ---
export function AgendaWidget({ agenda, title = "Agenda & Kalender" }: { agenda: AgendaItem[], title?: string }) {
  return (
    <div className="bg-surface-1 border border-hairline rounded-xl overflow-hidden flex flex-col h-full">
      <div className="px-5 py-4 border-b border-hairline flex justify-between items-center bg-surface-2/50">
        <h3 className="font-bold text-sm text-ink flex items-center gap-2">
          <Calendar size={16} className="text-primary" />
          {title}
        </h3>
      </div>
      <div className="p-0 flex flex-col flex-1 divide-y divide-hairline">
        {agenda.length === 0 ? (
          <div className="text-sm text-ink-muted text-center py-6">Tidak ada agenda dalam waktu dekat.</div>
        ) : (
          agenda.map(item => (
            <div key={item.id} className="flex gap-4 p-5 hover:bg-surface-2 transition-colors group cursor-pointer">
              <div className="flex flex-col items-center justify-center bg-surface-3 rounded-lg w-12 h-12 shrink-0 border border-hairline group-hover:border-primary/30 transition-colors">
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest leading-none">
                  {new Date(item.date).toLocaleString('id-ID', { month: 'short' })}
                </span>
                <span className="text-lg font-extrabold text-ink leading-none mt-1">
                  {new Date(item.date).getDate()}
                </span>
              </div>
              <div className="flex flex-col flex-1 justify-center min-w-0">
                <span className="text-sm font-semibold text-ink truncate group-hover:text-primary transition-colors">{item.title}</span>
                <div className="flex items-center gap-2 mt-1.5 text-xs text-ink-subtle">
                  <span className="flex items-center gap-1"><Clock size={12} /> {item.time}</span>
                  <span>•</span>
                  <span className="truncate">{item.location}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
