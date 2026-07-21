import { DashboardRegistryConfig } from '../types/registry';
import { RoleSlug } from '../types/rbac';

export const dashboardRegistry: Record<RoleSlug, DashboardRegistryConfig> = Object.freeze({
  'super-admin': {
    layout: 'standard',
    widgetGroups: [
      {
        groupId: 'overview',
        widgets: ['stat-proker', 'stat-surat', 'quick-actions-admin']
      },
      {
        groupId: 'activity',
        widgets: ['timeline-activities']
      }
    ],
    quickActions: ['create-user', 'system-settings']
  },
  'kabem': {
    layout: 'standard',
    widgetGroups: [
      {
        groupId: 'overview',
        widgets: ['stat-proker', 'stat-surat', 'quick-actions-admin']
      },
      {
        groupId: 'activity',
        widgets: ['timeline-activities']
      }
    ],
    quickActions: ['system-settings']
  },
  'wakabem': {
    layout: 'standard',
    widgetGroups: [
      {
        groupId: 'overview',
        widgets: ['stat-proker', 'quick-actions-admin']
      },
      {
        groupId: 'activity',
        widgets: ['timeline-activities']
      }
    ],
    quickActions: []
  },
  'sekretaris': {
    layout: 'standard',
    widgetGroups: [
      {
        groupId: 'overview',
        widgets: ['stat-surat']
      },
      {
        groupId: 'documents',
        widgets: ['recent-letters']
      }
    ],
    quickActions: ['create-letter']
  },
  'bendahara': {
    layout: 'standard',
    widgetGroups: [
      {
        groupId: 'overview',
        widgets: ['stat-surat'] // Assuming we'll add finance specific stats later
      }
    ],
    quickActions: []
  },
  'kadep': {
    layout: 'standard',
    widgetGroups: [
      {
        groupId: 'overview',
        widgets: ['stat-proker']
      },
      {
        groupId: 'activity',
        widgets: ['timeline-activities']
      }
    ],
    quickActions: []
  },
  'wakadep': {
    layout: 'standard',
    widgetGroups: [
      {
        groupId: 'overview',
        widgets: ['stat-proker']
      }
    ],
    quickActions: []
  },
  'ketua_panitia': {
    layout: 'standard',
    widgetGroups: [
      {
        groupId: 'overview',
        widgets: ['timeline-activities']
      }
    ],
    quickActions: []
  },
  'staf': {
    layout: 'minimal',
    widgetGroups: [],
    quickActions: []
  }
});

// A fallback function in case a role isn't explicitly mapped
export function getDashboardConfig(roleSlug: RoleSlug): DashboardRegistryConfig {
  return dashboardRegistry[roleSlug] || dashboardRegistry['staf'];
}
