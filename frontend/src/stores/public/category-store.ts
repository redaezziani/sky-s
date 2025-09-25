import { axiosInstance } from "@/lib/utils";
import { create } from "zustand";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
}

interface CategoryState {
  categories: Category[];
  loading: boolean;
  error: string | null;
  fetchCategories: () => Promise<void>;
}

export const useCategoryStore = create<CategoryState>((set) => ({
  categories: [],
  loading: false,
  error: null,

  fetchCategories: async () => {
    set({ loading: true, error: null });
    try {
      const res = await axiosInstance.get<Category[]>("/public/categories");
      set({ categories: res.data, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },
}));
