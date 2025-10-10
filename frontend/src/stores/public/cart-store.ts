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

  addItem: (item: CartItem) => Promise<void>;
  updateQuantity: (skuId: string, quantity: number) => Promise<void>;
  removeItem: (skuId: string) => Promise<void>;
  clearCart: () => Promise<void>;

  totalItems: () => number;
  subtotal: () => number;

  setUser: (userId: string, authResponse?: any) => Promise<void>;
  syncFromDB: () => Promise<void>;
  syncToDB: () => Promise<void>;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      userId: undefined,

      // Add or increment
      addItem: async (item) => {
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
        });

        // Sync to server if logged in
        const { userId } = get();
        if (userId) {
          try {
            await fetch(`/cart/add`, {
              method: "POST",
              headers: { 
                "Content-Type": "application/json",
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
              },
              body: JSON.stringify({ skuId: item.skuId, quantity: item.quantity }),
            });
          } catch (error) {
            console.error('Error syncing add to server:', error);
          }
        }
      },

      // Update qty
      updateQuantity: async (skuId, quantity) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.skuId === skuId ? { ...i, quantity } : i
          ),
        }));

        // Sync to server if logged in
        const { userId } = get();
        if (userId) {
          try {
            await fetch(`/cart/update`, {
              method: "PUT",
              headers: { 
                "Content-Type": "application/json",
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
              },
              body: JSON.stringify({ skuId, quantity }),
            });
          } catch (error) {
            console.error('Error syncing update to server:', error);
          }
        }
      },

      // Remove
      removeItem: async (skuId) => {
        set((state) => ({
          items: state.items.filter((i) => i.skuId !== skuId),
        }));

        // Sync to server if logged in
        const { userId } = get();
        if (userId) {
          try {
            await fetch(`/cart/remove/${skuId}`, {
              method: "DELETE",
              headers: { 
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
              },
            });
          } catch (error) {
            console.error('Error syncing remove to server:', error);
          }
        }
      },

      clearCart: async () => {
        set({ items: [] });

        // Sync to server if logged in
        const { userId } = get();
        if (userId) {
          try {
            await fetch(`/cart/clear`, {
              method: "DELETE",
              headers: { 
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
              },
            });
          } catch (error) {
            console.error('Error syncing clear to server:', error);
          }
        }
      },

      // Totals
      totalItems: () => get().items.reduce((acc, i) => acc + i.quantity, 0),
      subtotal: () =>
        get().items.reduce((acc, i) => acc + i.price * i.quantity, 0),

      // 🔹 Sync: set logged user (called after login)
      setUser: async (userId: string, authResponse?: any) => {
        set({ userId: userId || undefined });
        
        // If clearing user (logout)
        if (!userId) {
          return;
        }
        
        // If we have cart data from login response, use it
        if (authResponse?.cart?.items) {
          set({ items: authResponse.cart.items });
        } else {
          // Otherwise sync normally
          await get().syncToDB(); // push guest cart
          await get().syncFromDB(); // refresh from server
        }
      },

      // 🔹 Sync: pull user cart from DB
      syncFromDB: async () => {
        const { userId } = get();
        if (!userId) return;

        try {
          const response = await fetch(`/cart`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
          });
          if (!response.ok) return;
          const data: CartItem[] = await response.json();
          set({ items: data });
        } catch (error) {
          console.error('Error syncing cart from DB:', error);
        }
      },

      // 🔹 Sync: push local cart to DB
      syncToDB: async () => {
        const { userId, items } = get();
        if (!userId || items.length === 0) return;

        try {
          await fetch(`/cart/sync`, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify({ userId, items }),
          });
        } catch (error) {
          console.error('Error syncing cart to DB:', error);
        }
      },
    }),
    {
      name: "cart-storage", // localStorage (guest)
    }
  )
);
