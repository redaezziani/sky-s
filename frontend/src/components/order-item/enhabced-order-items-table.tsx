"use client";

import { useState, useEffect } from "react";
import { DataTable, TableColumn } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
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
import { MoreHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useOrderItemsStore, OrderItem } from "@/stores/order-items-store";
import { useLocale } from "@/components/local-lang-swither";
import { getMessages } from "@/lib/locale";

interface EnhancedOrderItemsTableProps {
  orderId?: string;
}

export function EnhancedOrderItemsTable({
  orderId,
}: EnhancedOrderItemsTableProps) {
  const {
    items,
    loading,
    error,
    selectedItems,
    fetchItems,
    deleteItem,
    bulkDeleteItems,
    selectItem,
    clearError,
  } = useOrderItemsStore();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const { locale } = useLocale();
  const t = getMessages(locale).pages.orderItems.components.orderItemsTable;

  useEffect(() => {
    fetchItems(orderId);
  }, [orderId, fetchItems]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const handleDeleteItem = async (id: string) => {
    try {
      await deleteItem(id);
      toast.success(t.toast.itemDeleted);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    } catch {
      toast.error(t.toast.itemDeleteFailed);
    }
  };

  const handleBulkDelete = async () => {
    try {
      await bulkDeleteItems(selectedItems);
      toast.success(
        t.toast.bulkDeleted.replace("{0}", selectedItems.length.toString())
      );
      setBulkDeleteDialogOpen(false);
    } catch {
      toast.error(t.toast.bulkDeleteFailed);
    }
  };

  const columns: TableColumn<OrderItem>[] = [
    {
      key: "select",
      label: "",
      render: (item) => (
        <Checkbox
          checked={selectedItems.includes(item.id)}
          onCheckedChange={() => selectItem(item.id)}
          aria-label={t.table.selectRow}
        />
      ),
    },
    {
      key: "orderNumber",
      label: t.table.orderNumber,
      render: (item) => (
        <div className="flex flex-col">
          <span className="font-medium">{item.orderNumber}</span>
          <span className="text-sm text-muted-foreground">{item.orderId}</span>
        </div>
      ),
    },
    {
      key: "sku",
      label: t.table.sku,
      render: (item) => (
        <div className="flex flex-col">
          <span className="font-medium">{item.skuCode}</span>
          <span className="text-sm text-muted-foreground">
            {item.productName}
          </span>
        </div>
      ),
    },
    {
      key: "quantity",
      label: t.table.quantity,
      render: (item) => <span>{item.quantity}</span>,
    },
    {
      key: "unitPrice",
      label: t.table.unitPrice,
      render: (item) =>
        new Intl.NumberFormat(locale === "ja" ? "ja-JP" : "en-US", {
          style: "currency",
          currency: "USD",
        }).format(item.unitPrice),
    },
    {
      key: "totalPrice",
      label: t.table.totalPrice,
      render: (item) =>
        new Intl.NumberFormat(locale === "ja" ? "ja-JP" : "en-US", {
          style: "currency",
          currency: "USD",
        }).format(item.totalPrice),
    },
    {
      key: "actions",
      label: t.table.actions,
      render: (item) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => {
                setItemToDelete(item.id);
                setDeleteDialogOpen(true);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t.dialogs.delete}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <DataTable
        title={t.title}
        data={items}
        columns={columns}
        searchKeys={["skuCode", "productName"]}
        searchPlaceholder={t.table.searchPlaceholder}
        emptyMessage={t.table.empty}
        showCount
        customHeader={
          selectedItems.length > 0 && (
            <Button
              variant="destructive"
              onClick={() => setBulkDeleteDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {t.table.deleteSelected.replace(
                "{0}",
                selectedItems.length.toString()
              )}
            </Button>
          )
        }
      />

      {/* Single Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.dialogs.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.dialogs.deleteDesc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.dialogs.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              onClick={() => itemToDelete && handleDeleteItem(itemToDelete)}
            >
              {t.dialogs.delete}
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
              {t.dialogs.bulkDeleteTitle.replace(
                "{0}",
                selectedItems.length.toString()
              )}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t.dialogs.bulkDeleteDesc.replace(
                "{0}",
                selectedItems.length.toString()
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.dialogs.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {t.dialogs.delete} {selectedItems.length}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
