"use client";

import { useEffect } from "react";
import { useCategoriesStore, type Category } from "@/stores/categories-store";
import { EnhancedCategoryTable } from "@/components/category/enhanced-category-table";

export default function CategoriesPage() {
  const { fetchCategories } = useCategoriesStore();
  
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return (
    <section className="flex flex-col gap-4 w-full px-6 py-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Categories Management</h1>
          <p className="text-muted-foreground">
            Manage your product categories and hierarchies
          </p>
        </div>
      </div>

      <EnhancedCategoryTable />
    </section>
  );
}
