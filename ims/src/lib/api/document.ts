import { BaseImsApiService, ApiResponse } from './client';

export class DocumentApi<T> extends BaseImsApiService {
  protected basePath: string;

  constructor(basePath: string) {
    super();
    this.basePath = basePath;
  }

  async getList(query?: string): Promise<ApiResponse<T[]>> {
    const qs = query ? `?${query}` : '';
    return DocumentApi.request<T[]>(`${this.basePath}${qs}`);
  }

  async getDetail(id: string): Promise<ApiResponse<T>> {
    return DocumentApi.request<T>(`${this.basePath}/${id}`);
  }

  async create(data: any): Promise<ApiResponse<T>> {
    return DocumentApi.request<T>(`${this.basePath}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async update(id: string, data: any): Promise<ApiResponse<T>> {
    return DocumentApi.request<T>(`${this.basePath}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    return DocumentApi.request<void>(`${this.basePath}/${id}`, {
      method: 'DELETE',
    });
  }

  async submit(id: string, comment?: string): Promise<ApiResponse<T>> {
    return DocumentApi.request<T>(`${this.basePath}/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    });
  }

  async approve(id: string, comment?: string): Promise<ApiResponse<T>> {
    return DocumentApi.request<T>(`${this.basePath}/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    });
  }

  async reject(id: string, comment: string): Promise<ApiResponse<T>> {
    return DocumentApi.request<T>(`${this.basePath}/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    });
  }

  async requestRevision(id: string, comment: string): Promise<ApiResponse<T>> {
    return DocumentApi.request<T>(`${this.basePath}/${id}/request-revision`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    });
  }

  async getHistory(id: string): Promise<ApiResponse<any[]>> {
    return DocumentApi.request<any[]>(`${this.basePath}/${id}/history`);
  }

  async exportDocument(id: string, format: 'pdf' | 'docx' | 'html'): Promise<Blob> {
    const { API_BASE_URL } = await import('./client');
    const url = `${API_BASE_URL}${this.basePath}/${id}/export/${format}`;
    const token = DocumentApi.getToken();
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error(`Export failed! status: ${response.status}`);
    }

    return response.blob();
  }

  /**
   * Fetch available workflow actions for a document from the Workflow Platform.
   * Returns dynamic action list based on current stage + user roles.
   */
  async getAvailableActions(id: string): Promise<ApiResponse<any>> {
    return DocumentApi.request<any>(`${this.basePath}/${id}/available-actions`);
  }

  /**
   * Execute a generic workflow action by keyword.
   * The Workflow Engine resolves the correct transition dynamically.
   */
  async executeWorkflowAction(id: string, action: string, comment?: string): Promise<ApiResponse<any>> {
    return DocumentApi.request<any>(`${this.basePath}/${id}/workflow-action`, {
      method: 'POST',
      body: JSON.stringify({ action, comment }),
    });
  }
}
