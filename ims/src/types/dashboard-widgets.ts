export interface StatTrend {
  value: number;
  isPositive: boolean;
}

export interface StatItem {
  id: string;
  label: string;
  value: string | number;
  trend?: StatTrend;
}

export interface ActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'danger';
}

export interface TaskItem {
  id: string;
  title: string;
  deadline: string;
  status: 'pending' | 'in-progress' | 'completed';
  assignee?: string;
}

export interface AgendaItem {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
}
