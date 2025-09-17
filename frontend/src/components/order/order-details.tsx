"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Eye } from "lucide-react";
import { Order } from "@/stores/orders-store";
import DeliveryMapPicker from "../delivery-map-picker";
import { useLocale } from "@/components/local-lang-swither";
import { getMessages } from "@/lib/locale";

interface OrderDetailsProps {
  order: Order;
}

export default function OrderDetails({ order }: OrderDetailsProps) {
  const { locale } = useLocale();
  const t = getMessages(locale).pages.orders.dialogs.orderDetails;

  const formatCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(amount);

  return (
    <div
      className="flex justify-center self-start w-full"
      style={{
        all: "revert",
        display: "flex",
        justifyContent: "center",
        alignSelf: "flex-start",
        paddingTop: "1.5rem",
        width: "100%",
        fontSize: "14px",
        lineHeight: "1.5",
        letterSpacing: "normal",
      }}
    >
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            {t.viewDetails}
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full px-4 sm:min-w-[670px] lg:w-[700px] xl:w-[900px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {t.title.replace("{orderNumber}", order.orderNumber)}
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-6 py-4">
            {/* General Info */}
            <section>
              <h3 className="text-lg font-semibold">
                {t.sections.generalInfo}
              </h3>
              <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                <div>
                  <p className="text-muted-foreground">{t.fields.status}</p>
                  <Badge className="mt-1" variant="secondary">
                    {order.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">{t.fields.payment}</p>
                  <Badge className="mt-1" variant="secondary">
                    {order.paymentStatus}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">{t.fields.user}</p>
                  <p>{order.userId}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t.fields.createdAt}</p>
                  <p>{new Date(order.createdAt).toLocaleString(locale)}</p>
                </div>
              </div>
            </section>

            <Separator />

            {/* Shipping Info */}
            <section>
              <h3 className="text-lg font-semibold">
                {t.sections.shippingInfo}
              </h3>
              <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                <div>
                  <p className="text-muted-foreground">{t.fields.name}</p>
                  <p>{order.shippingName || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t.fields.email}</p>
                  <p>{order.shippingEmail || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t.fields.phone}</p>
                  <p>{order.shippingPhone || "-"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">{t.fields.address}</p>
                  <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                    {order.shippingAddress
                      ? JSON.stringify(order.shippingAddress, null, 2)
                      : "-"}
                  </pre>
                </div>
              </div>
            </section>

            <Separator />

            {/* Billing Info */}
            <section>
              <h3 className="text-lg font-semibold">
                {t.sections.billingInfo}
              </h3>
              <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                <div>
                  <p className="text-muted-foreground">{t.fields.name}</p>
                  <p>{order.billingName || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t.fields.email}</p>
                  <p>{order.billingEmail || "-"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">{t.fields.address}</p>
                  <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                    {order.billingAddress
                      ? JSON.stringify(order.billingAddress, null, 2)
                      : "-"}
                  </pre>
                </div>
              </div>
            </section>

            <Separator />

            {/* Items */}
            <section>
              <h3 className="text-lg font-semibold">{t.sections.items}</h3>
              <div className="mt-2 border rounded-md divide-y">
                {order.items.map((item) => (
                  <div
                    key={item.skuId}
                    className="flex justify-between items-center p-3 text-sm gap-4"
                  >
                    <div className="w-16 h-16 flex-shrink-0">
                      <img
                        src={item.sku?.coverImage || "/placeholder.png"}
                        alt={item.productName}
                        className="w-full h-full object-cover rounded"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-muted-foreground text-xs">
                        {item.skuCode}
                      </p>
                      <p className="text-xs">
                        {t.labels.qty.replace("{qty}", String(item.quantity))} ×{" "}
                        {formatCurrency(item.unitPrice, order.currency)}
                      </p>
                    </div>
                    <p className="font-medium">
                      {formatCurrency(item.totalPrice, order.currency)}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <Separator />

            {/* Totals */}
            <section>
              <h3 className="text-lg font-semibold">{t.sections.totals}</h3>
              <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                <div>
                  <p className="text-muted-foreground">{t.fields.subtotal}</p>
                  <p>{formatCurrency(order.subtotal, order.currency)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t.fields.tax}</p>
                  <p>{formatCurrency(order.taxAmount, order.currency)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t.fields.shipping}</p>
                  <p>{formatCurrency(order.shippingAmount, order.currency)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t.fields.discount}</p>
                  <p>{formatCurrency(order.discountAmount, order.currency)}</p>
                </div>
                <div className="col-span-2 flex justify-between font-semibold text-base mt-2">
                  <span>{t.fields.total}</span>
                  <span>
                    {formatCurrency(order.totalAmount, order.currency)}
                  </span>
                </div>
              </div>
            </section>

            <Separator />

            {/* Delivery Map */}
            {order.deliveryLat && order.deliveryLng && (
              <section>
                <h3 className="text-lg font-semibold mb-2">
                  {t.sections.deliveryLocation}
                </h3>
                <DeliveryMapPicker
                  deliveryLat={order.deliveryLat}
                  deliveryLng={order.deliveryLng}
                  readonly
                />
              </section>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
