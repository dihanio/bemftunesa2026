import { useDashboardContext } from '../components/dashboards/provider/DashboardProvider';
import { 
  hasPermission, 
  hasAllPermissions, 
  hasAnyPermission 
} from '../core/authorization/permission-resolver';
import { PermissionString } from '../types/rbac';

export function usePermissions() {
  const { profile } = useDashboardContext();

  return {
    hasPermission: (permission: PermissionString) => hasPermission(profile, permission),
    hasAllPermissions: (permissions: PermissionString[]) => hasAllPermissions(profile, permissions),
    hasAnyPermission: (permissions: PermissionString[]) => hasAnyPermission(profile, permissions),
  };
}
