"use client";

import { useEffect } from "react";
import { useOrdersStore } from "@/stores/orders-store";
import { EnhancedOrderTable } from "@/components/order/enhanced-order-table";
import { useLocale } from "@/components/local-lang-swither"; // your LocaleProvider hook
import { getMessages } from "@/lib/locale";

export default function OrdersPage() {
  const { fetchOrders } = useOrdersStore();

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const { locale } = useLocale();
  const t = getMessages(locale);



  return (
    <section className="flex flex-col gap-4 w-full px-6 py-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">{t.pages.orders.title}</h1>
          <p className="text-muted-foreground">{t.pages.orders.description}</p>
        </div>
      </div>
      <EnhancedOrderTable />
    </section>
  );
}
