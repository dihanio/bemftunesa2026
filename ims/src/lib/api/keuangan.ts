import { BaseImsApiService, ApiResponse } from './client';
import { KeuanganItem } from '../api';

export class KeuanganApi extends BaseImsApiService {
  static async getKeuanganList(): Promise<ApiResponse<KeuanganItem[]>> {
    return this.request<KeuanganItem[]>("/ims/keuangan");
  }

  static async getKeuanganDetail(id: string): Promise<ApiResponse<KeuanganItem>> {
    return this.request<KeuanganItem>(`/ims/keuangan/${id}`);
  }

  static async createKeuangan(data: Partial<KeuanganItem>): Promise<ApiResponse<KeuanganItem>> {
    return this.request<KeuanganItem>("/ims/keuangan", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async updateKeuangan(id: string, data: Partial<KeuanganItem>): Promise<ApiResponse<KeuanganItem>> {
    return this.request<KeuanganItem>(`/ims/keuangan/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  static async submitKeuangan(id: string): Promise<ApiResponse<KeuanganItem>> {
    return this.request<KeuanganItem>(`/ims/keuangan/${id}/submit`, { method: "POST" });
  }

  static async approveKeuangan(id: string, note?: string): Promise<ApiResponse<KeuanganItem>> {
    return this.request<KeuanganItem>(`/ims/keuangan/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ note }),
    });
  }

  static async rejectKeuangan(id: string, note?: string): Promise<ApiResponse<KeuanganItem>> {
    return this.request<KeuanganItem>(`/ims/keuangan/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ note }),
    });
  }
}
