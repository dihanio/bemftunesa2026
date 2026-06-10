import { SetMetadata } from '@nestjs/common';

export const COMMITTEE_ROLES_KEY = 'committeeRoles';
export const RequireCommitteeRoles = (...roles: string[]) =>
  SetMetadata(COMMITTEE_ROLES_KEY, roles);
