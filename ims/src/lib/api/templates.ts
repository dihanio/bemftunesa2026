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
    return TemplateApiService.request<Template[]>('/document-platform/templates');
  }

  async getById(id: string) {
    return TemplateApiService.request<Template>(`/document-platform/templates/${id}`);
  }

  async sync(id: string) {
    return TemplateApiService.request<Template>(`/document-platform/templates/${id}/sync`, {
      method: 'POST',
    });
  }

  async validate(id: string) {
    return TemplateApiService.request<any>(`/document-platform/templates/${id}/validate`);
  }

  async publish(id: string) {
    return TemplateApiService.request<Template>(`/document-platform/templates/${id}/publish`, {
      method: 'POST',
    });
  }

  async preview(id: string, payload: any) {
    return TemplateApiService.request<string>(`/document-platform/templates/${id}/preview`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}

export const templateApi = new TemplateApiService();
