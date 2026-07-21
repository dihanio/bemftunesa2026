import { WidgetRegistryItem } from '../types/registry';

export const widgetRegistry: Record<string, WidgetRegistryItem> = Object.freeze({
  'stat-proker': {
    id: 'stat-proker',
    componentName: 'StatProkerContainer',
    requiredPermissions: [],
    requiredRoles: [],
    defaultPosition: { w: 1, h: 1 },
    group: 'stats',
    priority: 10
  },
  'stat-surat': {
    id: 'stat-surat',
    componentName: 'StatSuratContainer',
    requiredPermissions: [],
    requiredRoles: [],
    defaultPosition: { w: 1, h: 1 },
    group: 'stats',
    priority: 9
  },
  'timeline-activities': {
    id: 'timeline-activities',
    componentName: 'SystemTimelineContainer',
    requiredPermissions: [],
    requiredRoles: [],
    defaultPosition: { w: 2, h: 2 },
    group: 'timeline',
    priority: 5
  },
  'recent-letters': {
    id: 'recent-letters',
    componentName: 'RecentLettersContainer',
    requiredPermissions: ['read:letters'],
    requiredRoles: [],
    defaultPosition: { w: 2, h: 2 },
    group: 'list',
    priority: 8
  },
  'quick-actions-admin': {
    id: 'quick-actions-admin',
    componentName: 'AdminQuickActionsContainer',
    requiredPermissions: [],
    requiredRoles: ['super-admin', 'kabem', 'wakabem'],
    defaultPosition: { w: 4, h: 1 },
    group: 'action',
    priority: 100
  }
});
