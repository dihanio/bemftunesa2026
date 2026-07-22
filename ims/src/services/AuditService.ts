import ImsApiService from '../lib/api';
import { ActivityData } from '../types/dashboard-domains';

interface AuditLog {
  _id: string;
  action: string;
  resourceType: string;
  resourceName: string;
  createdAt: string;
  actor?: { name: string };
}

export class AuditService {
  /**
   * Retrieves recent audit logs from backend.
   */
  static async getRecentLogs(limit: number = 20): Promise<ActivityData[]> {
    const response = await ImsApiService.get<AuditLog[]>(`/ims/audit?limit=${limit}`);
    
    // Transform backend audit log format to ActivityData format
    return response.data.map((log: AuditLog) => ({
      id: log._id,
      title: `${log.action} - ${log.resourceType}`,
      description: log.resourceName,
      timestamp: log.createdAt,
      actor: log.actor?.name || 'System',
      type: this.mapActionToType(log.action)
    }));
  }

  private static mapActionToType(action: string): 'create' | 'update' | 'delete' | 'system' {
    if (action.includes('create')) return 'create';
    if (action.includes('update')) return 'update';
    if (action.includes('delete')) return 'delete';
    return 'system';
  }
}
