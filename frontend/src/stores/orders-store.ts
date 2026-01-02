import { create } from "zustand";
import { axiosInstance } from "@/lib/utils";

export enum OrderStatus {
  PENDING,
  CONFIRMED,
  PROCESSING,
  SHIPPED,
  DELIVERED,
  CANCELLED,
  REFUNDED,
}

export enum PaymentStatus {
  PENDING,
  COMPLETED,
  FAILED,
  REFUNDED,
}

export interface SKUImage {
  id: string;
  url: string;
  altText?: string;
}

export interface SKU {
  id: string;
  sku: string;
  price: number;
  coverImage: string;
  images: SKUImage[];
}

export interface OrderItem {
  id: string;
  skuId: string;
  productName: string;
  skuCode: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  sku: SKU;
}

export interface Order {
  id: string;
  orderNumber: string;
  createdById?: string;
  confirmedById?: string;
  confirmedBy?: {
    id: string;
    name: string;
    email: string;
  };
  status: string;
  paymentStatus: string;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  language?: string;
  invoiceUrl?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress?: Record<string, string | number>;
  deliveryLat?: number | null;
  deliveryLng?: number | null;
  deliveryPlace?: string | null;
  trackingNumber?: string;
  shippedAt?: string;
  deliveredAt?: string;
  confirmedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

interface UpdateOrderPayload {
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: Record<string, string | number>;
  deliveryLat?: number;
  deliveryLng?: number;
  deliveryPlace?: string;
  notes?: string;
  trackingNumber?: string;
  status?: string;
  paymentStatus?: string;
  language?: string;
  items?: { skuId: string; quantity: number }[];
}

export interface OrdersResponse {
  data: Order[];
  total: number;
  offset?: number;
  limit?: number;
}

interface OrderWithPdf extends Order {
  payment?: {
    id: string;
    method: string;
    status: string;
    amount: number;
    currency: string;
  };
}

interface OrdersStore {
  orders: Order[];
  total: number;
  loading: boolean;
  error: string | null;
  selectedOrders: string[];
  currentPage: number;
  pageSize: number;
  totalPages: number;

  fetchOrders: (params?: Record<string, string | number | boolean>) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  bulkDeleteOrders: (orderIds: string[]) => Promise<void>;
  createOrder: (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'orderNumber'>) => Promise<string>;
  updateOrder: (
    id: string,
    updateData: Partial<UpdateOrderPayload>
  ) => Promise<void>;

  cancelOrder: (orderId: string, reason?: string) => Promise<void>;

  setPage: (page: number) => void;
  setPageSize: (size: number) => void;

  selectOrder: (id: string) => void;
  selectAllOrders: () => void;
  clearSelection: () => void;

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

  fetchOrders: async (params: Record<string, string | number | boolean> = {}) => {
    try {
      set({ loading: true, error: null });
      const { currentPage, pageSize } = get();
      const apiParams = { page: currentPage, limit: pageSize, ...params };
      const res = await axiosInstance.get<OrdersResponse>("/orders", {
        params: apiParams,
      });
      set({
        orders: res.data.data,
        total: res.data.total,
        totalPages: Math.ceil(res.data.total / pageSize),
        loading: false,
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to fetch orders"
        : "Failed to fetch orders";
      set({
        error: errorMessage,
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
    } catch (err: unknown) {
      const errorMessage = err instanceof Error && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to delete order"
        : "Failed to delete order";
      set({
        error: errorMessage,
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
    } catch (err: unknown) {
      const errorMessage = err instanceof Error && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to delete orders"
        : "Failed to delete orders";
      set({
        error: errorMessage,
        loading: false,
      });
    }
  },

  createOrder: async (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'orderNumber'>) => {
    try {
      set({ loading: true, error: null });
      const res = await axiosInstance.post<OrderWithPdf>("/orders", orderData);
      set({ orders: [res.data, ...get().orders], loading: false });

      return res.data.id;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to create order"
        : "Failed to create order";
      set({
        error: errorMessage,
        loading: false,
      });
      throw err;
    }
  },

  updateOrder: async (id: string, updateData: Partial<UpdateOrderPayload>) => {
    try {
      set({ loading: true, error: null });

      // Send PUT request to your API
      const res = await axiosInstance.patch<Order>(`/orders/${id}`, updateData);

      // Update the order locally in the store
      set({
        orders: get().orders.map((order) =>
          order.id === id ? res.data : order
        ),
        loading: false,
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to update order"
        : "Failed to update order";
      set({
        error: errorMessage,
        loading: false,
      });
      throw err;
    }
  },

  cancelOrder: async (orderId: string, reason?: string) => {
    try {
      set({ loading: true, error: null });
      await axiosInstance.post(`/orders/cancel`, { orderId, reason });
      // Update the order status locally in the store
      set({
        orders: get().orders.map((order) =>
          order.id === orderId
            ? { ...order, status: "CANCELLED" }
            : order
        ),
        loading: false,
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to cancel order"
        : "Failed to cancel order";
      set({
        error: errorMessage,
        loading: false,
      });
      throw err;
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
