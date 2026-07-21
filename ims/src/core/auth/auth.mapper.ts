import { UserProfileBase, RoleAssignment, PermissionString } from '../../types/rbac';
import { UserProfileDTO } from './auth.dto';

export function mapProfileDtoToDomain(dto: UserProfileDTO): UserProfileBase {
  const assignments: RoleAssignment[] = (dto.assignments || []).map(a => {
    let mappedScope: 'global' | 'department' | 'organization' = 'global';
    if (a.scopeType === 'department') mappedScope = 'department';
    if (a.scopeType === 'organization') mappedScope = 'organization';

    return {
      _id: a._id,
      roleId: {
        _id: a.roleId._id,
        slug: a.roleId.slug,
        name: a.roleId.name
      },
      scopeType: mappedScope,
      scopeTargetId: a.scopeTargetId,
      period: a.periodId || '2026',
      organizationId: a.organizationId ? { _id: a.organizationId, name: 'Organisasi' } : undefined
    };
  });

  return {
    _id: dto.id,
    name: dto.name,
    email: dto.email,
    avatar: dto.avatar,
    role: dto.role,
    department: dto.department,
    assignments,
    permissions: (dto.permissions || []) as PermissionString[]
  };
}
