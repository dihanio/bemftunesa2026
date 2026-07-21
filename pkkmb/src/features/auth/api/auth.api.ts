import { apiClient } from '@/shared/api/axios';
import { AuthResponse, MeResponse } from '../types/auth.types';

export const authApi = {
  loginMaba: async (nim: string, password: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', { nim, password });
    return response.data;
  },

  getMe: async (): Promise<MeResponse> => {
    const response = await apiClient.get<MeResponse>('/pkkmb/me');
    return response.data;
  }
};
