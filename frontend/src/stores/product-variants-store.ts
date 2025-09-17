import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { axiosInstance } from "@/lib/utils";

// Types based on backend DTOs
export interface ProductSKUImage {
  id: string;
  url: string;
  altText?: string;
  position: number;
  createdAt: string;
}

export interface ProductSKU {
  id: string;
  sku: string;
  barcode?: string;
  price: number;
  comparePrice?: number;
  costPrice?: number;
  stock: number;
  lowStockAlert: number;
  weight?: number;
  dimensions?: Record<string, any>;
  coverImage?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  images?: ProductSKUImage[];
}

export interface ProductVariant {
  id: string;
  name?: string;
  attributes?: Record<string, any>;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  skus?: ProductSKU[];
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  shortDesc?: string;
  coverImage?: string;
  isActive: boolean;
  isFeatured: boolean;
  metaTitle?: string;
  metaDesc?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  variants?: ProductVariant[];
  categories?: Array<{
    id: string;
    name: string;
    slug: string;
    description?: string;
  }>;
}

export interface CreateProductVariantDto {
  name?: string;
  attributes?: Record<string, any>;
  isActive?: boolean;
  sortOrder?: number;
}

export interface CreateProductSKUDto {
  sku?: string;
  barcode?: string;
  price: number; // required
  comparePrice?: number;
  costPrice?: number;
  stock: number; // ✅ always send number
  lowStockAlert?: number;
  weight?: number;
  dimensions?: Record<string, any>;
  coverImage?: string;
  isActive: boolean; // ✅ always send boolean
}


export interface ProductVariantsState {
  products: Product[];
  loading: boolean;
  error: string | null;

  selectedProduct: Product | null;
  selectedVariant: ProductVariant | null;
  selectedSKU: ProductSKU | null;

  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  searchTerm: string;

  fetchProducts: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    includeVariants?: boolean;
    includeSKUs?: boolean;
  }) => Promise<void>;

  fetchProductById: (id: string) => Promise<void>;
  setSelectedProduct: (product: Product | null) => void;
  setSelectedVariant: (variant: ProductVariant | null) => void;
  setSelectedSKU: (sku: ProductSKU | null) => void;

  createVariant: (
    productId: string,
    data: CreateProductVariantDto
  ) => Promise<ProductVariant>;
  updateVariant: (
    variantId: string,
    data: Partial<CreateProductVariantDto>
  ) => Promise<ProductVariant>;
  deleteVariant: (variantId: string) => Promise<void>;

  createSKU: (
    variantId: string,
    data: CreateProductSKUDto | FormData
  ) => Promise<ProductSKU>;
  updateSKU: (
    skuId: string,
    data: Partial<CreateProductSKUDto> | FormData
  ) => Promise<ProductSKU>;
  deleteSKU: (skuId: string) => Promise<void>;

  setSearchTerm: (term: string) => void;
  setCurrentPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  resetState: () => void;
}

const useProductVariantsStore = create<ProductVariantsState>()(
  devtools(
    (set, get) => ({
      products: [],
      loading: false,
      error: null,
      selectedProduct: null,
      selectedVariant: null,
      selectedSKU: null,
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      itemsPerPage: 10,
      searchTerm: "",

      // ✅ Fetch products with variants & SKUs
      fetchProducts: async (params = {}) => {
        set({ loading: true, error: null });
        try {
          const {
            page = get().currentPage,
            limit = get().itemsPerPage,
            search = get().searchTerm,
            includeVariants = true,
            includeSKUs = true,
          } = params;

          const searchParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            includeVariants: includeVariants.toString(),
            includeSKUs: includeSKUs.toString(),
          });

          if (search.trim()) {
            searchParams.append("search", search.trim());
          }

          const response = await axiosInstance.get(`/products?${searchParams}`);
          const responseData = response.data;

          set({
            products: responseData.data || [],
            totalPages: Math.ceil((responseData.total || 0) / limit),
            totalItems: responseData.total || 0,
            currentPage: page,
            loading: false,
          });
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to fetch products",
            loading: false,
          });
        }
      },

      fetchProductById: async (id: string) => {
        set({ loading: true, error: null });
        try {
          const response = await axiosInstance.get(`/products/${id}`);
          set({ selectedProduct: response.data, loading: false });
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to fetch product",
            loading: false,
          });
        }
      },

      setSelectedProduct: (product) => set({ selectedProduct: product }),
      setSelectedVariant: (variant) => set({ selectedVariant: variant }),
      setSelectedSKU: (sku) => set({ selectedSKU: sku }),

      // ✅ Create Variant
      createVariant: async (productId, data) => {
        try {
          const response = await axiosInstance.post(
            `/products/${productId}/variants`,
            data
          );
          const variant = response.data;

          const state = get();
          const updatedProducts = state.products.map((product) =>
            product.id === productId
              ? { ...product, variants: [...(product.variants || []), variant] }
              : product
          );

          set({ products: updatedProducts });

          if (state.selectedProduct?.id === productId) {
            set({
              selectedProduct: {
                ...state.selectedProduct,
                variants: [...(state.selectedProduct.variants || []), variant],
              },
            });
          }

          return variant;
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to create variant";
          set({ error: message });
          throw error;
        }
      },

      // ✅ Update Variant
      updateVariant: async (variantId, data) => {
        try {
          const response = await axiosInstance.patch(
            `/products/variants/${variantId}`,
            data
          );
          const updatedVariant = response.data;

          const state = get();
          const updatedProducts = state.products.map((product) => ({
            ...product,
            variants: product.variants?.map((variant) =>
              variant.id === variantId ? updatedVariant : variant
            ),
          }));

          set({ products: updatedProducts });

          if (state.selectedProduct) {
            set({
              selectedProduct: {
                ...state.selectedProduct,
                variants: state.selectedProduct.variants?.map((variant) =>
                  variant.id === variantId ? updatedVariant : variant
                ),
              },
            });
          }

          if (state.selectedVariant?.id === variantId) {
            set({ selectedVariant: updatedVariant });
          }

          return updatedVariant;
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to update variant";
          set({ error: message });
          throw error;
        }
      },

      // ✅ Delete Variant
      deleteVariant: async (variantId) => {
        try {
          await axiosInstance.delete(`/products/variants/${variantId}`);

          const state = get();
          const updatedProducts = state.products.map((product) => ({
            ...product,
            variants: product.variants?.filter((v) => v.id !== variantId),
          }));

          set({ products: updatedProducts });

          if (state.selectedProduct) {
            set({
              selectedProduct: {
                ...state.selectedProduct,
                variants: state.selectedProduct.variants?.filter(
                  (v) => v.id !== variantId
                ),
              },
            });
          }

          if (state.selectedVariant?.id === variantId) {
            set({ selectedVariant: null });
          }
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to delete variant";
          set({ error: message });
          throw error;
        }
      },

      createSKU: async (variantId, data) => {
        try {

          console.log("Creating SKU with data:", data);
          
          let payload: any;
          if (data instanceof FormData) {
            payload = data; // form data is sent as-is
          } else {
            // ✅ Ensure numbers and boolean are valid
            payload = {
              ...data,
              price: Number(data.price ?? 0),
              comparePrice:
                data.comparePrice !== undefined
                  ? Number(data.comparePrice)
                  : undefined,
              costPrice:
                data.costPrice !== undefined
                  ? Number(data.costPrice)
                  : undefined,
              stock: Number(data.stock ?? 0),
              lowStockAlert:
                data.lowStockAlert !== undefined
                  ? Number(data.lowStockAlert)
                  : 0,
              weight:
                data.weight !== undefined ? Number(data.weight) : undefined,
              isActive: data.isActive ?? true,
            };
          }

          const response = await axiosInstance.post(
            `/products/variants/${variantId}/skus`,
            payload,
            data instanceof FormData
              ? { headers: { "Content-Type": "multipart/form-data" } }
              : undefined
          );

          const sku: ProductSKU = response.data;
          const state = get();

          const updatedProducts = state.products.map((product) => ({
            ...product,
            variants: product.variants?.map((variant) =>
              variant.id === variantId
                ? { ...variant, skus: [...(variant.skus || []), sku] }
                : variant
            ),
          }));

          set({ products: updatedProducts });

          if (state.selectedProduct) {
            set({
              selectedProduct: {
                ...state.selectedProduct,
                variants: state.selectedProduct.variants?.map((variant) =>
                  variant.id === variantId
                    ? { ...variant, skus: [...(variant.skus || []), sku] }
                    : variant
                ),
              },
            });
          }

          if (state.selectedVariant?.id === variantId) {
            set({
              selectedVariant: {
                ...state.selectedVariant,
                skus: [...(state.selectedVariant.skus || []), sku],
              },
            });
          }

          return sku;
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to create SKU";
          set({ error: message });
          throw error;
        }
      },

      // ✅ Update SKU with image support
      updateSKU: async (skuId, data) => {
        try {
          let response;
          if (data instanceof FormData) {
            response = await axiosInstance.patch(
              `/products/skus/${skuId}`,
              data,
              {
                headers: { "Content-Type": "multipart/form-data" },
              }
            );
          } else {
            response = await axiosInstance.patch(
              `/products/skus/${skuId}`,
              data
            );
          }

          const updatedSKU: ProductSKU = response.data;
          const state = get();

          const updatedProducts = state.products.map((product) => ({
            ...product,
            variants: product.variants?.map((variant) => ({
              ...variant,
              skus: variant.skus?.map((sku) =>
                sku.id === skuId ? updatedSKU : sku
              ),
            })),
          }));

          set({ products: updatedProducts });

          if (state.selectedProduct) {
            set({
              selectedProduct: {
                ...state.selectedProduct,
                variants: state.selectedProduct.variants?.map((variant) => ({
                  ...variant,
                  skus: variant.skus?.map((sku) =>
                    sku.id === skuId ? updatedSKU : sku
                  ),
                })),
              },
            });
          }

          if (state.selectedVariant) {
            set({
              selectedVariant: {
                ...state.selectedVariant,
                skus: state.selectedVariant.skus?.map((sku) =>
                  sku.id === skuId ? updatedSKU : sku
                ),
              },
            });
          }

          if (state.selectedSKU?.id === skuId) {
            set({ selectedSKU: updatedSKU });
          }

          return updatedSKU;
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to update SKU";
          set({ error: message });
          throw error;
        }
      },

      // ✅ Delete SKU
      deleteSKU: async (skuId) => {
        try {
          await axiosInstance.delete(`/products/skus/${skuId}`);

          const state = get();
          const updatedProducts = state.products.map((product) => ({
            ...product,
            variants: product.variants?.map((variant) => ({
              ...variant,
              skus: variant.skus?.filter((sku) => sku.id !== skuId),
            })),
          }));

          set({ products: updatedProducts });

          if (state.selectedProduct) {
            set({
              selectedProduct: {
                ...state.selectedProduct,
                variants: state.selectedProduct.variants?.map((variant) => ({
                  ...variant,
                  skus: variant.skus?.filter((sku) => sku.id !== skuId),
                })),
              },
            });
          }

          if (state.selectedVariant) {
            set({
              selectedVariant: {
                ...state.selectedVariant,
                skus: state.selectedVariant.skus?.filter(
                  (sku) => sku.id !== skuId
                ),
              },
            });
          }

          if (state.selectedSKU?.id === skuId) {
            set({ selectedSKU: null });
          }
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to delete SKU";
          set({ error: message });
          throw error;
        }
      },

      setSearchTerm: (term) => set({ searchTerm: term }),
      setCurrentPage: (page) => set({ currentPage: page }),
      setPageSize: (pageSize) =>
        set({ itemsPerPage: pageSize, currentPage: 1 }),

      resetState: () =>
        set({
          products: [],
          loading: false,
          error: null,
          selectedProduct: null,
          selectedVariant: null,
          selectedSKU: null,
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: 10,
          searchTerm: "",
        }),
    }),
    { name: "product-variants-store" }
  )
);

export default useProductVariantsStore;
