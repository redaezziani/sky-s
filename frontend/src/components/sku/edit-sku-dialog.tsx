"use client";

import { useState, useEffect } from "react";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
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
import Image from "next/image";
import { Trash2 } from "lucide-react";
import { MultiImageUploader } from "../multy-image-file";

const editSKUSchema = z.object({
  variantId: z.string().min(1, "Variant is required"),
  sku: z.string().min(1, "SKU code is required"),
  barcode: z.string().optional(),
  price: z.number().min(0, "Price must be non-negative"),
  comparePrice: z.number().optional(),
  costPrice: z.number().optional(),
  stock: z.number().min(0, "Stock must be non-negative"),
  lowStockAlert: z.number().min(0, "Low stock alert must be non-negative"),
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
  const { updateSKU, loading, products,deleteSKUImage } = useProductVariantsStore();
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<
    { id: string; url: string }[]
  >([]);

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
     console.log(sku.images)
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
      formData.append("isActive", String(data.isActive));

      selectedImages.forEach((file) => formData.append("images", file));

      await updateSKU(sku.id, formData);

      toast.success("SKU updated successfully");
      onOpenChange(false);
      setSelectedImages([]);
    } catch (error) {
      toast.error("Failed to update SKU");
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    try {
      if (!sku) return;
      await deleteSKUImage(imageId, sku!.id);
      setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
      toast.success("Image deleted");
    } catch {
      toast.error("Failed to delete image");
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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit SKU</DialogTitle>
          <DialogDescription>
            Update the SKU details, pricing, inventory, and images.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 max-w-[700px]"
          >
            {/* Variant Selection */}
            <FormField
              control={form.control}
              name="variantId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Variant</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a product variant" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {allVariants.map((variant) => (
                        <SelectItem
                          className="max-w-[600px] truncate"
                          key={variant.id}
                          value={variant.id}
                        >
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
                    <FormLabel>SKU Code</FormLabel>
                    <FormControl>
                      <Input {...field} className="font-mono" />
                    </FormControl>
                    <FormDescription>Unique identifier</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="barcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Barcode</FormLabel>
                    <FormControl>
                      <Input {...field} className="font-mono" />
                    </FormControl>
                    <FormDescription>Optional barcode</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-3 gap-4">
              {["price", "comparePrice", "costPrice"].map((fieldName) => (
                <FormField
                  key={fieldName}
                  control={form.control}
                  name={fieldName as keyof EditSKUFormData}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{fieldName}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? undefined
                                : parseFloat(e.target.value)
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>

            {/* Stock */}
            <div className="grid grid-cols-2 gap-4">
              {["stock", "lowStockAlert"].map((fieldName) => (
                <FormField
                  key={fieldName}
                  control={form.control}
                  name={fieldName as keyof EditSKUFormData}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{fieldName}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value) || 0)
                          }
                        />
                      </FormControl>
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
                    <FormLabel>Weight</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? undefined
                              : parseFloat(e.target.value)
                          )
                        }
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dimensions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dimensions</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Active Switch */}
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between border p-4 rounded-lg">
                  <div>
                    <FormLabel>Active</FormLabel>
                    <FormDescription>Enable/disable SKU</FormDescription>
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

            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div>
                <FormLabel>Existing Images</FormLabel>
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
                        className="absolute top-1 right-1 hover:cursor-pointer  p-1 rounded-full"
                        onClick={() => handleDeleteImage(img.id)}
                      >
                        <Trash2 className=" text-destructive " size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload New Images */}
            <FormItem>
              <FormLabel>Add New Images</FormLabel>
              <FormControl>
                <MultiImageUploader
                  value={selectedImages}
                  onChange={setSelectedImages}
                  maxSizeMB={5}
                  maxFiles={10}
                />
              </FormControl>
              <FormDescription>Upload new images if needed</FormDescription>
            </FormItem>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Update SKU"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
