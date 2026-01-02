"use client";

import { useEffect } from "react";
import { useProductsStore } from "@/stores/products-store";
import { EnhancedProductTable } from "@/components/product/enhanced-product-table";
import { useLocale } from "@/components/local-lang-swither";
import { getMessages } from "@/lib/locale";

export default function ProductsPage() {
  const { fetchProducts } = useProductsStore();
  const { locale } = useLocale();
  const lang = getMessages(locale);
  const t = lang.pages?.products || {};

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <section className="flex flex-col gap-4 w-full px-6 py-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">{t.title || "Products Management"}</h1>
          <p className="text-muted-foreground">
            {t.description || "Manage your product catalog, pricing, and inventory"}
          </p>
        </div>
      </div>

      <EnhancedProductTable />
    </section>
  );
}
