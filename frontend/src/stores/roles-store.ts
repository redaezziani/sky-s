import { create } from "zustand";
import { axiosInstance } from "@/lib/utils";

export interface Role {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    Users: number;
  };
}

export interface CreateRolePayload {
  name: string;
}

export interface UpdateRolePayload {
  name?: string;
}

export interface FilterParams {
  offset?: number;
  limit?: number;
  search?: string;
  roleId?: number;
}

export interface RolesResponse {
  data: Role[];
  total: number;
}

interface RolesStore {
  roles: Role[];
  total: number;
  loading: boolean;
  error: string | null;
  selectedRoles: number[];
  
  // Pagination state
  currentPage: number;
  pageSize: number;
  totalPages: number;
  
  // Search state
  searchQuery: string;

  // Actions
  fetchRoles: (params?: FilterParams) => Promise<void>;
  createRole: (roleData: CreateRolePayload) => Promise<void>;
  updateRole: (id: number, roleData: UpdateRolePayload) => Promise<void>;
  deleteRole: (id: number) => Promise<void>;
  bulkDeleteRoles: (roleIds: number[]) => Promise<void>;
  getRoleById: (id: number) => Promise<Role | null>;

  // Pagination actions
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  
  // Search actions
  setSearch: (query: string) => void;

  // Selection actions
  selectRole: (id: number) => void;
  selectAllRoles: () => void;
  clearSelection: () => void;

  // Utility actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useRolesStore = create<RolesStore>((set, get) => ({
  roles: [],
  total: 0,
  loading: false,
  error: null,
  selectedRoles: [],
  
  // Pagination state
  currentPage: 1,
  pageSize: 25,
  totalPages: 0,
  
  // Search state
  searchQuery: "",

  // Fetch roles with filtering
  fetchRoles: async (params: FilterParams = {}) => {
    try {
      set({ loading: true, error: null });

      const { currentPage, pageSize, searchQuery } = get();
      const offset = Math.max(0, (currentPage - 1) * pageSize);

      // Always send default values to ensure integers
      const finalOffset = Math.max(0, Math.floor(params.offset ?? offset));
      const finalLimit = Math.max(1, Math.floor(params.limit ?? pageSize));
      
      // Use axios params instead of URLSearchParams for better type handling
      const apiParams: { offset: number; limit: number; search?: string; roleId?: number } = {
        offset: finalOffset,
        limit: finalLimit,
      };
      
      // Use search from params or store state
      const searchTerm = params.search ?? searchQuery;
      if (searchTerm && searchTerm.trim()) {
        apiParams.search = searchTerm.trim();
      }
      if (params.roleId && params.roleId > 0) {
        apiParams.roleId = Math.floor(params.roleId);
      }

      const response = await axiosInstance.get<RolesResponse>('/roles/admin/list/all', {
        params: apiParams
      });

      const totalPages = Math.ceil(response.data.total / pageSize);

      set({
        roles: response.data.data,
        total: response.data.total,
        totalPages,
        loading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to fetch roles",
        loading: false,
      });
    }
  },

  // Create a new role (admin only)
  createRole: async (roleData: CreateRolePayload) => {
    try {
      set({ loading: true, error: null });

      await axiosInstance.post("/roles/admin/create", roleData);

      // Refresh the roles list
      await get().fetchRoles();

      set({ loading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to create role",
        loading: false,
      });
      throw error;
    }
  },

  // Update role (admin only)
  updateRole: async (id: number, roleData: UpdateRolePayload) => {
    try {
      set({ loading: true, error: null });

      await axiosInstance.put(`/roles/admin/${id}`, roleData);

      // Refresh the roles list
      await get().fetchRoles();

      set({ loading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to update role",
        loading: false,
      });
      throw error;
    }
  },

  // Delete role (admin only)
  deleteRole: async (id: number) => {
    try {
      set({ loading: true, error: null });

      await axiosInstance.delete(`/roles/admin/${id}`);

      // Remove role from local state
      const { roles } = get();
      set({
        roles: roles.filter((role) => role.id !== id),
        loading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to delete role",
        loading: false,
      });
      throw error;
    }
  },

  // Bulk delete roles (admin only)
  bulkDeleteRoles: async (roleIds: number[]) => {
    try {
      set({ loading: true, error: null });

      const response = await axiosInstance.delete("/roles/admin/bulk", {
        data: { roleIds },
      });

      // Remove deleted roles from local state
      const { roles } = get();
      set({
        roles: roles.filter((role) => !roleIds.includes(role.id)),
        selectedRoles: [],
        loading: false,
      });

      return response.data;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to delete roles",
        loading: false,
      });
      throw error;
    }
  },

  // Get role by ID (admin only)
  getRoleById: async (id: number): Promise<Role | null> => {
    try {
      const response = await axiosInstance.get<Role>(`/roles/admin/${id}`);
      return response.data;
    } catch (error: any) {
      set({ error: error.response?.data?.message || "Failed to fetch role" });
      return null;
    }
  },

  // Pagination actions
  setPage: (page: number) => {
    const validPage = Math.max(1, Math.floor(page));
    set({ currentPage: validPage });
    get().fetchRoles();
  },

  setPageSize: (pageSize: number) => {
    const validPageSize = Math.max(1, Math.floor(pageSize));
    set({ pageSize: validPageSize, currentPage: 1 });
    get().fetchRoles();
  },

  // Search actions
  setSearch: (query: string) => {
    set({ searchQuery: query, currentPage: 1 });
    // Fetch will be triggered by useEffect in component due to debouncing
  },

  // Selection management
  selectRole: (id: number) => {
    const { selectedRoles } = get();
    const isSelected = selectedRoles.includes(id);

    if (isSelected) {
      set({ selectedRoles: selectedRoles.filter((roleId) => roleId !== id) });
    } else {
      set({ selectedRoles: [...selectedRoles, id] });
    }
  },

  selectAllRoles: () => {
    const { roles } = get();
    set({ selectedRoles: roles.map((role) => role.id) });
  },

  clearSelection: () => {
    set({ selectedRoles: [] });
  },

  // Utility actions
  setLoading: (loading: boolean) => set({ loading }),
  setError: (error: string | null) => set({ error }),
  clearError: () => set({ error: null }),
}));
