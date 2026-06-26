import { BaseImsApiService } from './client';

export interface NumberingToken {
  id: string;
  name: string;
  description: string;
  category: 'system' | 'date' | 'metadata' | 'organization';
}

export interface NumberingFormat {
  _id: string;
  documentType: string;
  formatPattern: string;
  sequenceLength: number;
  resetPeriod: 'never' | 'monthly' | 'quarterly' | 'semester' | 'yearly' | 'cabinet_period';
  version: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NumberingPreview {
  current: string;
  next: string;
  nextReset: string;
  resolvedTokens: Record<string, string>;
}

export class NumberingApiService extends BaseImsApiService {
  async getFormats() {
    return NumberingApiService.request<NumberingFormat[]>('/document-platform/numbering/formats');
  }

  async getFormat(id: string) {
    return NumberingApiService.request<NumberingFormat>(`/document-platform/numbering/formats/${id}`);
  }

  async getTokens() {
    return NumberingApiService.request<NumberingToken[]>('/document-platform/numbering/tokens');
  }

  async createFormat(data: Partial<NumberingFormat>) {
    return NumberingApiService.request<NumberingFormat>('/document-platform/numbering/formats', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateFormat(id: string, data: Partial<NumberingFormat>) {
    return NumberingApiService.request<NumberingFormat>(`/document-platform/numbering/formats/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async preview(payload: { formatPattern: string; resetPeriod: string; sequenceLength: number; context: any }) {
    return NumberingApiService.request<NumberingPreview>('/document-platform/numbering/preview', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async resetSequence(id: string, payload: { context: any; reason: string }) {
    return NumberingApiService.request<any>(`/document-platform/numbering/formats/${id}/reset`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}

export const numberingApi = new NumberingApiService();
