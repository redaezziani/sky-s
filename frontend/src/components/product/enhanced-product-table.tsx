'use client';

import { useState, useEffect } from 'react';
import { DataTable, TableColumn } from '@/components/shared/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  MoreHorizontal,
  Trash2,
  Edit,
  Package,
  Star,
  Eye,
} from 'lucide-react';
import { useProductsStore, type Product } from '@/stores/products-store';
import { toast } from 'sonner';
import { CreateProductDialog } from '@/components/product/create-product-dialog';
import { EditProductDialog } from '@/components/product/edit-product-dialog';
import PaginationTable from '@/components/pagination-table';
import { useSearchQuery } from '@/hooks/use-search-query';
import { IconCircleCheckFilled } from '@tabler/icons-react';
import Link from 'next/link';
import { useLocale } from '@/components/local-lang-swither';
import { getMessages } from '@/lib/locale';

type EnhancedProductTableProps = Record<string, never>;

export function EnhancedProductTable({}: EnhancedProductTableProps) {
  const [search, setSearch] = useSearchQuery('q', 400);
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

  const { locale } = useLocale();
  const lang = getMessages(locale);
  const t = lang.pages?.products?.components?.productTable || {};
  const tCommon = lang.pages?.common || {};

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
      toast.success(t.toast?.deleted || 'Product deleted successfully');
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    } catch (error) {
      toast.error(t.toast?.deleteFailed || 'Failed to delete product');
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await toggleProductStatus(id);
      toast.success(
        t.toast?.statusUpdated || 'Product status updated successfully',
      );
    } catch (error) {
      toast.error(
        t.toast?.statusUpdateFailed || 'Failed to update product status',
      );
    }
  };

  const handleToggleFeatured = async (id: string) => {
    try {
      await toggleProductFeatured(id);
      toast.success(
        t.toast?.featuredUpdated ||
          'Product featured status updated successfully',
      );
    } catch (error) {
      toast.error(
        t.toast?.featuredUpdateFailed ||
          'Failed to update product featured status',
      );
    }
  };

  const handleBulkDelete = async () => {
    try {
      await bulkDeleteProducts(selectedProducts);
      toast.success(
        t.toast?.bulkDeleted?.replace('{0}', String(selectedProducts.length)) ||
          `${selectedProducts.length} products deleted successfully`,
      );
      setBulkDeleteDialogOpen(false);
    } catch (error) {
      toast.error(t.toast?.bulkDeleteFailed || 'Failed to delete products');
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
    if (price === undefined) return 'N/A';
    return new Intl.NumberFormat('ar-MA', {
      style: 'currency',
      currency: 'MAD',
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
      key: 'select',
      // @ts-expect-error - Type mismatch handled at runtime
      label: (
        <Checkbox
          checked={
            selectedProducts.length === products.length && products.length > 0
          }
          onCheckedChange={(checked) => handleSelectAll(!!checked)}
          aria-label={t.table?.selectAll || 'Select all products'}
        />
      ),
      render: (product) => (
        <Checkbox
          checked={selectedProducts.includes(product.id)}
          onCheckedChange={() => selectProduct(product.id)}
          aria-label={t.table?.selectRow || 'Select product'}
        />
      ),
    },
    {
      key: 'product',
      label: t.table?.product || 'Product',
      render: (product) => {
        // Get first SKU from first variant
        const firstVariant = product.variants?.[0];
        const firstSKU = firstVariant?.skus?.[0];
        return (
          <div className="flex items-center max-w-32 md:max-w-80 gap-3">
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
                className="font-medium line-clamp-1 truncate"
              >
                {product.name}
              </Link>
              <div className="text-xs line-clamp-1 truncate text-muted-foreground">
                {product.slug}
              </div>
              {firstSKU && (
                <div className="text-xs text-muted-foreground">
                  SKU: {firstSKU.sku}
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'price',
      label: t.table?.price || 'Price',
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
              <span className="text-muted-foreground">
                {t.table?.noPricing || 'no pricing'}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'stock',
      label: t.table?.stock || 'Stock',
      render: (product) => {
        // Show stock from first SKU if available
        const firstVariant = product.variants?.[0];
        const firstSKU = firstVariant?.skus?.[0];
        const stock = firstSKU?.stock;
        return (
          <div className="text-sm">
            {stock !== undefined ? (
              <span className={stock > 0 ? '' : 'text-red-600'}>
                {stock} {t.table?.units || 'units'}
              </span>
            ) : (
              <span className="text-muted-foreground">
                {t.table?.noStock || 'no stock'}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'variants',
      label: t.table?.variants || 'Variants',
      render: (product) => (
        <div className="text-sm text-muted-foreground">
          {product.variants?.length || 0} {t.table?.variantsLabel || 'variants'}
        </div>
      ),
    },
    {
      key: 'status',
      label: t.table?.status || 'Status',
      render: (product) => (
        <div className="flex items-center gap-2">
          <Badge variant={'secondary'}>
            {product.isActive ? (
              <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400" />
            ) : (
              <IconCircleCheckFilled className="fill-red-500 dark:fill-red-400" />
            )}
            {product.isActive
              ? t.table?.active || 'Active'
              : t.table?.inactive || 'Inactive'}
          </Badge>
          {product.isFeatured && (
            <Badge variant="secondary" className="text-xs">
              <Star className="w-3 h-3 mr-1 stroke-orange-300 fill-orange-300 dark:fill-orange-300" />
              {t.table?.featured || 'Featured'}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'metrics',
      label: t.table?.performance || 'Performance',
      render: (product) => (
        <div className="text-xs text-muted-foreground">
          <div className="space-y-1">
            <div>
              {t.table?.skus || 'SKUs'}:{' '}
              {product.variants?.reduce(
                (total, variant) => total + (variant.skus?.length || 0),
                0,
              ) || 0}
            </div>
            <div>
              {t.table?.stock || 'Stock'}: {getTotalStock(product)}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'createdAt',
      label: t.table?.created || 'Created',
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
      key: 'actions',
      label: t.table?.actions || 'Actions',
      render: (product) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">
                {t.table?.openMenu || 'Open menu'}
              </span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEditProduct(product)}>
              <Edit className="mr-2 h-4 w-4" />
              {t.table?.edit || 'Edit'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleToggleStatus(product.id)}>
              <Eye className="mr-2 h-4 w-4" />
              {product.isActive
                ? t.table?.deactivate || 'Deactivate'
                : t.table?.activate || 'Activate'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleToggleFeatured(product.id)}>
              <Star className="mr-2 h-4 w-4" />
              {product.isFeatured
                ? t.table?.unfeature || 'Unfeature'
                : t.table?.feature || 'Feature'}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setProductToDelete(product.id);
                setDeleteDialogOpen(true);
              }}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t.table?.delete || 'Delete'}
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
        title={t.title || 'Product Management'}
        data={products}
        columns={columns}
        searchKeys={['name', 'slug', 'description']}
        searchPlaceholder={
          t.table?.searchPlaceholder ||
          'Search products by name, slug, or description...'
        }
        emptyMessage={t.table?.empty || 'No products found'}
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
                {t.table?.deleteSelected?.replace(
                  '{0}',
                  String(selectedProducts.length),
                ) || `Delete Selected (${selectedProducts.length})`}
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
            <AlertDialogTitle>
              {t.dialogs?.deleteTitle || 'Are you sure?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t.dialogs?.deleteDesc ||
                'This action cannot be undone. This will permanently delete the product and all its variants and SKUs.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t.dialogs?.cancel || 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                productToDelete && handleDeleteProduct(productToDelete)
              }
            >
              {t.dialogs?.delete || 'Delete'}
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
              {t.dialogs?.bulkDeleteTitle?.replace(
                '{0}',
                String(selectedProducts.length),
              ) || `Delete ${selectedProducts.length} products?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t.dialogs?.bulkDeleteDesc ||
                'This action cannot be undone. This will permanently delete the selected products and all their variants and SKUs.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t.dialogs?.cancel || 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete}>
              {t.dialogs?.deleteAll || 'Delete All'}
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
