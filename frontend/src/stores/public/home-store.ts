"use client";

import { create } from "zustand";
import { axiosInstance } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  shortDesc: string;
  coverImage: string;
  isFeatured: boolean;
  startingPrice: number;
  inStock: boolean;
  categories: Category[];
  createdAt: string;
}

interface ProductsResponse {
  data: Product[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

interface HomeStore {
  products: Product[];
  bestProducts: Product[];
  relatedProducts: Product[];
  loading: boolean;
  error: string | null;
  fetchLatestProducts: (page?: number, limit?: number) => Promise<void>;
  fetchBestProducts: (page?: number, limit?: number) => Promise<void>;
  fetchRelatedProducts: (identifier: string, limit?: number) => Promise<void>;
}

export const useHomeStore = create<HomeStore>((set) => ({
  products: [],
  bestProducts: [],
  relatedProducts: [],
  loading: false,
  error: null,

  fetchLatestProducts: async (page = 1, limit = 15) => {
    try {
      set({ loading: true, error: null });

      const res = await axiosInstance.get(
        `/public/products/latest?page=${page}&limit=${limit}&inStock=true`
      );
      const data: ProductsResponse = res.data;

      set({ products: data.data });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Something went wrong",
      });
    } finally {
      set({ loading: false });
    }
  },

  fetchBestProducts: async (page = 1, limit = 15) => {
    try {
      set({ loading: true, error: null });

      const res = await axiosInstance.get(
        `/public/products/best?page=${page}&limit=${limit}&inStock=true`
      );
      const data: ProductsResponse = res.data;

      set({ bestProducts: data.data });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Something went wrong",
      });
    } finally {
      set({ loading: false });
    }
  },

  fetchRelatedProducts: async (identifier: string, limit = 6) => {
    try {
      set({ loading: true, error: null });

      const res = await axiosInstance.get(
        `/public/products/${identifier}/related?limit=${limit}`
      );
      const data: ProductsResponse = res.data;

      set({ relatedProducts: data.data });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Something went wrong",
      });
    } finally {
      set({ loading: false });
    }
  },
}));
