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
import { MoreHorizontal, Trash2, Package, CloudDownload } from "lucide-react";
import { useOrdersStore, type Order } from "@/stores/orders-store";
import { toast } from "sonner";
import PaginationTable from "@/components/pagination-table";
import { useSearchQuery } from "@/hooks/use-search-query";
import OrderDetails from "./order-details";
import { CreateOrderDialog } from "./create-order-dialog";
import UpdateOrderSheet from "./edit-order-sheet";
import { IconCircleCheckFilled } from "@tabler/icons-react";
import { useLocale } from "@/components/local-lang-swither";
import { getMessages } from "@/lib/locale";

export function EnhancedOrderTable() {
  const [search, setSearch] = useSearchQuery("q", 400);
  const {
    orders,
    loading,
    error,
    selectedOrders,
    total,
    currentPage,
    pageSize,
    totalPages,
    fetchOrders,
    deleteOrder,
    bulkDeleteOrders,
    selectOrder,
    clearError,
    setPage,
    setPageSize,
    cancelOrder,
  } = useOrdersStore();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);

  const { locale } = useLocale();
  const t = getMessages(locale).pages.orders;

  useEffect(() => {
    fetchOrders({ search });
  }, [search, fetchOrders]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const handleDeleteOrder = async (id: string) => {
    try {
      await deleteOrder(id);
      toast.success(t.toast?.success ?? "Order deleted successfully");
      setDeleteDialogOpen(false);
      setOrderToDelete(null);
    } catch {
      toast.error(t.toast?.failed ?? "Failed to delete order");
    }
  };

  const handelOrderCancel = async (orderId: string, userId: string) => {
    try {
      await cancelOrder(orderId, userId);
      toast.success(t.toast?.cancelled ?? "Order cancelled successfully");
    } catch {
      toast.error(t.toast?.cancelFailed ?? "Failed to cancel order");
    }
  };

  const handleBulkDelete = async () => {
    try {
      await bulkDeleteOrders(selectedOrders);
      toast.success(
        t.toast?.bulkDeleted?.replace(
          "{0}",
          selectedOrders.length.toString()
        ) || `${selectedOrders.length} orders deleted successfully`
      );
      setBulkDeleteDialogOpen(false);
    } catch {
      toast.error(t.toast?.bulkDeleteFailed ?? "Failed to delete orders");
    }
  };

  const formatCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat(locale === "ja" ? "ja-JP" : "en-US", {
      style: "currency",
      currency,
    }).format(amount);

  const getOrderStatusLabel = (status: string) =>
    t.updateOrder?.fields?.status?.[status] || status;

  const getPaymentStatusLabel = (status: string) =>
    t.updateOrder?.fields?.paymentStatus?.[status] || status;

  // handle  invoiceUrl column

  const handleInvoiceClick = (url: string | undefined) => {
    if (url) {
      window.open(url, "_blank");
    } else {
      toast.error(t.toast?.noInvoice ?? "No invoice available");
    }
  };

  const columns: TableColumn<Order>[] = [
    {
      key: "select",
      label: "",
      render: (order) => (
        <Checkbox
          checked={selectedOrders.includes(order.id)}
          onCheckedChange={() => selectOrder(order.id)}
          aria-label={
            t.components?.ordersTable?.table?.selectRow ?? "Select order"
          }
        />
      ),
    },
    {
      key: "orderNumber",
      label: t.components?.ordersTable?.table?.orderNumber ?? "Order",
      render: (order) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center">
            <Package className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium">#{order.orderNumber}</span>
            <span className="text-xs text-muted-foreground">
              {t.updateOrder?.fields?.shippingName ?? "User"}:{" "}
              {order.shippingName} - {order.shippingEmail}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: t.components?.ordersTable?.table?.status ?? "Status",
      render: (order) => (
        <Badge variant="secondary" className="flex items-center gap-1">
          <IconCircleCheckFilled
            className={`${
              order.status === "PENDING"
                ? "fill-yellow-500"
                : order.status === "SHIPPED"
                ? "fill-blue-500"
                : order.status === "DELIVERED"
                ? "fill-green-400"
                : order.status === "CANCELLED"
                ? "fill-red-500"
                : "fill-gray-500"
            } `}
          />
          {getOrderStatusLabel(order.status)}
        </Badge>
      ),
    },
    {
      key: "paymentStatus",
      label: t.components?.ordersTable?.table?.paymentStatus ?? "Payment",
      render: (order) => (
        <Badge variant="secondary" className="flex items-center gap-1">
          <IconCircleCheckFilled
            className={`${
              order.paymentStatus === "COMPLETED"
                ? "fill-green-400"
                : order.paymentStatus === "FAILED"
                ? "fill-red-500"
                : "fill-gray-500"
            }  `}
          />
          {getPaymentStatusLabel(order.paymentStatus)}
        </Badge>
      ),
    },
    {
      key: "totalAmount",
      label: t.components?.ordersTable?.table?.total ?? "Total",
      render: (order) => (
        <span className="font-medium">
          {formatCurrency(order.totalAmount, order.currency)}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: t.components?.ordersTable?.table?.createdAt ?? "Created",
      render: (order) => (
        <span className="text-sm text-muted-foreground">
          {new Date(order.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      label: t.components?.ordersTable?.table?.actions ?? "Actions",
      render: (order) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <OrderDetails order={order} />
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <UpdateOrderSheet order={order} />
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleInvoiceClick(order.invoiceUrl)}
              disabled={!order.invoiceUrl}
            >
              <CloudDownload className={`mr-2 h-4 w-4 `} />
              {t.components?.ordersTable?.table?.viewInvoice ?? "View Invoice"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handelOrderCancel(order.id, order.userId)}
              disabled={order.status === "CANCELLED"}
            >
              <Package className="mr-2 h-4 w-4" />
              {t.components?.ordersTable?.table?.cancelOrder ?? "Cancel Order"}
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => {
                setOrderToDelete(order.id);
                setDeleteDialogOpen(true);
              }}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t.components?.ordersTable?.dialogs?.delete ?? "Delete"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <DataTable
        title={t.title ?? "Order Management"}
        data={orders}
        columns={columns}
        searchKeys={["orderNumber", "shippingName", "status", "paymentStatus"]}
        searchPlaceholder={
          t.components?.ordersTable?.table?.searchPlaceholder ??
          "Search orders by number, user, or status..."
        }
        emptyMessage={
          t.components?.ordersTable?.table?.empty ?? "No orders found"
        }
        showCount
        searchValue={search}
        onSearchChange={setSearch}
        customHeader={
          <div className="flex items-center gap-2">
            {selectedOrders.length > 0 && (
              <Button
                variant="destructive"
                onClick={() => setBulkDeleteDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                {t.components?.ordersTable?.table?.deleteSelected?.replace(
                  "{0}",
                  selectedOrders.length.toString()
                ) || `Delete Selected (${selectedOrders.length})`}
              </Button>
            )}
            <CreateOrderDialog />
          </div>
        }
      />

      {/* Single Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t.components?.ordersTable?.dialogs?.deleteTitle ??
                "Delete Order?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t.components?.ordersTable?.dialogs?.deleteDesc ??
                "This will permanently delete this order and its items."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t.components?.ordersTable?.dialogs?.cancel ?? "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              onClick={() => orderToDelete && handleDeleteOrder(orderToDelete)}
            >
              {t.components?.ordersTable?.dialogs?.delete ?? "Delete"}
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
              {t.components?.ordersTable?.dialogs?.bulkDeleteTitle?.replace(
                "{0}",
                selectedOrders.length.toString()
              ) ?? `Delete ${selectedOrders.length} orders?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t.components?.ordersTable?.dialogs?.bulkDeleteDesc?.replace(
                "{0}",
                selectedOrders.length.toString()
              ) ??
                "This action cannot be undone. This will permanently delete all selected orders and their items."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t.components?.ordersTable?.dialogs?.cancel ?? "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              onClick={handleBulkDelete}
            >
              {t.components?.ordersTable?.dialogs?.delete ?? "Delete All"}
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
