import { PermissionString, RoleSlug } from './rbac';
import { ElementType } from 'react';

export interface WidgetRegistryItem {
  id: string;
  componentName: string; // Used to lazily load or resolve the component
  requiredPermissions: PermissionString[]; // If empty, anyone can access
  requiredRoles: RoleSlug[]; // If empty, any role can access
  defaultPosition: { w: number; h: number };
  group: 'stats' | 'timeline' | 'action' | 'list' | 'chart';
  priority: number;
}

export interface DashboardRegistryConfig {
  layout: 'standard' | 'minimal' | 'fullwidth';
  widgetGroups: Array<{
    groupId: string;
    widgets: string[]; // Widget IDs
  }>;
  quickActions: string[]; // Action IDs
}

export interface RoleRegistryItem {
  slug: RoleSlug;
  label: string;
  icon?: string;
  priority: number; // Higher number = higher priority when resolving multiple assignments
  description?: string;
}

export interface NavigationRegistryItem {
  id: string;
  title: string;
  href?: string;
  icon?: string;
  requiredPermissions: PermissionString[];
  requiredRoles: RoleSlug[];
  children?: NavigationRegistryItem[];
}
