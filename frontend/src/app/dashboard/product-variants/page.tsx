"use client";

import { useEffect } from "react";
import useProductVariantsStore from "@/stores/product-variants-store";
import { EnhancedProductVariantTable } from "@/components/product-variant/enhanced-product-variant-table";

export default function ProductVariantsPage() {
  const { fetchProducts } = useProductVariantsStore();
  
  useEffect(() => {
    fetchProducts({ includeVariants: true, includeSKUs: true });
  }, [fetchProducts]);

  return (
    <section className="flex flex-col gap-4 w-full px-6 py-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Product Variants Management</h1>
          <p className="text-muted-foreground">
            Manage product variants and their attributes
          </p>
        </div>
      </div>

      <EnhancedProductVariantTable />
    </section>
  );
}