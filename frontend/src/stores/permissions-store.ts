import { create } from "zustand";
import {
  UserRole,
  RolePermissions,
  AvailablePermissionsResponse,
  SetRolePermissionsDto,
} from "@/types/permissions";
import { toast } from "sonner";
import { axiosInstance, getTranslation } from "@/lib/utils";
import { AxiosError } from "axios";

interface PermissionsState {
  rolePermissions: RolePermissions | null;
  availablePermissions: string[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchAllRolePermissions: () => Promise<void>;
  fetchAvailablePermissions: () => Promise<void>;
  updateRolePermissions: (
    role: UserRole,
    permissions: string[]
  ) => Promise<void>;
  addPermission: (role: UserRole, permission: string) => Promise<void>;
  removePermission: (role: UserRole, permission: string) => Promise<void>;
  refreshCache: () => Promise<void>;
}

export const usePermissionsStore = create<PermissionsState>((set, get) => ({
  rolePermissions: null,
  availablePermissions: [],
  loading: false,
  error: null,

  fetchAllRolePermissions: async () => {
    set({ loading: true, error: null });

    try {
      const response = await axiosInstance.get<RolePermissions>("/permissions/roles");
      set({ rolePermissions: response.data, loading: false });
    } catch (error: unknown) {
      const errorMessage = error instanceof AxiosError
        ? error.response?.data?.message || "Failed to fetch role permissions"
        : "Failed to fetch role permissions";
      set({ error: errorMessage, loading: false });
      // Don't show toast for 403 - handled globally by axios interceptor
      if (error instanceof AxiosError && error.response?.status !== 403) {
        toast.error(errorMessage);
      }
    }
  },

  fetchAvailablePermissions: async () => {
    try {
      const response = await axiosInstance.get<AvailablePermissionsResponse>("/permissions/available");
      set({ availablePermissions: response.data.permissions });
    } catch (error: unknown) {
      const errorMessage = error instanceof AxiosError
        ? error.response?.data?.message || "Failed to fetch available permissions"
        : "Failed to fetch available permissions";
      // Don't show toast for 403 - handled globally by axios interceptor
      if (error instanceof AxiosError && error.response?.status !== 403) {
        toast.error(errorMessage);
      }
    }
  },

  updateRolePermissions: async (role: UserRole, permissions: string[]) => {
    set({ loading: true, error: null });

    try {
      await axiosInstance.post(`/permissions/roles/${role}`, {
        permissions,
      } as SetRolePermissionsDto);

      // Refresh the permissions
      await get().fetchAllRolePermissions();
      await get().refreshCache();

      const message = getTranslation('permissions.toast.permissionsUpdated', { role });
      toast.success(message);
      set({ loading: false });
    } catch (error: unknown) {
      const errorMessage = error instanceof AxiosError
        ? error.response?.data?.message || "Failed to update role permissions"
        : "Failed to update role permissions";
      set({ error: errorMessage, loading: false });
      // Don't show toast for 403 - handled globally by axios interceptor
      if (error instanceof AxiosError && error.response?.status !== 403) {
        toast.error(errorMessage);
      }
    }
  },

  addPermission: async (role: UserRole, permission: string) => {
    try {
      await axiosInstance.post("/permissions/add", { role, permission });

      await get().fetchAllRolePermissions();
      await get().refreshCache();

      const message = getTranslation('permissions.toast.permissionAdded', { permission, role });
      toast.success(message);
    } catch (error: unknown) {
      const errorMessage = error instanceof AxiosError
        ? error.response?.data?.message || "Failed to add permission"
        : "Failed to add permission";
      // Don't show toast for 403 - handled globally by axios interceptor
      if (error instanceof AxiosError && error.response?.status !== 403) {
        toast.error(errorMessage);
      }
    }
  },

  removePermission: async (role: UserRole, permission: string) => {
    try {
      await axiosInstance.delete("/permissions/remove", {
        data: { role, permission },
      });

      await get().fetchAllRolePermissions();
      await get().refreshCache();

      const message = getTranslation('permissions.toast.permissionRemoved', { permission, role });
      toast.success(message);
    } catch (error: unknown) {
      const errorMessage = error instanceof AxiosError
        ? error.response?.data?.message || "Failed to remove permission"
        : "Failed to remove permission";
      // Don't show toast for 403 - handled globally by axios interceptor
      if (error instanceof AxiosError && error.response?.status !== 403) {
        toast.error(errorMessage);
      }
    }
  },

  refreshCache: async () => {
    try {
      await axiosInstance.post("/permissions/refresh-cache");
      const message = getTranslation('permissions.toast.cacheRefreshed');
      toast.success(message);
    } catch (error) {
      // Silent fail for cache refresh
      console.error("Failed to refresh cache:", error);
    }
  },
}));
