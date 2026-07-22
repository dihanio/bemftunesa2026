/* eslint-disable */
import { apiClient } from '@/shared/api/axios';
import { AuthResponse, MeResponse } from '../types/auth.types';

export const authApi = {
  loginMaba: async (nim: string, password: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', { nim, password });
    if (response.data?.data?.user) {
      response.data.data.user.role = 'MABA';
    }
    return response.data;
  },

  getMe: async (): Promise<MeResponse> => {
    const response = await apiClient.get<any>('/auth/me');
    const userData = response.data.data;
    if (userData && userData.role) {
      const slug = typeof userData.role === 'object' ? userData.role.slug : userData.role;
      const normalized = slug?.toLowerCase() || '';
      if (normalized === 'super-admin' || normalized === 'admin') userData.role = 'ADMIN';
      else if (normalized === 'panitia' || normalized === 'pemateri' || normalized === 'kakak-pendamping') userData.role = 'PANITIA';
      else userData.role = 'MABA';
    }
    return { success: true, data: userData };
  }
};
