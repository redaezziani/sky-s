import { create } from "zustand";
import { axiosInstance } from "@/lib/utils";

export interface ProductSKU {
  id: string;
  sku: string;
  barcode?: string;
  price: number;
  stock: number;
  lowStockAlert: number;
  weight?: number;
  dimensions?: Record<string, number>;
  coverImage?: string;
  isActive: boolean;
  attributes?: Record<string, string | number | boolean>;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  variantType: string;
  variantValue: string;
  additionalPrice: number;
  isActive: boolean;
  sortOrder: number;
  productId: string;
  skus: ProductSKU[];
  createdAt: string;
  updatedAt: string;
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
  categories?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  variants?: ProductVariant[];
}

export interface CreateProductPayload {
  name: string;
  slug?: string;
  description?: string;
  shortDesc?: string;
  coverImage?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  metaTitle?: string;
  metaDesc?: string;
  sortOrder?: number;
  categoryIds?: string[];
  imageFolder?: string;
}

export interface UpdateProductPayload {
  name?: string;
  description?: string;
  shortDesc?: string;
  coverImage?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  metaTitle?: string;
  metaDesc?: string;
  sortOrder?: number;
  categoryIds?: string[];
}

export interface FilterParams {
  offset?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  includeCategories?: boolean;
  includeVariants?: boolean;
  includeImages?: boolean;
}

export interface ProductsResponse {
  data: Product[];
  total: number;
  offset: number;
  limit: number;
}

interface ProductsStore {
  products: Product[];
  total: number;
  loading: boolean;
  error: string | null;
  selectedProducts: string[];
  
  // Pagination state
  currentPage: number;
  pageSize: number;
  totalPages: number;

  // Actions
  fetchProducts: (params?: FilterParams) => Promise<void>;
  createProduct: (productData: CreateProductPayload, coverImage?: File) => Promise<void>;
  updateProduct: (id: string, productData: UpdateProductPayload, coverImage?: File) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  bulkDeleteProducts: (productIds: string[]) => Promise<void>;
  getProductById: (id: string) => Promise<Product | null>;
  getProductBySlug: (slug: string) => Promise<Product | null>;
  toggleProductStatus: (id: string) => Promise<void>;
  toggleProductFeatured: (id: string) => Promise<void>;

  // Pagination actions
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;

  // Selection actions
  selectProduct: (id: string) => void;
  selectAllProducts: () => void;
  clearSelection: () => void;

  // Utility actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useProductsStore = create<ProductsStore>((set, get) => ({
  products: [],
  total: 0,
  loading: false,
  error: null,
  selectedProducts: [],
  
  // Pagination state
  currentPage: 1,
  pageSize: 13,
  totalPages: 0,

  // Fetch products with filtering
  fetchProducts: async (params: FilterParams = {}) => {
    try {
      set({ loading: true, error: null });

      const { currentPage, pageSize } = get();
      
      // Use axios params for better type handling - backend uses page/limit not offset/limit
      const apiParams: Record<string, string | number | boolean | undefined> = {
        page: currentPage,
        limit: pageSize,
        includeCategories: params.includeCategories ?? true,
        includeVariants: params.includeVariants ?? true,
        includeImages: params.includeImages ?? false,
        includeSKUs: params.includeVariants ?? true,
      };
      
      if (params.search && params.search.trim()) {
        apiParams.search = params.search.trim();
      }
      if (params.categoryId) {
        apiParams.categoryId = params.categoryId;
      }
      if (typeof params.isActive === 'boolean') {
        apiParams.isActive = params.isActive;
      }
      if (typeof params.isFeatured === 'boolean') {
        apiParams.isFeatured = params.isFeatured;
      }
      if (typeof params.inStock === 'boolean') {
        apiParams.inStock = params.inStock;
      }
      if (params.minPrice !== undefined) {
        apiParams.minPrice = params.minPrice;
      }
      if (params.maxPrice !== undefined) {
        apiParams.maxPrice = params.maxPrice;
      }
      if (params.sortBy) {
        apiParams.sortBy = params.sortBy;
      }
      if (params.sortOrder) {
        apiParams.sortOrder = params.sortOrder;
      }

      const response = await axiosInstance.get<ProductsResponse>('/products', {
        params: apiParams
      });

      const totalPages = Math.ceil(response.data.total / pageSize);

      set({
        products: response.data.data,
        total: response.data.total,
        totalPages,
        loading: false,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to fetch products"
        : "Failed to fetch products";
      set({
        error: errorMessage,
        loading: false,
      });
    }
  },

  // Create a new product
  createProduct: async (productData: CreateProductPayload, coverImage?: File) => {
    try {
      set({ loading: true, error: null });

      // Create FormData if we have a file to upload
      if (coverImage) {
        const formData = new FormData();

        // Append all product data fields
        Object.entries(productData).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              // Handle arrays (like categoryIds)
              value.forEach((item) => formData.append(`${key}[]`, item));
            } else {
              formData.append(key, value.toString());
            }
          }
        });

        // Append the cover image file
        formData.append('coverImage', coverImage);

        await axiosInstance.post("/products", formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        // No file, use JSON
        await axiosInstance.post("/products", productData);
      }

      // Refresh the products list
      await get().fetchProducts();

      set({ loading: false });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to create product"
        : "Failed to create product";
      set({
        error: errorMessage,
        loading: false,
      });
      throw error;
    }
  },

  // Update product
  updateProduct: async (id: string, productData: UpdateProductPayload, coverImage?: File) => {
    try {
      set({ loading: true, error: null });

      // Create FormData if we have a file to upload
      if (coverImage) {
        const formData = new FormData();

        // Append all product data fields
        Object.entries(productData).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              // Handle arrays (like categoryIds)
              value.forEach((item) => formData.append(`${key}[]`, item));
            } else {
              formData.append(key, value.toString());
            }
          }
        });

        // Append the cover image file
        formData.append('coverImage', coverImage);

        await axiosInstance.patch(`/products/${id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        // No file, use JSON
        await axiosInstance.patch(`/products/${id}`, productData);
      }

      // Refresh the products list
      await get().fetchProducts();

      set({ loading: false });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to update product"
        : "Failed to update product";
      set({
        error: errorMessage,
        loading: false,
      });
      throw error;
    }
  },

  // Delete product
  deleteProduct: async (id: string) => {
    try {
      set({ loading: true, error: null });

      await axiosInstance.delete(`/products/${id}`);

      // Remove product from local state
      const { products } = get();
      set({
        products: products.filter((product) => product.id !== id),
        loading: false,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to delete product"
        : "Failed to delete product";
      set({
        error: errorMessage,
        loading: false,
      });
      throw error;
    }
  },

  // Bulk delete products
  bulkDeleteProducts: async (productIds: string[]) => {
    try {
      set({ loading: true, error: null });

      // Since the backend might not have bulk delete, we'll delete one by one
      await Promise.all(
        productIds.map(id => axiosInstance.delete(`/products/${id}`))
      );

      // Remove deleted products from local state
      const { products } = get();
      set({
        products: products.filter((product) => !productIds.includes(product.id)),
        selectedProducts: [],
        loading: false,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to delete products"
        : "Failed to delete products";
      set({
        error: errorMessage,
        loading: false,
      });
      throw error;
    }
  },

  // Get product by ID
  getProductById: async (id: string): Promise<Product | null> => {
    try {
      const response = await axiosInstance.get<Product>(`/products/${id}?includeCategories=true&includeVariants=true`);
      return response.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to fetch product"
        : "Failed to fetch product";
      set({ error: errorMessage });
      return null;
    }
  },

  // Get product by slug
  getProductBySlug: async (slug: string): Promise<Product | null> => {
    try {
      const response = await axiosInstance.get<Product>(`/products/slug/${slug}?includeCategories=true&includeVariants=true`);
      return response.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to fetch product"
        : "Failed to fetch product";
      set({ error: errorMessage });
      return null;
    }
  },

  // Toggle product status
  toggleProductStatus: async (id: string) => {
    try {
      set({ loading: true, error: null });

      // Get current product to toggle its status
      const { products } = get();
      const product = products.find(p => p.id === id);
      if (product) {
        await axiosInstance.patch(`/products/${id}`, { 
          isActive: !product.isActive 
        });
      }

      // Refresh the products list
      await get().fetchProducts();

      set({ loading: false });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to toggle product status"
        : "Failed to toggle product status";
      set({
        error: errorMessage,
        loading: false,
      });
      throw error;
    }
  },

  // Toggle product featured status
  toggleProductFeatured: async (id: string) => {
    try {
      set({ loading: true, error: null });

      // Get current product to toggle its featured status
      const { products } = get();
      const product = products.find(p => p.id === id);
      if (product) {
        await axiosInstance.patch(`/products/${id}`, {
          isFeatured: !product.isFeatured
        });
      }

      // Refresh the products list
      await get().fetchProducts();

      set({ loading: false });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to toggle product featured status"
        : "Failed to toggle product featured status";
      set({
        error: errorMessage,
        loading: false,
      });
      throw error;
    }
  },

  // Pagination actions
  setPage: (page: number) => {
    const validPage = Math.max(1, Math.floor(page));
    set({ currentPage: validPage });
    // Always fetch with the updated currentPage
    get().fetchProducts();
  },

  setPageSize: (pageSize: number) => {
    const validPageSize = Math.max(1, Math.floor(pageSize));
    // Reset to first page and update pageSize, then fetch
    set({ pageSize: validPageSize, currentPage: 1 });
    get().fetchProducts();
  },

  // Selection management
  selectProduct: (id: string) => {
    const { selectedProducts } = get();
    const isSelected = selectedProducts.includes(id);

    if (isSelected) {
      set({ selectedProducts: selectedProducts.filter((productId) => productId !== id) });
    } else {
      set({ selectedProducts: [...selectedProducts, id] });
    }
  },

  selectAllProducts: () => {
    const { products } = get();
    set({ selectedProducts: products.map((product) => product.id) });
  },

  clearSelection: () => {
    set({ selectedProducts: [] });
  },

  // Utility actions
  setLoading: (loading: boolean) => set({ loading }),
  setError: (error: string | null) => set({ error }),
  clearError: () => set({ error: null }),
}));
