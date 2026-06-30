import { BaseImsApiService, ApiResponse } from './client';
import { UserProfile, ActiveContext } from '../api';

export interface UserItem {
  _id: string;
  name: string;
  nim?: string;
  email: string;
  phone?: string;
  position?: string;
  role: {
    _id: string;
    name: string;
    slug: string;
  };
  department?: {
    _id: string;
    name: string;
    code?: string;
  };
  cabinetPeriod: {
    _id: string;
    name: string;
    code?: string;
  } | string;
  avatar?: {
    _id: string;
    url: string;
  } | string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PermissionItem {
  _id: string;
  name: string;
  resource: string;
  action: string;
  description?: string;
}

export interface RoleItem {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  permissions: PermissionItem[] | string[];
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CabinetPeriodItem {
  _id: string;
  name: string;
  code?: string;
  status: 'draft' | 'active' | 'archived';
  years: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserPayload {
  name: string;
  nim?: string;
  email: string;
  phone?: string;
  position?: string;
  roleId: string;
  department?: string;
  cabinetPeriod: string;
  isActive: boolean;
  avatar?: string;
}

export class AuthApi extends BaseImsApiService {
  static async getProfile(): Promise<ApiResponse<UserProfile>> {
    return this.request<UserProfile>("/auth/me");
  }

  static async getUsers(query?: { search?: string; role?: string; limit?: number; page?: number }): Promise<ApiResponse<UserItem[]>> {
    const params = new URLSearchParams();
    if (query?.search) params.append('search', query.search);
    if (query?.role) params.append('role', query.role);
    if (query?.limit) params.append('limit', String(query.limit));
    if (query?.page) params.append('page', String(query.page));
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request<UserItem[]>(`/users${qs}`);
  }

  static async createUser(data: UserPayload): Promise<ApiResponse<UserItem>> {
    return this.request<UserItem>("/users", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async updateUser(id: string, data: Partial<UserPayload>): Promise<ApiResponse<UserItem>> {
    return this.request<UserItem>(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  static async deleteUser(id: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.request<{ success: boolean }>(`/users/${id}`, {
      method: "DELETE",
    });
  }

  static async getRoles(): Promise<ApiResponse<RoleItem[]>> {
    return this.request<RoleItem[]>("/roles");
  }

  static async createRole(data: Partial<RoleItem>): Promise<ApiResponse<RoleItem>> {
    return this.request<RoleItem>("/roles", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async updateRole(id: string, data: Partial<RoleItem>): Promise<ApiResponse<RoleItem>> {
    return this.request<RoleItem>(`/roles/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  static async deleteRole(id: string): Promise<ApiResponse<{ deleted: boolean }>> {
    return this.request<{ deleted: boolean }>(`/roles/${id}`, {
      method: "DELETE",
    });
  }

  static async getCabinetPeriods(): Promise<ApiResponse<CabinetPeriodItem[]>> {
    return this.request<CabinetPeriodItem[]>("/cabinet-periods");
  }

  static async switchRole(assignmentId: string): Promise<ApiResponse<{ token: string; activeContext: ActiveContext }>> {
    return this.request<{ token: string; activeContext: ActiveContext }>("/auth/switch-role", {
      method: "POST",
      body: JSON.stringify({ assignmentId }),
    });
  }
}

