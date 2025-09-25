"use client";

import MainLayout from "@/components/store/main-layout";
import React, { useEffect, useState } from "react";
import Link from "next/link";

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

const ProductCard = ({ product }: { product: Product }) => {



  return (
    <div className="group">
      <div className=" transition-all duration-200 ">
        {/* Image Container */}
        <div className=" relative overflow-hidden ">
          <img
            src={product.coverImage}
            alt={product.name}
            className="w-full h-full object-cover "
          />
          {product.isFeatured && (
            <div className="absolute top-3 left-3">
              <span className="bg-black text-white flex gap-1 text-xs px-2 py-1 font-medium">
                <svg
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="w-4 h-4"
                >
                  {" "}
                  <path
                    d="M12 1h2v8h8v4h-2v-2h-8V5h-2V3h2V1zM8 7V5h2v2H8zM6 9V7h2v2H6zm-2 2V9h2v2H4zm10 8v2h-2v2h-2v-8H2v-4h2v2h8v6h2zm2-2v2h-2v-2h2zm2-2v2h-2v-2h2zm0 0h2v-2h-2v2z"
                    fill="currentColor"
                  />{" "}
                </svg>
                Featured
              </span>
            </div>
          )}
          {!product.inStock && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
              <span className="bg-gray-900 text-white px-3 py-1 text-sm font-medium">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="py-2 px-1">
          {/* Category */}
          <div className="mb-2">
            <Link
              href={`/store/products?category=${product.categories[0]?.slug}`}
              className="text-xs text-gray-500 uppercase tracking-wide hover:underline"
            >
              {product.categories[0]?.name}
            </Link>
          </div>

          {/* Product Name */}
          <Link
            href={`/store/products/${product.slug}`}
            className="font-medium text-gray-900 mb-2 line-clamp-2 group-hover:text-gray-700 transition-colors hover:underline"
          >
            {product.name}
          </Link>

          {/* Short Description */}
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {product.shortDesc}
          </p>

          {/* Price */}
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-gray-900">
              ${product.startingPrice.toFixed(2)}
            </span>
            <span className="text-xs text-gray-500">Starting price</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const HomePage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLatestProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          "http://localhost:8085/api/public/products/latest?page=1&limit=12&inStock=true"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }

        const data: ProductsResponse = await response.json();
        setProducts(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchLatestProducts();
  }, []);

  return (
    <MainLayout
      title="Welcome to reda store"
      description="Browse our latest collection of amazing products."
    >
      <div className="w-full px-4 py-8">
        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6 w-full">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-gray-200 mb-4"></div>
                <div className="h-4 bg-gray-200 mb-2"></div>
                <div className="h-4 bg-gray-200 w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 w-1/2"></div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">Failed to load products</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-900 text-white px-4 py-2 hover:bg-gray-800 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Products Grid */}
        {!loading && !error && products.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 w-full">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">
              No products available at the moment
            </p>
            <Link
              href="/store"
              className="bg-gray-900 text-white px-4 py-2 hover:bg-gray-800 transition-colors inline-block"
            >
              Browse Store
            </Link>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default HomePage;
