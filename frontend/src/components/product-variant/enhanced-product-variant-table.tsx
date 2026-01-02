'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { MoreHorizontal, Trash2, Edit, Plus, Package } from 'lucide-react';
import useProductVariantsStore, {
  type ProductVariant,
} from '@/stores/product-variants-store';
import { toast } from 'sonner';
import { CreateProductVariantDialog } from '@/components/product-variant/create-product-variant-dialog';
import { EditProductVariantDialog } from '@/components/product-variant/edit-product-variant-dialog';
import PaginationTable from '@/components/pagination-table';
import { IconCircleCheckFilled } from '@tabler/icons-react';
import Link from 'next/link';
import { useSearchQuery } from '@/hooks/use-search-query';
import { useLocale } from '@/components/local-lang-swither';
import { getMessages } from '@/lib/locale';

type EnhancedProductVariantTableProps = Record<string, never>;

export function EnhancedProductVariantTable({}: EnhancedProductVariantTableProps) {
  const { products, loading, error, fetchProducts, deleteVariant } =
    useProductVariantsStore();
  const { locale } = useLocale();
  const lang = getMessages(locale);
  const t = lang.pages?.variants?.components?.variantTable || {};
  const tCommon = lang.pages?.common || {};

  // Local pagination state for variants
  const [variantCurrentPage, setVariantCurrentPage] = useState(1);
  const [variantItemsPerPage, setVariantItemsPerPage] = useState(8);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingProductVariant, setEditingProductVariant] = useState<
    (ProductVariant & { productName: string; productId: string }) | null
  >(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [productVariantToDelete, setProductVariantToDelete] = useState<
    string | null
  >(null);
  const [search, setSearch] = useSearchQuery('q', 400);
  const [selectedVariantIds, setSelectedVariantIds] = useState<string[]>([]);

  // Flatten all variants from all products
  const allVariants = useMemo(() => {
    const variants: (ProductVariant & {
      productName: string;
      productId: string;
    })[] = [];
    products.forEach((product) => {
      if (product.variants) {
        product.variants.forEach((variant) => {
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
      toast.success(t.toast?.deleted || 'Product variant deleted successfully');
      setDeleteDialogOpen(false);
      setProductVariantToDelete(null);
    } catch (error) {
      toast.error(t.toast?.deleteFailed || 'Failed to delete product variant');
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedVariantIds.map((id) => deleteVariant(id)));
      toast.success(
        t.toast?.bulkDeleted?.replace(
          '{0}',
          String(selectedVariantIds.length),
        ) ||
          `${selectedVariantIds.length} product variants deleted successfully`,
      );
      setBulkDeleteDialogOpen(false);
      setSelectedVariantIds([]);
    } catch (error) {
      toast.error(
        t.toast?.bulkDeleteFailed ||
          'Failed to delete selected product variants',
      );
    }
  };

  const handleEditProductVariant = (
    productVariant: ProductVariant & { productName: string; productId: string },
  ) => {
    setEditingProductVariant(productVariant);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (id: string) => {
    setProductVariantToDelete(id);
    setDeleteDialogOpen(true);
  };

  const columns: TableColumn<
    ProductVariant & { productName: string; productId: string }
  >[] = [
    {
      key: 'select',
      label: '',
      render: (variant) => (
        <Checkbox
          checked={selectedVariantIds.includes(variant.id)}
          onCheckedChange={(value) => {
            if (value) {
              setSelectedVariantIds((prev) => [...prev, variant.id]);
            } else {
              setSelectedVariantIds((prev) =>
                prev.filter((id) => id !== variant.id),
              );
            }
          }}
          aria-label={t.table?.selectRow || 'Select row'}
        />
      ),
    },
    {
      key: 'name',
      label: t.table?.name || 'Name',
      render: (variant) => (
        <div className="flex items-center space-x-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium line-clamp-1 truncate">
              {variant.name || `Variant ${variant.id.slice(-8)}`}
            </div>
            <div className="text-sm truncate max-w-80 text-muted-foreground">
              <Link
                className="hover:underline transition-all duration-500 ease-in-out"
                href={`/dashboard/products?q=${variant.productName}`}
              >
                {variant.productName ||
                  tCommon.unknownProduct ||
                  'Unknown Product'}
              </Link>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'attributes',
      label: t.table?.attributes || 'Attributes',
      render: (variant) => {
        const attributes = variant.attributes;
        if (!attributes || Object.keys(attributes).length === 0) {
          return (
            <span className="text-muted-foreground">
              {tCommon.noAttributes || 'No attributes'}
            </span>
          );
        }

        const entries = Object.entries(attributes);
        const displayedEntries = entries.slice(0, 1);
        const remainingCount = entries.length - 1;

        return (
          <div className="flex flex-wrap gap-1">
            {displayedEntries.map(([key, value]) => (
              <Badge key={key} variant="secondary" className="text-xs">
                {key}: {String(value)}
              </Badge>
            ))}
            {remainingCount > 0 && (
              <Badge variant="secondary" className="text-xs md:hidden">
                +{remainingCount}
              </Badge>
            )}
            {entries.slice(2).map(([key, value]) => (
              <Badge
                key={key}
                variant="secondary"
                className="hidden text-xs md:inline-flex"
              >
                {key}: {String(value)}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      key: 'skuCount',
      label: t.table?.skus || 'SKUs',
      render: (variant) => {
        const count = variant.skus?.length || 0;
        return (
          <Badge variant={'secondary'}>
            {count} SKU{count !== 1 ? 's' : ''}
          </Badge>
        );
      },
    },
    {
      key: 'isActive',
      label: t.table?.status || 'Status',
      render: (variant) => {
        const isActive = variant.isActive;
        return (
          <Badge variant={'secondary'}>
            {isActive ? (
              <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400" />
            ) : (
              <IconCircleCheckFilled className="fill-red-500 dark:fill-red-400" />
            )}
            {isActive
              ? t.table?.active || 'Active'
              : t.table?.inactive || 'Inactive'}
          </Badge>
        );
      },
    },
    {
      key: 'sortOrder',
      label: 'Sort Order',
      render: (variant) => variant.sortOrder,
    },
    {
      key: 'createdAt',
      label: t.table?.created || 'Created',
      render: (variant) => {
        const date = new Date(variant.createdAt);
        return date.toLocaleDateString();
      },
    },
    {
      key: 'actions',
      label: t.table?.actions || 'Actions',
      render: (variant) => (
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
            <DropdownMenuItem onClick={() => handleEditProductVariant(variant)}>
              <Edit className="mr-2 h-4 w-4" />
              {t.table?.edit || 'Edit'}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => openDeleteDialog(variant.id)}
              className="text-red-600"
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
        title={t.title || 'Product Variants'}
        columns={columns}
        data={paginatedVariants}
        searchKeys={['name', 'productName']}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t.table?.searchPlaceholder || 'Search variants...'}
        customHeader={
          <div className="flex gap-2 items-center justify-between">
            <div className="flex items-center gap-2 space-x-2">
              <Checkbox
                checked={
                  selectedVariantIds.length === paginatedVariants.length &&
                  paginatedVariants.length > 0
                }
                onCheckedChange={(value) => {
                  if (value) {
                    setSelectedVariantIds(paginatedVariants.map((v) => v.id));
                  } else {
                    setSelectedVariantIds([]);
                  }
                }}
                aria-label="Select all"
              />
              <span className="text-sm text-muted-foreground">
                {selectedVariantIds.length > 0
                  ? `${selectedVariantIds.length} selected`
                  : 'Select all'}
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
              {t.table?.addVariant || 'Add Product Variant'}
            </Button>
          </div>
        }
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
            <AlertDialogTitle>
              {t.dialogs?.deleteTitle || 'Are you sure?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t.dialogs?.deleteDesc ||
                'This action cannot be undone. This will permanently delete the product variant and all associated data.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t.dialogs?.cancel || 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                productVariantToDelete &&
                handleDeleteProductVariant(productVariantToDelete)
              }
              className="bg-red-600 hover:bg-red-700"
            >
              {t.dialogs?.delete || 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t.dialogs?.bulkDeleteTitle || 'Delete Selected Product Variants'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t.dialogs?.bulkDeleteDesc?.replace(
                '{0}',
                String(selectedVariantIds.length),
              ) ||
                `Are you sure you want to delete ${selectedVariantIds.length} product variant(s)? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t.dialogs?.cancel || 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {t.dialogs?.delete || 'Delete'} {selectedVariantIds.length}
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
