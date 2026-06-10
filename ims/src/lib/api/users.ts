import { api } from "@bemft/api-client";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: "Super Admin" | "Kadep" | "Sekretaris" | "Bendahara" | "Staff";
  department: string;
  position: string;
  avatar?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateUserDto {
  name: string;
  email: string;
  role: "Super Admin" | "Kadep" | "Sekretaris" | "Bendahara" | "Staff";
  department: string;
  position: string;
  phone?: string;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  role?: string;
  department?: string;
  position?: string;
  phone?: string;
  isActive?: boolean;
}

export const usersService = {
  list: async (query?: Record<string, any>) => {
    return api.get<{ data: User[]; meta?: any }>("/ims/users", query as any);
  },

  getById: async (id: string) => {
    return api.get<{ data: User }>(`/ims/users/${id}`);
  },

  create: async (data: CreateUserDto) => {
    return api.post<{ data: User; message: string }>("/ims/users", data);
  },

  update: async (id: string, data: UpdateUserDto) => {
    return api.put<{ data: User; message: string }>(`/ims/users/${id}`, data);
  },

  updateStatus: async (id: string, isActive: boolean) => {
    return api.patch<{ data: User }>(`/ims/users/${id}/status`, { isActive });
  },

  delete: async (id: string) => {
    return api.delete<{ message: string }>(`/ims/users/${id}`);
  },

  listSessions: async (id: string) => {
    return api.get<{ data: any[] }>(`/ims/users/${id}/sessions`);
  },

  revokeSessions: async (id: string, sessionId?: string) => {
    return api.delete<{ message: string }>(
      sessionId
        ? `/ims/users/${id}/sessions/${sessionId}`
        : `/ims/users/${id}/sessions`,
    );
  },

  listPermissions: async (id: string) => {
    return api.get<{ data: any[] }>(`/ims/users/${id}/permissions`);
  },

  addPermissionOverride: async (id: string, data: any) => {
    return api.post<{ data: any; message: string }>(
      `/ims/users/${id}/permissions`,
      data,
    );
  },

  removePermissionOverride: async (id: string, permission: string) => {
    return api.delete<{ message: string }>(
      `/ims/users/${id}/permissions/${permission}`,
    );
  },
};
