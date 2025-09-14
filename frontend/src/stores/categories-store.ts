import { create } from "zustand";
import { axiosInstance } from "@/lib/utils";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  info?: Record<string, any>;
  parentId?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  parent?: Category;
  children?: Category[];
  productCount?: number;
}

export interface CreateCategoryPayload {
  name: string;
  slug?: string;
  description?: string;
  info?: Record<string, any>;
  parentId?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateCategoryPayload {
  name?: string;
  description?: string;
  info?: Record<string, any>;
  parentId?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface FilterParams {
  offset?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  parentId?: string;
  includeChildren?: boolean;
  includeProductCount?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CategoriesResponse {
  data: Category[];
  total: number;
  offset: number;
  limit: number;
}

interface CategoriesStore {
  categories: Category[];
  total: number;
  loading: boolean;
  error: string | null;
  selectedCategories: string[];
  
  // Pagination state
  currentPage: number;
  pageSize: number;
  totalPages: number;

  // Actions
  fetchCategories: (params?: FilterParams) => Promise<void>;
  createCategory: (categoryData: CreateCategoryPayload) => Promise<void>;
  updateCategory: (id: string, categoryData: UpdateCategoryPayload) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  bulkDeleteCategories: (categoryIds: string[]) => Promise<void>;
  getCategoryById: (id: string) => Promise<Category | null>;
  getCategoryBySlug: (slug: string) => Promise<Category | null>;
  toggleCategoryStatus: (id: string) => Promise<void>;

  // Pagination actions
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;

  // Selection actions
  selectCategory: (id: string) => void;
  selectAllCategories: () => void;
  clearSelection: () => void;

  // Utility actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useCategoriesStore = create<CategoriesStore>((set, get) => ({
  categories: [],
  total: 0,
  loading: false,
  error: null,
  selectedCategories: [],
  
  // Pagination state
  currentPage: 1,
  pageSize: 13,
  totalPages: 0,

  // Fetch categories with filtering
  fetchCategories: async (params: FilterParams = {}) => {
    try {
      set({ loading: true, error: null });

      const { currentPage, pageSize } = get();
      const offset = Math.max(0, (currentPage - 1) * pageSize);

      // Always send default values to ensure integers
      const finalOffset = Math.max(0, Math.floor(params.offset ?? offset));
      const finalLimit = Math.max(1, Math.floor(params.limit ?? pageSize));
      
      // Use axios params instead of URLSearchParams for better type handling
      const apiParams: any = {
        offset: finalOffset,
        limit: finalLimit,
        includeChildren: params.includeChildren ?? true,
        includeProductCount: params.includeProductCount ?? true,
      };
      
      if (params.search && params.search.trim()) {
        apiParams.search = params.search.trim();
      }
      if (typeof params.isActive === 'boolean') {
        apiParams.isActive = params.isActive;
      }
      if (params.parentId) {
        apiParams.parentId = params.parentId;
      }
      if (params.sortBy) {
        apiParams.sortBy = params.sortBy;
      }
      if (params.sortOrder) {
        apiParams.sortOrder = params.sortOrder;
      }

      const response = await axiosInstance.get<Category[]>('/categories', {
        params: apiParams
      });

      // Since the backend doesn't return paginated data for categories,
      // we'll simulate pagination on the frontend
      const allCategories = response.data;
      const total = allCategories.length;
      const totalPages = Math.ceil(total / pageSize);
      const startIndex = finalOffset;
      const endIndex = Math.min(startIndex + finalLimit, total);
      const paginatedCategories = allCategories.slice(startIndex, endIndex);

      set({
        categories: paginatedCategories,
        total,
        totalPages,
        loading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to fetch categories",
        loading: false,
      });
    }
  },

  // Create a new category
  createCategory: async (categoryData: CreateCategoryPayload) => {
    try {
      set({ loading: true, error: null });

      await axiosInstance.post("/categories", categoryData);

      // Refresh the categories list
      await get().fetchCategories();

      set({ loading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to create category",
        loading: false,
      });
      throw error;
    }
  },

  // Update category
  updateCategory: async (id: string, categoryData: UpdateCategoryPayload) => {
    try {
      set({ loading: true, error: null });

      await axiosInstance.patch(`/categories/${id}`, categoryData);

      // Refresh the categories list
      await get().fetchCategories();

      set({ loading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to update category",
        loading: false,
      });
      throw error;
    }
  },

  // Delete category
  deleteCategory: async (id: string) => {
    try {
      set({ loading: true, error: null });

      await axiosInstance.delete(`/categories/${id}`);

      // Remove category from local state
      const { categories } = get();
      set({
        categories: categories.filter((category) => category.id !== id),
        loading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to delete category",
        loading: false,
      });
      throw error;
    }
  },

  // Bulk delete categories
  bulkDeleteCategories: async (categoryIds: string[]) => {
    try {
      console.log("Bulk deleting categories:", categoryIds);
      set({ loading: true, error: null });

      // Since the backend doesn't have bulk delete, we'll delete one by one
      await Promise.all(
        categoryIds.map(id => axiosInstance.delete(`/categories/${id}`))
      );

      // Remove deleted categories from local state
      const { categories } = get();
      set({
        categories: categories.filter((category) => !categoryIds.includes(category.id)),
        selectedCategories: [],
        loading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to delete categories",
        loading: false,
      });
      throw error;
    }
  },

  // Get category by ID
  getCategoryById: async (id: string): Promise<Category | null> => {
    try {
      const response = await axiosInstance.get<Category>(`/categories/${id}`);
      return response.data;
    } catch (error: any) {
      set({ error: error.response?.data?.message || "Failed to fetch category" });
      return null;
    }
  },

  // Get category by slug
  getCategoryBySlug: async (slug: string): Promise<Category | null> => {
    try {
      const response = await axiosInstance.get<Category>(`/categories/slug/${slug}`);
      return response.data;
    } catch (error: any) {
      set({ error: error.response?.data?.message || "Failed to fetch category" });
      return null;
    }
  },

  // Toggle category status
  toggleCategoryStatus: async (id: string) => {
    try {
      set({ loading: true, error: null });

      // Get current category to toggle its status
      const { categories } = get();
      const category = categories.find(c => c.id === id);
      if (category) {
        await axiosInstance.patch(`/categories/${id}`, { 
          isActive: !category.isActive 
        });
      }

      // Refresh the categories list
      await get().fetchCategories();

      set({ loading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to toggle category status",
        loading: false,
      });
      throw error;
    }
  },

  // Pagination actions
  setPage: (page: number) => {
    const validPage = Math.max(1, Math.floor(page));
    set({ currentPage: validPage });
    get().fetchCategories();
  },

  setPageSize: (pageSize: number) => {
    const validPageSize = Math.max(1, Math.floor(pageSize));
    set({ pageSize: validPageSize, currentPage: 1 });
    get().fetchCategories();
  },

  // Selection management
  selectCategory: (id: string) => {
    const { selectedCategories } = get();
    const isSelected = selectedCategories.includes(id);

    if (isSelected) {
      set({ selectedCategories: selectedCategories.filter((categoryId) => categoryId !== id) });
    } else {
      set({ selectedCategories: [...selectedCategories, id] });
    }
  },

  selectAllCategories: () => {
    const { categories } = get();
    set({ selectedCategories: categories.map((category) => category.id) });
  },

  clearSelection: () => {
    set({ selectedCategories: [] });
  },

  // Utility actions
  setLoading: (loading: boolean) => set({ loading }),
  setError: (error: string | null) => set({ error }),
  clearError: () => set({ error: null }),
}));
