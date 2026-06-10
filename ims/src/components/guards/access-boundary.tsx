"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { evaluatePermission } from "@bemft/permissions";
import type {
  PermissionKey,
  PermissionResource,
  PermissionSubject,
} from "@bemft/types";

interface AccessBoundaryProps {
  permission: PermissionKey;
  resource?: PermissionResource;
  fallback?: ReactNode;
  mode?: "hidden" | "disabled" | "readonly";
  children: ReactNode;
}

export function AccessBoundary({
  permission,
  resource,
  fallback = null,
  mode = "hidden",
  children,
}: AccessBoundaryProps) {
  const { user, activeRole } = useAuth();

  if (!user) {
    return <>{fallback}</>;
  }

  // Bypass for system administrators
  const currentRole = activeRole || user.role;
  const isSystemAdmin =
    currentRole === "Admin Sistem" ||
    currentRole === "System Administrator" ||
    currentRole === "Super Admin";

  if (isSystemAdmin) {
    return <>{children}</>;
  }

  // Construct PermissionSubject format for evaluation
  const subject: PermissionSubject = {
    userId: user.id,
    email: user.email,
    roles: (user.roles || [user.role]).map((r) => ({ roleId: r })),
    departmentId: user.departmentId,
    directGrants: [],
  };

  const decision = evaluatePermission(subject, permission, resource);

  if (decision.allowed) {
    return <>{children}</>;
  }

  // If permission decision is not allowed, handle modes
  const uiMode = mode || decision.mode;

  if (uiMode === "disabled") {
    return (
      <span
        className="relative group cursor-not-allowed opacity-45 inline-block"
        aria-disabled="true"
      >
        <span className="pointer-events-none">{children}</span>
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-red-950/90 border border-red-800/40 text-red-200 text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-50 backdrop-blur-xs font-semibold">
          {decision.reason || "Anda tidak memiliki akses untuk tindakan ini"}
        </span>
      </span>
    );
  }

  if (uiMode === "readonly") {
    return (
      <div className="relative group select-none">
        <div className="pointer-events-none filter grayscale opacity-80">
          {children}
        </div>
        <div
          className="absolute inset-0 bg-transparent cursor-not-allowed"
          title="Akses Baca Saja"
        />
      </div>
    );
  }

  // Hidden mode
  return <>{fallback}</>;
}
