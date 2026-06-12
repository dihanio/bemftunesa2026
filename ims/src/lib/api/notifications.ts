import { apiClient } from "@bemft/api-client";
import type { ApiResponse } from "@bemft/api-client";

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

export const notificationsApi = {
  getNotifications: async (params?: { page?: number; limit?: number }) => {
    const res = await apiClient.get<ApiResponse<INotification[]>>("/notifications", params as Record<string, number | undefined>);
    return res;
  },

  markAsRead: async (id: string) => {
    const res = await apiClient.patch<ApiResponse<INotification>>(
      `/notifications/${id}/read`
    );
    return res;
  },
};
