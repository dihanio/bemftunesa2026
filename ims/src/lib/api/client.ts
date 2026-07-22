// Base API client configuration and core fetch methods
import { ApiError } from './error';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:4000/api/v1' : 'https://api.bemftunesa.org/api/v1');

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success?: boolean;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export class BaseImsApiService {
  protected static async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Cookies are automatically sent with fetch for same-origin requests
    // No need to manually add Authorization header
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    try {
      const response = await fetch(url, { 
        ...options, 
        headers,
        credentials: 'include', // Important: include cookies in requests
      });
      
      if (response.status === 401) {
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        throw new ApiError(401, "Unauthorized");
      }

      if (!response.ok) {
        // We will try to parse error JSON if possible, otherwise just use statusText
        let message = `HTTP error! status: ${response.status}`;
        let responseData: unknown = undefined;
        try {
           responseData = await response.json();
           if (responseData && typeof responseData === 'object' && 'message' in responseData) {
              message = String((responseData as {message: unknown}).message);
           }
        } catch {
           // JSON parse failed, use default message
        }
        throw new ApiError(response.status, message, responseData);
      }

      const json = await response.json();
      
      // Global normalization to fix double-wrapped data arrays from NestJS TransformInterceptor
      if (json && typeof json === 'object' && 'data' in json) {
        const innerData = json.data;
        if (innerData && typeof innerData === 'object' && !Array.isArray(innerData)) {
          if ('data' in innerData && Array.isArray(innerData.data)) {
            json.data = innerData.data;
          } else if ('docs' in innerData && Array.isArray(innerData.docs)) {
            json.data = innerData.docs;
          }
        }
      }
      
      return json;
    } catch (error) {
      console.error(`IMS API request failed on endpoint ${endpoint}:`, error);
      throw error;
    }
  }

  public static async get<TResponse>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse>(endpoint, { ...options, method: 'GET' });
  }

  public static async post<TResponse, TRequest = unknown>(endpoint: string, data?: TRequest, options: RequestInit = {}): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse>(endpoint, { ...options, method: 'POST', body: data ? JSON.stringify(data) : undefined });
  }

  public static async put<TResponse, TRequest = unknown>(endpoint: string, data?: TRequest, options: RequestInit = {}): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse>(endpoint, { ...options, method: 'PUT', body: data ? JSON.stringify(data) : undefined });
  }

  public static async patch<TResponse, TRequest = unknown>(endpoint: string, data?: TRequest, options: RequestInit = {}): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse>(endpoint, { ...options, method: 'PATCH', body: data ? JSON.stringify(data) : undefined });
  }

  public static async delete<TResponse>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse>(endpoint, { ...options, method: 'DELETE' });
  }

  protected static async postForm<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include', // Include cookies for authentication
        body: formData,
      });

      if (response.status === 401) {
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        throw new ApiError(401, "Unauthorized");
      }

      if (!response.ok) {
        let message = `HTTP error! status: ${response.status}`;
        let responseData: unknown = undefined;
        try {
           responseData = await response.json();
           if (responseData && typeof responseData === 'object' && 'message' in responseData) {
              message = String((responseData as {message: unknown}).message);
           }
        } catch {
           // Ignored
        }
        throw new ApiError(response.status, message, responseData);
      }

      return await response.json();
    } catch (error) {
      console.error(`IMS API postForm failed on endpoint ${endpoint}:`, error);
      throw error;
    }
  }
}
