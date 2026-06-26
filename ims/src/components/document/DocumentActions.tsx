import React from 'react';
import { WorkflowAction } from '@/lib/types/document';
import { Check, X, Send, RotateCcw, Archive, Globe, ArrowLeft, Ban } from 'lucide-react';

interface DocumentActionsProps {
  availableActions: WorkflowAction[];
  onAction: (action: WorkflowAction) => void;
  isLoading?: boolean;
}

const ACTION_CONFIG: Record<WorkflowAction, { label: string; icon: React.ElementType; className: string }> = {
  [WorkflowAction.SUBMIT]: {
    label: 'Kirim Review',
    icon: Send,
    className: 'bg-sage hover:bg-sage/90 text-white border-sage/50 shadow-md shadow-sage/20',
  },
  [WorkflowAction.APPROVE]: {
    label: 'Setujui',
    icon: Check,
    className: 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/10',
  },
  [WorkflowAction.REJECT]: {
    label: 'Tolak',
    icon: X,
    className: 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/20',
  },
  [WorkflowAction.REQUEST_REVISION]: {
    label: 'Minta Revisi',
    icon: RotateCcw,
    className: 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border-orange-500/20',
  },
  [WorkflowAction.RETURN]: {
    label: 'Kembalikan',
    icon: ArrowLeft,
    className: 'bg-white/5 hover:bg-white/10 text-white border-white/10',
  },
  [WorkflowAction.CANCEL]: {
    label: 'Batalkan',
    icon: Ban,
    className: 'bg-white/5 hover:bg-white/10 text-foreground/70 border-white/10',
  },
  [WorkflowAction.PUBLISH]: {
    label: 'Publish',
    icon: Globe,
    className: 'bg-sage hover:bg-sage/90 text-white border-sage/50',
  },
  [WorkflowAction.ARCHIVE]: {
    label: 'Arsipkan',
    icon: Archive,
    className: 'bg-white/5 hover:bg-white/10 text-foreground/70 border-white/10',
  },
};

export function DocumentActions({ availableActions, onAction, isLoading }: DocumentActionsProps) {
  if (!availableActions || availableActions.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {availableActions.map(action => {
        const config = ACTION_CONFIG[action];
        const Icon = config.icon;
        return (
          <button
            key={action}
            onClick={() => onAction(action)}
            disabled={isLoading}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 border ${config.className}`}
          >
            <Icon className="w-4 h-4" />
            {config.label}
          </button>
        );
      })}
    </div>
  );
}
