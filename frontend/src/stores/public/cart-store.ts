// store/cartStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";


export interface CartItem {
  id?: string; 
  skuId: string;
  quantity: number;
  productId: string;
  productName: string;
  shortDesc?: string;
  coverImage?: string;
  price: number;
  comparePrice?: number;
}

interface CartState {
  items: CartItem[];
  userId?: string; 

  addItem: (item: CartItem) => void;
  updateQuantity: (skuId: string, quantity: number) => void;
  removeItem: (skuId: string) => void;
  clearCart: () => void;

  totalItems: () => number;
  subtotal: () => number;

  setUser: (userId: string) => Promise<void>;
  syncFromDB: () => Promise<void>;
  syncToDB: () => Promise<void>;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      userId: undefined,

      // Add or increment
      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.skuId === item.skuId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.skuId === item.skuId
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, item] };
        }),

      // Update qty
      updateQuantity: (skuId, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.skuId === skuId ? { ...i, quantity } : i
          ),
        })),

      // Remove
      removeItem: (skuId) =>
        set((state) => ({
          items: state.items.filter((i) => i.skuId !== skuId),
        })),

      clearCart: () => set({ items: [] }),

      // Totals
      totalItems: () => get().items.reduce((acc, i) => acc + i.quantity, 0),
      subtotal: () =>
        get().items.reduce((acc, i) => acc + i.price * i.quantity, 0),

      // 🔹 Sync: set logged user
      setUser: async (userId: string) => {
        set({ userId });
        await get().syncToDB(); // push guest cart
        await get().syncFromDB(); // refresh from server
      },

      // 🔹 Sync: pull user cart from DB
      syncFromDB: async () => {
        const { userId } = get();
        if (!userId) return;

        const res = await fetch(`/api/cart?userId=${userId}`);
        if (!res.ok) return;
        const data: CartItem[] = await res.json();

        set({ items: data });
      },

      // 🔹 Sync: push local cart to DB
      syncToDB: async () => {
        const { userId, items } = get();
        if (!userId || items.length === 0) return;

        await fetch(`/api/cart/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, items }),
        });
      },
    }),
    {
      name: "cart-storage", // localStorage (guest)
    }
  )
);
