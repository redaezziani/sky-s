"use client";

import { useState, useEffect } from "react";
import { DataTable, TableColumn } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreHorizontal, Trash2, Edit } from "lucide-react";
import { useCategoriesStore, type Category } from "@/stores/categories-store";
import { toast } from "sonner";
import { CreateCategoryDialog } from "@/components/category/create-category-dialog";
import { EditCategoryDialog } from "@/components/category/edit-category-dialog";
import PaginationTable from "@/components/pagination-table";
import { IconCircleCheckFilled } from "@tabler/icons-react";
import { useSearchQuery } from "@/hooks/use-search-query";
import { useLocale } from "@/components/local-lang-swither";
import { getMessages } from "@/lib/locale";

type EnhancedCategoryTableProps = Record<string, never>;

export function EnhancedCategoryTable({}: EnhancedCategoryTableProps) {
   const [search, setSearch] = useSearchQuery("q", 400);
  const { locale } = useLocale();
  const lang = getMessages(locale);
  const t = lang.pages?.categories?.components?.categoryTable || {};

  const {
    categories,
    loading,
    error,
    selectedCategories,
    total,
    currentPage,
    pageSize,
    totalPages,
    fetchCategories,
    deleteCategory,
    bulkDeleteCategories,
    selectCategory,
    clearSelection,
    clearError,
    setPage,
    setPageSize,
    toggleCategoryStatus,
  } = useCategoriesStore();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Show error toast
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteCategory(id);
      toast.success(t.toast?.deleted || "Category deleted successfully");
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    } catch (error) {
      toast.error(t.toast?.deleteFailed || "Failed to delete category");
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await toggleCategoryStatus(id);
      toast.success(t.toast?.statusUpdated || "Category status updated successfully");
    } catch (error) {
      toast.error(t.toast?.statusUpdateFailed || "Failed to update category status");
    }
  };

  const handleBulkDelete = async () => {
    try {
      await bulkDeleteCategories(selectedCategories);
      const message = t.toast?.bulkDeleted?.replace("{0}", selectedCategories.length.toString()) || `${selectedCategories.length} categories deleted successfully`;
      toast.success(message);
      setBulkDeleteDialogOpen(false);
    } catch (error) {
      toast.error(t.toast?.bulkDeleteFailed || "Failed to delete categories");
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setIsEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditingCategory(null);
    setIsEditDialogOpen(false);
  };

  const columns: TableColumn<Category>[] = [
    {
      key: "select",
      label: t.table?.select || "Select",
      render: (category) => (
        <Checkbox
          checked={selectedCategories.includes(category.id)}
          onCheckedChange={() => selectCategory(category.id)}
          aria-label={t.table?.selectRow || "Select category"}
        />
      ),
    },
    {
      key: "name",
      label: t.table?.name || "Name",
      render: (category) => (
        <div className="flex items-center gap-2">
          <div className="font-medium">{category.name}</div>
          {category.parent && (
            <Badge variant="outline" className="text-xs">
              {t.table?.subCategory || "Sub-category"}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "slug",
      label: t.table?.slug || "Slug",
      render: (category) => (
        <div className="text-sm text-muted-foreground font-mono">
          {category.slug}
        </div>
      ),
    },
    {
      key: "parent",
      label: t.table?.parent || "Parent",
      render: (category) => (
        <div className="text-sm text-muted-foreground">
          {category.parent ? category.parent.name : (t.table?.rootCategory || "Root Category")}
        </div>
      ),
    },
    {
      key: "status",
      label: t.table?.status || "Status",
      render: (category) => (
        <div className="flex items-center gap-2">
          <Badge variant={"secondary"}>
            {category.isActive ? <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400" /> : <IconCircleCheckFilled className="fill-red-500 dark:fill-red-400" /> }
          {category.isActive  ? (t.table?.active || "Active") : (t.table?.inactive || "Inactive")}
          </Badge>
        </div>
      ),
    },
    {
      key: "products",
      label: t.table?.products || "Products",
      render: (category) => {
        const count = category.productCount ?? 0;
        const text = t.table?.productsCount?.replace("{count}", count.toString()) || `${count} products`;
        return (
          <div className="text-sm text-muted-foreground">
            {text}
          </div>
        );
      },
    },
    {
      key: "children",
      label: t.table?.subCategories || "Sub-categories",
      render: (category) => {
        const count = category.children ? category.children.length : 0;
        const text = t.table?.subCategoriesCount?.replace("{count}", count.toString()) || `${count} sub-categories`;
        return (
          <div className="text-sm text-muted-foreground">
            {text}
          </div>
        );
      },
    },
    {
      key: "sortOrder",
      label: t.table?.order || "Order",
      render: (category) => (
        <div className="text-sm text-muted-foreground">
          {category.sortOrder}
        </div>
      ),
    },
    {
      key: "createdAt",
      label: t.table?.created || "Created",
      render: (category) => {
        const date = new Date(category.createdAt);
        return (
          <div className="text-sm text-muted-foreground">
            {date.toLocaleDateString()}
          </div>
        );
      },
    },
    {
      key: "actions",
      label: t.table?.actions || "Actions",
      render: (category) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">{t.table?.openMenu || "Open menu"}</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEditCategory(category)}>
              <Edit className="mr-2 h-4 w-4" />
              {t.table?.edit || "Edit"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleToggleStatus(category.id)}>
              {category.isActive ? (t.table?.deactivate || "Deactivate") : (t.table?.activate || "Activate")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setCategoryToDelete(category.id);
                setDeleteDialogOpen(true);
              }}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t.table?.delete || "Delete"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
  useEffect(() => {
    fetchCategories({ search });
  }, [search, fetchCategories]);
  return (
    <div className="space-y-4">
      <DataTable
        title={t.title || "Category Management"}
        data={categories}
        columns={columns}
        searchKeys={["name", "slug", "description"]}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t.table?.searchPlaceholder || "Search categories by name, slug, or description..."}
        emptyMessage={t.table?.empty || "No categories found"}
        showCount={true}
        customHeader={
          <div className="flex items-center gap-2">
            {selectedCategories.length > 0 && (
              <Button
                variant="destructive"
                onClick={() => setBulkDeleteDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                {t.table?.deleteSelected?.replace("{0}", selectedCategories.length.toString()) || `Delete Selected (${selectedCategories.length})`}
              </Button>
            )}
            <CreateCategoryDialog />
          </div>
        }
      />

      {/* Edit Category Dialog */}
      <EditCategoryDialog
        category={editingCategory}
        open={isEditDialogOpen}
        onClose={handleCloseEditDialog}
      />

      {/* Single Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.dialogs?.deleteTitle || "Are you sure?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.dialogs?.deleteDesc || "This action cannot be undone. This will permanently delete the category and all its subcategories."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.dialogs?.cancel || "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                categoryToDelete && handleDeleteCategory(categoryToDelete)
              }
            >
              {t.dialogs?.delete || "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Dialog */}
      <AlertDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t.dialogs?.bulkDeleteTitle?.replace("{0}", selectedCategories.length.toString()) || `Delete ${selectedCategories.length} categories?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t.dialogs?.bulkDeleteDesc || "This action cannot be undone. This will permanently delete the selected categories and all their subcategories."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.dialogs?.cancel || "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete}>
              {t.dialogs?.deleteAll || "Delete All"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {total > 0 && (
        <PaginationTable
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={total}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}
    </div>
  );
}
