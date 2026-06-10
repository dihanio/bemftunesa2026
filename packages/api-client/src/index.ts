import { logger } from "./logger";

export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalDocs: number;
  totalPages: number;
}

export interface ListQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
}

export type QueryParamValue =
  | string
  | number
  | boolean
  | readonly string[]
  | null
  | undefined;

export type QueryParams = Record<string, QueryParamValue>;

export class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL?: string) {
    this.baseURL = baseURL || this.resolveBaseUrl();
    this.defaultHeaders = {
      "Content-Type": "application/json",
    };

    // Auto-hydrate token synchronously from localStorage on client side to prevent race conditions on page refresh
    if (typeof window !== "undefined") {
      try {
        const persistedAuth = window.localStorage.getItem("ims-auth-storage");
        if (persistedAuth) {
          const parsed = JSON.parse(persistedAuth);
          const token = parsed?.state?.token;
          if (token) {
            this.setAuthToken(token);
          }
        }
      } catch (e) {
        // Silent error if localStorage is disabled or corrupted
      }
    }
  }

  private resolveBaseUrl(): string {
    let envBaseURL =
      typeof process !== "undefined"
        ? process.env.NEXT_PUBLIC_API_URL
        : undefined;

    if (!envBaseURL && typeof window !== "undefined") {
      envBaseURL = `${window.location.origin}/api/v1`;
    }

    const fallback = "https://api.bemftunesa.org/v1";
    const url = envBaseURL || fallback;
    const normalized = url.endsWith("/") ? url.slice(0, -1) : url;

    if (normalized.endsWith("/api/v1")) {
      return normalized;
    }

    if (normalized.endsWith("/v1")) {
      return `${normalized.slice(0, -3)}/api/v1`;
    }

    return `${normalized}/api/v1`;
  }

  private buildURL(endpoint: string, params?: QueryParams): string {
    const normalizedEndpoint = endpoint.startsWith("/")
      ? endpoint
      : `/${endpoint}`;
    let url = `${this.baseURL}${normalizedEndpoint}`;

    if (params) {
      const searchParams = new URLSearchParams();

      Object.entries(params).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach((item) => searchParams.append(key, String(item)));
          return;
        }

        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });

      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    return url;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage =
        typeof body?.message === "string"
          ? body.message
          : `API Error: ${response.status}`;

      logger.error(
        "API request failed",
        {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          errorData: body,
        },
        new Error(errorMessage),
      );

      if (response.status === 401 && typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("auth:unauthorized"));
      }

      throw new Error(errorMessage);
    }

    return body;
  }

  async get<T>(endpoint: string, params?: QueryParams): Promise<T> {
    const url = this.buildURL(endpoint, params);
    logger.debug("GET", { endpoint, params, url });

    return this.handleResponse<T>(
      await fetch(url, {
        method: "GET",
        headers: this.defaultHeaders,
      }),
    );
  }

  async post<T>(
    endpoint: string,
    data?: unknown,
    params?: QueryParams,
  ): Promise<T> {
    const url = this.buildURL(endpoint, params);
    logger.debug("POST", { endpoint, params, url });

    return this.handleResponse<T>(
      await fetch(url, {
        method: "POST",
        headers: this.defaultHeaders,
        body: data === undefined ? undefined : JSON.stringify(data),
      }),
    );
  }

  async put<T>(
    endpoint: string,
    data?: unknown,
    params?: QueryParams,
  ): Promise<T> {
    const url = this.buildURL(endpoint, params);
    logger.debug("PUT", { endpoint, params, url });

    return this.handleResponse<T>(
      await fetch(url, {
        method: "PUT",
        headers: this.defaultHeaders,
        body: data === undefined ? undefined : JSON.stringify(data),
      }),
    );
  }

  async patch<T>(
    endpoint: string,
    data?: unknown,
    params?: QueryParams,
  ): Promise<T> {
    const url = this.buildURL(endpoint, params);
    logger.debug("PATCH", { endpoint, params, url });

    return this.handleResponse<T>(
      await fetch(url, {
        method: "PATCH",
        headers: this.defaultHeaders,
        body: data === undefined ? undefined : JSON.stringify(data),
      }),
    );
  }

  async delete<T>(endpoint: string, params?: QueryParams): Promise<T> {
    const url = this.buildURL(endpoint, params);
    logger.debug("DELETE", { endpoint, params, url });

    return this.handleResponse<T>(
      await fetch(url, {
        method: "DELETE",
        headers: this.defaultHeaders,
      }),
    );
  }

  setAuthToken(token: string): void {
    this.defaultHeaders.Authorization = `Bearer ${token}`;
  }

  removeAuthToken(): void {
    delete this.defaultHeaders.Authorization;
  }

  setHeader(key: string, value: string): void {
    this.defaultHeaders[key] = value;
  }

  removeHeader(key: string): void {
    delete this.defaultHeaders[key];
  }
}

export const apiClient = new ApiClient();

export const api = {
  get: <T>(endpoint: string, params?: QueryParams) =>
    apiClient.get<T>(endpoint, params),
  post: <T>(endpoint: string, data?: unknown, params?: QueryParams) =>
    apiClient.post<T>(endpoint, data, params),
  put: <T>(endpoint: string, data?: unknown, params?: QueryParams) =>
    apiClient.put<T>(endpoint, data, params),
  patch: <T>(endpoint: string, data?: unknown, params?: QueryParams) =>
    apiClient.patch<T>(endpoint, data, params),
  delete: <T>(endpoint: string, params?: QueryParams) =>
    apiClient.delete<T>(endpoint, params),
  setAuthToken: (token: string) => apiClient.setAuthToken(token),
  removeAuthToken: () => apiClient.removeAuthToken(),
};

export { logger } from "./logger";
export default apiClient;
