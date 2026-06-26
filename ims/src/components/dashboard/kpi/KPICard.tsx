import React from 'react';
import { 
  TrendingUp, TrendingDown, Minus, Briefcase, AlertTriangle, 
  FileSignature, DollarSign, MessageSquare, Inbox, Send, 
  FileSearch, Archive, Wallet, FileClock, FileText, FileCheck,
  Users, Cpu, Database, HardDrive, CheckSquare, Clock
} from 'lucide-react';
import { KPIConfig } from '../../../types/role-types';

interface KPICardProps {
  config: KPIConfig;
  value: string | number;
  trend?: string;
}

const iconMap: Record<string, React.ElementType> = {
  'briefcase': Briefcase,
  'alert-triangle': AlertTriangle,
  'file-signature': FileSignature,
  'dollar-sign': DollarSign,
  'message-square': MessageSquare,
  'trending-up': TrendingUp,
  'inbox': Inbox,
  'send': Send,
  'file-search': FileSearch,
  'archive': Archive,
  'wallet': Wallet,
  'trending-down': TrendingDown,
  'file-clock': FileClock,
  'file-text': FileText,
  'file-check': FileCheck,
  'users': Users,
  'cpu': Cpu,
  'database': Database,
  'hard-drive': HardDrive,
  'check-square': CheckSquare,
  'clock': Clock
};

export function KPICard({ config, value, trend }: KPICardProps) {
  const Icon = config.icon && iconMap[config.icon] ? iconMap[config.icon] : Minus;
  
  let colorClass = 'text-foreground';
  let bgClass = 'bg-background/40';
  let borderClass = 'border-sage/10';

  if (config.color === 'sage') {
    colorClass = 'text-sage';
    bgClass = 'bg-sage/10';
    borderClass = 'border-sage/15';
  } else if (config.color === 'accent-blue') {
    colorClass = 'text-accent-blue';
    bgClass = 'bg-accent-blue/10';
    borderClass = 'border-accent-blue/15';
  } else if (config.color === 'accent-gold') {
    colorClass = 'text-accent-gold';
    bgClass = 'bg-accent-gold/10';
    borderClass = 'border-accent-gold/15';
  } else if (config.color === 'rose') {
    colorClass = 'text-rose-400';
    bgClass = 'bg-rose-500/10';
    borderClass = 'border-rose-500/15';
  }

  return (
    <div className="glass-subtle border border-sage/10 rounded-2xl p-5 flex flex-col gap-3 transition-all duration-300 hover:border-sage/30 hover:glass-active hover:-translate-y-1 shadow-sm">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl ${bgClass} border ${borderClass} flex items-center justify-center shrink-0`}>
          <Icon className={`w-5 h-5 ${colorClass}`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
            config.trendDirection === 'up' ? 'text-sage bg-sage/10' : 
            config.trendDirection === 'down' ? 'text-rose-400 bg-rose-500/10' : 
            'text-foreground/60 bg-foreground/5'
          }`}>
            {config.trendDirection === 'up' && <TrendingUp className="w-3 h-3" />}
            {config.trendDirection === 'down' && <TrendingDown className="w-3 h-3" />}
            {config.trendDirection === 'neutral' && <Minus className="w-3 h-3" />}
            {trend}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1 mt-1">
        <span className="text-2xl font-bold font-mono leading-none tracking-tight">{value}</span>
        <span className="text-[11px] text-foreground/45 font-medium uppercase tracking-wider">{config.label}</span>
      </div>
    </div>
  );
}
