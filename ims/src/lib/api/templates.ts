import { BaseImsApiService } from './client';

export interface Template {
  _id: string;
  code: string;
  name: string;
  description: string;
  documentType: string;
  category: string;
  sourceType: string;
  googleDriveId?: string;
  googleDriveUrl?: string;
  status: 'draft' | 'published' | 'deprecated';
  version: number;
  placeholders: any[];
  workflowId?: string;
  lastSyncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class TemplateApiService extends BaseImsApiService {
  async getAll() {
    return TemplateApiService.request<Template[]>('/templates');
  }

  async getById(id: string) {
    return TemplateApiService.request<Template>(`/templates/${id}`);
  }

  async sync(payload: { code: string; name: string; documentType: string; category: string; googleDriveUrl: string; description?: string }) {
    return TemplateApiService.request<Template>('/templates/sync', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async validate(id: string) {
    return TemplateApiService.request<any>(`/templates/${id}/validate`);
  }

  async publish(id: string) {
    return TemplateApiService.request<Template>(`/templates/${id}/publish`, {
      method: 'POST',
    });
  }

  async preview(id: string, payload: any) {
    return TemplateApiService.request<string>(`/templates/${id}/preview`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async update(id: string, payload: any) {
    return TemplateApiService.request<Template>(`/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deprecate(id: string) {
    return TemplateApiService.request<Template>(`/templates/${id}/deprecate`, {
      method: 'POST',
    });
  }
}

export const templateApi = new TemplateApiService();
