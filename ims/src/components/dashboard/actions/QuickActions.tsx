import React from 'react';
import Link from 'next/link';
import { 
  CheckCircle, DollarSign, Megaphone, Send, 
  Plus, FileSearch, Archive, CheckSquare, 
  UserCog, Shield, Settings, Edit
} from 'lucide-react';
import { QuickActionConfig } from '../../../types/role-types';

interface QuickActionsProps {
  actions: QuickActionConfig[];
}

const iconMap: Record<string, React.ElementType> = {
  'check-circle': CheckCircle,
  'dollar-sign': DollarSign,
  'megaphone': Megaphone,
  'send': Send,
  'plus': Plus,
  'file-search': FileSearch,
  'archive': Archive,
  'check-square': CheckSquare,
  'user-cog': UserCog,
  'shield': Shield,
  'settings': Settings,
  'edit': Edit
};

export function QuickActions({ actions }: QuickActionsProps) {
  if (!actions || actions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-3">
      {actions.map((action) => {
        const Icon = iconMap[action.icon] || Plus;
        
        let styleClass = '';
        if (action.color === 'primary') {
          styleClass = 'bg-sage text-white hover:bg-sage/90 shadow-md shadow-sage/20 border-sage/50';
        } else if (action.color === 'secondary') {
          styleClass = 'bg-white/5 hover:bg-white/10 text-foreground border-white/10 glass-subtle';
        } else if (action.color === 'warning') {
          styleClass = 'bg-accent-gold/20 text-accent-gold hover:bg-accent-gold/30 border-accent-gold/30';
        } else if (action.color === 'danger') {
          styleClass = 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border-rose-500/30';
        } else {
          styleClass = 'bg-white/5 hover:bg-white/10 text-foreground border-white/10';
        }

        const commonClasses = `flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border ${styleClass}`;

        const content = (
          <>
            <Icon className="w-4 h-4 shrink-0" />
            <span className="truncate">{action.label}</span>
          </>
        );

        if (action.href) {
          return (
            <Link key={action.id} href={action.href} className={commonClasses}>
              {content}
            </Link>
          );
        }

        return (
          <button 
            key={action.id} 
            onClick={() => console.log('Action clicked:', action.action)}
            className={commonClasses}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}
