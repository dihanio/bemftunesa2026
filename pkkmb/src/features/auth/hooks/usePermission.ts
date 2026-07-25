"use client";

import { useAuthStore } from '../store/useAuthStore';

export function usePermission() {
  const { user } = useAuthStore();

  const userPermissions: string[] = user?.permissions || [];

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (userPermissions.includes('manage:all')) return true;
    return userPermissions.includes(permission);
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!user) return false;
    if (userPermissions.includes('manage:all')) return true;
    return permissions.some((p) => userPermissions.includes(p));
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    if (!user) return false;
    if (userPermissions.includes('manage:all')) return true;
    return permissions.every((p) => userPermissions.includes(p));
  };

  return {
    userPermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isSuperAdmin: userPermissions.includes('manage:all'),
  };
}
