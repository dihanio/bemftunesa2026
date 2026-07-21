import React, { ReactNode } from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import { PermissionString } from '../../types/rbac';

interface RequirePermissionProps {
  permission?: PermissionString;
  permissions?: PermissionString[];
  requireAll?: boolean;
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * A wrapper component that conditionally renders its children
 * based on the user's permissions.
 */
export function RequirePermission({
  permission,
  permissions,
  requireAll = true,
  fallback = null,
  children,
}: RequirePermissionProps) {
  const { hasPermission, hasAllPermissions, hasAnyPermission } = usePermissions();

  let isAllowed = false;

  if (permission) {
    isAllowed = hasPermission(permission);
  } else if (permissions && permissions.length > 0) {
    if (requireAll) {
      isAllowed = hasAllPermissions(permissions);
    } else {
      isAllowed = hasAnyPermission(permissions);
    }
  } else {
    // If no permission requirements are specified, allow access
    isAllowed = true;
  }

  return isAllowed ? <>{children}</> : <>{fallback}</>;
}
