import { BaseImsApiService, ApiResponse } from './client';

export class RapatApi extends BaseImsApiService {
  // ===== RAPAT =====
  static async getRapatList(cabinetPeriod: string) {
    return this.request<any[]>(`/ims/rapat?cabinetPeriod=${cabinetPeriod}`);
  }

  static async getRapatDetail(id: string) {
    return this.request<any>(`/ims/rapat/${id}`);
  }

  static async createRapat(data: any) {
    return this.request<any>('/ims/rapat', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async updateRapat(id: string, data: any) {
    return this.request<any>(`/ims/rapat/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  static async startRapat(id: string) {
    return this.request<any>(`/ims/rapat/${id}/start`, {
      method: 'POST',
    });
  }

  static async endRapat(id: string) {
    return this.request<any>(`/ims/rapat/${id}/end`, {
      method: 'POST',
    });
  }

  static async getQrToken(id: string) {
    return this.request<any>(`/ims/rapat/${id}/qr-token`);
  }

  static async attendByQr(id: string, data: { token: string; latitude: number; longitude: number }) {
    return this.request<any>(`/ims/rapat/${id}/attend/qr`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async attendManual(id: string, data: { userId: string; note?: string }) {
    return this.request<any>(`/ims/rapat/${id}/attend/manual`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async removeAttendee(rapatId: string, userId: string) {
    return this.request<any>(`/ims/rapat/${rapatId}/attendees/${userId}`, {
      method: 'DELETE',
    });
  }
}
