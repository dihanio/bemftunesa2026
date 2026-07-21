import React from 'react';
import { Hourglass, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { BaseStateProps } from '../../../types/state';

const iconMap = {
  'hourglass_empty': Hourglass,
  'alert': AlertCircle,
  'check': CheckCircle,
  'error': XCircle,
};

export function BaseState({ 
  title, 
  message, 
  icon, 
  actionLabel, 
  onAction, 
  className = '' 
}: BaseStateProps) {
  const IconComponent = icon ? iconMap[icon as keyof typeof iconMap] : null;
  
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center border rounded-lg bg-surface-1 border-hairline min-h-[200px] ${className}`}>
      {IconComponent && (
        <div className="w-12 h-12 mb-4 text-ink-tertiary flex items-center justify-center">
          <IconComponent size={32} className="animate-pulse" />
        </div>
      )}
      {title && <h3 className="text-lg font-semibold text-ink mb-1">{title}</h3>}
      {message && <p className="text-sm text-ink-tertiary mb-4 max-w-md">{message}</p>}
      {actionLabel && onAction && (
        <button 
          onClick={onAction}
          className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-hover transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
