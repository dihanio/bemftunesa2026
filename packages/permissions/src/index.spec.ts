import { hasPermission } from './index';

describe('Permissions Package', () => {
  it('should allow superadmin to perform any action', () => {
    expect(hasPermission('superadmin', 'create_user')).toBe(true);
    expect(hasPermission('superadmin', 'manage_telemetry')).toBe(true);
    expect(hasPermission('superadmin', 'delete_proker')).toBe(true);
  });

  it('should restrict guest to view actions only', () => {
    expect(hasPermission('guest', 'view_proker')).toBe(true);
    expect(hasPermission('guest', 'create_proker')).toBe(false);
    expect(hasPermission('guest', 'create_user')).toBe(false);
  });

  it('should respect department-scoped actions for staff', () => {
    // create_surat is department scoped and allowed for staf
    // If resourceDeptId and userDeptId match, return true
    expect(hasPermission('staf', 'create_surat', 'dept1', 'dept1')).toBe(true);
    // If they do not match, return false
    expect(hasPermission('staf', 'create_surat', 'dept1', 'dept2')).toBe(false);
  });

  it('should allow BPI roles to perform actions globally regardless of department scope', () => {
    // ketua_bem has global scope
    expect(hasPermission('ketua_bem', 'create_proker', 'dept1', 'dept2')).toBe(true);
  });
});
