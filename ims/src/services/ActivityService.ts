import { AuditService } from './AuditService';
import { ActivityData } from '../types/dashboard-domains';

export class ActivityService {
  /**
   * Retrieves global system activities (Audit Log)
   */
  static async getSystemActivities(): Promise<ActivityData[]> {
    return AuditService.getRecentLogs(20);
  }
}
