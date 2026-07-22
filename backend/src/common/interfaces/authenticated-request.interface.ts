import { Request } from 'express';
import { Types } from 'mongoose';
import { AppPermission } from '../auth/permissions';

export interface AuthenticatedRequest extends Request {
  user: {
    userId: Types.ObjectId | string;
    activeRoleId: Types.ObjectId | string;
    role?: {
      _id: Types.ObjectId | string;
      slug: string;
      name: string;
      scope: string;
    };
    organizationId?: Types.ObjectId | string;
    assignmentId?: Types.ObjectId | string;
    cabinetPeriod?: string;
    permissions: AppPermission[];
    session?: unknown; // To be strictly typed if sessions are fully modeled
  };
}
