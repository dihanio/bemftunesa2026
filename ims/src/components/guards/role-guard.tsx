"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";

interface RoleGuardProps {
  allowedRoles: string[];
  fallback?: ReactNode;
  children: ReactNode;
}

export function RoleGuard({
  allowedRoles,
  fallback = null,
  children,
}: RoleGuardProps) {
  const { activeRole, user } = useAuth();
  const currentRole = activeRole || user?.role;

  const isSystemAdmin =
    currentRole === "Admin Sistem" ||
    currentRole === "System Administrator" ||
    currentRole === "Super Admin";

  if (isSystemAdmin || (currentRole && allowedRoles.includes(currentRole))) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
