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
import {
  MoreHorizontal,
  Trash2,
  Edit,
  Plus,
  AlertTriangle,
  Printer,
} from "lucide-react";
import useProductVariantsStore, {
  type ProductSKU,
} from "@/stores/product-variants-store";
import { toast } from "sonner";
import PaginationTable from "@/components/pagination-table";
import { CreateSKUDialog } from "./create-sku-dialog";
import { EditSKUDialog } from "./edit-sku-dialog";
import { IconCircleCheckFilled } from "@tabler/icons-react";
import Link from "next/link";
import { useSearchQuery } from "@/hooks/use-search-query";
import { useLocale } from "@/components/local-lang-swither"; // your LocaleProvider hook
import { getMessages } from "@/lib/locale";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type EnhancedSKUTableProps = Record<string, never>;

export function EnhancedSKUTable({}: EnhancedSKUTableProps) {
  const [search, setSearch] = useSearchQuery("q", 400);
  const { products, loading, error, fetchProducts, deleteSKU } =
    useProductVariantsStore();

  const [skuCurrentPage, setSkuCurrentPage] = useState(1);
  const [skuItemsPerPage, setSkuItemsPerPage] = useState(7);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingSKU, setEditingSKU] = useState<
    | (ProductSKU & {
        productName: string;
        variantName: string;
        variantId: string;
      })
    | null
  >(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [skuToDelete, setSKUToDelete] = useState<string | null>(null);
  const [selectedSKUIds, setSelectedSKUIds] = useState<string[]>([]);
  const [printLabelsDialogOpen, setPrintLabelsDialogOpen] = useState(false);
  const [skuToPrint, setSKUToPrint] = useState<ProductSKU | null>(null);
  const [labelCount, setLabelCount] = useState(1);

  const { locale } = useLocale();
  const t = getMessages(locale);

  // Flatten all SKUs
  const allSKUs = useMemo(() => {
    const skus: (ProductSKU & {
      productName: string;
      productId: string;
      variantName: string;
      variantId: string;
    })[] = [];
    products.forEach((product) => {
      product.variants?.forEach((variant) => {
        variant.skus?.forEach((sku) => {
          skus.push({
            ...sku,
            productName: product.name,
            productId: product.id,
            variantName: variant.name || `Variant ${variant.id.slice(-8)}`,
            variantId: variant.id,
          });
        });
      });
    });
    return skus;
  }, [products]);

  const skuTotalItems = allSKUs.length;
  const skuTotalPages = Math.ceil(skuTotalItems / skuItemsPerPage);
  const startIndex = (skuCurrentPage - 1) * skuItemsPerPage;
  const endIndex = startIndex + skuItemsPerPage;
  const paginatedSKUs = allSKUs.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => setSkuCurrentPage(page);
  const handlePageSizeChange = (pageSize: number) => {
    setSkuItemsPerPage(pageSize);
    setSkuCurrentPage(1);
  };

  useEffect(() => {
    fetchProducts({ includeVariants: true, includeSKUs: true });
  }, [fetchProducts]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const handleDeleteSKU = async (id: string) => {
    try {
      await deleteSKU(id);
      toast.success(t.pages.skus.components.skuTable.toast.skuDeleted);
      setDeleteDialogOpen(false);
      setSKUToDelete(null);
    } catch (error) {
      toast.error(t.pages.skus.components.skuTable.toast.skuDeleteFailed);
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedSKUIds.map((id) => deleteSKU(id)));
      toast.success(
        t.pages.skus.components.skuTable.toast.bulkDeleted.replace(
          "{0}",
          selectedSKUIds.length.toString()
        )
      );
      setBulkDeleteDialogOpen(false);
      setSelectedSKUIds([]);
    } catch (error) {
      toast.error(t.pages.skus.components.skuTable.toast.bulkDeleteFailed);
    }
  };

  const handleEditSKU = (
    sku: ProductSKU & {
      productName: string;
      variantName: string;
      variantId: string;
    }
  ) => {
    setEditingSKU(sku);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (id: string) => {
    setSKUToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handlePrintLabels = (sku: ProductSKU) => {
    setSKUToPrint(sku);
    setLabelCount(1);
    setPrintLabelsDialogOpen(true);
  };

  const confirmPrintLabels = () => {
    if (!skuToPrint) return;

    // Generate barcode labels for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error(t.pages.skus.components.skuTable.printLabels.allowPopupsMessage);
      return;
    }

    // Create single label template for thermal printer (XP-360B - 80mm width, 203 dpi)
    // The printer will handle multiple copies based on user's print settings
    const labelTemplate = `
      <div class="label" style="
        width: 80mm;
        padding: 8mm 4mm;
        page-break-inside: avoid;
        display: block;
        box-sizing: border-box;
      ">
        <div style="
          text-align: center;
          font-size: 14px;
          font-weight: bold;
          font-family: 'Courier New', monospace;
          margin-bottom: 4mm;
          letter-spacing: 1px;
        ">
          ${skuToPrint.sku}
        </div>
        <div style="
          text-align: center;
          margin: 3mm 0;
        ">
          <svg id="barcode"></svg>
        </div>
        <div style="
          text-align: center;
          font-size: 11px;
          font-family: 'Courier New', monospace;
          color: #333;
          margin-top: 2mm;
        ">
          ${skuToPrint.barcode || skuToPrint.sku}
        </div>
      </div>
    `;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Labels - ${skuToPrint.sku}</title>
          <meta charset="UTF-8">
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }

            @page {
              size: 80mm auto;
              margin: 0;
            }

            @media print {
              body {
                margin: 0;
                padding: 0;
              }
            }

            body {
              font-family: 'Courier New', monospace;
              margin: 0;
              padding: 0;
              width: 80mm;
            }
          </style>
        </head>
        <body>
          ${labelTemplate}
          <script>
            window.onload = function() {
              // Generate barcode
              JsBarcode("#barcode", "${skuToPrint.barcode || skuToPrint.sku}", {
                format: "CODE128",
                width: 2,
                height: 50,
                displayValue: false,
                margin: 0,
                fontSize: 14
              });

              // Open print dialog - user will set number of copies to ${labelCount}
              setTimeout(() => {
                window.print();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
    setPrintLabelsDialogOpen(false);
    toast.success(
      t.pages.skus.components.skuTable.printLabels.printingMessage
        .replace('{count}', labelCount.toString())
        .replace('{sku}', skuToPrint.sku)
    );
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "MAD",
    }).format(price);

  const getStockStatus = (stock: number, lowStockAlert: number) => {
    if (stock === 0)
      return {
        status: "out-of-stock",
        label: t.pages.skus.components.skuTable.stock.outOfStock,
        color: "destructive",
      };
    if (stock <= lowStockAlert)
      return {
        status: "low-stock",
        label: t.pages.skus.components.skuTable.stock.lowStock,
        color: "secondary",
      };
    return {
      status: "in-stock",
      label: t.pages.skus.components.skuTable.stock.inStock,
      color: "secondary",
    };
  };

  const columns: TableColumn<
    ProductSKU & { productName: string; variantName: string; variantId: string }
  >[] = [
    {
      key: "select",
      label: "",
      render: (sku) => (
        <Checkbox
          checked={selectedSKUIds.includes(sku.id)}
          onCheckedChange={(value) =>
            value
              ? setSelectedSKUIds((prev) => [...prev, sku.id])
              : setSelectedSKUIds((prev) => prev.filter((id) => id !== sku.id))
          }
          aria-label={t.pages.skus.components.skuTable.table.selectRow}
        />
      ),
    },
    {
      key: "sku",
      label: t.pages.skus.components.skuTable.table.sku,
      render: (sku) => (
        <div className="flex items-center space-x-2">
          <div className="flex items-center justify-center  max-w-80 bg-muted rounded">
            <img
              src={sku?.images?.[0]?.url || "/placeholder-image.png"}
              alt={sku.sku}
              className="w-10 aspect-auto object-cover rounded-md"
            />
          </div>
          <div>
            <div className="font-medium font-mono text-sm">{sku.sku}</div>
            {sku.barcode && (
              <div className="text-xs text-muted-foreground font-mono">
                {sku.barcode}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "product",
      label: t.pages.skus.components.skuTable.table.productVariant,
      render: (sku) => (
        <div>
          <div className="font-medium truncate max-w-80 text-sm">
            <Link
              className="hover:underline transition-all duration-500 ease-in-out"
              href={`/dashboard/products?q=${sku.productName}`}
            >
              {sku.productName}
            </Link>
          </div>
          <div className="text-xs text-muted-foreground">{sku.variantName}</div>
        </div>
      ),
    },
    {
      key: "pricing",
      label: t.pages.skus.components.skuTable.table.pricing,
      render: (sku) => (
        <div className="space-y-1">
          <div className="flex items-center space-x-1">
            <span className="font-medium">{formatPrice(sku.price)}</span>
          </div>
        </div>
      ),
    },
    {
      key: "stock",
      label: t.pages.skus.components.skuTable.table.stock,
      render: (sku) => {
        const stockStatus = getStockStatus(sku.stock, sku.lowStockAlert);
        return (
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Badge variant={stockStatus.color as "default" | "destructive" | "outline" | "secondary"}>
                {stockStatus.label}
              </Badge>
              {stockStatus.status === "low-stock" && (
                <AlertTriangle className="h-3 w-3 text-orange-500" />
              )}
            </div>
            <div className="text-sm">
              <span className="font-medium">{sku.stock}</span>{" "}
              {t.pages.skus.components.skuTable.table.units}
              {sku.lowStockAlert && (
                <span className="text-xs text-muted-foreground ml-1">
                  ({t.pages.skus.components.skuTable.table.alert}:{" "}
                  {sku.lowStockAlert})
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: "dimensions",
      label: t.pages.skus.components.skuTable.table.details,
      render: (sku) => (
        <div className="text-xs text-muted-foreground space-y-1">
          {sku.weight && (
            <div>
              {t.pages.skus.components.skuTable.table.weight}: {sku.weight}g
            </div>
          )}
          {sku.dimensions && (
            <div>
              {t.pages.skus.components.skuTable.table.dimensions}:{" "}
              {JSON.stringify(sku.dimensions)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "status",
      label: t.pages.skus.components.skuTable.table.status,
      render: (sku) => (
        <Badge variant={"secondary"}>
          {sku.isActive ? (
            <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400" />
          ) : (
            <IconCircleCheckFilled className="fill-red-500 dark:fill-red-400" />
          )}
          {sku.isActive
            ? t.pages.skus.components.skuTable.table.active
            : t.pages.skus.components.skuTable.table.inactive}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      label: t.pages.skus.components.skuTable.table.created,
      render: (sku) => {
        const date = new Date(sku.createdAt);
        const formatter = new Intl.DateTimeFormat(locale, {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        // => 2025年9月22日

        return (
          <div className="text-sm text-muted-foreground">
            {formatter.format(date)}
          </div>
        );
      },
    },
    {
      key: "actions",
      label: t.pages.skus.components.skuTable.table.actions,
      render: (sku) => {
        return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">
              {t.pages.skus.components.skuTable.table.openMenu}
            </span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleEditSKU(sku)}>
            <Edit className="mr-2 h-4 w-4" />
            {t.pages.skus.components.skuTable.table.edit}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handlePrintLabels(sku)}>
            <Printer className="mr-2 h-4 w-4" />
            {t.pages.skus.components.skuTable.printLabels.menuItem}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => openDeleteDialog(sku.id)}
            className="text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {t.pages.skus.components.skuTable.table.delete}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
        );
      },
    },

    
  ];

  useEffect(() => {
    fetchProducts({ search });
  }, [search, fetchProducts]);

  return (
    <div className="space-y-4">
      <DataTable
        title={t.pages.skus.components.skuTable.title}
        data={paginatedSKUs}
        columns={columns}
        searchValue={search}
        onSearchChange={setSearch}
        searchKeys={["sku", "barcode", "productName", "variantName"]}
        searchPlaceholder={
          t.pages.skus.components.skuTable.table.searchPlaceholder
        }
        emptyMessage={t.pages.skus.components.skuTable.table.empty}
        showCount
        customHeader={
          <div className="flex items-center gap-2">
            {selectedSKUIds.length > 0 && (
              <Button
                variant="destructive"
                onClick={() => setBulkDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t.pages.skus.components.skuTable.table.deleteSelected.replace(
                  "{0}",
                  selectedSKUIds.length.toString()
                )}
              </Button>
            )}
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t.pages.skus.components.skuTable.table.addSKU}
            </Button>
          </div>
        }
       
      />

      <PaginationTable
        currentPage={skuCurrentPage}
        totalPages={skuTotalPages}
        pageSize={skuItemsPerPage}
        totalItems={skuTotalItems}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t.pages.skus.components.skuTable.dialogs.deleteTitle}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t.pages.skus.components.skuTable.dialogs.deleteDesc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t.pages.skus.components.skuTable.dialogs.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => skuToDelete && handleDeleteSKU(skuToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              {t.pages.skus.components.skuTable.dialogs.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete */}
      <AlertDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t.pages.skus.components.skuTable.dialogs.bulkDeleteTitle}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t.pages.skus.components.skuTable.dialogs.bulkDeleteDesc.replace(
                "{0}",
                selectedSKUIds.length.toString()
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t.pages.skus.components.skuTable.dialogs.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {t.pages.skus.components.skuTable.dialogs.delete}{" "}
              {selectedSKUIds.length}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create & Edit */}
      <CreateSKUDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
      <EditSKUDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        sku={editingSKU}
      />

      {/* Print Labels Dialog */}
      <Dialog open={printLabelsDialogOpen} onOpenChange={setPrintLabelsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t.pages.skus.components.skuTable.printLabels.dialogTitle}</DialogTitle>
            <DialogDescription>
              {t.pages.skus.components.skuTable.printLabels.dialogDescription.replace('{sku}', skuToPrint?.sku || '')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">
                {t.pages.skus.components.skuTable.printLabels.quantity}
              </Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max="100"
                value={labelCount}
                onChange={(e) => setLabelCount(parseInt(e.target.value) || 1)}
                className="col-span-3"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <div className="font-medium mb-1">SKU: {skuToPrint?.sku}</div>
              <div>Barcode: {skuToPrint?.barcode || skuToPrint?.sku}</div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPrintLabelsDialogOpen(false)}>
              {t.pages.skus.components.skuTable.printLabels.cancel}
            </Button>
            <Button onClick={confirmPrintLabels}>
              <Printer className="mr-2 h-4 w-4" />
              {t.pages.skus.components.skuTable.printLabels.printButton.replace('{count}', labelCount.toString())}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
