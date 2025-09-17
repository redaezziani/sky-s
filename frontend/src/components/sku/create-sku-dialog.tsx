"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import useProductVariantsStore from "@/stores/product-variants-store";
import { toast } from "sonner";
import { useLocale } from "@/components/local-lang-swither"; // your LocaleProvider hook
import { getMessages } from "@/lib/locale";

const createSKUSchema = z.object({
  variantId: z.string().min(1),
  sku: z.string().min(1),
  barcode: z.string().optional(),
  price: z.number().min(0),
  comparePrice: z.number().optional(),
  costPrice: z.number().optional(),
  stock: z.number().min(0),
  lowStockAlert: z.number().min(0),
  weight: z.number().optional(),
  dimensions: z.string().optional(),
  isActive: z.boolean(),
  images: z.any().optional(),
});

type CreateSKUFormData = z.infer<typeof createSKUSchema>;

interface CreateSKUDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateSKUDialog({ open, onOpenChange }: CreateSKUDialogProps) {
  const { createSKU, loading, products } = useProductVariantsStore();
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const { locale } = useLocale();
  const t = getMessages(locale).pages.skus.dialogs;

  const form = useForm<CreateSKUFormData>({
    resolver: zodResolver(createSKUSchema),
    defaultValues: {
      variantId: "",
      sku: "",
      barcode: "",
      price: 0,
      comparePrice: undefined,
      costPrice: undefined,
      stock: 0,
      lowStockAlert: 5,
      weight: undefined,
      dimensions: "",
      isActive: true,
      images: undefined,
    },
  });

  const allVariants = products.flatMap(
    (product) =>
      product.variants?.map((variant) => ({
        id: variant.id,
        name: variant.name || `Variant ${variant.id.slice(-8)}`,
        productName: product.name,
      })) || []
  );

  const onSubmit = async (data: CreateSKUFormData) => {
    try {
      const formData = new FormData();
      formData.append("variantId", data.variantId);
      formData.append("sku", data.sku);
      if (data.barcode) formData.append("barcode", data.barcode);
      formData.append("price", String(data.price));
      if (data.comparePrice !== undefined)
        formData.append("comparePrice", String(data.comparePrice));
      if (data.costPrice !== undefined)
        formData.append("costPrice", String(data.costPrice));
      formData.append("stock", String(data.stock));
      formData.append("lowStockAlert", String(data.lowStockAlert));
      if (data.weight !== undefined)
        formData.append("weight", String(data.weight));
      if (data.dimensions) formData.append("dimensions", data.dimensions);
      formData.append("isActive", String(data.isActive));
      selectedImages.forEach((file) => formData.append("images", file));

      await createSKU(data.variantId, formData);
      toast.success(t.toast?.skuCreated || "SKU created successfully");
      onOpenChange(false);
      form.reset();
      setSelectedImages([]);
    } catch {
      toast.error(t.toast?.skuCreateFailed || "Failed to create SKU");
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) form.reset();
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t.createSKU.title}</DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Variant */}
            <FormField
              control={form.control}
              name="variantId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.createSKU.fields.productVariant}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t.createSKU.placeholders.selectVariant}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {allVariants.map((variant) => (
                        <SelectItem key={variant.id} value={variant.id}>
                          {variant.productName} - {variant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* SKU & Barcode */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.createSKU.fields.skuCode}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t.createSKU.placeholders.skuCode}
                        {...field}
                        className="font-mono"
                      />
                    </FormControl>
                    <FormDescription>
                      {t.createSKU.fields.skuCode}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="barcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.createSKU.fields.barcode}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t.createSKU.placeholders.barcode}
                        {...field}
                        className="font-mono"
                      />
                    </FormControl>
                    <FormDescription>
                      {t.createSKU.fields.barcode}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Price, Compare, Cost */}
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.createSKU.fields.price}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      {t.createSKU.fields.price}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="comparePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.createSKU.fields.comparePrice}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            parseFloat(e.target.value) || undefined
                          )
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      {t.createSKU.fields.comparePrice}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="costPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.createSKU.fields.costPrice}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            parseFloat(e.target.value) || undefined
                          )
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      {t.createSKU.fields.costPrice}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Stock & Alerts */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.createSKU.fields.stock}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      {t.createSKU.fields.stock}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lowStockAlert"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.createSKU.fields.lowStockAlert}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      {t.createSKU.fields.lowStockAlert}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Weight & Dimensions */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.createSKU.fields.weight}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            parseFloat(e.target.value) || undefined
                          )
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      {t.createSKU.fields.weight}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dimensions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.createSKU.fields.dimensions}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t.createSKU.placeholders.dimensions}
                        {...field}
                        className="font-mono text-xs"
                      />
                    </FormControl>
                    <FormDescription>
                      {t.createSKU.fields.dimensions}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Active */}
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      {t.createSKU.fields.isActive}
                    </FormLabel>
                    <FormDescription>
                      {t.createSKU.fields.isActiveDescription}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Images */}
            <FormItem>
              <FormLabel>{t.createSKU.fields.images}</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) =>
                    e.target.files &&
                    setSelectedImages(Array.from(e.target.files))
                  }
                />
              </FormControl>
              <FormDescription>
                {t.createSKU.fields.imagesDescription}
              </FormDescription>
              <FormMessage />
            </FormItem>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                {t.createSKU.submit.cancel}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading
                  ? t.createSKU.submit.creating
                  : t.createSKU.submit.create}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
