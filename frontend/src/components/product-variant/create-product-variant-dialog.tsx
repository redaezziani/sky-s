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
import useProductVariantsStore from "@/stores/product-variants-store";
import { toast } from "sonner";
import { useProductsStore } from "@/stores/products-store";

const createProductVariantSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  name: z.string().optional(),
  isActive: z.boolean(),
  sortOrder: z.number().min(0, "Sort order must be non-negative"),
});

type CreateProductVariantFormData = z.infer<typeof createProductVariantSchema>;

interface CreateProductVariantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateProductVariantDialog({
  open,
  onOpenChange,
}: CreateProductVariantDialogProps) {
  const { createVariant, loading } = useProductVariantsStore();
  const { products, fetchProducts } = useProductsStore();
  const [attributes, setAttributes] = useState<Record<string, string>>({});

  const form = useForm<CreateProductVariantFormData>({
    resolver: zodResolver(createProductVariantSchema),
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

  const handleAddAttribute = () => {
    setAttributes({ ...attributes, "": "" });
  };

  const handleUpdateAttribute = (oldKey: string, newKey: string, value: string) => {
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

  const onSubmit = async (data: CreateProductVariantFormData) => {
    try {
      const filteredAttributes = Object.fromEntries(
        Object.entries(attributes).filter(([key, value]) => key && value)
      );

      await createVariant(data.productId, {
        name: data.name,
        attributes: Object.keys(filteredAttributes).length > 0 ? filteredAttributes : undefined,
        isActive: data.isActive,
        sortOrder: data.sortOrder,
      });

      toast.success("Product variant created successfully");
      onOpenChange(false);
      form.reset();
      setAttributes({});
    } catch (error) {
      toast.error("Failed to create product variant");
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
      setAttributes({});
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create Product Variant</DialogTitle>
          <DialogDescription>
            Add a new variant for an existing product. You can specify attributes like size, color, etc.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="productId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a product" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
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
                    <Input
                      placeholder="e.g., Large - Red"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    A descriptive name for this variant. If not provided, it will be auto-generated.
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
                    onChange={(e) => handleUpdateAttribute(key, e.target.value, value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Value (e.g., Large)"
                    value={value}
                    onChange={(e) => handleUpdateAttribute(key, key, e.target.value)}
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
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
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
                {loading ? "Creating..." : "Create Product Variant"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
