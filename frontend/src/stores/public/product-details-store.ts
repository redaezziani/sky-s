// /stores/public/product-details-store.ts
import { create } from "zustand";

// --- Types ---
export type Sku = {
  id: string;
  sku: string;
  price: number;
  stock: number;
  dimensions: {
    size: string;
    width: number;
    height: number;
    length: number;
  };
  coverImage: string;
  images: string[];
  createdAt: string;
  updatedAt: string;
};

export type Variant = {
  id: string;
  name: string;
  attributes: { [key: string]: string };
  skus: Sku[];
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDesc: string;
  coverImage: string;
  metaTitle: string;
  metaDesc: string;
  categories: { id: string; name: string; slug: string }[];
  variants: Variant[];
  startingPrice: number;
  inStock: boolean;
  totalStock: number;
  avgRating: number;
  createdAt: string;
  updatedAt: string;
};

// Store State
type ProductDetailsState = {
  product: Product | null;
  selectedVariantIndex: number;
  selectedSkuId: string | null;
};

// Store Actions
type ProductDetailsActions = {
  setProduct: (product: Product | null) => void;
  setSelectedVariantIndex: (index: number) => void;
  setSelectedSkuId: (skuId: string | null) => void;
  resetSelections: (product: Product) => void;
};

// Combined Store
export const useProductDetailsStore = create<
  ProductDetailsState & ProductDetailsActions
>((set) => ({
  // --- State ---
  product: null,
  selectedVariantIndex: 0,
  selectedSkuId: null,

  // --- Actions ---
  setProduct: (product) => set({ product }),
  setSelectedVariantIndex: (selectedVariantIndex) =>
    set({ selectedVariantIndex }),
  setSelectedSkuId: (selectedSkuId) => set({ selectedSkuId }),

  resetSelections: (product) => {
    let defaultSkuId: string | null = null;
    let defaultVariantIndex = 0;

    if (product.variants.length > 0) {
      defaultVariantIndex = 0;
      const firstAvailableSku = product.variants[0].skus.find(
        (s) => s.stock > 0
      );
      defaultSkuId = firstAvailableSku ? firstAvailableSku.id : null;
    }

    set({
      product,
      selectedVariantIndex: defaultVariantIndex,
      selectedSkuId: defaultSkuId,
    });
  },
}));