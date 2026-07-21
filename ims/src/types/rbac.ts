export type RoleScope = 'global' | 'department' | 'committee' | 'readonly';

export type RoleSlug = string;

export type PermissionString = string; // e.g. "read:proker", "write:users"

export interface ActiveContext {
  role?: {
    _id: string;
    name: string;
    slug: RoleSlug;
    scope?: RoleScope;
  };
  departmentId?: string;
  departmentName?: string;
  assignmentId?: string;
  period?: string;
  organizationId?: string;
}

export interface RoleAssignment {
  _id: string;
  roleId: {
    _id: string;
    name: string;
    slug: RoleSlug;
  };
  departmentId?: {
    _id: string;
    name: string;
  };
  period: string;
  organizationId?: {
    _id: string;
    name: string;
  };
  scopeType?: string;
  scopeTargetId?: string;
  isPrimary?: boolean;
}

// Mimicking what comes from backend
export interface UserProfileBase {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string | { _id: string; name: string; slug: RoleSlug }; 
  department?: string | { _id: string; name: string };
  assignments?: RoleAssignment[];
  permissions?: PermissionString[]; // Array of permission strings from backend
  activeContext?: ActiveContext;
}
