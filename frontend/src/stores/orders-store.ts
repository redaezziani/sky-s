import { create } from "zustand";
import { axiosInstance } from "@/lib/utils";

export interface OrderItem {
  skuId: string;
  productName: string;
  skuCode: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  status: string; // could use enum OrderStatus
  paymentStatus: string; // could use enum PaymentStatus
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  shippingName?: string;
  shippingEmail?: string;
  shippingPhone?: string;
  shippingAddress?: Record<string, any>;
  billingName?: string;
  billingEmail?: string;
  billingAddress?: Record<string, any>;
  notes?: string;
  trackingNumber?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  deliveryLat?: null | number;
  deliveryLng?: null | number;
  deliveryPlace?: null | string;
}

export interface OrdersResponse {
  data: Order[];
  total: number;
  offset: number;
  limit: number;
}

interface OrdersStore {
  orders: Order[];
  total: number;
  loading: boolean;
  error: string | null;
  selectedOrders: string[];

  // Pagination state
  currentPage: number;
  pageSize: number;
  totalPages: number;

  // Actions
  fetchOrders: (params?: Record<string, any>) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  bulkDeleteOrders: (orderIds: string[]) => Promise<void>;

  // Pagination
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;

  // Selection
  selectOrder: (id: string) => void;
  selectAllOrders: () => void;
  clearSelection: () => void;

  // Utils
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useOrdersStore = create<OrdersStore>((set, get) => ({
  orders: [],
  total: 0,
  loading: false,
  error: null,
  selectedOrders: [],
  currentPage: 1,
  pageSize: 10,
  totalPages: 0,

  fetchOrders: async (params: Record<string, any> = {}) => {
    try {
      set({ loading: true, error: null });
      const { currentPage, pageSize } = get();

      const apiParams = {
        page: currentPage,
        limit: pageSize,
        ...params,
      };

      const res = await axiosInstance.get<OrdersResponse>("/orders", {
        params: apiParams,
      });

      set({
        orders: res.data.data,
        total: res.data.total,
        totalPages: Math.ceil(res.data.total / pageSize),
        loading: false,
      });
    } catch (err: any) {
      set({
        error: err.response?.data?.message || "Failed to fetch orders",
        loading: false,
      });
    }
  },

  deleteOrder: async (id: string) => {
    try {
      set({ loading: true });
      await axiosInstance.delete(`/orders/${id}`);
      set({
        orders: get().orders.filter((o) => o.id !== id),
        loading: false,
      });
    } catch (err: any) {
      set({
        error: err.response?.data?.message || "Failed to delete order",
        loading: false,
      });
    }
  },

  bulkDeleteOrders: async (ids: string[]) => {
    try {
      set({ loading: true });
      await Promise.all(ids.map((id) => axiosInstance.delete(`/orders/${id}`)));
      set({
        orders: get().orders.filter((o) => !ids.includes(o.id)),
        selectedOrders: [],
        loading: false,
      });
    } catch (err: any) {
      set({
        error: err.response?.data?.message || "Failed to delete orders",
        loading: false,
      });
    }
  },

  setPage: (page: number) => {
    set({ currentPage: Math.max(1, page) });
    get().fetchOrders();
  },

  setPageSize: (size: number) => {
    set({ pageSize: Math.max(1, size), currentPage: 1 });
    get().fetchOrders();
  },

  selectOrder: (id: string) => {
    const { selectedOrders } = get();
    set({
      selectedOrders: selectedOrders.includes(id)
        ? selectedOrders.filter((o) => o !== id)
        : [...selectedOrders, id],
    });
  },

  selectAllOrders: () => {
    set({ selectedOrders: get().orders.map((o) => o.id) });
  },

  clearSelection: () => set({ selectedOrders: [] }),

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));
