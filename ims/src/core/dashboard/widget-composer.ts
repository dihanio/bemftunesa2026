import { UserProfileBase } from '../../types/rbac';
import { DashboardRegistryConfig, WidgetRegistryItem } from '../../types/registry';
import { widgetRegistry } from '../../config/widget-registry';
import { hasAllPermissions } from '../authorization/permission-resolver';

export interface ComposedWidget {
  id: string;
  componentName: string;
  isPermitted: boolean;
  defaultPosition: { w: number; h: number };
}

export interface ComposedGroup {
  groupId: string;
  widgets: ComposedWidget[];
}

/**
 * Pure function to map a dashboard config into a structural array of widgets.
 * Evaluates permissions but does not render JSX.
 */
export function composeDashboard(profile: UserProfileBase | null, dashboardConfig: DashboardRegistryConfig): ComposedGroup[] {
  return dashboardConfig.widgetGroups.map(group => {
    const composedWidgets = group.widgets.map(widgetId => {
      const widgetDef: WidgetRegistryItem | undefined = widgetRegistry[widgetId];
      
      if (!widgetDef) {
        // Fallback for missing definitions
        return {
          id: widgetId,
          componentName: 'UnknownWidget',
          isPermitted: false,
          defaultPosition: { w: 1, h: 1 }
        };
      }

      // 1. Role check
      let isPermitted = true;
      if (widgetDef.requiredRoles.length > 0) {
        const activeRole = profile?.activeContext?.role?.slug;
        if (!activeRole || !widgetDef.requiredRoles.includes(activeRole)) {
          isPermitted = false;
        }
      }

      // 2. Permission check
      if (isPermitted && widgetDef.requiredPermissions.length > 0) {
        isPermitted = hasAllPermissions(profile, widgetDef.requiredPermissions);
      }

      return {
        id: widgetDef.id,
        componentName: widgetDef.componentName,
        isPermitted,
        defaultPosition: widgetDef.defaultPosition
      };
    });

    return {
      groupId: group.groupId,
      widgets: composedWidgets
    };
  });
}
