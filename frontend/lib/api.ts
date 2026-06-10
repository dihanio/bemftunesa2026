import {
  ApiClient,
  type ApiResponse,
  type PaginationMeta,
  type QueryParams,
  type ListQuery,
} from "@bemft/api-client";

// Public API client - no authentication required
export class PublicApiClient extends ApiClient {
  constructor() {
    super();
  }

  // Enhanced fetcher with better error handling for public use
  async fetcher<T>(
    endpoint: string,
    options: RequestInit & { params?: QueryParams } = {},
  ): Promise<T> {
    try {
      const { params, ...fetchOptions } = options;

      // Use parent class methods directly
      if (
        fetchOptions.method === "POST" ||
        fetchOptions.method === "PUT" ||
        fetchOptions.method === "PATCH"
      ) {
        const data = fetchOptions.body
          ? JSON.parse(fetchOptions.body as string)
          : undefined;

        switch (fetchOptions.method) {
          case "POST":
            return await this.post<T>(endpoint, data, params);
          case "PUT":
            return await this.put<T>(endpoint, data, params);
          case "PATCH":
            return await this.patch<T>(endpoint, data, params);
          default:
            throw new Error(`Unsupported method: ${fetchOptions.method}`);
        }
      } else {
        return await this.get<T>(endpoint, params);
      }
    } catch (error: any) {
      // Enhanced error handling for public API
      console.error("Public API request failed:", error);

      // Don't expose sensitive errors to public
      if (error.message.includes("401") || error.message.includes("403")) {
        throw new Error(
          "Access denied. This resource is not available publicly.",
        );
      }

      if (error.message.includes("500")) {
        throw new Error(
          "Server is temporarily unavailable. Please try again later.",
        );
      }

      throw error;
    }
  }
}

// Create public API client instance
const publicApiClient = new PublicApiClient();

// Export convenience methods for public API
export const api = {
  get: <T>(endpoint: string, params?: QueryParams) =>
    publicApiClient.get<T>(endpoint, params),
  post: <T>(endpoint: string, data?: any, params?: QueryParams) =>
    publicApiClient.post<T>(endpoint, data, params),
  put: <T>(endpoint: string, data?: any, params?: QueryParams) =>
    publicApiClient.put<T>(endpoint, data, params),
  patch: <T>(endpoint: string, data?: any, params?: QueryParams) =>
    publicApiClient.patch<T>(endpoint, data, params),
  delete: <T>(endpoint: string, params?: QueryParams) =>
    publicApiClient.delete<T>(endpoint, params),
};

// Legacy fetcher function for backward compatibility
export async function fetcher<T>(
  endpoint: string,
  options: RequestInit & { params?: QueryParams } = {},
): Promise<T> {
  const { params, ...fetchOptions } = options;

  if (
    fetchOptions.method === "POST" ||
    fetchOptions.method === "PUT" ||
    fetchOptions.method === "PATCH"
  ) {
    const data = fetchOptions.body
      ? JSON.parse(fetchOptions.body as string)
      : undefined;

    switch (fetchOptions.method) {
      case "POST":
        return await publicApiClient.post<T>(endpoint, data, params);
      case "PUT":
        return await publicApiClient.put<T>(endpoint, data, params);
      case "PATCH":
        return await publicApiClient.patch<T>(endpoint, data, params);
      default:
        return await publicApiClient.get<T>(endpoint, params);
    }
  } else {
    return await publicApiClient.get<T>(endpoint, params);
  }
}

// Export types
export type { ApiResponse, PaginationMeta, QueryParams, ListQuery };
