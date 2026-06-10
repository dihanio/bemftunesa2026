import {
  ApiClient,
  type ApiResponse,
  type PaginationMeta,
  type QueryParams,
  type ListQuery,
} from "@bemft/api-client";

export class PublicApiClient extends ApiClient {
  constructor() {
    super();
  }

  async fetcher<T>(
    endpoint: string,
    options: RequestInit & { params?: QueryParams } = {},
  ): Promise<T> {
    try {
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
    } catch (error) {
      const err = error as Error;
      console.error("Public API request failed:", err);
      if (err.message.includes("401") || err.message.includes("403")) {
        throw new Error(
          "Access denied. This resource is not available publicly.",
        );
      }
      if (err.message.includes("500")) {
        throw new Error(
          "Server is temporarily unavailable. Please try again later.",
        );
      }
      throw error;
    }
  }
}

const publicApiClient = new PublicApiClient();

export const api = {
  get: <T>(endpoint: string, params?: QueryParams) =>
    publicApiClient.get<T>(endpoint, params),
  post: <T>(endpoint: string, data?: unknown, params?: QueryParams) =>
    publicApiClient.post<T>(endpoint, data, params),
  put: <T>(endpoint: string, data?: unknown, params?: QueryParams) =>
    publicApiClient.put<T>(endpoint, data, params),
  patch: <T>(endpoint: string, data?: unknown, params?: QueryParams) =>
    publicApiClient.patch<T>(endpoint, data, params),
  delete: <T>(endpoint: string, params?: QueryParams) =>
    publicApiClient.delete<T>(endpoint, params),
  setAuthToken: (token: string) => publicApiClient.setAuthToken(token),
  removeAuthToken: () => publicApiClient.removeAuthToken(),
};

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

export type { ApiResponse, PaginationMeta, QueryParams, ListQuery };
