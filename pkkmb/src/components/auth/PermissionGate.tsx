"use client";

import React from 'react';
import { usePermission } from '@/features/auth/hooks/usePermission';

interface PermissionGateProps {
  permission?: string;
  anyPermissions?: string[];
  allPermissions?: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGate({
  permission,
  anyPermissions,
  allPermissions,
  children,
  fallback = null,
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermission();

  let isAllowed = true;

  if (permission) {
    isAllowed = hasPermission(permission);
  } else if (anyPermissions && anyPermissions.length > 0) {
    isAllowed = hasAnyPermission(anyPermissions);
  } else if (allPermissions && allPermissions.length > 0) {
    isAllowed = hasAllPermissions(allPermissions);
  }

  if (!isAllowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
