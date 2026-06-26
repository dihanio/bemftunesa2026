import { DocumentApi } from './document';
import { Surat } from '../types/surat';
import { ApiResponse } from './client';

class SuratApiService extends DocumentApi<Surat> {
  constructor() {
    super('/ims/surat');
  }

  async getSuratList(cabinetPeriod?: string): Promise<ApiResponse<Surat[]>> {
    const qs = cabinetPeriod ? `cabinetPeriod=${cabinetPeriod}` : '';
    return this.getList(qs);
  }

  async createSurat(data: any): Promise<ApiResponse<Surat>> {
    return SuratApiService.request<Surat>(`${this.basePath}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async uploadVersion(id: string, data: {
    fileUrl: string;
    fileSize: number;
    mimeType: string;
    versionType: string;
    notes?: string;
    fileHash?: string;
  }): Promise<ApiResponse<Surat>> {
    return SuratApiService.request<Surat>(`${this.basePath}/${id}/version`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async verifySuratPublic(id: string): Promise<ApiResponse<Surat>> {
    return SuratApiService.request<Surat>(`/public/surat/${id}/verify`);
  }
}

export const SuratApi = new SuratApiService();
