"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import DeliveryMapPicker from "../delivery-map-picker";
import {
  useOrdersStore,
  OrderStatus,
  PaymentStatus,
  Order,
} from "@/stores/orders-store";
import { Edit } from "lucide-react";
import { toast } from "sonner";
import { useLocale } from "@/components/local-lang-swither";
import { getMessages } from "@/lib/locale";

interface UpdateOrderSheetProps {
  order: Order;
}

interface UpdateOrderPayload {
  shippingName?: string;
  shippingEmail?: string;
  shippingPhone?: string;
  shippingAddress?: Record<string, any>;
  billingName?: string;
  billingEmail?: string;
  billingAddress?: Record<string, any>;
  deliveryLat?: number;
  deliveryLng?: number;
  deliveryPlace?: string;
  notes?: string;
  trackingNumber?: string;
  status?: string;
  paymentStatus?: string;
  items?: { skuId: string; quantity: number }[];
}

export default function UpdateOrderSheet({ order }: UpdateOrderSheetProps) {
  const { updateOrder } = useOrdersStore();

  const { locale } = useLocale();
  const t = getMessages(locale).pages?.orders?.dialogs?.updateOrder || {};

  const [form, setForm] = useState<UpdateOrderPayload>({
    shippingName: order.shippingName,
    shippingEmail: order.shippingEmail,
    shippingPhone: order.shippingPhone,
    shippingAddress: order.shippingAddress,
    billingName: order.billingName,
    billingEmail: order.billingEmail,
    billingAddress: order.billingAddress,
    deliveryLat: order.deliveryLat ?? undefined,
    deliveryLng: order.deliveryLng ?? undefined,
    deliveryPlace: order.deliveryPlace ?? "",
    notes: order.notes,
    trackingNumber: order.trackingNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    items: order.items.map((i) => ({ skuId: i.skuId, quantity: i.quantity })),
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof UpdateOrderPayload, string>>
  >({});

  const handleChange = (field: keyof UpdateOrderPayload, value: any) => {
    setForm({ ...form, [field]: value });
  };

  const handleItemChange = (idx: number, field: string, value: any) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items?.map((item, i) =>
        i === idx ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addOrderItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [...(prev.items || []), { skuId: "", quantity: 1 }],
    }));
  };

  const removeOrderItem = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items?.filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = async () => {
    const newErrors: typeof errors = {};
    if (!form.status)
      newErrors.status = t.errors?.statusRequired || "Order status is required";
    if (!form.paymentStatus)
      newErrors.paymentStatus =
        t.errors?.paymentRequired || "Payment status is required";
    setErrors(newErrors);

    if (Object.keys(newErrors).length) return;

    try {
      await updateOrder(order.id, form);
      toast.success(t.toast?.success || "Order updated successfully");
    } catch (err) {
      toast.error(t.toast?.failed || "Failed to update order");
      console.error(err);
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-3">
          <Edit className="h-4 w-4" />
          {t.trigger || "Edit Order"}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full px-4 sm:min-w-[670px] lg:w-[700px] xl:w-[900px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {t.title || `Update Order ${order.orderNumber}`}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 py-4">
          {/* Shipping Info */}
          <section className="grid grid-cols-2 gap-4">
            <h3 className="text-lg font-semibold col-span-2">
              {t.sections?.shipping || "Shipping Info"}
            </h3>
            <div className="space-y-2">
              <Label htmlFor="shippingName">
                {t.fields?.shippingName || "Name"}
              </Label>
              <Input
                id="shippingName"
                value={form.shippingName || ""}
                onChange={(e) => handleChange("shippingName", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shippingEmail">
                {t.fields?.shippingEmail || "Email"}
              </Label>
              <Input
                id="shippingEmail"
                value={form.shippingEmail || ""}
                onChange={(e) => handleChange("shippingEmail", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shippingPhone">
                {t.fields?.shippingPhone || "Phone"}
              </Label>
              <Input
                id="shippingPhone"
                value={form.shippingPhone || ""}
                onChange={(e) => handleChange("shippingPhone", e.target.value)}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="shippingAddress">
                {t.fields?.shippingAddress || "Address (JSON)"}
              </Label>
              <Textarea
                id="shippingAddress"
                rows={2}
                value={JSON.stringify(form.shippingAddress || {}, null, 2)}
                onChange={(e) =>
                  handleChange(
                    "shippingAddress",
                    (() => {
                      try {
                        return JSON.parse(e.target.value);
                      } catch {
                        return {};
                      }
                    })()
                  )
                }
              />
            </div>
          </section>

          <Separator />

          {/* Billing Info */}
          <section className="grid grid-cols-2 gap-4">
            <h3 className="text-lg font-semibold col-span-2">
              {t.sections?.billing || "Billing Info"}
            </h3>
            <div className="space-y-2">
              <Label htmlFor="billingName">
                {t.fields?.billingName || "Name"}
              </Label>
              <Input
                id="billingName"
                value={form.billingName || ""}
                onChange={(e) => handleChange("billingName", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="billingEmail">
                {t.fields?.billingEmail || "Email"}
              </Label>
              <Input
                id="billingEmail"
                value={form.billingEmail || ""}
                onChange={(e) => handleChange("billingEmail", e.target.value)}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="billingAddress">
                {t.fields?.billingAddress || "Address (JSON)"}
              </Label>
              <Textarea
                id="billingAddress"
                rows={2}
                value={JSON.stringify(form.billingAddress || {}, null, 2)}
                onChange={(e) =>
                  handleChange(
                    "billingAddress",
                    (() => {
                      try {
                        return JSON.parse(e.target.value);
                      } catch {
                        return {};
                      }
                    })()
                  )
                }
              />
            </div>
          </section>

          <Separator />

          {/* Delivery Info */}
          <section>
            <h3 className="text-lg font-semibold">
              {t.sections?.delivery || "Delivery Info"}
            </h3>
            <DeliveryMapPicker
              deliveryLat={form.deliveryLat}
              deliveryLng={form.deliveryLng}
              deliveryPlace={form.deliveryPlace}
              onChange={(data) => {
                handleChange("deliveryLat", data.lat);
                handleChange("deliveryLng", data.lng);
                handleChange("deliveryPlace", data.place);
              }}
            />
            <div className="space-y-2 mt-2">
              <Label htmlFor="deliveryPlace">
                {t.fields?.deliveryPlace || "Place"}
              </Label>
              <Input
                id="deliveryPlace"
                value={form.deliveryPlace || ""}
                onChange={(e) => handleChange("deliveryPlace", e.target.value)}
              />
            </div>
          </section>

          <Separator />

          {/* Status */}
          <section className="grid grid-cols-2 gap-4">
            <h3 className="text-lg font-semibold col-span-2">
              {t.sections?.status || "Status"}
            </h3>

            <div className="space-y-1">
              <Label htmlFor="status">
                {t.fields?.status || "Order Status"}
              </Label>
              <Select
                value={form.status || ""}
                onValueChange={(v) => handleChange("status", v)}
              >
                <SelectTrigger id="status">
                  <SelectValue
                    placeholder={
                      t.placeholders?.selectStatus || "Select status"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(OrderStatus)
                    .filter((v) => typeof v === "string")
                    .map((s) => (
                      <SelectItem key={s} value={s}>
                        {t.statuses?.[s] || s}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-sm text-destructive">{errors.status}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="paymentStatus">
                {t.fields?.paymentStatus || "Payment Status"}
              </Label>
              <Select
                value={form.paymentStatus || ""}
                onValueChange={(v) => handleChange("paymentStatus", v)}
              >
                <SelectTrigger id="paymentStatus">
                  <SelectValue
                    placeholder={
                      t.placeholders?.selectPayment || "Select payment status"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(PaymentStatus)
                    .filter((v) => typeof v === "string")
                    .map((s) => (
                      <SelectItem key={s} value={s}>
                        {t.paymentStatuses?.[s] || s}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {errors.paymentStatus && (
                <p className="text-sm text-destructive">
                  {errors.paymentStatus}
                </p>
              )}
            </div>
          </section>

          <Separator />

          {/* Notes & Tracking */}
          <section className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="notes">{t.fields?.notes || "Notes"}</Label>
              <Textarea
                id="notes"
                value={form.notes || ""}
                onChange={(e) => handleChange("notes", e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trackingNumber">
                {t.fields?.trackingNumber || "Tracking Number"}
              </Label>
              <Input
                id="trackingNumber"
                value={form.trackingNumber || ""}
                onChange={(e) => handleChange("trackingNumber", e.target.value)}
              />
            </div>
          </section>

          <Button onClick={handleSubmit} className="mt-4 w-full">
            {t.actions?.save || "Save Changes"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
