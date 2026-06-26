import { BaseImsApiService, ApiResponse } from './client';
import { UserProfile, ActiveContext } from '../api';

export class AuthApi extends BaseImsApiService {
  static async getProfile(): Promise<ApiResponse<UserProfile>> {
    return this.request<UserProfile>("/auth/me");
  }

  static async getUsers(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>("/users?limit=100");
  }

  static async switchRole(assignmentId: string): Promise<ApiResponse<{ token: string; activeContext: ActiveContext }>> {
    return this.request<{ token: string; activeContext: ActiveContext }>("/auth/switch-role", {
      method: "POST",
      body: JSON.stringify({ assignmentId }),
    });
  }
}
