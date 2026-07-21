export interface RoleDTO {
  _id: string;
  slug: string;
  name: string;
}

export interface DepartmentDTO {
  _id: string;
  name: string;
  slug: string;
  taskBoardUrl?: string;
}

export interface RoleAssignmentDTO {
  _id: string;
  roleId: RoleDTO;
  organizationId?: string;
  scopeType: string;
  scopeTargetId?: string;
  periodId: string;
}

export interface ActiveContextDTO {
  assignmentId: string;
  role: RoleDTO;
  scopeType: string;
  scopeTargetId?: string;
  departmentId?: string;
  department?: DepartmentDTO;
  period: string;
}

export interface UserProfileDTO {
  id: string;
  name: string;
  email: string;
  role?: string | RoleDTO;
  avatar?: string;
  departmentId?: string;
  department?: string | DepartmentDTO;
  cabinetPeriod?: string;
  assignments?: RoleAssignmentDTO[];
  activeContext?: ActiveContextDTO;
  permissions?: string[];
}
