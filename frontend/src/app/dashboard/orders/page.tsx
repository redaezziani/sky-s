"use client";

import { useEffect } from "react";
import { useOrdersStore } from "@/stores/orders-store";
import { EnhancedOrderTable } from "@/components/order/enhanced-order-table";


export default function OrdersPage() {
  const { fetchOrders } = useOrdersStore();

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <section className="flex flex-col gap-4 w-full px-6 py-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Orders Management</h1>
          <p className="text-muted-foreground">
            Manage customer orders, payments, and deliveries
          </p>
        </div>
      </div>
      <EnhancedOrderTable />
    </section>
  );
}
