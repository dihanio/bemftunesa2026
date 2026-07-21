export {};

declare global {
  namespace Express {
    interface User {
      userId: import('mongoose').Types.ObjectId | string;
      activeRoleId: import('mongoose').Types.ObjectId | string;
      organizationId?: import('mongoose').Types.ObjectId | string;
      assignmentId?: import('mongoose').Types.ObjectId | string;
      cabinetPeriod?: string;
      permissions: import('../common/auth/permissions').AppPermission[];
      session?: unknown;
    }
    // Re-declare Request if needed, but usually interface User is enough.
  }
}
