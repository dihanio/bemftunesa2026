"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";

type PermissionGuardMode = "hidden" | "disabled" | "readonly";

interface PermissionGuardProps {
  permission: string;
  mode?: PermissionGuardMode;
  fallback?: ReactNode;
  children: ReactNode;
}

export function PermissionGuard({
  permission,
  mode = "hidden",
  fallback = null,
  children,
}: PermissionGuardProps) {
  const { hasPermission } = useAuth();

  if (hasPermission(permission)) {
    return <>{children}</>;
  }

  if (mode === "disabled") {
    return (
      <span className="pointer-events-none opacity-50" aria-disabled="true">
        {children}
      </span>
    );
  }

  if (mode === "readonly") {
    return <span data-readonly="true">{children}</span>;
  }

  return <>{fallback}</>;
}
