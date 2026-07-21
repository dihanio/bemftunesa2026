import { UserProfileBase, ActiveContext } from '../../types/rbac';
import { roleRegistry } from '../../config/role-registry';

/**
 * Pure function to determine the active role context for a user profile.
 * It does not have side effects, JSX, or state.
 */
export function determineActiveContext(profile: UserProfileBase | null): ActiveContext | null {
  if (!profile) return null;

  // 1. If the user already has an activeContext selected (e.g., via a role switcher), respect it.
  if (profile.activeContext) {
    return profile.activeContext;
  }

  // 2. If the user has a list of assignments, pick the one with the highest priority or marked as primary
  if (profile.assignments && profile.assignments.length > 0) {
    const primaryAssignment = profile.assignments.find(a => a.isPrimary);
    if (primaryAssignment) {
      return {
        role: primaryAssignment.roleId,
        departmentId: primaryAssignment.departmentId?._id,
        departmentName: primaryAssignment.departmentId?.name,
        assignmentId: primaryAssignment._id,
        period: primaryAssignment.period,
        organizationId: primaryAssignment.organizationId?._id,
      };
    }

    // Sort by priority based on the registry, fallback to 0 if not found
    const sortedAssignments = [...profile.assignments].sort((a, b) => {
      const priorityA = roleRegistry[a.roleId.slug]?.priority || 0;
      const priorityB = roleRegistry[b.roleId.slug]?.priority || 0;
      return priorityB - priorityA; // descending
    });

    const highest = sortedAssignments[0];
    return {
      role: highest.roleId,
      departmentId: highest.departmentId?._id,
      departmentName: highest.departmentId?.name,
      assignmentId: highest._id,
      period: highest.period,
      organizationId: highest.organizationId?._id,
    };
  }

  // 3. Fallback to basic role if assignments array is empty/missing
  if (profile.role) {
    if (typeof profile.role === 'string') {
      return {
        role: {
          _id: profile.role,
          name: profile.role,
          slug: profile.role,
        }
      };
    } else {
      return {
        role: profile.role
      };
    }
  }

  return null;
}
