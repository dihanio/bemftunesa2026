import ImsApiService from '../lib/api';
import { StatData } from '../types/dashboard-domains';

export class StatsService {
  /**
   * Retrieves Proker Statistics from backend.
   */
  static async getProkerStats(): Promise<StatData> {
    const response = await ImsApiService.get<{ total: StatData; planning: StatData; active: StatData; completed: StatData }>('/ims/proker/stats');
    return response.data.total;
  }

  /**
   * Retrieves Surat Statistics from backend.
   */
  static async getSuratStats(): Promise<StatData> {
    const response = await ImsApiService.get<{ total: StatData; pending: StatData; approved: StatData; rejected: StatData }>('/letters/stats');
    return response.data.total;
  }
}
