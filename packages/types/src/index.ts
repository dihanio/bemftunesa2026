export type EcosystemApp = "api" | "ims" | "public" | "or" | "shop" | "pkkmb";
export type AccessScopeType =
  | "global"
  | "department"
  | "event"
  | "committee"
  | "proker"
  | "own";
export type PermissionEffect = "allow" | "deny";
export type PermissionUiMode = "hidden" | "disabled" | "readonly" | "allowed";
export type PermissionKey = string;

export interface AccessScope {
  type: AccessScopeType;
  id?: string;
}

export interface PermissionDefinition {
  key: PermissionKey;
  description: string;
  app: EcosystemApp | "shared";
  defaultUiMode?: Exclude<PermissionUiMode, "allowed">;
  requiresMfa?: boolean;
}

export interface PermissionGrant {
  permission: PermissionKey;
  effect: PermissionEffect;
  scope?: AccessScope;
  reason?: string;
}

export interface UserRoleAssignment {
  roleId: string;
  scope?: AccessScope;
  startsAt?: string;
  endsAt?: string;
}

export interface PermissionSubject {
  userId: string;
  email?: string;
  roles: UserRoleAssignment[];
  directGrants?: PermissionGrant[];
  departmentId?: string;
}

export interface PermissionResource {
  ownerId?: string;
  departmentId?: string;
  eventId?: string;
  committeeId?: string;
  prokerId?: string;
}

export interface PermissionDecision {
  allowed: boolean;
  mode: PermissionUiMode;
  permission: PermissionKey;
  reason: string;
  matchedGrant?: PermissionGrant;
}

export type CommitteeLifecycleState =
  | "Planning"
  | "Active"
  | "Event Finished"
  | "LPJ Revision"
  | "LPJ Approved"
  | "Archived";

export type WorkflowInstanceStatus =
  | "draft"
  | "running"
  | "revision"
  | "approved"
  | "rejected"
  | "archived"
  | "cancelled";

export interface WorkflowStepDefinition {
  id: string;
  label: string;
  requiredPermissions?: PermissionKey[];
  requiresMfa?: boolean;
  terminal?: boolean;
}

export interface WorkflowTransitionDefinition {
  from: string;
  to: string;
  action: string;
  label: string;
  requiredPermissions?: PermissionKey[];
  requiresMfa?: boolean;
}

export interface WorkflowDefinition {
  key: string;
  version: number;
  label: string;
  entity: "proposal" | "lpj" | "finance" | "archive" | "committee" | string;
  initialStep: string;
  steps: WorkflowStepDefinition[];
  transitions: WorkflowTransitionDefinition[];
}

export interface DocumentVersion {
  _id: string;
  entityType: "proposal" | "lpj" | "wiki" | string;
  entityId: string;
  version: number;
  snapshot: Record<string, any>;
  note?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkloadMatrixItem {
  department: string;
  members: number;
  assignments: number;
  loadScore: number;
  risk: "low" | "medium" | "high";
}

export interface OverspendingAlert {
  departmentId: string;
  allocatedAmount: number;
  requestedAmount: number;
  overspendAmount: number;
  warning: boolean;
}
