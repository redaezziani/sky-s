"use client";

import React, { useEffect } from "react";
import MainLayout from "@/components/store/main-layout";
import swr from "swr";
import { fetcher } from "@/lib/utils";
import {
  useProductDetailsStore,
  Product,
} from "@/stores/public/product-details-store";
import ProductGallery from "@/components/store/product/product-gallery";
import ProductDetails from "@/components/store/product/product-details";
import { useHomeStore } from "@/stores/public/home-store";
import { ProductCard } from "@/components/store/product/product-card";

type ProductPageProps = {
  params: Promise<{ slug: string }> | { slug: string };
};

const ProductPage = ({ params }: ProductPageProps) => {
  // Resolve slug param
  const resolvedParams = React.use(
    params instanceof Promise ? params : Promise.resolve(params)
  );
  const { slug } = resolvedParams;

  // Product details store
  const product = useProductDetailsStore((state) => state.product);
  const resetSelections = useProductDetailsStore(
    (state) => state.resetSelections
  );

  // Fetch product with SWR
  const apiUrl = `/public/products/${slug}`;
  const { error, isLoading } = swr<Product>(apiUrl, fetcher, {
    revalidateOnFocus: false,
    onSuccess: (newProduct) => {
      resetSelections(newProduct);
    },
    onError: (err) => {
      console.error("Product fetch failed:", err);
    },
  });

  // Related products store
  const { relatedProducts, fetchRelatedProducts, loading } = useHomeStore();

  // Fetch related products when product is loaded
  useEffect(() => {
    if (slug) {
      fetchRelatedProducts(slug);
    }
  }, [slug, fetchRelatedProducts]);

  if (isLoading) {
    return (
      <MainLayout title="Loading..." description="Loading product details">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <p>Loading product...</p>
        </div>
      </MainLayout>
    );
  }

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
      title="Details Page"
      description="Detailed view of the product & related items"
    >
      <div className="w-full px-4 md:px-0 py-4">
        <div className="grid w-full  md:max-w-6xl col-span-1 lg:grid-cols-3 gap-12">
          <ProductGallery />
          <ProductDetails />
        </div>

        {/* Related Products */}
        <div className="max-w-6xl mt-12">
          <h2 className="text-xl font-semibold mb-4">Related Products</h2>
          {loading ? (
            <p>Loading related products...</p>
          ) : relatedProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {relatedProducts.map((rp) => (
                <ProductCard key={rp.id} product={rp} />
              ))}
            </div>
          ) : (
            <p>No related products found.</p>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default ProductPage;
