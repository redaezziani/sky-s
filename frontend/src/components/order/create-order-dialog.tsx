"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useOrdersStore } from "@/stores/orders-store";
import { useProductsStore } from "@/stores/products-store";
import { useUsersStore } from "@/stores/users-store";
import { toast } from "sonner";
import { Loader } from "../loader";
import { useUserLocation } from "@/hooks/use-user-location";
import DeliveryMapPicker from "../delivery-map-picker";
import { useLocale } from "@/components/local-lang-swither";
import { getMessages } from "@/lib/locale";
interface CreateOrderDialogProps {
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
}

export function CreateOrderDialog({
  trigger,
  isOpen: externalIsOpen,
  onClose: externalOnClose,
}: CreateOrderDialogProps) {
  const { locale } = useLocale();
  const lang = getMessages(locale);
  const t = lang.pages?.orders?.dialogs?.createOrder || {};

  console.log("CreateOrderDialog t:", t);
  const { createOrder, loading } = useOrdersStore();
  const { products, fetchProducts } = useProductsStore();
  const { users, fetchUsers } = useUsersStore();
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  const {
    lat,
    lng,
    place,
    loading: locationLoading,
    error: locationError,
  } = useUserLocation();

  const isDialogOpen =
    externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsDialogOpen =
    externalOnClose !== undefined
      ? (open: boolean) => {
          if (!open) externalOnClose();
        }
      : setInternalIsOpen;

  // Form state
  const [formData, setFormData] = useState({
    userId: "",
    items: [{ skuId: "", quantity: 1 }],
    deliveryLat: lat ?? undefined,
    deliveryLng: lng ?? undefined,
    deliveryPlace: place || "",
    shippingName: "",
    shippingEmail: "",
    shippingPhone: "",
    shippingAddress: {},
    billingName: "",
    billingEmail: "",
    billingAddress: {},
    notes: "",
    trackingNumber: "",
  });

  const [errors, setErrors] = useState({
    userId: "",
    items: [{ skuId: "", quantity: "" }],
  });

  useEffect(() => {
    if (isDialogOpen) {
      fetchProducts();
      fetchUsers();
    }
  }, [isDialogOpen, fetchProducts, fetchUsers]);

  useEffect(() => {
    if (lat && lng) {
      setFormData((prev) => ({
        ...prev,
        deliveryLat: prev.deliveryLat ?? lat,
        deliveryLng: prev.deliveryLng ?? lng,
        deliveryPlace: prev.deliveryPlace || place || "",
      }));
    }
  }, [lat, lng, place]);

  const handleItemChange = (idx: number, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === idx ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addOrderItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { skuId: "", quantity: 1 }],
    }));
    setErrors((prev) => ({
      ...prev,
      items: [...prev.items, { skuId: "", quantity: "" }],
    }));
  };

  const removeOrderItem = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
    }));
    setErrors((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors = {
      userId: "",
      items: formData.items.map(() => ({ skuId: "", quantity: "" })),
    };

    if (!formData.userId) newErrors.userId = t.errors?.userRequired;

    formData.items.forEach((item, idx) => {
      if (!item.skuId) newErrors.items[idx].skuId = t.errors?.skuRequired;
      if (!item.quantity || item.quantity < 1)
        newErrors.items[idx].quantity = t.errors?.quantityMin;
    });

    setErrors(newErrors);

    if (
      newErrors.userId ||
      newErrors.items.some((itemErr) => itemErr.skuId || itemErr.quantity)
    )
      return;

    try {
      const payload = {
        userId: formData.userId,
        items: formData.items.map((item) => ({
          skuId: item.skuId,
          quantity: item.quantity,
        })),
        deliveryLat: formData.deliveryLat,
        deliveryLng: formData.deliveryLng,
        deliveryPlace: formData.deliveryPlace,
        shippingName: formData.shippingName,
        shippingEmail: formData.shippingEmail,
        shippingPhone: formData.shippingPhone,
        shippingAddress: formData.shippingAddress,
        billingName: formData.billingName,
        billingEmail: formData.billingEmail,
        billingAddress: formData.billingAddress,
        notes: formData.notes,
        trackingNumber: formData.trackingNumber,
      };

      await createOrder(payload);
      toast.success(t.toast?.success);

      setFormData({
        userId: "",
        items: [{ skuId: "", quantity: 1 }],
        deliveryLat: lat ?? undefined,
        deliveryLng: lng ?? undefined,
        deliveryPlace: place || "",
        shippingName: "",
        shippingEmail: "",
        shippingPhone: "",
        shippingAddress: {},
        billingName: "",
        billingEmail: "",
        billingAddress: {},
        notes: "",
        trackingNumber: "",
      });
      setErrors({ userId: "", items: [{ skuId: "", quantity: "" }] });
      setIsDialogOpen(false);
    } catch (error) {
      toast.error(t.toast?.failed);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {t.trigger || "Add Order"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t.title || "Create New Order"}</DialogTitle>
          <DialogDescription>
            {t.description ||
              "Add a new order. You can add multiple items and delivery details."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User */}
          <div className="space-y-2">
            <Label htmlFor="userId">{t.sections?.user || "User"}</Label>
            <Select
              value={formData.userId}
              onValueChange={(val) =>
                setFormData((prev) => ({ ...prev, userId: val }))
              }
            >
              <SelectTrigger id="userId">
                <SelectValue
                  placeholder={t.placeholders?.selectUser || "Select user"}
                />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.userId && (
              <p className="text-sm text-destructive">{errors.userId}</p>
            )}
          </div>

          {/* Order Items */}
          <div className="space-y-2">
            <Label>{t.sections?.orderItems || "Order Items"}</Label>
            {formData.items.map((item, idx) => (
              <div key={idx} className="border rounded-md p-3 mb-2 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>{t.fields?.sku || "SKU"}</Label>
                    <Select
                      value={item.skuId}
                      onValueChange={(val) =>
                        handleItemChange(idx, "skuId", val)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            t.placeholders?.selectSKU || "Select SKU"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {products
                          .map(
                            (prod) =>
                              prod.variants?.flatMap(
                                (variant) =>
                                  variant.skus?.map((sku) => (
                                    <SelectItem key={sku.id} value={sku.id}>
                                      {prod.name} - {sku.sku}
                                    </SelectItem>
                                  )) || []
                              ) || []
                          )
                          .flat()}
                      </SelectContent>
                    </Select>
                    {errors.items[idx]?.skuId && (
                      <p className="text-sm text-destructive">
                        {errors.items[idx].skuId}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>{t.fields?.quantity || "Quantity"}</Label>
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(
                          idx,
                          "quantity",
                          parseInt(e.target.value) || 1
                        )
                      }
                    />
                    {errors.items[idx]?.quantity && (
                      <p className="text-sm text-destructive">
                        {errors.items[idx].quantity}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  {formData.items.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => removeOrderItem(idx)}
                    >
                      {t.actions?.removeItem || "Remove"}
                    </Button>
                  )}
                  {idx === formData.items.length - 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addOrderItem}
                    >
                      {t.actions?.addItem || "Add Item"}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Delivery */}
          <div className="space-y-2">
            <Label>{t.sections?.delivery || "Delivery Location"}</Label>
            {locationLoading ? (
              <p className="text-sm text-muted-foreground">
                {t.status?.detectingLocation || "Detecting location..."}
              </p>
            ) : (
              <DeliveryMapPicker
                deliveryLat={formData.deliveryLat}
                deliveryLng={formData.deliveryLng}
                deliveryPlace={formData.deliveryPlace}
                onChange={(data) =>
                  setFormData((prev) => ({
                    ...prev,
                    deliveryLat: data.lat,
                    deliveryLng: data.lng,
                    deliveryPlace: data.place,
                  }))
                }
              />
            )}
          </div>

          {/* Shipping & Billing */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shippingName">
                {t.fields?.shippingName || "Shipping Name"}
              </Label>
              <Input
                id="shippingName"
                value={formData.shippingName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    shippingName: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shippingEmail">
                {t.fields?.shippingEmail || "Shipping Email"}
              </Label>
              <Input
                id="shippingEmail"
                value={formData.shippingEmail}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    shippingEmail: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shippingPhone">
                {t.fields?.shippingPhone || "Shipping Phone"}
              </Label>
              <Input
                id="shippingPhone"
                value={formData.shippingPhone}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    shippingPhone: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="shippingAddress">
                {t.fields?.shippingAddress || "Shipping Address (JSON)"}
              </Label>
              <Textarea
                id="shippingAddress"
                value={JSON.stringify(formData.shippingAddress)}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    shippingAddress: (() => {
                      try {
                        return JSON.parse(e.target.value);
                      } catch {
                        return {};
                      }
                    })(),
                  }))
                }
                rows={2}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="billingName">
                {t.fields?.billingName || "Billing Name"}
              </Label>
              <Input
                id="billingName"
                value={formData.billingName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    billingName: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="billingEmail">
                {t.fields?.billingEmail || "Billing Email"}
              </Label>
              <Input
                id="billingEmail"
                value={formData.billingEmail}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    billingEmail: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="billingAddress">
                {t.fields?.billingAddress || "Billing Address (JSON)"}
              </Label>
              <Textarea
                id="billingAddress"
                value={JSON.stringify(formData.billingAddress)}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    billingAddress: (() => {
                      try {
                        return JSON.parse(e.target.value);
                      } catch {
                        return {};
                      }
                    })(),
                  }))
                }
                rows={2}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">{t.sections?.notes || "Notes"}</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              rows={2}
            />
          </div>

          {/* Tracking */}
          <div className="space-y-2">
            <Label htmlFor="trackingNumber">
              {t.sections?.trackingNumber || "Tracking Number"}
            </Label>
            <Input
              id="trackingNumber"
              value={formData.trackingNumber}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  trackingNumber: e.target.value,
                }))
              }
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              {t.actions?.cancel || "Cancel"}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader className="mr-2 h-4 w-4" />{" "}
                  {t.actions?.creating || "Creating..."}
                </>
              ) : (
                t.actions?.create || "Create Order"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
