"use client";

import { useEffect } from "react";
import useProductVariantsStore from "@/stores/product-variants-store";
import { EnhancedSKUTable } from "@/components/sku/enhanced-sku-table";

export default function SKUsPage() {
  const { fetchProducts } = useProductVariantsStore();
  
  useEffect(() => {
    fetchProducts({ includeVariants: true, includeSKUs: true });
  }, [fetchProducts]);

  return (
    <section className="flex flex-col gap-4 w-full px-6 py-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">SKUs & Inventory Management</h1>
          <p className="text-muted-foreground">
            Manage product SKUs, pricing, and inventory levels
          </p>
        </div>
      </div>

      <EnhancedSKUTable />
    </section>
  );
}
