"use client";

import { useEffect } from "react";
import { EnhancedOrderItemsTable } from "@/components/order-item/enhabced-order-items-table";
import { useOrderItemsStore } from "@/stores/order-items-store";


export default function OrdersItemsPage() {
  const { fetchItems } = useOrderItemsStore();

  useEffect(() => {
    fetchItems();
  }
  , [fetchItems]);

  return (
    <section className="flex flex-col gap-4 w-full px-6 py-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Orders Items Management</h1>
          <p className="text-muted-foreground">
            Manage customer orders, payments, and deliveries
          </p>
        </div>
      </div>
      <EnhancedOrderItemsTable />
    </section>
  );
}
