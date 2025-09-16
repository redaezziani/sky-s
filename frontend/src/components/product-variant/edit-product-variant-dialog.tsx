"use client";

import { useState, useEffect } from "react";
import useProductVariantsStore, {
  type ProductVariant,
} from "@/stores/product-variants-store";
import { useProductsStore } from "@/stores/products-store";
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
import { toast } from "sonner";

const editProductVariantSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  name: z.string().optional(),
  isActive: z.boolean(),
  sortOrder: z.number().min(0, "Sort order must be non-negative"),
});

type EditProductVariantFormData = z.infer<typeof editProductVariantSchema>;

interface EditProductVariantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productVariant:
    | (ProductVariant & { productName?: string; productId?: string })
    | null;
}

export function EditProductVariantDialog({
  open,
  onOpenChange,
  productVariant,
}: EditProductVariantDialogProps) {
  const { updateVariant, loading } = useProductVariantsStore();
  const { products, fetchProducts } = useProductsStore();
  const [attributes, setAttributes] = useState<Record<string, string>>({});

  const form = useForm<EditProductVariantFormData>({
    resolver: zodResolver(editProductVariantSchema),
    defaultValues: {
      productId: "",
      name: "",
      isActive: true,
      sortOrder: 0,
    },
  });

  useEffect(() => {
    if (open) {
      fetchProducts({ includeVariants: false });
    }
  }, [open, fetchProducts]);

  useEffect(() => {
    if (productVariant) {
      form.reset({
        productId: productVariant.productId || "",
        name: productVariant.name || "",
        isActive: productVariant.isActive,
        sortOrder: productVariant.sortOrder,
      });
      setAttributes(productVariant.attributes || {});
    }
  }, [productVariant, form]);

  const handleAddAttribute = () => {
    setAttributes({ ...attributes, "": "" });
  };

  const handleUpdateAttribute = (
    oldKey: string,
    newKey: string,
    value: string
  ) => {
    const newAttributes = { ...attributes };
    if (oldKey !== newKey && newKey) {
      delete newAttributes[oldKey];
      newAttributes[newKey] = value;
    } else {
      newAttributes[oldKey] = value;
    }
    setAttributes(newAttributes);
  };

  const handleRemoveAttribute = (key: string) => {
    const newAttributes = { ...attributes };
    delete newAttributes[key];
    setAttributes(newAttributes);
  };

  const onSubmit = async (data: EditProductVariantFormData) => {
    if (!productVariant) return;

    try {
      const filteredAttributes = Object.fromEntries(
        Object.entries(attributes).filter(([key, value]) => key && value)
      );

      await updateVariant(productVariant.id, {
        name: data.name,
        attributes:
          Object.keys(filteredAttributes).length > 0
            ? filteredAttributes
            : undefined,
        isActive: data.isActive,
        sortOrder: data.sortOrder,
      });

      toast.success("Product variant updated successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update product variant");
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
      setAttributes({});
    }
    onOpenChange(newOpen);
  };

  if (!productVariant) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Product Variant</DialogTitle>
          <DialogDescription>
            Update the product variant information and attributes.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 w-full "
          >
            <FormField
              control={form.control}
              name="productId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full max-w-[600px] truncate">
                        <SelectValue placeholder="Select a product" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem
                          className="max-w-[500px] truncate"
                          key={product.id}
                          value={product.id}
                        >
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Large - Red" {...field} />
                  </FormControl>
                  <FormDescription>
                    A descriptive name for this variant. If not provided, it
                    will be auto-generated.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel>Attributes</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddAttribute}
                >
                  Add Attribute
                </Button>
              </div>
              <FormDescription>
                Define attributes like size, color, material, etc.
              </FormDescription>
              {Object.entries(attributes).map(([key, value], index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    placeholder="Attribute name (e.g., size)"
                    value={key}
                    onChange={(e) =>
                      handleUpdateAttribute(key, e.target.value, value)
                    }
                    className="flex-1"
                  />
                  <Input
                    placeholder="Value (e.g., Large)"
                    value={value}
                    onChange={(e) =>
                      handleUpdateAttribute(key, key, e.target.value)
                    }
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveAttribute(key)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>

            <FormField
              control={form.control}
              name="sortOrder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sort Order</FormLabel>
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
                    Used to control the display order of variants.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active</FormLabel>
                    <FormDescription>
                      Whether this variant is active and available for use.
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

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Update Product Variant"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
