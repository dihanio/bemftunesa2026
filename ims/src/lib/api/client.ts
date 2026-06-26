// Base API client configuration and core fetch methods
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL as string;

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export class BaseImsApiService {
  protected static getToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("ims_token");
    }
    return null;
  }

  protected static async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = this.getToken();
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    };

    try {
      const response = await fetch(url, { ...options, headers });
      if (response.status === 401) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("ims_token");
          window.location.href = "/login";
        }
        throw new Error("Unauthorized");
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`IMS API request failed on endpoint ${endpoint}:`, error);
      throw error;
    }
  }

  public static async get<T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  public static async post<T = any>(endpoint: string, data?: any, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body: data ? JSON.stringify(data) : undefined });
  }

  public static async put<T = any>(endpoint: string, data?: any, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body: data ? JSON.stringify(data) : undefined });
  }

  public static async patch<T = any>(endpoint: string, data?: any, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body: data ? JSON.stringify(data) : undefined });
  }

  public static async delete<T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  protected static async postForm<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = this.getToken();
    const headers = {
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (response.status === 401) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("ims_token");
          window.location.href = "/login";
        }
        throw new Error("Unauthorized");
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`IMS API postForm failed on endpoint ${endpoint}:`, error);
      throw error;
    }
  }
}
