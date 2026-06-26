import React from 'react';
import { StatusBadge } from '../ui/StatusBadge';
import { DocumentState } from '@/lib/types/document';
import { 
  FileText, Edit3, Send, CheckCircle, 
  XCircle, RotateCcw, Hash, PenTool, 
  Globe, Archive, Ban
} from 'lucide-react';

interface DocumentStatusBadgeProps {
  state: DocumentState;
}

export function DocumentStatusBadge({ state }: DocumentStatusBadgeProps) {
  switch (state) {
    case DocumentState.DRAFT:
    case DocumentState.GENERATED:
    case DocumentState.EDITED:
      return <StatusBadge label="Draft" colorClass="bg-gray-500/10 text-gray-400 border-gray-500/20" icon={FileText} />;
    
    case DocumentState.SUBMITTED:
    case DocumentState.REVIEWED:
      return <StatusBadge label="Waiting Review" colorClass="bg-yellow-500/10 text-yellow-400 border-yellow-500/20" icon={Send} />;
      
    case DocumentState.REVISION:
      return <StatusBadge label="Revision Needed" colorClass="bg-orange-500/10 text-orange-400 border-orange-500/20" icon={RotateCcw} />;
      
    case DocumentState.REJECTED:
      return <StatusBadge label="Rejected" colorClass="bg-red-500/10 text-red-400 border-red-500/20" icon={XCircle} />;
      
    case DocumentState.APPROVED:
      return <StatusBadge label="Approved" colorClass="bg-emerald-500/10 text-emerald-400 border-emerald-500/20" icon={CheckCircle} />;
      
    case DocumentState.NUMBERED:
      return <StatusBadge label="Numbered" colorClass="bg-blue-500/10 text-blue-400 border-blue-500/20" icon={Hash} />;
      
    case DocumentState.SIGNED:
      return <StatusBadge label="Signed" colorClass="bg-indigo-500/10 text-indigo-400 border-indigo-500/20" icon={PenTool} />;
      
    case DocumentState.PUBLISHED:
      return <StatusBadge label="Published" colorClass="bg-sage/10 text-sage border-sage/20" icon={Globe} />;
      
    case DocumentState.ARCHIVED:
      return <StatusBadge label="Archived" colorClass="bg-slate-500/10 text-slate-400 border-slate-500/20" icon={Archive} />;
      
    case DocumentState.CANCELLED:
      return <StatusBadge label="Cancelled" colorClass="bg-zinc-500/10 text-zinc-400 border-zinc-500/20" icon={Ban} />;
      
    default:
      return <StatusBadge label={state || 'Unknown'} colorClass="bg-gray-500/10 text-gray-400 border-gray-500/20" icon={FileText} />;
  }
}
