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
import {
  MoreHorizontal,
  Trash2,
  Edit,
  Plus,
  Package,
  Star,
  Eye,
} from "lucide-react";
import { useProductsStore, type Product } from "@/stores/products-store";
import { toast } from "sonner";
import { CreateProductDialog } from "@/components/product/create-product-dialog";
import { EditProductDialog } from "@/components/product/edit-product-dialog";
import PaginationTable from "@/components/pagination-table";
import { useSearchQuery } from "@/hooks/use-search-query";
import { IconCircleCheckFilled } from "@tabler/icons-react";
import Link from "next/link";
interface EnhancedProductTableProps {
  // Remove the callback props since we'll handle them internally
}

export function EnhancedProductTable({ }: EnhancedProductTableProps) {
  const [search, setSearch] = useSearchQuery("q", 400);
  const {
    products,
    loading,
    error,
    selectedProducts,
    total,
    currentPage,
    pageSize,
    totalPages,
    fetchProducts,
    deleteProduct,
    bulkDeleteProducts,
    selectProduct,
    clearSelection,
    clearError,
    setPage,
    setPageSize,
    toggleProductStatus,
    toggleProductFeatured,
  } = useProductsStore();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Show error toast
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const handleDeleteProduct = async (id: string) => {
    try {
      await deleteProduct(id);
      toast.success("Product deleted successfully");
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    } catch (error) {
      toast.error("Failed to delete product");
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await toggleProductStatus(id);
      toast.success("Product status updated successfully");
    } catch (error) {
      toast.error("Failed to update product status");
    }
  };

  const handleToggleFeatured = async (id: string) => {
    try {
      await toggleProductFeatured(id);
      toast.success("Product featured status updated successfully");
    } catch (error) {
      toast.error("Failed to update product featured status");
    }
  };

  const handleBulkDelete = async () => {
    try {
      await bulkDeleteProducts(selectedProducts);
      toast.success(`${selectedProducts.length} products deleted successfully`);
      setBulkDeleteDialogOpen(false);
    } catch (error) {
      toast.error("Failed to delete products");
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditingProduct(null);
    setIsEditDialogOpen(false);
  };

  const formatPrice = (price: number | undefined) => {
    if (price === undefined) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const getTotalStock = (product: Product) => {
    if (!product.variants || product.variants.length === 0) return 0;

    return product.variants
      .flatMap((variant) => variant.skus || [])
      .reduce((total, sku) => total + (sku.stock || 0), 0);
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Select all product IDs
      products.forEach((p) => selectProduct(p.id));
    } else {
      // Clear all selections
      clearSelection();
    }
  };


  const columns: TableColumn<Product>[] = [
    {
      key: "select",
      label: (
        <Checkbox
          checked={selectedProducts.length === products.length && products.length > 0}
          onCheckedChange={(checked) => handleSelectAll(!!checked)}
          aria-label="Select all products"
        />
      ),
      render: (product) => (
        <Checkbox
          checked={selectedProducts.includes(product.id)}
          onCheckedChange={() => selectProduct(product.id)}
          aria-label="Select product"
        />
      ),
    },
    {
      key: "product",
      label: "Product",
      render: (product) => {
        // Get first SKU from first variant
        const firstVariant = product.variants?.[0];
        const firstSKU = firstVariant?.skus?.[0];
        return (
          <div className="flex items-center max-w-80 gap-3">
            {product.coverImage ? (
              <img
                src={product.coverImage}
                alt={product.name}
                className="w-12 h-12 object-cover rounded-md"
              />
            ) : (
              <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center">
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div className="flex flex-col w-full">
              <Link
                href={`/dashboard/products/${product.slug}`}
                className="font-medium line-clamp-1 truncate">
                {product.name}
              </Link>
              <div className="text-sm text-muted-foreground">
                {product.slug}
              </div>
              {firstSKU && (
                <div className="text-xs text-muted-foreground">
                  SKU: {firstSKU.sku}
                </div>
              )}
            </div>
          </div >
        );
      },
    },
    {
      key: "price",
      label: "Price",
      render: (product) => {
        // Show price from first SKU if available
        const firstVariant = product.variants?.[0];
        const firstSKU = firstVariant?.skus?.[0];
        const price = firstSKU?.price;
        return (
          <div className="text-sm">
            {price !== undefined ? (
              <span className="font-medium">{formatPrice(price)}</span>
            ) : (
              <span className="text-muted-foreground">no pricing</span>
            )}
          </div>
        );
      },
    },
    {
      key: "stock",
      label: "Stock",
      render: (product) => {
        // Show stock from first SKU if available
        const firstVariant = product.variants?.[0];
        const firstSKU = firstVariant?.skus?.[0];
        const stock = firstSKU?.stock;
        return (
          <div className="text-sm">
            {stock !== undefined ? (
              <span className={stock > 0 ? "" : "text-red-600"}>
                {stock} units
              </span>
            ) : (
              <span className="text-muted-foreground">no stock</span>
            )}
          </div>
        );
      },
    },
    {
      key: "variants",
      label: "Variants",
      render: (product) => (
        <div className="text-sm text-muted-foreground">
          {product.variants?.length || 0} variants
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (product) => (
        <div className="flex items-center gap-2">
          <Badge variant={"secondary"}>
            {product.isActive ? (
              <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400" />
            ) : (
              <IconCircleCheckFilled className="fill-red-500 dark:fill-red-400" />
            )}
            {product.isActive ? "Active" : "Inactive"}
          </Badge>
          {product.isFeatured && (
            <Badge variant="secondary" className="text-xs">
              <Star className="w-3 h-3 mr-1 stroke-orange-300 fill-orange-300 dark:fill-orange-300" />
              Featured
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "metrics",
      label: "Performance",
      render: (product) => (
        <div className="text-xs text-muted-foreground">
          <div className="space-y-1">
            <div>
              SKUs:{" "}
              {product.variants?.reduce(
                (total, variant) => total + (variant.skus?.length || 0),
                0
              ) || 0}
            </div>
            <div>Stock: {getTotalStock(product)}</div>
          </div>
        </div>
      ),
    },
    {
      key: "createdAt",
      label: "Created",
      render: (product) => {
        const date = new Date(product.createdAt);
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
      render: (product) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEditProduct(product)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleToggleStatus(product.id)}>
              <Eye className="mr-2 h-4 w-4" />
              {product.isActive ? "Deactivate" : "Activate"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleToggleFeatured(product.id)}>
              <Star className="mr-2 h-4 w-4" />
              {product.isFeatured ? "Unfeature" : "Feature"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setProductToDelete(product.id);
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
  useEffect(() => {
    fetchProducts({ search });
  }, [search, fetchProducts]);

  return (
    <div className="space-y-4">
      <DataTable
        title="Product Management"
        data={products}
        columns={columns}
        searchKeys={["name", "slug", "description"]}
        searchPlaceholder="Search products by name, slug, or description..."
        emptyMessage="No products found"
        showCount={true}
        searchValue={search}
        onSearchChange={setSearch}
        customHeader={
          <div className="flex items-center gap-2">
            {selectedProducts.length > 0 && (
              <Button
                variant="destructive"
                onClick={() => setBulkDeleteDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete Selected ({selectedProducts.length})
              </Button>
            )}
            <CreateProductDialog />
          </div>
        }
      />

      {/* Edit Product Dialog */}
      <EditProductDialog
        product={editingProduct}
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
              product and all its variants and SKUs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                productToDelete && handleDeleteProduct(productToDelete)
              }
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
              Delete {selectedProducts.length} products?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              selected products and all their variants and SKUs.
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
