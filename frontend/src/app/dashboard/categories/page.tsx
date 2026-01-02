"use client";

import { useEffect } from "react";
import { useCategoriesStore } from "@/stores/categories-store";
import { EnhancedCategoryTable } from "@/components/category/enhanced-category-table";
import { useLocale } from "@/components/local-lang-swither";
import { getMessages } from "@/lib/locale";

export default function CategoriesPage() {
  const { fetchCategories } = useCategoriesStore();
  const { locale } = useLocale();
  const lang = getMessages(locale);
  const t = lang.pages?.categories || {};

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return (
    <section className="flex flex-col gap-4 w-full px-6 py-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">{t.title || "Categories Management"}</h1>
          <p className="text-muted-foreground">
            {t.description || "Manage your product categories and hierarchies"}
          </p>
        </div>
      </div>

      <EnhancedCategoryTable />
    </section>
  );
}
