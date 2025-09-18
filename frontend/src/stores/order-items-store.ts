import { create } from "zustand";
import { axiosInstance } from "@/lib/utils";

// Types based on your backend OrderItemResponseDto
export interface SKU {
  id: string;
  sku: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  orderNumber?: string;
  skuId: string;
  skuCode: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  sku?: SKU;
}

export interface OrderItemsResponse {
  data: OrderItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface OrderItemsStore {
  items: OrderItem[];
  loading: boolean;
  error: string | null;
  selectedItems: string[];
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;

  fetchItems: (orderId?: string) => Promise<void>;
  createItem: (data: Partial<OrderItem>) => Promise<OrderItem>;
  updateItem: (id: string, data: Partial<OrderItem>) => Promise<OrderItem>;
  deleteItem: (id: string) => Promise<void>;
  bulkDeleteItems: (ids: string[]) => Promise<void>;

  selectItem: (id: string) => void;
  selectAllItems: () => void;
  clearSelection: () => void;

  setPage: (page: number) => void;
  setPageSize: (size: number) => void;

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useOrderItemsStore = create<OrderItemsStore>((set, get) => ({
  items: [],
  loading: false,
  error: null,
  selectedItems: [],
  currentPage: 1,
  pageSize: 10,
  totalItems: 0,
  totalPages: 0,

  fetchItems: async (orderId) => {
    try {
      set({ loading: true, error: null });
      const { currentPage, pageSize } = get();
      const params: Record<string, any> = {
        page: currentPage,
        limit: pageSize,
      };
      if (orderId) params.orderId = orderId;

      const res = await axiosInstance.get<OrderItemsResponse>("/order-items", {
        params,
      });
      set({
        items: res.data.data,
        totalItems: res.data.total,
        totalPages: res.data.totalPages,
        loading: false,
      });
    } catch (err: any) {
      set({
        error: err.response?.data?.message || "Failed to fetch order items",
        loading: false,
      });
    }
  },

  createItem: async (data) => {
    try {
      set({ loading: true, error: null });
      const res = await axiosInstance.post<OrderItem>("/order-items", data);
      set({ items: [res.data, ...get().items], loading: false });
      return res.data;
    } catch (err: any) {
      set({
        error: err.response?.data?.message || "Failed to create item",
        loading: false,
      });
      throw err;
    }
  },

  updateItem: async (id, data) => {
    try {
      set({ loading: true, error: null });
      const res = await axiosInstance.patch<OrderItem>(
        `/order-items/${id}`,
        data
      );
      set({
        items: get().items.map((item) => (item.id === id ? res.data : item)),
        loading: false,
      });
      return res.data;
    } catch (err: any) {
      set({
        error: err.response?.data?.message || "Failed to update item",
        loading: false,
      });
      throw err;
    }
  },

  deleteItem: async (id) => {
    try {
      set({ loading: true });
      await axiosInstance.delete(`/order-items/${id}`);
      set({
        items: get().items.filter((item) => item.id !== id),
        loading: false,
      });
    } catch (err: any) {
      set({
        error: err.response?.data?.message || "Failed to delete item",
        loading: false,
      });
      throw err;
    }
  },

  bulkDeleteItems: async (ids) => {
    try {
      set({ loading: true });
      await Promise.all(
        ids.map((id) => axiosInstance.delete(`/order-items/${id}`))
      );
      set({
        items: get().items.filter((item) => !ids.includes(item.id)),
        selectedItems: [],
        loading: false,
      });
    } catch (err: any) {
      set({
        error: err.response?.data?.message || "Failed to delete items",
        loading: false,
      });
      throw err;
    }
  },

  selectItem: (id) => {
    const { selectedItems } = get();
    set({
      selectedItems: selectedItems.includes(id)
        ? selectedItems.filter((i) => i !== id)
        : [...selectedItems, id],
    });
  },

  selectAllItems: () => {
    set({ selectedItems: get().items.map((i) => i.id) });
  },

  clearSelection: () => set({ selectedItems: [] }),

  setPage: (page) => {
    set({ currentPage: page });
    get().fetchItems();
  },

  setPageSize: (size) => {
    set({ pageSize: size, currentPage: 1 });
    get().fetchItems();
  },

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));
