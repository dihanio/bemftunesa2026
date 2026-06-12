import type {
  AccessScope,
  PermissionDecision,
  PermissionDefinition,
  PermissionGrant,
  PermissionKey,
  PermissionResource,
  PermissionSubject,
} from "@bemft/types";

export type { PermissionKey } from "@bemft/types";

export const PERMISSIONS = {
  dashboardRead: "dashboard.read",
  usersRead: "users.read",
  usersManage: "users.manage",
  permissionsManage: "permissions.manage",
  workflowRead: "workflow.read",
  workflowManage: "workflow.manage",
  auditRead: "audit.read",
  prokerRead: "proker.read",
  prokerManage: "proker.manage",
  committeeRead: "committee.read",
  committeeManage: "committee.manage",
  financeRead: "finance.read",
  financeApprove: "finance.approve",
  financeOverride: "finance.override",
  documentsRead: "documents.read",
  documentsManage: "documents.manage",
  documentsApprove: "documents.approve",
  cmsRead: "cms.read",
  cmsManage: "cms.manage",
  publicRead: "public.read",
  aspirationSubmit: "aspirations.submit",
} as const;

export const PERMISSION_CATALOG: readonly PermissionDefinition[] = [
  {
    key: PERMISSIONS.dashboardRead,
    app: "ims",
    description: "Read IMS dashboard",
  },
  {
    key: PERMISSIONS.usersRead,
    app: "ims",
    description: "Read organization users",
  },
  {
    key: PERMISSIONS.usersManage,
    app: "ims",
    description: "Create and update users",
  },
  {
    key: PERMISSIONS.permissionsManage,
    app: "ims",
    description: "Manage roles and permission grants",
    requiresMfa: true,
  },
  {
    key: PERMISSIONS.workflowRead,
    app: "ims",
    description: "Read workflow definitions and instances",
  },
  {
    key: PERMISSIONS.workflowManage,
    app: "ims",
    description: "Manage workflow policies",
    requiresMfa: true,
  },
  {
    key: PERMISSIONS.auditRead,
    app: "ims",
    description: "Read immutable audit logs",
  },
  {
    key: PERMISSIONS.prokerRead,
    app: "ims",
    description: "Read proker and committee records",
  },
  {
    key: PERMISSIONS.prokerManage,
    app: "ims",
    description: "Create and update proker",
  },
  {
    key: PERMISSIONS.committeeRead,
    app: "ims",
    description: "Read committee memberships",
  },
  {
    key: PERMISSIONS.committeeManage,
    app: "ims",
    description: "Manage committee lifecycle and archiving",
  },
  {
    key: PERMISSIONS.financeRead,
    app: "ims",
    description: "Read finance dashboard, RAB, SPJ, and ledger",
  },
  {
    key: PERMISSIONS.financeApprove,
    app: "ims",
    description: "Approve finance items and RAB/SPJ lines",
    requiresMfa: true,
  },
  {
    key: PERMISSIONS.financeOverride,
    app: "ims",
    description: "Override finance soft validations",
    requiresMfa: true,
  },
  {
    key: PERMISSIONS.documentsRead,
    app: "ims",
    description: "Read documents and version history",
  },
  {
    key: PERMISSIONS.documentsManage,
    app: "ims",
    description: "Create and revise documents",
  },
  {
    key: PERMISSIONS.documentsApprove,
    app: "ims",
    description: "Approve and sign official documents",
    requiresMfa: true,
  },
  {
    key: PERMISSIONS.cmsRead,
    app: "ims",
    description: "Read CMS content drafts",
  },
  {
    key: PERMISSIONS.cmsManage,
    app: "ims",
    description: "Create, publish, and archive CMS content",
  },
  {
    key: PERMISSIONS.publicRead,
    app: "public",
    description: "Read public website data",
  },
  {
    key: PERMISSIONS.aspirationSubmit,
    app: "public",
    description: "Submit public aspirations",
  },
];

const allPermissions = PERMISSION_CATALOG.map((permission) => permission.key);

export const DEFAULT_ROLE_GRANTS: Record<string, readonly PermissionGrant[]> = {
  "Super Admin": allPermissions.map((permission) => ({
    permission,
    effect: "allow",
  })),
  KaBEM: [
    PERMISSIONS.dashboardRead,
    PERMISSIONS.usersRead,
    PERMISSIONS.prokerRead,
    PERMISSIONS.prokerManage,
    PERMISSIONS.committeeRead,
    PERMISSIONS.committeeManage,
    PERMISSIONS.financeRead,
    PERMISSIONS.financeApprove,
    PERMISSIONS.documentsRead,
    PERMISSIONS.documentsApprove,
    PERMISSIONS.auditRead,
    PERMISSIONS.cmsRead,
    PERMISSIONS.cmsManage,
  ].map((permission) => ({ permission, effect: "allow" })),
  WaKaBEM: [
    PERMISSIONS.dashboardRead,
    PERMISSIONS.usersRead,
    PERMISSIONS.workflowRead,
    PERMISSIONS.auditRead,
    PERMISSIONS.prokerRead,
    PERMISSIONS.prokerManage,
    PERMISSIONS.committeeRead,
    PERMISSIONS.committeeManage,
    PERMISSIONS.documentsRead,
    PERMISSIONS.documentsApprove,
    PERMISSIONS.cmsRead,
  ].map((permission) => ({ permission, effect: "allow" })),
  "Admin Sistem": [
    PERMISSIONS.dashboardRead,
    PERMISSIONS.usersRead,
    PERMISSIONS.usersManage,
    PERMISSIONS.permissionsManage,
    PERMISSIONS.workflowRead,
    PERMISSIONS.workflowManage,
    PERMISSIONS.auditRead,
  ].map((permission) => ({ permission, effect: "allow" })),
  Admin: [
    PERMISSIONS.dashboardRead,
    PERMISSIONS.usersRead,
    PERMISSIONS.prokerRead,
    PERMISSIONS.committeeRead,
    PERMISSIONS.documentsRead,
    PERMISSIONS.cmsRead,
  ].map((permission) => ({ permission, effect: "allow" })),
  Sekretaris: [
    PERMISSIONS.dashboardRead,
    PERMISSIONS.usersRead,
    PERMISSIONS.prokerRead,
    PERMISSIONS.committeeRead,
    PERMISSIONS.committeeManage,
    PERMISSIONS.documentsRead,
    PERMISSIONS.documentsManage,
    PERMISSIONS.cmsRead,
    PERMISSIONS.cmsManage,
    PERMISSIONS.workflowRead,
  ].map((permission) => ({ permission, effect: "allow" })),
  Bendahara: [
    PERMISSIONS.dashboardRead,
    PERMISSIONS.prokerRead,
    PERMISSIONS.financeRead,
    PERMISSIONS.financeApprove,
    PERMISSIONS.financeOverride,
    PERMISSIONS.documentsRead,
    PERMISSIONS.workflowRead,
  ].map((permission) => ({ permission, effect: "allow" })),
  Kadep: [
    PERMISSIONS.dashboardRead,
    PERMISSIONS.usersRead,
    PERMISSIONS.prokerRead,
    PERMISSIONS.prokerManage,
    PERMISSIONS.committeeRead,
    PERMISSIONS.financeRead,
    PERMISSIONS.documentsRead,
    PERMISSIONS.cmsRead,
  ].map((permission) => ({
    permission,
    effect: "allow",
    scope: { type: "department" },
  })),
  Wakadep: [
    PERMISSIONS.dashboardRead,
    PERMISSIONS.prokerRead,
    PERMISSIONS.committeeRead,
    PERMISSIONS.financeRead,
    PERMISSIONS.documentsRead,
  ].map((permission) => ({
    permission,
    effect: "allow",
    scope: { type: "department" },
  })),
  Staff: [
    PERMISSIONS.dashboardRead,
    PERMISSIONS.prokerRead,
    PERMISSIONS.committeeRead,
    PERMISSIONS.documentsRead,
  ].map((permission) => ({
    permission,
    effect: "allow",
    scope: { type: "own" },
  })),
  Panitia: [
    PERMISSIONS.dashboardRead,
    PERMISSIONS.prokerRead,
    PERMISSIONS.prokerManage,
    PERMISSIONS.committeeRead,
    PERMISSIONS.documentsRead,
    PERMISSIONS.documentsManage,
  ].map((permission) => ({
    permission,
    effect: "allow",
    scope: { type: "committee" },
  })),
  Guest: [],
};

export const ROLE_HIERARCHY: Record<string, readonly string[]> = {
  "Super Admin": ["KaBEM", "Admin Sistem"],
  "Admin Sistem": ["Admin"],
  KaBEM: ["WaKaBEM"],
  WaKaBEM: ["Sekretaris", "Kadep"],
  Sekretaris: ["Admin"],
  Bendahara: ["Admin"],
  Kadep: ["Wakadep"],
  Wakadep: ["Staff"],
  Staff: ["Guest"],
  Panitia: ["Staff"],
  Admin: ["Staff"],
  Guest: [],
};

export function getInheritedRoles(roles: readonly string[]): string[] {
  const result = new Set<string>();
  const queue = [...roles];
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current && !result.has(current)) {
      result.add(current);
      const inherited = ROLE_HIERARCHY[current] || [];
      queue.push(...inherited);
    }
  }
  return Array.from(result);
}

export function listPermissionsForRoles(
  roles: readonly string[],
): PermissionKey[] {
  const allRoles = getInheritedRoles(roles);
  return Array.from(
    new Set(
      allRoles.flatMap((role) =>
        (DEFAULT_ROLE_GRANTS[role] || [])
          .filter((grant) => grant.effect === "allow")
          .map((grant) => grant.permission),
      ),
    ),
  );
}

export function evaluatePermission(
  subject: PermissionSubject,
  permission: PermissionKey,
  resource?: PermissionResource,
): PermissionDecision {
  const grants = (subject.directGrants || []).filter(
    (grant) => grant.permission === permission,
  );

  const deny = grants.find(
    (grant) =>
      grant.effect === "deny" && scopeMatches(grant.scope, subject, resource),
  );
  if (deny) {
    return {
      allowed: false,
      mode: "hidden",
      permission,
      reason: deny.reason || "Permission denied by explicit deny grant",
      matchedGrant: deny,
    };
  }

  const allow = grants.find(
    (grant) =>
      grant.effect === "allow" && scopeMatches(grant.scope, subject, resource),
  );
  if (allow) {
    return {
      allowed: true,
      mode: "allowed",
      permission,
      reason: "Permission granted",
      matchedGrant: allow,
    };
  }

  return {
    allowed: false,
    mode: "hidden",
    permission,
    reason: "No matching permission grant",
  };
}

function scopeMatches(
  scope: AccessScope | undefined,
  subject: PermissionSubject,
  resource?: PermissionResource,
): boolean {
  if (!scope || scope.type === "global") {
    return true;
  }

  if (scope.type === "department") {
    return (
      !scope.id ||
      scope.id === resource?.departmentId ||
      subject.departmentId === resource?.departmentId
    );
  }

  if (scope.type === "own") {
    return subject.userId === resource?.ownerId;
  }

  if (scope.type === "event") {
    return !scope.id || scope.id === resource?.eventId;
  }

  if (scope.type === "committee") {
    return !scope.id || scope.id === resource?.committeeId;
  }

  if (scope.type === "proker") {
    return !scope.id || scope.id === resource?.prokerId;
  }

  return false;
}
