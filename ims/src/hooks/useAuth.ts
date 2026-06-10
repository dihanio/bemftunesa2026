import { create } from "zustand";
import { persist } from "zustand/middleware";
import { listPermissionsForRoles } from "@bemft/permissions";
import apiClient from "@bemft/api-client";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  roles?: string[];
  permissions?: string[];
  rolePermissions?: Record<string, string[]>;
  department?: string;
  departmentId?: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  activeRole: string | null;
  _hasHydrated: boolean;
  login: (user: User, token: string, refreshToken?: string) => void;
  logout: () => void;
  setActiveRole: (role: string) => void;
  hasPermission: (permission: string) => boolean;
  setPermissions: (permissions: string[]) => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      activeRole: null,
      _hasHydrated: false,
      login: (user, token, refreshToken) => {
        const roles = user.roles?.length
          ? user.roles
          : [user.role].filter(Boolean);
        const activeRole = user.role || roles[0] || null;

        // Use permissions returned by backend, default to rolePermissions[activeRole]
        const permissions =
          (activeRole && user.rolePermissions?.[activeRole]) ||
          user.permissions ||
          [];

        set({
          user: {
            ...user,
            roles,
            permissions,
          },
          token,
          refreshToken: refreshToken || null,
          activeRole,
          isAuthenticated: true,
        });
      },
      logout: () => {
        const state = get();
        // Fire revokation request to backend asynchronously (fire-and-forget)
        if (state.refreshToken) {
          apiClient
            .post("/auth/logout", { refreshToken: state.refreshToken })
            .catch(() => {});
        }
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          activeRole: null,
        });
      },
      setActiveRole: (role) => {
        const state = get();
        if (!state.user) return;

        const permissions = state.user.rolePermissions?.[role] || [];
        set({
          activeRole: role,
          user: {
            ...state.user,
            permissions,
          },
        });
      },
      hasPermission: (permission) => {
        const state = get();
        const role = state.activeRole || state.user?.role;
        const isSystemAdmin =
          role === "Admin Sistem" ||
          role === "System Administrator" ||
          role === "Super Admin";
        if (isSystemAdmin) return true;
        return state.user?.permissions?.includes(permission) ?? false;
      },
      setPermissions: (permissions) =>
        set((state) => ({
          user: state.user ? { ...state.user, permissions } : state.user,
        })),
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: "ims-auth-storage",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
