import { UserRole } from '@bemft/types';

export type ActionType =
  | 'create_user' | 'update_user' | 'delete_user' | 'view_users'
  | 'manage_telemetry'
  | 'create_proker' | 'update_proker' | 'delete_proker' | 'view_proker'
  | 'submit_aspirasi' | 'respond_aspirasi' | 'view_aspirasi'
  | 'create_surat' | 'approve_surat' | 'view_surat' | 'delete_surat'
  | 'create_rab' | 'approve_rab' | 'view_rab'
  | 'create_lpj' | 'approve_lpj' | 'view_lpj'
  | 'create_rapat' | 'manage_rapat_attendance' | 'view_rapat'
  | 'create_asset' | 'update_asset' | 'loan_asset' | 'approve_loan_asset' | 'view_assets';

// Role permissions mapping
export const RolePermissions: Record<UserRole, ActionType[]> = {
  superadmin: [
    'create_user', 'update_user', 'delete_user', 'view_users',
    'manage_telemetry',
    'create_proker', 'update_proker', 'delete_proker', 'view_proker',
    'submit_aspirasi', 'respond_aspirasi', 'view_aspirasi',
    'create_surat', 'approve_surat', 'view_surat', 'delete_surat',
    'create_rab', 'approve_rab', 'view_rab',
    'create_lpj', 'approve_lpj', 'view_lpj',
    'create_rapat', 'manage_rapat_attendance', 'view_rapat',
    'create_asset', 'update_asset', 'loan_asset', 'approve_loan_asset', 'view_assets'
  ],
  ketua_bem: [
    'view_users',
    'create_proker', 'update_proker', 'view_proker',
    'respond_aspirasi', 'view_aspirasi',
    'create_surat', 'approve_surat', 'view_surat',
    'create_rab', 'approve_rab', 'view_rab',
    'create_lpj', 'approve_lpj', 'view_lpj',
    'create_rapat', 'manage_rapat_attendance', 'view_rapat',
    'loan_asset', 'approve_loan_asset', 'view_assets'
  ],
  wakil_ketua_bem: [
    'view_users',
    'create_proker', 'update_proker', 'view_proker',
    'respond_aspirasi', 'view_aspirasi',
    'create_surat', 'approve_surat', 'view_surat',
    'create_rab', 'approve_rab', 'view_rab',
    'create_lpj', 'approve_lpj', 'view_lpj',
    'create_rapat', 'manage_rapat_attendance', 'view_rapat',
    'loan_asset', 'approve_loan_asset', 'view_assets'
  ],
  admin: [
    'create_user', 'update_user', 'view_users',
    'manage_telemetry',
    'view_proker',
    'view_aspirasi',
    'view_surat',
    'view_rab',
    'view_lpj',
    'view_rapat',
    'create_asset', 'update_asset', 'view_assets'
  ],
  sekretaris: [
    'view_users',
    'view_proker',
    'respond_aspirasi', 'view_aspirasi',
    'create_surat', 'approve_surat', 'view_surat', 'delete_surat',
    'view_rab',
    'view_lpj',
    'create_rapat', 'manage_rapat_attendance', 'view_rapat',
    'loan_asset', 'view_assets'
  ],
  bendahara: [
    'view_users',
    'view_proker',
    'view_aspirasi',
    'create_surat', 'view_surat',
    'create_rab', 'approve_rab', 'view_rab',
    'create_lpj', 'approve_lpj', 'view_lpj',
    'view_rapat',
    'loan_asset', 'view_assets'
  ],
  kadep: [
    'view_users',
    'create_proker', 'update_proker', 'view_proker',
    'view_aspirasi',
    'create_surat', 'view_surat',
    'create_rab', 'view_rab',
    'create_lpj', 'view_lpj',
    'create_rapat', 'manage_rapat_attendance', 'view_rapat',
    'loan_asset', 'view_assets'
  ],
  wakadep: [
    'view_users',
    'view_proker',
    'view_aspirasi',
    'create_surat', 'view_surat',
    'create_rab', 'view_rab',
    'create_lpj', 'view_lpj',
    'view_rapat', 'manage_rapat_attendance', 'view_rapat',
    'loan_asset', 'view_assets'
  ],
  staf: [
    'view_proker',
    'create_surat', 'view_surat',
    'create_rab', 'view_rab',
    'create_lpj', 'view_lpj',
    'view_rapat',
    'loan_asset', 'view_assets'
  ],
  guest: [
    'view_proker',
    'view_rapat',
    'view_assets'
  ]
};

/**
 * Checks if a user has permission to perform a specific action, taking department constraints into account.
 * 
 * @param role The role of the user.
 * @param action The action being performed.
 * @param resourceDeptId (Optional) The department ID associated with the resource being accessed.
 * @param userDeptId (Optional) The department ID of the user.
 * @returns boolean
 */
export function hasPermission(
  role: UserRole,
  action: ActionType,
  resourceDeptId?: string,
  userDeptId?: string
): boolean {
  // 1. Basic permission list check
  const permissions = RolePermissions[role];
  if (!permissions || !permissions.includes(action)) {
    return false;
  }

  // 2. Superadmin and BPI (Ketua/Wakil/Admin) have global scope
  if (role === 'superadmin' || role === 'ketua_bem' || role === 'wakil_ketua_bem' || role === 'admin') {
    return true;
  }

  // 3. Department scoped checks (for Kadep, Wakadep, Staf)
  // If the action relates to creating/modifying department-specific resources (like Proker, Surat, RAB, LPJ)
  // and a department ID is required, enforce that it matches the user's department.
  const isDeptScopedAction = [
    'create_proker', 'update_proker', 'delete_proker',
    'create_surat', 'delete_surat',
    'create_rab', 'create_lpj',
    'manage_rapat_attendance'
  ].includes(action);

  if (isDeptScopedAction && resourceDeptId && userDeptId) {
    return resourceDeptId === userDeptId;
  }

  return true;
}
