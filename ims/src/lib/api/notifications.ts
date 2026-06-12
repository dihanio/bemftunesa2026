import { apiClient } from "@bemft/api-client";

export interface INotification {
  _id: string;
  recipientId: string;
  title: string;
  message: string;
  category: "info" | "warning" | "success" | "error";
  isRead: boolean;
  actionData?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export const notificationsApi = {
  getNotifications: async (params?: { page?: number; limit?: number }) => {
    const res = await apiClient.get<PaginatedResponse<INotification>>("/notifications", {
      params,
    });
    return res.data;
  },

  markAsRead: async (id: string) => {
    const res = await apiClient.patch<{ data: INotification; message: string }>(
      `/notifications/${id}/read`
    );
    return res.data;
  },
};
