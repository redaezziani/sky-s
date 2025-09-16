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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useOrdersStore } from "@/stores/orders-store";
import { useProductsStore } from "@/stores/products-store";
import { useUsersStore } from "@/stores/users-store";
import { toast } from "sonner";
import { Loader } from "../loader";
import { useUserLocation } from "@/hooks/use-user-location";
import DeliveryMapPicker from "../delivery-map-picker";

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
  const { createOrder, loading } = useOrdersStore();
  const { products, fetchProducts } = useProductsStore();
  const { users, fetchUsers } = useUsersStore();
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  const { lat, lng, place, loading: locationLoading, error: locationError } = useUserLocation();

  const isDialogOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsDialogOpen =
    externalOnClose !== undefined ? (open: boolean) => { if (!open) externalOnClose(); } : setInternalIsOpen;

  // Form state
  const [formData, setFormData] = useState({
    userId: "",
    items: [
      {
        skuId: "",
        quantity: 1,
        deliveryLat: undefined as number | undefined,
        deliveryLng: undefined as number | undefined,
        deliveryPlace: "",
      },
    ],
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

  // Apply default location if available
  useEffect(() => {
    if (lat && lng) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.map(item => ({
          ...item,
          deliveryLat: item.deliveryLat ?? lat,
          deliveryLng: item.deliveryLng ?? lng,
          deliveryPlace: item.deliveryPlace || place || "",
        })),
      }));
    }
  }, [lat, lng, place]);

  const handleItemChange = (idx: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => (i === idx ? { ...item, [field]: value } : item)),
    }));
  };

  const addOrderItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { skuId: "", quantity: 1, deliveryLat: lat ?? undefined, deliveryLng: lng ?? undefined, deliveryPlace: place || "" },
      ],
    }));
    setErrors(prev => ({ ...prev, items: [...prev.items, { skuId: "", quantity: "" }] }));
  };

  const removeOrderItem = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
    }));
    setErrors(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Basic validation
    const newErrors = {
      userId: "",
      items: formData.items.map(item => ({ skuId: "", quantity: "" })),
    };
    if (!formData.userId) newErrors.userId = "User is required";
    formData.items.forEach((item, idx) => {
      if (!item.skuId) newErrors.items[idx].skuId = "SKU is required";
      if (!item.quantity || item.quantity < 1) newErrors.items[idx].quantity = "Quantity must be at least 1";
    });
    setErrors(newErrors);
    if (newErrors.userId || newErrors.items.some(itemErr => itemErr.skuId || itemErr.quantity)) return;

    try {
      await createOrder(formData);
      toast.success("Order created successfully");
      setFormData({
        userId: "",
        items: [{
          skuId: "",
          quantity: 1,
          deliveryLat: lat ?? undefined,
          deliveryLng: lng ?? undefined,
          deliveryPlace: place || ""
        }],
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
      toast.error("Failed to create order");
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Order
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Order</DialogTitle>
          <DialogDescription>Add a new order. You can add multiple items and delivery details.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User */}
          <div className="space-y-2">
            <Label htmlFor="userId">User</Label>
            <Select
              value={formData.userId}
              onValueChange={val => setFormData(prev => ({ ...prev, userId: val }))}
            >
              <SelectTrigger id="userId">
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.userId && <p className="text-sm text-destructive">{errors.userId}</p>}
          </div>

          {/* Order Items */}
          <div className="space-y-2">
            <Label>Order Items</Label>
            {formData.items.map((item, idx) => (
              <div key={idx} className="border rounded-md p-3 mb-2 space-y-3">
                {/* SKU + Quantity */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>SKU</Label>
                    <Select value={item.skuId} onValueChange={val => handleItemChange(idx, "skuId", val)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select SKU" />
                      </SelectTrigger>
                      <SelectContent>
                        {products
                          .map(prod =>
                            prod.variants?.flatMap(variant =>
                              variant.skus?.map(sku => (
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
                      <p className="text-sm text-destructive">{errors.items[idx].skuId}</p>
                    )}
                  </div>
                  <div>
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={e =>
                        handleItemChange(idx, "quantity", parseInt(e.target.value) || 1)
                      }
                    />
                    {errors.items[idx]?.quantity && (
                      <p className="text-sm text-destructive">{errors.items[idx].quantity}</p>
                    )}
                  </div>
                </div>

                {/* Map Picker */}
                <div>
                  <Label>Delivery Location</Label>
                  {locationLoading ? (
                    <p className="text-sm text-muted-foreground">Detecting location...</p>
                  ) : locationError ? (
                    <DeliveryMapPicker
                      deliveryLat={item.deliveryLat}
                      deliveryLng={item.deliveryLng}
                      deliveryPlace={item.deliveryPlace}
                      onChange={data => {
                        handleItemChange(idx, "deliveryLat", data.lat);
                        handleItemChange(idx, "deliveryLng", data.lng);
                        handleItemChange(idx, "deliveryPlace", data.place);
                      }}
                    />
                  ) : (
                    <DeliveryMapPicker
                      deliveryLat={item.deliveryLat}
                      deliveryLng={item.deliveryLng}
                      deliveryPlace={item.deliveryPlace}
                      onChange={data => {
                        handleItemChange(idx, "deliveryLat", data.lat);
                        handleItemChange(idx, "deliveryLng", data.lng);
                        handleItemChange(idx, "deliveryPlace", data.place);
                      }}
                    />
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2">
                  {formData.items.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => removeOrderItem(idx)}
                    >
                      Remove
                    </Button>
                  )}
                  {idx === formData.items.length - 1 && (
                    <Button type="button" variant="outline" onClick={addOrderItem}>
                      Add Item
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Shipping & Billing */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shippingName">Shipping Name</Label>
              <Input
                id="shippingName"
                value={formData.shippingName}
                onChange={e => setFormData(prev => ({ ...prev, shippingName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shippingEmail">Shipping Email</Label>
              <Input
                id="shippingEmail"
                value={formData.shippingEmail}
                onChange={e => setFormData(prev => ({ ...prev, shippingEmail: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shippingPhone">Shipping Phone</Label>
              <Input
                id="shippingPhone"
                value={formData.shippingPhone}
                onChange={e => setFormData(prev => ({ ...prev, shippingPhone: e.target.value }))}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="shippingAddress">Shipping Address (JSON)</Label>
              <Textarea
                id="shippingAddress"
                value={JSON.stringify(formData.shippingAddress)}
                onChange={e =>
                  setFormData(prev => ({
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
              <Label htmlFor="billingName">Billing Name</Label>
              <Input
                id="billingName"
                value={formData.billingName}
                onChange={e => setFormData(prev => ({ ...prev, billingName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="billingEmail">Billing Email</Label>
              <Input
                id="billingEmail"
                value={formData.billingEmail}
                onChange={e => setFormData(prev => ({ ...prev, billingEmail: e.target.value }))}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="billingAddress">Billing Address (JSON)</Label>
              <Textarea
                id="billingAddress"
                value={JSON.stringify(formData.billingAddress)}
                onChange={e =>
                  setFormData(prev => ({
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

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="trackingNumber">Tracking Number</Label>
            <Input
              id="trackingNumber"
              value={formData.trackingNumber}
              onChange={e => setFormData(prev => ({ ...prev, trackingNumber: e.target.value }))}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader className="mr-2 h-4 w-4" /> Creating...
                </>
              ) : (
                "Create Order"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
