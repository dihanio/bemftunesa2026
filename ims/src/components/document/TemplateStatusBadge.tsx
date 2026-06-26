import React from 'react';
import { StatusBadge } from '../ui/StatusBadge';
import { FileText, CheckCircle, Globe, Archive } from 'lucide-react';

interface TemplateStatusBadgeProps {
  status: 'draft' | 'validated' | 'published' | 'deprecated';
}

export function TemplateStatusBadge({ status }: TemplateStatusBadgeProps) {
  switch (status) {
    case 'draft':
      return <StatusBadge label="Draft" colorClass="bg-gray-500/10 text-gray-400 border-gray-500/20" icon={FileText} />;
    
    case 'validated':
      return <StatusBadge label="Validated" colorClass="bg-yellow-500/10 text-yellow-400 border-yellow-500/20" icon={CheckCircle} />;
      
    case 'published':
      return <StatusBadge label="Published" colorClass="bg-sage/10 text-sage border-sage/20" icon={Globe} />;
      
    case 'deprecated':
      return <StatusBadge label="Deprecated" colorClass="bg-red-500/10 text-red-400 border-red-500/20" icon={Archive} />;
      
    default:
      return <StatusBadge label={status || 'Unknown'} colorClass="bg-gray-500/10 text-gray-400 border-gray-500/20" icon={FileText} />;
  }
}
