import { BaseImsApiService, ApiResponse } from './client';

export interface DocumentTemplate {
  _id: string;
  code: string;
  name: string;
  documentType: string;
  category: string;
  description?: string;
  googleDriveUrl?: string;
  order: number;
  status: string;
}

export class TemplateApiService extends BaseImsApiService {
  static async getTemplates(): Promise<ApiResponse<DocumentTemplate[]>> {
    return this.request<DocumentTemplate[]>('/templates');
  }
}