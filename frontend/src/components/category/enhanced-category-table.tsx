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
import { MoreHorizontal, Trash2, Edit, Plus, Tag } from "lucide-react";
import { useCategoriesStore, type Category } from "@/stores/categories-store";
import { toast } from "sonner";
import { CreateCategoryDialog } from "@/components/category/create-category-dialog";
import { EditCategoryDialog } from "@/components/category/edit-category-dialog";
import PaginationTable from "@/components/pagination-table";

interface EnhancedCategoryTableProps {
  // Remove the callback props since we'll handle them internally
}

export function EnhancedCategoryTable({}: EnhancedCategoryTableProps) {
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
      toast.success("Category deleted successfully");
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    } catch (error) {
      toast.error("Failed to delete category");
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await toggleCategoryStatus(id);
      toast.success("Category status updated successfully");
    } catch (error) {
      toast.error("Failed to update category status");
    }
  };

  const handleBulkDelete = async () => {
    try {
      await bulkDeleteCategories(selectedCategories);
      toast.success(`${selectedCategories.length} categories deleted successfully`);
      setBulkDeleteDialogOpen(false);
    } catch (error) {
      toast.error("Failed to delete categories");
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

  const handleCreateCategory = () => {
    setIsCreateDialogOpen(true);
  };

  const handleCloseCreateDialog = () => {
    setIsCreateDialogOpen(false);
  };

  const columns: TableColumn<Category>[] = [
    {
      key: "select",
      label: "Select",
      render: (category) => (
        <Checkbox
          checked={selectedCategories.includes(category.id)}
          onCheckedChange={() => selectCategory(category.id)}
          aria-label="Select category"
        />
      ),
    },
    {
      key: "name",
      label: "Name",
      render: (category) => (
        <div className="flex items-center gap-2">
          <div className="font-medium">{category.name}</div>
          {category.parent && (
            <Badge variant="outline" className="text-xs">
              Sub-category
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "slug",
      label: "Slug",
      render: (category) => (
        <div className="text-sm text-muted-foreground font-mono">
          {category.slug}
        </div>
      ),
    },
    {
      key: "parent",
      label: "Parent",
      render: (category) => (
        <div className="text-sm text-muted-foreground">
          {category.parent ? category.parent.name : "Root Category"}
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (category) => (
        <div className="flex items-center gap-2">
          <Badge variant={category.isActive ? "secondary" : "outline"}>
            {category.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      ),
    },
    {
      key: "products",
      label: "Products",
      render: (category) => (
        <div className="text-sm text-muted-foreground">
          {category.productCount ?? 0} products
        </div>
      ),
    },
    {
      key: "children",
      label: "Sub-categories",
      render: (category) => (
        <div className="text-sm text-muted-foreground">
          {category.children ? category.children.length : 0} sub-categories
        </div>
      ),
    },
    {
      key: "sortOrder",
      label: "Order",
      render: (category) => (
        <div className="text-sm text-muted-foreground">
          {category.sortOrder}
        </div>
      ),
    },
    {
      key: "createdAt",
      label: "Created",
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
      label: "Actions",
      render: (category) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEditCategory(category)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleToggleStatus(category.id)}>
              {category.isActive ? "Deactivate" : "Activate"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setCategoryToDelete(category.id);
                setDeleteDialogOpen(true);
              }}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <DataTable
        title="Category Management"
        data={categories}
        columns={columns}
        searchKeys={["name", "slug", "description"]}
        searchPlaceholder="Search categories by name, slug, or description..."
        emptyMessage="No categories found"
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
                Delete Selected ({selectedCategories.length})
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
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              category and all its subcategories.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => categoryToDelete && handleDeleteCategory(categoryToDelete)}
            >
              Delete
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
              Delete {selectedCategories.length} categories?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              selected categories and all their subcategories.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete}>
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pagination */}
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
