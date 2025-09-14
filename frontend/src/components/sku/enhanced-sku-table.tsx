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
import { MoreHorizontal, Trash2, Edit, Plus, Package, AlertTriangle } from "lucide-react";
import useProductVariantsStore, { type ProductSKU } from "@/stores/product-variants-store";
import { toast } from "sonner";
import PaginationTable from "@/components/pagination-table";
import { CreateSKUDialog } from "./create-sku-dialog";
import { EditSKUDialog } from "./edit-sku-dialog";
import { IconCircleCheckFilled } from "@tabler/icons-react";

interface EnhancedSKUTableProps {
  // Remove the callback props since we'll handle them internally
}

export function EnhancedSKUTable({}: EnhancedSKUTableProps) {
  const {
    products,
    loading,
    error,
    fetchProducts,
    deleteSKU,
  } = useProductVariantsStore();

  // Local pagination state for SKUs
  const [skuCurrentPage, setSkuCurrentPage] = useState(1);
  const [skuItemsPerPage, setSkuItemsPerPage] = useState(7);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingSKU, setEditingSKU] = useState<(ProductSKU & { productName: string; variantName: string; variantId: string }) | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [skuToDelete, setSKUToDelete] = useState<string | null>(null);
  const [selectedSKUIds, setSelectedSKUIds] = useState<string[]>([]);

  // Flatten all SKUs from all products and variants
  const allSKUs = useMemo(() => {
    const skus: (ProductSKU & { 
      productName: string; 
      productId: string; 
      variantName: string; 
      variantId: string;
    })[] = [];
    
    products.forEach(product => {
      if (product.variants) {
        product.variants.forEach(variant => {
          if (variant.skus) {
            variant.skus.forEach(sku => {
              skus.push({
                ...sku,
                productName: product.name,
                productId: product.id,
                variantName: variant.name || `Variant ${variant.id.slice(-8)}`,
                variantId: variant.id,
              });
            });
          }
        });
      }
    });
    return skus;
  }, [products]);

  // Calculate pagination for SKUs
  const skuTotalItems = allSKUs.length;
  const skuTotalPages = Math.ceil(skuTotalItems / skuItemsPerPage);
  const startIndex = (skuCurrentPage - 1) * skuItemsPerPage;
  const endIndex = startIndex + skuItemsPerPage;
  const paginatedSKUs = allSKUs.slice(startIndex, endIndex);

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setSkuCurrentPage(page);
  };

  const handlePageSizeChange = (pageSize: number) => {
    setSkuItemsPerPage(pageSize);
    setSkuCurrentPage(1); // Reset to first page when page size changes
  };

  // Fetch products with variants and SKUs on component mount
  useEffect(() => {
    fetchProducts({ includeVariants: true, includeSKUs: true });
  }, [fetchProducts]);

  // Show error toast
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleDeleteSKU = async (id: string) => {
    try {
      await deleteSKU(id);
      toast.success("SKU deleted successfully");
      setDeleteDialogOpen(false);
      setSKUToDelete(null);
    } catch (error) {
      toast.error("Failed to delete SKU");
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedSKUIds.map(id => deleteSKU(id)));
      toast.success(`${selectedSKUIds.length} SKUs deleted successfully`);
      setBulkDeleteDialogOpen(false);
      setSelectedSKUIds([]);
    } catch (error) {
      toast.error("Failed to delete selected SKUs");
    }
  };

  const handleEditSKU = (sku: ProductSKU & { productName: string; variantName: string; variantId: string }) => {
    setEditingSKU(sku);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (id: string) => {
    setSKUToDelete(id);
    setDeleteDialogOpen(true);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const getStockStatus = (stock: number, lowStockAlert: number) => {
    if (stock === 0) return { status: 'out-of-stock', label: 'Out of Stock', color: 'destructive' };
    if (stock <= lowStockAlert) return { status: 'low-stock', label: 'Low Stock', color: 'default' };
    return { status: 'in-stock', label: 'In Stock', color: 'secondary' };
  };

  const columns: TableColumn<ProductSKU & { productName: string; variantName: string; variantId: string }>[] = [
    {
      key: "select",
      label: "",
      render: (sku) => (
        <Checkbox
          checked={selectedSKUIds.includes(sku.id)}
          onCheckedChange={(value) => {
            if (value) {
              setSelectedSKUIds(prev => [...prev, sku.id]);
            } else {
              setSelectedSKUIds(prev => prev.filter(id => id !== sku.id));
            }
          }}
          aria-label="Select row"
        />
      ),
    },
    {
      key: "sku",
      label: "SKU",
      render: (sku) => (
        <div className="flex items-center space-x-2">
          <div className="flex items-center justify-center w-8 h-8 bg-muted rounded">
            <Package className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <div className="font-medium font-mono text-sm">{sku.sku}</div>
            {sku.barcode && (
              <div className="text-xs text-muted-foreground font-mono">{sku.barcode}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "product",
      label: "Product & Variant",
      render: (sku) => (
        <div>
          <div className="font-medium text-sm">{sku.productName}</div>
          <div className="text-xs text-muted-foreground">{sku.variantName}</div>
        </div>
      ),
    },
    {
      key: "pricing",
      label: "Pricing",
      render: (sku) => (
        <div className="space-y-1">
          <div className="flex items-center space-x-1">
            <span className="font-medium">{formatPrice(sku.price)}</span>
          </div>
          {sku.comparePrice && sku.comparePrice > sku.price && (
            <div className="text-xs text-muted-foreground line-through">
              {formatPrice(sku.comparePrice)}
            </div>
          )}
          {sku.costPrice && (
            <div className="text-xs text-muted-foreground">
              Cost: {formatPrice(sku.costPrice)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "stock",
      label: "Stock",
      render: (sku) => {
        const stockStatus = getStockStatus(sku.stock, sku.lowStockAlert);
        return (
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Badge variant={stockStatus.color as any}>
                {stockStatus.label}
              </Badge>
              {stockStatus.status === 'low-stock' && (
                <AlertTriangle className="h-3 w-3 text-orange-500" />
              )}
            </div>
            <div className="text-sm">
              <span className="font-medium">{sku.stock}</span> units
              {sku.lowStockAlert && (
                <span className="text-xs text-muted-foreground ml-1">
                  (Alert: {sku.lowStockAlert})
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: "dimensions",
      label: "Details",
      render: (sku) => (
        <div className="text-xs text-muted-foreground space-y-1">
          {sku.weight && (
            <div>Weight: {sku.weight}g</div>
          )}
          {sku.dimensions && (
            <div>
              Dims: {JSON.stringify(sku.dimensions)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (sku) => (
        <Badge variant={"secondary"}>
            {sku.isActive ? <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400" /> : <IconCircleCheckFilled className="fill-red-500 dark:fill-red-400" /> }
          {sku.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      label: "Created",
      render: (sku) => {
        const date = new Date(sku.createdAt);
        return (
          <div className="text-sm text-muted-foreground">
            {date.toLocaleDateString()}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <DataTable
        title="SKU Management"
        data={paginatedSKUs}
        columns={columns}
        searchKeys={["sku", "barcode", "productName", "variantName"]}
        searchPlaceholder="Search by SKU, barcode, product or variant..."
        emptyMessage="No SKUs found"
        showCount={true}
        customHeader={
          <div className="flex items-center gap-2">
            {selectedSKUIds.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setBulkDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Selected ({selectedSKUIds.length})
              </Button>
            )}
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add SKU
            </Button>
          </div>
        }
        actions={(sku) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEditSKU(sku)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => openDeleteDialog(sku.id)}
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
        currentPage={skuCurrentPage}
        totalPages={skuTotalPages}
        pageSize={skuItemsPerPage}
        totalItems={skuTotalItems}
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
              SKU and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => skuToDelete && handleDeleteSKU(skuToDelete)}
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
            <AlertDialogTitle>Delete Selected SKUs</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedSKUIds.length} SKU(s)?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete {selectedSKUIds.length} SKU(s)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create SKU Dialog */}
      <CreateSKUDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />

      {/* Edit SKU Dialog */}
      <EditSKUDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        sku={editingSKU}
      />
    </div>
  );
}
