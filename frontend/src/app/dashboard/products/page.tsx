"use client";

import { useEffect } from "react";
import { useProductsStore, type Product } from "@/stores/products-store";
import { EnhancedProductTable } from "@/components/product/enhanced-product-table";

export default function ProductsPage() {
  const { fetchProducts } = useProductsStore();
  
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <section className="flex flex-col gap-4 w-full px-6 py-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Products Management</h1>
          <p className="text-muted-foreground">
            Manage your product catalog, pricing, and inventory
          </p>
        </div>
      </div>

      <EnhancedProductTable />
    </section>
  );
}
