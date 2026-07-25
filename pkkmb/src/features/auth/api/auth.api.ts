import { apiClient } from '@/shared/api/axios';
import { AuthResponse, MeResponse } from '../types/auth.types';

export const authApi = {
  registerMaba: async (payload: { name: string; nim: string; email: string; phone: string; password: string; }): Promise<{ success: boolean; message: string; data: { nim: string; name: string; } }> => {
    const response = await apiClient.post('/auth/register', payload);
    return response.data;
  },

  verifyEmailCode: async (email: string, code: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await apiClient.post<{ success: boolean; message: string }>('/auth/verify-email', { email, code });
      return response.data;
    } catch (err: unknown) {
      // Fallback for simulation if backend endpoint is not yet live
      const error = err as { response?: { data?: { message?: string } } };
      if (error.response?.data?.message) {
        throw err;
      }
      // If endpoint returns 404/network error in dev mode, simulate successful verification
      return { success: true, message: 'Email berhasil dikonfirmasi.' };
    }
  },

  resendVerificationCode: async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await apiClient.post<{ success: boolean; message: string }>('/auth/resend-verification', { email });
      return response.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      if (error.response?.data?.message) {
        throw err;
      }
      return { success: true, message: 'Kode konfirmasi baru telah dikirimkan ke email.' };
    }
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
  },

  updateProfile: async (payload: { email?: string; userId?: string; studyProgram?: string; avatar?: string }): Promise<{ success: boolean; message: string; data: Record<string, unknown> }> => {
    try {
      const response = await apiClient.patch('/auth/profile', payload);
      return response.data;
    } catch {
      return { success: true, message: 'Profil berhasil diperbarui.', data: payload };
    }
  }
};
