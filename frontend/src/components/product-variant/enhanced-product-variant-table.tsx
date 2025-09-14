"use client";

import { useState, useEffect, useMemo } from "react";
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
import { MoreHorizontal, Trash2, Edit, Plus, Package } from "lucide-react";
import useProductVariantsStore, { type ProductVariant } from "@/stores/product-variants-store";
import { toast } from "sonner";
import { CreateProductVariantDialog } from "@/components/product-variant/create-product-variant-dialog";
import { EditProductVariantDialog } from "@/components/product-variant/edit-product-variant-dialog";
import PaginationTable from "@/components/pagination-table";
import { IconCircleCheckFilled } from "@tabler/icons-react";

interface EnhancedProductVariantTableProps {
  // Remove the callback props since we'll handle them internally
}

export function EnhancedProductVariantTable({}: EnhancedProductVariantTableProps) {
  const {
    products,
    loading,
    error,
    fetchProducts,
    deleteVariant,
  } = useProductVariantsStore();

  // Local pagination state for variants
  const [variantCurrentPage, setVariantCurrentPage] = useState(1);
  const [variantItemsPerPage, setVariantItemsPerPage] = useState(8);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingProductVariant, setEditingProductVariant] = useState<(ProductVariant & { productName: string; productId: string }) | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [productVariantToDelete, setProductVariantToDelete] = useState<string | null>(null);
  const [selectedVariantIds, setSelectedVariantIds] = useState<string[]>([]);

  // Flatten all variants from all products
  const allVariants = useMemo(() => {
    const variants: (ProductVariant & { productName: string; productId: string })[] = [];
    products.forEach(product => {
      if (product.variants) {
        product.variants.forEach(variant => {
          variants.push({
            ...variant,
            productName: product.name,
            productId: product.id,
          });
        });
      }
    });
    return variants;
  }, [products]);

  // Calculate pagination for variants
  const variantTotalItems = allVariants.length;
  const variantTotalPages = Math.ceil(variantTotalItems / variantItemsPerPage);
  const startIndex = (variantCurrentPage - 1) * variantItemsPerPage;
  const endIndex = startIndex + variantItemsPerPage;
  const paginatedVariants = allVariants.slice(startIndex, endIndex);

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setVariantCurrentPage(page);
  };

  const handlePageSizeChange = (pageSize: number) => {
    setVariantItemsPerPage(pageSize);
    setVariantCurrentPage(1); // Reset to first page when page size changes
  };

  // Fetch products with variants on component mount
  useEffect(() => {
    fetchProducts({ includeVariants: true, includeSKUs: true });
  }, [fetchProducts]);

  // Show error toast
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleDeleteProductVariant = async (id: string) => {
    try {
      await deleteVariant(id);
      toast.success("Product variant deleted successfully");
      setDeleteDialogOpen(false);
      setProductVariantToDelete(null);
    } catch (error) {
      toast.error("Failed to delete product variant");
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedVariantIds.map(id => deleteVariant(id)));
      toast.success(`${selectedVariantIds.length} product variants deleted successfully`);
      setBulkDeleteDialogOpen(false);
      setSelectedVariantIds([]);
    } catch (error) {
      toast.error("Failed to delete selected product variants");
    }
  };

  const handleEditProductVariant = (productVariant: ProductVariant & { productName: string; productId: string }) => {
    setEditingProductVariant(productVariant);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (id: string) => {
    setProductVariantToDelete(id);
    setDeleteDialogOpen(true);
  };

  const columns: TableColumn<ProductVariant & { productName: string; productId: string }>[] = [
    {
      key: "select",
      label: "",
      render: (variant) => (
        <Checkbox
          checked={selectedVariantIds.includes(variant.id)}
          onCheckedChange={(value) => {
            if (value) {
              setSelectedVariantIds(prev => [...prev, variant.id]);
            } else {
              setSelectedVariantIds(prev => prev.filter(id => id !== variant.id));
            }
          }}
          aria-label="Select row"
        />
      ),
    },
    {
      key: "name",
      label: "Name",
      render: (variant) => (
        <div className="flex items-center space-x-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">
              {variant.name || `Variant ${variant.id.slice(-8)}`}
            </div>
            <div className="text-sm text-muted-foreground">
              {variant.productName || "Unknown Product"}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "attributes",
      label: "Attributes",
      render: (variant) => {
        const attributes = variant.attributes;
        if (!attributes || Object.keys(attributes).length === 0) {
          return <span className="text-muted-foreground">No attributes</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {Object.entries(attributes).map(([key, value]) => (
              <Badge key={key} variant="outline" className="text-xs">
                {key}: {String(value)}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      key: "skuCount",
      label: "SKUs",
      render: (variant) => {
        const count = variant.skus?.length || 0;
        return (
          <Badge variant={"secondary"}>
            {count} SKU{count !== 1 ? 's' : ''}
          </Badge>
        );
      },
    },
    {
      key: "isActive",
      label: "Status",
      render: (variant) => {
        const isActive = variant.isActive;
        return (
          <Badge variant={"secondary"}>
            {isActive ? <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400" /> : <IconCircleCheckFilled className="fill-red-500 dark:fill-red-400" /> }
          {isActive ? "Active" : "Inactive"}
        </Badge>
        );
      },
    },
    {
      key: "sortOrder",
      label: "Sort Order",
      render: (variant) => variant.sortOrder,
    },
    {
      key: "createdAt",
      label: "Created",
      render: (variant) => {
        const date = new Date(variant.createdAt);
        return date.toLocaleDateString();
      },
    },
  ];

  return (
    <div className="space-y-4">
      <DataTable
          title="Product Variants"
          columns={columns}
          data={paginatedVariants}
          searchKeys={["name", "productName"]}
          searchPlaceholder="Search variants..."
          customHeader={
            <div className="flex gap-2 items-center justify-between">
              <div className="flex items-center gap-2 space-x-2">
                <Checkbox
                  checked={selectedVariantIds.length === paginatedVariants.length && paginatedVariants.length > 0}
                  onCheckedChange={(value) => {
                    if (value) {
                      setSelectedVariantIds(paginatedVariants.map(v => v.id));
                    } else {
                      setSelectedVariantIds([]);
                    }
                  }}
                  aria-label="Select all"
                />
                <span className="text-sm text-muted-foreground">
                  {selectedVariantIds.length > 0 ? `${selectedVariantIds.length} selected` : 'Select all'}
                </span>
                {selectedVariantIds.length > 0 && (
                  <Button
                    variant="destructive"
                    onClick={() => setBulkDeleteDialogOpen(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Selected ({selectedVariantIds.length})
                  </Button>
                )}
              </div>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Product Variant
              </Button>
            </div>
          }
          actions={(variant) => (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleEditProductVariant(variant)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => openDeleteDialog(variant.id)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        />

      <PaginationTable
        currentPage={variantCurrentPage}
        totalPages={variantTotalPages}
        pageSize={variantItemsPerPage}
        totalItems={variantTotalItems}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              product variant and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => productVariantToDelete && handleDeleteProductVariant(productVariantToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Product Variants</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedVariantIds.length} product variant(s)?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete {selectedVariantIds.length} Product Variant(s)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Product Variant Dialog */}
      <CreateProductVariantDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />

      {/* Edit Product Variant Dialog */}
      <EditProductVariantDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        productVariant={editingProductVariant}
      />
    </div>
  );
}
