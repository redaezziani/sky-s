"use client";

import React from "react";
import MainLayout from "@/components/store/main-layout";
import swr from "swr";
import { fetcher } from "@/lib/utils";
import { useProductDetailsStore, Product } from "@/stores/public/product-details-store";
import ProductGallery from "@/components/store/product/product-gallery";
import ProductDetails from "@/components/store/product/product-details";

type ProductPageProps = {
  params: Promise<{ slug: string }> | { slug: string };
};

const ProductPage = ({ params }: ProductPageProps) => {
  // 💡 FIX: Handle params as Promise for Next.js 15+ compatibility
  const resolvedParams = React.use(
    params instanceof Promise ? params : Promise.resolve(params)
  );
  const { slug } = resolvedParams;

  // 💡 FIX: Use separate selectors to avoid object recreation
  const product = useProductDetailsStore((state) => state.product);
  const resetSelections = useProductDetailsStore((state) => state.resetSelections);

  // SWR Fetching
  const apiUrl = `/public/products/${slug}`;
  const { error, isLoading } = swr<Product>(apiUrl, fetcher, {
    revalidateOnFocus: false,
    onSuccess: (newProduct) => {
      resetSelections(newProduct);
    },
    onError: (err) => {
      console.error("Product fetch failed:", err);
    }
  });

  // Handle Loading State
  if (isLoading) {
    return (
      <MainLayout title="Loading..." description="Loading product details">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <p>Loading product...</p>
        </div>
      </MainLayout>
    );
  }

  // Handle Error State (SWR error or product data not available)
  if (error || !product) {
    return (
      <MainLayout
        title="Product not found"
        description="No product details available"
      >
        <div className="max-w-6xl mx-auto px-4 py-8">
          <p>{error ? `Error: ${error.message}` : "Product not found."}</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      title="product details"
      description="Detailed information about the product"
    >
      <div className="w-full justify-start  px-4 md:px-0 py-8">
        <div className="grid max-w-6xl  lg:grid-cols-2 gap-12">
          <ProductGallery />
          <ProductDetails />
        </div>
      </div>
    </MainLayout>
  );
};

export default ProductPage;