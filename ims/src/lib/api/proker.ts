import { BaseImsApiService, ApiResponse } from './client';
import { ProkerItem } from '../api';

export class ProkerApi extends BaseImsApiService {
  static async getProkerList(): Promise<ApiResponse<ProkerItem[]>> {
    return this.request<ProkerItem[]>("/ims/proker");
  }

  static async getProkerDetail(id: string): Promise<ApiResponse<ProkerItem>> {
    return this.request<ProkerItem>(`/ims/proker/${id}`);
  }

  static async createProker(data: Partial<ProkerItem>): Promise<ApiResponse<ProkerItem>> {
    return this.request<ProkerItem>("/ims/proker", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async updateProker(id: string, data: Partial<ProkerItem>): Promise<ApiResponse<ProkerItem>> {
    return this.request<ProkerItem>(`/ims/proker/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  static async submitProker(id: string): Promise<ApiResponse<ProkerItem>> {
    return this.request<ProkerItem>(`/ims/proker/${id}/submit`, { method: "POST" });
  }

  static async approveProker(id: string, note?: string): Promise<ApiResponse<ProkerItem>> {
    return this.request<ProkerItem>(`/ims/proker/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ note }),
    });
  }

  static async rejectProker(id: string, note?: string): Promise<ApiResponse<ProkerItem>> {
    return this.request<ProkerItem>(`/ims/proker/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ note }),
    });
  }

  static async deleteProker(id: string): Promise<ApiResponse<{ deleted: boolean }>> {
    return this.request<{ deleted: boolean }>(`/ims/proker/${id}`, {
      method: "DELETE",
    });
  }
}
