"use client";

import { useEffect } from "react";
import useProductVariantsStore from "@/stores/product-variants-store";
import { EnhancedProductVariantTable } from "@/components/product-variant/enhanced-product-variant-table";
import { useLocale } from "@/components/local-lang-swither";
import { getMessages } from "@/lib/locale";

export default function ProductVariantsPage() {
  const { fetchProducts } = useProductVariantsStore();
  const { locale } = useLocale();
  const lang = getMessages(locale);
  const t = lang.pages?.variants || {};

  useEffect(() => {
    fetchProducts({ includeVariants: true, includeSKUs: true });
  }, [fetchProducts]);

  return (
    <section className="flex flex-col gap-4 w-full px-6 py-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">{t.title || "Product Variants Management"}</h1>
          <p className="text-muted-foreground">
            {t.description || "Manage product variants and their attributes"}
          </p>
        </div>
      </div>

      <EnhancedProductVariantTable />
    </section>
  );
}