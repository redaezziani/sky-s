import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { axiosInstance } from '@/lib/utils';

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
  sku: string;
  barcode?: string;
  price: number;
  comparePrice?: number;
  costPrice?: number;
  stock?: number;
  lowStockAlert?: number;
  weight?: number;
  dimensions?: Record<string, any>;
  coverImage?: string;
  isActive?: boolean;
}

export interface ProductVariantsState {
  // Products with variants
  products: Product[];
  loading: boolean;
  error: string | null;

  // Current product and variant selection
  selectedProduct: Product | null;
  selectedVariant: ProductVariant | null;
  selectedSKU: ProductSKU | null;

  // Pagination and filtering
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  searchTerm: string;

  // Actions
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

  // Variant management
  createVariant: (productId: string, data: CreateProductVariantDto) => Promise<ProductVariant>;
  updateVariant: (variantId: string, data: Partial<CreateProductVariantDto>) => Promise<ProductVariant>;
  deleteVariant: (variantId: string) => Promise<void>;

  // SKU management
  createSKU: (variantId: string, data: CreateProductSKUDto) => Promise<ProductSKU>;
  updateSKU: (skuId: string, data: Partial<CreateProductSKUDto>) => Promise<ProductSKU>;
  deleteSKU: (skuId: string) => Promise<void>;

  // Utilities
  setSearchTerm: (term: string) => void;
  setCurrentPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  resetState: () => void;
}

const useProductVariantsStore = create<ProductVariantsState>()(
  devtools(
    (set, get) => ({
      // Initial state
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
      searchTerm: '',

      // Fetch products with variants
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
            searchParams.append('search', search.trim());
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
            error: error instanceof Error ? error.message : 'Failed to fetch products',
            loading: false,
          });
        }
      },

      // Fetch a single product by ID
      fetchProductById: async (id: string) => {
        set({ loading: true, error: null });
        try {
          const response = await axiosInstance.get(`/products/${id}`);
          const product = response.data;
          set({ selectedProduct: product, loading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch product',
            loading: false,
          });
        }
      },

      // Selection setters
      setSelectedProduct: (product) => set({ selectedProduct: product }),
      setSelectedVariant: (variant) => set({ selectedVariant: variant }),
      setSelectedSKU: (sku) => set({ selectedSKU: sku }),

      // Create variant
      createVariant: async (productId: string, data: CreateProductVariantDto) => {
        try {
          const response = await axiosInstance.post(`/products/${productId}/variants`, data);
          const variant = response.data;

          // Update products list and selected product
          const state = get();
          const updatedProducts = state.products.map(product => {
            if (product.id === productId) {
              return {
                ...product,
                variants: [...(product.variants || []), variant],
              };
            }
            return product;
          });

          set({ products: updatedProducts });

          // Update selected product if it matches
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
          const message = error instanceof Error ? error.message : 'Failed to create variant';
          set({ error: message });
          throw error;
        }
      },

      // Update variant
      updateVariant: async (variantId: string, data: Partial<CreateProductVariantDto>) => {
        try {
          const response = await axiosInstance.patch(`/products/variants/${variantId}`, data);
          const updatedVariant = response.data;

          // Update products list and selected entities
          const state = get();
          const updatedProducts = state.products.map(product => ({
            ...product,
            variants: product.variants?.map(variant =>
              variant.id === variantId ? updatedVariant : variant
            ),
          }));

          set({ products: updatedProducts });

          // Update selected product and variant
          if (state.selectedProduct) {
            const updatedSelectedProduct = {
              ...state.selectedProduct,
              variants: state.selectedProduct.variants?.map(variant =>
                variant.id === variantId ? updatedVariant : variant
              ),
            };
            set({ selectedProduct: updatedSelectedProduct });
          }

          if (state.selectedVariant?.id === variantId) {
            set({ selectedVariant: updatedVariant });
          }

          return updatedVariant;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to update variant';
          set({ error: message });
          throw error;
        }
      },

      // Delete variant
      deleteVariant: async (variantId: string) => {
        try {
          await axiosInstance.delete(`/products/variants/${variantId}`);

          // Update products list and clear selected variant if it matches
          const state = get();
          const updatedProducts = state.products.map(product => ({
            ...product,
            variants: product.variants?.filter(variant => variant.id !== variantId),
          }));

          set({ products: updatedProducts });

          // Update selected product
          if (state.selectedProduct) {
            const updatedSelectedProduct = {
              ...state.selectedProduct,
              variants: state.selectedProduct.variants?.filter(variant => variant.id !== variantId),
            };
            set({ selectedProduct: updatedSelectedProduct });
          }

          // Clear selected variant if it matches
          if (state.selectedVariant?.id === variantId) {
            set({ selectedVariant: null });
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to delete variant';
          set({ error: message });
          throw error;
        }
      },

      // Create SKU
      createSKU: async (variantId: string, data: CreateProductSKUDto) => {
        try {
          const response = await axiosInstance.post(`/products/variants/${variantId}/skus`, data);
          const sku = response.data;

          // Update products list and selected entities
          const state = get();
          const updatedProducts = state.products.map(product => ({
            ...product,
            variants: product.variants?.map(variant => {
              if (variant.id === variantId) {
                return {
                  ...variant,
                  skus: [...(variant.skus || []), sku],
                };
              }
              return variant;
            }),
          }));

          set({ products: updatedProducts });

          // Update selected product and variant
          if (state.selectedProduct) {
            const updatedSelectedProduct = {
              ...state.selectedProduct,
              variants: state.selectedProduct.variants?.map(variant => {
                if (variant.id === variantId) {
                  return {
                    ...variant,
                    skus: [...(variant.skus || []), sku],
                  };
                }
                return variant;
              }),
            };
            set({ selectedProduct: updatedSelectedProduct });
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
          const message = error instanceof Error ? error.message : 'Failed to create SKU';
          set({ error: message });
          throw error;
        }
      },

      // Update SKU
      updateSKU: async (skuId: string, data: Partial<CreateProductSKUDto>) => {
        try {
          const response = await axiosInstance.patch(`/products/skus/${skuId}`, data);
          const updatedSKU = response.data;

          // Update products list and selected entities
          const state = get();
          const updatedProducts = state.products.map(product => ({
            ...product,
            variants: product.variants?.map(variant => ({
              ...variant,
              skus: variant.skus?.map(sku =>
                sku.id === skuId ? updatedSKU : sku
              ),
            })),
          }));

          set({ products: updatedProducts });

          // Update selected product, variant, and SKU
          if (state.selectedProduct) {
            const updatedSelectedProduct = {
              ...state.selectedProduct,
              variants: state.selectedProduct.variants?.map(variant => ({
                ...variant,
                skus: variant.skus?.map(sku =>
                  sku.id === skuId ? updatedSKU : sku
                ),
              })),
            };
            set({ selectedProduct: updatedSelectedProduct });
          }

          if (state.selectedVariant) {
            const updatedSelectedVariant = {
              ...state.selectedVariant,
              skus: state.selectedVariant.skus?.map(sku =>
                sku.id === skuId ? updatedSKU : sku
              ),
            };
            set({ selectedVariant: updatedSelectedVariant });
          }

          if (state.selectedSKU?.id === skuId) {
            set({ selectedSKU: updatedSKU });
          }

          return updatedSKU;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to update SKU';
          set({ error: message });
          throw error;
        }
      },

      // Delete SKU
      deleteSKU: async (skuId: string) => {
        try {
          await axiosInstance.delete(`/products/skus/${skuId}`);

          // Update products list and clear selected SKU if it matches
          const state = get();
          const updatedProducts = state.products.map(product => ({
            ...product,
            variants: product.variants?.map(variant => ({
              ...variant,
              skus: variant.skus?.filter(sku => sku.id !== skuId),
            })),
          }));

          set({ products: updatedProducts });

          // Update selected product and variant
          if (state.selectedProduct) {
            const updatedSelectedProduct = {
              ...state.selectedProduct,
              variants: state.selectedProduct.variants?.map(variant => ({
                ...variant,
                skus: variant.skus?.filter(sku => sku.id !== skuId),
              })),
            };
            set({ selectedProduct: updatedSelectedProduct });
          }

          if (state.selectedVariant) {
            const updatedSelectedVariant = {
              ...state.selectedVariant,
              skus: state.selectedVariant.skus?.filter(sku => sku.id !== skuId),
            };
            set({ selectedVariant: updatedSelectedVariant });
          }

          // Clear selected SKU if it matches
          if (state.selectedSKU?.id === skuId) {
            set({ selectedSKU: null });
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to delete SKU';
          set({ error: message });
          throw error;
        }
      },

      // Utility functions
      setSearchTerm: (term: string) => set({ searchTerm: term }),
      setCurrentPage: (page: number) => set({ currentPage: page }),
      setPageSize: (pageSize: number) => set({ itemsPerPage: pageSize, currentPage: 1 }),

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
          searchTerm: '',
        }),
    }),
    {
      name: 'product-variants-store',
    }
  )
);

export default useProductVariantsStore;
