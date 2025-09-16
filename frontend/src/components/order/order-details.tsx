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
interface OrderDetailsProps {
  order: Order;
}

export default function OrderDetails({ order }: OrderDetailsProps) {
  const formatCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);

  return (
    <div
      className="flex justify-center self-start  w-full"
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
            View Details
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full px-4 sm:min-w-[670px] lg:w-[700px] xl:w-[900px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Order #{order.orderNumber}</SheetTitle>
          </SheetHeader>

          <div className="space-y-6 py-4">
            {/* General Info */}
            <section>
              <h3 className="text-lg font-semibold">General Info</h3>
              <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge className=" mt-1" variant={"secondary"}>
                    {order.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Payment</p>
                  <Badge className=" mt-1" variant={"secondary"}>
                    {order.paymentStatus}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">User</p>
                  <p>{order.userId}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Created At</p>
                  <p>{new Date(order.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </section>

            <Separator />

            {/* Shipping Info */}
            <section>
              <h3 className="text-lg font-semibold">Shipping Info</h3>
              <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Name</p>
                  <p>{order.shippingName || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p>{order.shippingEmail || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p>{order.shippingPhone || "-"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Address</p>
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
              <h3 className="text-lg font-semibold">Billing Info</h3>
              <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Name</p>
                  <p>{order.billingName || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p>{order.billingEmail || "-"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Address</p>
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
              <h3 className="text-lg font-semibold">Items</h3>
              <div className="mt-2 border rounded-md divide-y">
                {order.items.map((item) => (
                  <div
                    key={item.skuId}
                    className="flex justify-between items-center p-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-muted-foreground text-xs">
                        {item.skuCode}
                      </p>
                      <p className="text-xs">
                        Qty: {item.quantity} ×{" "}
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
              <h3 className="text-lg font-semibold">Totals</h3>
              <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Subtotal</p>
                  <p>{formatCurrency(order.subtotal, order.currency)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tax</p>
                  <p>{formatCurrency(order.taxAmount, order.currency)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Shipping</p>
                  <p>{formatCurrency(order.shippingAmount, order.currency)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Discount</p>
                  <p>{formatCurrency(order.discountAmount, order.currency)}</p>
                </div>
                <div className="col-span-2 flex justify-between font-semibold text-base mt-2">
                  <span>Total</span>
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
                  Delivery Location
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
