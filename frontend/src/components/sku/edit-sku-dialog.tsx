"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
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
import useProductVariantsStore, {
  type ProductSKU,
} from "@/stores/product-variants-store";
import { toast } from "sonner";
import { useLocale } from "@/components/local-lang-swither";
import { getMessages } from "@/lib/locale";
import { Trash2 } from "lucide-react";
import { MultiImageUploader } from "../multy-image-file";

const editSKUSchema = z.object({
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

type EditSKUFormData = z.infer<typeof editSKUSchema>;

interface EditSKUDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sku:
    | (ProductSKU & {
        productName?: string;
        variantName?: string;
        variantId?: string;
        images?: { id: string; url: string }[];
      })
    | null;
}

export function EditSKUDialog({ open, onOpenChange, sku }: EditSKUDialogProps) {
  const { updateSKU, loading, products, deleteSKUImage } =
    useProductVariantsStore();
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<
    { id: string; url: string }[]
  >([]);
  const { locale } = useLocale();
  const t = getMessages(locale).pages.skus.dialogs;

  const form = useForm<EditSKUFormData>({
    resolver: zodResolver(editSKUSchema),
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

  useEffect(() => {
    if (sku) {
      form.reset({
        variantId: sku.variantId || "",
        sku: sku.sku,
        barcode: sku.barcode || "",
        price: sku.price,
        comparePrice: sku.comparePrice || undefined,
        costPrice: sku.costPrice || undefined,
        stock: sku.stock,
        lowStockAlert: sku.lowStockAlert,
        weight: sku.weight || undefined,
        dimensions: sku.dimensions ? JSON.stringify(sku.dimensions) : "",
        isActive: sku.isActive,
      });
      setExistingImages(
        sku.images?.map((img) => ({ id: img.id, url: img.url })) || []
      );
    }
  }, [sku, form]);

  const onSubmit = async (data: EditSKUFormData) => {
    if (!sku) return;
    try {
      const formData = new FormData();
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
      formData.append("isActive", data.isActive ? "true" : "false");
      selectedImages.forEach((file) => formData.append("images", file));

      await updateSKU(sku.id, formData);
      toast.success(t.toast?.skuUpdated || "SKU updated successfully");
      onOpenChange(false);
      setSelectedImages([]);
    } catch {
      toast.error(t.toast?.skuUpdateFailed || "Failed to update SKU");
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!sku) return;
    try {
      await deleteSKUImage(imageId, sku.id);
      setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
      toast.success(t.toast?.imageDeleted || "Image deleted");
    } catch {
      toast.error(t.toast?.imageDeleteFailed || "Failed to delete image");
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
      setSelectedImages([]);
    }
    onOpenChange(newOpen);
  };

  if (!sku) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle>{t.editSKU.title}</DialogTitle>
          <DialogDescription>{t.editSKU.description}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 ">
            {/* Variant */}
            <FormField
              control={form.control}
              name="variantId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.editSKU.fields.productVariant}</FormLabel>
                  <FormControl>
                    <Controller
                      name="variantId"
                      control={form.control}
                      render={({ field: controllerField }) => (
                        <Select
                          value={controllerField.value}
                          onValueChange={controllerField.onChange}
                        >
                          <SelectTrigger className="w-full max-w-[400px]">
                            <SelectValue
                              className="truncate"
                              placeholder={t.editSKU.placeholders.selectVariant}
                            />
                          </SelectTrigger>
                          <SelectContent className="w-full max-w-[400px]">
                            {allVariants.map((variant) => (
                              <SelectItem
                                className="truncate"
                                key={variant.id}
                                value={variant.id}
                              >
                                {variant.productName} - {variant.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* SKU & Barcode */}
            <div className="grid grid-cols-2 gap-4">
              {["sku", "barcode"].map((name) => (
                <FormField
                  key={name}
                  control={form.control}
                  name={name as keyof EditSKUFormData}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.editSKU.fields[name]}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t.editSKU.placeholders[name]}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        {t.editSKU.fields[name]}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-3 gap-4">
              {["price", "comparePrice", "costPrice"].map((name) => (
                <FormField
                  key={name}
                  control={form.control}
                  name={name as keyof EditSKUFormData}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.editSKU.fields[name]}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? undefined
                                : parseFloat(e.target.value)
                            )
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        {t.editSKU.fields[name]}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>

            {/* Stock */}
            <div className="grid grid-cols-2 gap-4">
              {["stock", "lowStockAlert"].map((name) => (
                <FormField
                  key={name}
                  control={form.control}
                  name={name as keyof EditSKUFormData}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.editSKU.fields[name]}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          value={field.value ?? 0}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        {t.editSKU.fields[name]}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>

            {/* Weight & Dimensions */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.editSKU.fields.weight}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? undefined
                              : parseFloat(e.target.value)
                          )
                        }
                      />
                    </FormControl>
                    <FormDescription>{t.editSKU.fields.weight}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dimensions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.editSKU.fields.dimensions}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t.editSKU.placeholders.dimensions}
                        value={field.value ?? ""}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormDescription>
                      {t.editSKU.fields.dimensions}
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
                      {t.editSKU.fields.isActive}
                    </FormLabel>
                    <FormDescription>
                      {t.editSKU.fields.isActiveDescription}
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
            {existingImages.length > 0 && (
              <div>
                <FormLabel>{t.editSKU.fields.existingImages}</FormLabel>
                <div className="grid grid-cols-4 gap-4 mt-2">
                  {existingImages.map((img) => (
                    <div key={img.id} className="relative">
                      <img
                        src={img.url}
                        alt="SKU"
                        width={100}
                        height={100}
                        className="rounded-md object-cover"
                      />
                      <button
                        type="button"
                        className="absolute top-1 right-1 p-1 rounded-full hover:cursor-pointer"
                        onClick={() => handleDeleteImage(img.id)}
                      >
                        <Trash2 className="text-destructive" size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <FormItem>
              <FormLabel>{t.editSKU.fields.images}</FormLabel>
              <FormControl>
                <MultiImageUploader
                  value={selectedImages}
                  onChange={setSelectedImages}
                  maxSizeMB={5}
                  maxFiles={10}
                />
              </FormControl>
              <FormDescription>
                {t.editSKU.fields.imagesDescription}
              </FormDescription>
              <FormMessage />
            </FormItem>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                {t.editSKU.actions.cancel}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading
                  ? t.editSKU.actions.updating
                  : t.editSKU.actions.update}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
