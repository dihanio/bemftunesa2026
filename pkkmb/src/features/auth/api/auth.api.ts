import { apiClient } from '@/shared/api/axios';
import { AuthResponse, MeResponse } from '../types/auth.types';

export const authApi = {
  registerMaba: async (payload: { name: string; nim: string; email: string; phone: string; password: string; }): Promise<{ success: boolean; message: string; data: { nim: string; name: string; } }> => {
    const response = await apiClient.post('/auth/register', payload);
    return response.data;
  },

  loginMaba: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', { email, password });
    if (response.data?.data?.user) {
      response.data.data.user.role = 'MABA';
    }
    return response.data;
  },

  getMe: async (): Promise<MeResponse> => {
    const response = await apiClient.get<{ success: boolean; data: Record<string, unknown> }>('/auth/me');
    const userData = response.data.data;
    if (userData && userData.role) {
      const slug = typeof userData.role === 'object' && userData.role !== null ? (userData.role as { slug?: string }).slug : userData.role as string;
      const normalized = slug?.toLowerCase() || '';
      if (normalized === 'super-admin' || normalized === 'admin') userData.role = 'ADMIN';
      else if (normalized === 'panitia' || normalized === 'pemateri' || normalized === 'kakak-pendamping') userData.role = 'PANITIA';
      else userData.role = 'MABA';
    }
    return { success: true, data: userData as unknown as MeResponse['data'] };
  }
};
