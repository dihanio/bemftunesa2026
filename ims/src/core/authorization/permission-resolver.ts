import { PermissionString, UserProfileBase } from '../../types/rbac';

/**
 * Pure function to check if a user has a specific permission.
 * It strictly relies on the backend-provided permissions array.
 * No fallbacks, no fakes.
 * 
 * Special case: 'manage:all' grants all permissions (super admin).
 */
export function hasPermission(profile: UserProfileBase | null, requiredPermission: PermissionString): boolean {
  if (!profile || !profile.permissions || profile.permissions.length === 0) {
    return false;
  }
  
  // Check for manage:all wildcard permission (super admin)
  if (profile.permissions.includes('manage:all')) {
    return true;
  }
  
  return profile.permissions.includes(requiredPermission);
}

/**
 * Check if the user has ALL of the required permissions.
 * Special case: 'manage:all' grants all permissions.
 */
export function hasAllPermissions(profile: UserProfileBase | null, requiredPermissions: PermissionString[]): boolean {
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true; // If no permissions are required, allow access
  }
  
  if (!profile || !profile.permissions || profile.permissions.length === 0) {
    return false;
  }

  // Check for manage:all wildcard permission (super admin)
  if (profile.permissions.includes('manage:all')) {
    return true;
  }

  return requiredPermissions.every(perm => profile.permissions!.includes(perm));
}

/**
 * Check if the user has ANY of the required permissions.
 * Special case: 'manage:all' grants all permissions.
 */
export function hasAnyPermission(profile: UserProfileBase | null, requiredPermissions: PermissionString[]): boolean {
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true; // If no permissions are required, allow access
  }
  
  if (!profile || !profile.permissions || profile.permissions.length === 0) {
    return false;
  }

  // Check for manage:all wildcard permission (super admin)
  if (profile.permissions.includes('manage:all')) {
    return true;
  }

  return requiredPermissions.some(perm => profile.permissions!.includes(perm));
}
