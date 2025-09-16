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
import { MoreHorizontal, Trash2, Eye, Package } from "lucide-react";
import { useOrdersStore, type Order } from "@/stores/orders-store";
import { toast } from "sonner";
import PaginationTable from "@/components/pagination-table";
import { useSearchQuery } from "@/hooks/use-search-query";
import OrderDetails from "./order-details";
import { CreateOrderDialog } from "./create-order-dialog";
import { IconCircleCheckFilled } from "@tabler/icons-react";

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
    clearSelection,
    clearError,
    setPage,
    setPageSize,
  } = useOrdersStore();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);

  // Fetch orders on mount and when search changes
  useEffect(() => {
    fetchOrders({ search });
  }, [search, fetchOrders]);

  // Show error toast
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const handleDeleteOrder = async (id: string) => {
    try {
      await deleteOrder(id);
      toast.success("Order deleted successfully");
      setDeleteDialogOpen(false);
      setOrderToDelete(null);
    } catch {
      toast.error("Failed to delete order");
    }
  };

  const handleBulkDelete = async () => {
    try {
      await bulkDeleteOrders(selectedOrders);
      toast.success(`${selectedOrders.length} orders deleted successfully`);
      setBulkDeleteDialogOpen(false);
    } catch {
      toast.error("Failed to delete orders");
    }
  };

  const formatCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);

  const columns: TableColumn<Order>[] = [
    {
      key: "select",
      label: "Select",
      render: (order) => (
        <Checkbox
          checked={selectedOrders.includes(order.id)}
          onCheckedChange={() => selectOrder(order.id)}
          aria-label="Select order"
        />
      ),
    },
    {
      key: "orderNumber",
      label: "Order",
      render: (order) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center">
            <Package className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium">#{order.orderNumber}</span>
            <span className="text-xs text-muted-foreground">
              User: {order.userId}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (order) => 
      <Badge variant="secondary">
        {order.status === "PENDING" ? (
          <IconCircleCheckFilled className="fill-yellow-500 dark:fill-yellow-400" />
        ) : order.status === "SHIPPED" ? (
          <IconCircleCheckFilled className="fill-blue-500 dark:fill-blue-400" />
        ) : order.status === "DELIVERED" ? (
          <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400" />
        ) : order.status === "CANCELLED" ? (
          <IconCircleCheckFilled className="fill-red-500 dark:fill-red-400" />
        ) : (
          <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400" />
        )}
        {order.status}
      </Badge>,
    },
    {
      key: "paymentStatus",
      label: "Payment",
      render: (order) => (
        <Badge
          variant={
            order.paymentStatus === "PAID"
              ? "secondary"
              : order.paymentStatus === "FAILED"
              ? "secondary"
              : "secondary"
          }
        >
           {order.paymentStatus === "PAID" ? (<IconCircleCheckFilled className="fill-green-500 dark:fill-green-400" />
           ) : order.paymentStatus === "FAILED" ? (
            <IconCircleCheckFilled className="fill-red-500 dark:fill-red-400" />
           ) : (
            <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400" />
           )}
          {order.paymentStatus}
        </Badge>
      ),
    },
    {
      key: "totalAmount",
      label: "Total",
      render: (order) => (
        <span className="font-medium">
          {formatCurrency(order.totalAmount, order.currency)}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Created",
      render: (order) => {
        const date = new Date(order.createdAt);
        return (
          <span className="text-sm text-muted-foreground">
            {date.toLocaleDateString()}
          </span>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      render: (order) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                setOrderToDelete(order.id);
                setDeleteDialogOpen(true);
              }}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <OrderDetails order={order} />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <DataTable
        title="Order Management"
        data={orders}
        columns={columns}
        searchKeys={["orderNumber", "userId", "status", "paymentStatus"]}
        searchPlaceholder="Search orders by number, user, or status..."
        emptyMessage="No orders found"
        showCount={true}
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
                Delete Selected ({selectedOrders.length})
              </Button>
            )}
            <CreateOrderDialog/>
          </div>
        }
      />

      {/* Single Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this order and its items.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => orderToDelete && handleDeleteOrder(orderToDelete)}
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
              Delete {selectedOrders.length} orders?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete all
              selected orders and their items.
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
