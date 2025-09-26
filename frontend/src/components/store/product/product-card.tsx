"use client";

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

export const ProductCard = ({ product }: { product: Product }) => {
  return (
    <div className="group">
      <div className="transition-all duration-200">
        {/* Image */}
        <div className="relative overflow-hidden">
          <img
            src={product.coverImage}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          {product.isFeatured && (
            <div className="absolute top-3 left-3">
              <span className="bg-black text-white flex gap-1 text-xs px-2 py-1 font-medium">
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
          <div className="mb-2">
            <Link
              href={`/store/products?category=${product.categories[0]?.slug}`}
              className="text-xs text-gray-500 uppercase tracking-wide hover:underline"
            >
              {product.categories[0]?.name}
            </Link>
          </div>

          <Link
            href={`/store/products/${product.slug}`}
            className="font-medium line-clamp-1 text-gray-900 mb-2  group-hover:text-gray-700 transition-colors hover:underline"
          >
            {product.name}
          </Link>

          <p className="text-xs text-gray-600 mb-3 line-clamp-2">
            {product.shortDesc}
          </p>

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
