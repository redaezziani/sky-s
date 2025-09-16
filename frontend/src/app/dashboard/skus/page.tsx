"use client";

import { useEffect } from "react";
import useProductVariantsStore from "@/stores/product-variants-store";
import { EnhancedSKUTable } from "@/components/sku/enhanced-sku-table";
import { useLocale } from "@/components/local-lang-swither"; // your LocaleProvider hook
import { getMessages } from "@/lib/locale";

export default function SKUsPage() {
  const { fetchProducts } = useProductVariantsStore();

  // ✅ Get current locale and translations
  const { locale } = useLocale();
  const t = getMessages(locale);

  useEffect(() => {
    fetchProducts({ includeVariants: true, includeSKUs: true });
  }, [fetchProducts]);

  return (
    <section className="flex flex-col gap-4 w-full px-6 py-4">
      <div className="flex justify-between items-center">
        <div>
          {/* ✅ Use translations */}
          <h1 className="text-2xl font-semibold">{t.pages.skus.title}</h1>
          <p className="text-muted-foreground">{t.pages.skus.description}</p>
        </div>
      </div>

      <EnhancedSKUTable />
    </section>
  );
}
