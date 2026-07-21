import { UserProfileBase } from '../../types/rbac';
import { SidebarSection, SidebarItemConfig } from '../../types/role-types';
import { navigationRegistry } from '../../config/navigation-registry';
import { hasAllPermissions } from '../authorization/permission-resolver';

/**
 * Pure function to compose navigation based on user's active role and permissions.
 * Translates NavigationRegistryItem into SidebarSection for the UI.
 */
export function composeNavigation(profile: UserProfileBase | null): SidebarSection[] {
  const sections: SidebarSection[] = [];
  const activeRole = profile?.activeContext?.role?.slug;

  for (const navItem of navigationRegistry) {
    // 1. Check parent role
    let parentPermitted = true;
    if (navItem.requiredRoles.length > 0) {
      if (!activeRole || !navItem.requiredRoles.includes(activeRole)) {
        parentPermitted = false;
      }
    }

    // 2. Check parent permissions
    if (parentPermitted && navItem.requiredPermissions.length > 0) {
      parentPermitted = hasAllPermissions(profile, navItem.requiredPermissions);
    }

    if (!parentPermitted) {
      continue; // Skip this whole section
    }

    // 3. Process children
    if (navItem.children && navItem.children.length > 0) {
      const items: SidebarItemConfig[] = [];
      
      for (const child of navItem.children) {
        // Role check
        let childPermitted = true;
        if (child.requiredRoles.length > 0) {
          if (!activeRole || !child.requiredRoles.includes(activeRole)) {
            childPermitted = false;
          }
        }
        
        // Permission check
        if (childPermitted && child.requiredPermissions.length > 0) {
          childPermitted = hasAllPermissions(profile, child.requiredPermissions);
        }

        if (childPermitted) {
          items.push({
            name: child.title,
            path: child.href || '#',
            icon: child.icon || 'layout-dashboard',
            status: 'active'
          });
        }
      }

      // Only add section if it has visible items
      if (items.length > 0) {
        sections.push({
          id: navItem.id,
          label: navItem.title,
          items
        });
      }
    }
  }

  return sections;
}
