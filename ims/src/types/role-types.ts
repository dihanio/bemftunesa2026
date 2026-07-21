export type RoleScope = 'global' | 'department' | 'committee' | 'readonly';

export type RoleSlug =
  // Global Scope
  | 'super-admin' 
  | 'admin' 
  | 'kabem' 
  | 'wakabem' 
  | 'sekretaris' 
  | 'bendahara'
  // Department Scope
  | 'kadep' 
  | 'wakadep' 
  | 'staf'
  // Committee Scope  
  | 'ketua_panitia' 
  | 'wakil_ketua_panitia' 
  | 'sekretaris_panitia' 
  | 'bendahara_panitia' 
  | 'koordinator_divisi' 
  | 'staf_panitia'
  // Common Scope
  | 'user'
  | string
  // Read Only
  | 'auditor' 
  | 'dpm';

export interface KPIConfig {
  id: string;
  label: string;
  valueKey: string; // key from data source
  trendKey?: string; // key for trend data (e.g., +5%)
  trendDirection?: 'up' | 'down' | 'neutral';
  color?: 'sage' | 'accent-blue' | 'accent-gold' | 'rose' | 'default';
  icon?: string; // Lucide icon name
}

export interface WidgetConfig {
  id: string;
  component: string;
  size: 'small' | 'medium' | 'large' | 'full'; // maps to grid columns
  props?: Record<string, unknown>;
}

export interface QuickActionConfig {
  id: string;
  label: string;
  icon: string;
  href?: string;
  action?: string; // identifier for click handler
  color?: 'primary' | 'secondary' | 'danger' | 'warning' | 'default';
}

export interface NotificationPriority {
  type: string;
  level: 'high' | 'medium' | 'low';
}

export interface SidebarSection {
  id: string;
  label: string;
  items: SidebarItemConfig[];
}

export interface SidebarItemConfig {
  name: string;
  path: string;
  icon: string; // Lucide icon name
  status: 'active' | 'locked';
  phase?: string;
}

export interface DashboardConfig {
  roleSlug: RoleSlug;
  roleName: string;
  scope: RoleScope;
  defaultPage: string;
  greeting: string;
  kpis: KPIConfig[];
  widgets: WidgetConfig[];
  quickActions: QuickActionConfig[];
  notificationPriority: NotificationPriority[];
}
