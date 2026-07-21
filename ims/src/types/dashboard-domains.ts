export interface StatData {
  label: string;
  value: number;
  trend?: number; // e.g. 5 for +5%, -2 for -2%
  trendDirection?: 'up' | 'down' | 'neutral';
  color?: 'primary' | 'success' | 'warning' | 'danger';
}

export interface ActivityData {
  id: string;
  title: string;
  description: string;
  timestamp: string; // ISO String
  actor: string;
  type: 'create' | 'update' | 'delete' | 'system';
}

export interface QuickActionData {
  id: string;
  label: string;
  icon: string;
  actionType: 'link' | 'modal' | 'api';
  href?: string;
}
