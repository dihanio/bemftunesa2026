import { BaseImsApiService, ApiResponse } from './client';
import { UserProfile } from '../api';

export class AuthApi extends BaseImsApiService {
  static async getProfile(): Promise<ApiResponse<UserProfile>> {
    return this.request<UserProfile>("/auth/me");
  }
}
