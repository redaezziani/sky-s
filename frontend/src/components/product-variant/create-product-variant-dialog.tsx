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
import { useProductsStore } from "@/stores/products-store";
import { useLocale } from "@/components/local-lang-swither";
import { getMessages } from "@/lib/locale";

const createProductVariantSchema = z.object({
  productId: z.string().min(1),
  name: z.string().optional(),
  isActive: z.boolean(),
  sortOrder: z.number().min(0),
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
  const { locale } = useLocale();
  const t =
    getMessages(locale).pages.variants.components.dialogs.createProductVariant;
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
    if (open) fetchProducts({ includeVariants: false });
  }, [open, fetchProducts]);

  const handleAddAttribute = () => setAttributes({ ...attributes, "": "" });
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

  const onSubmit = async (data: CreateProductVariantFormData) => {
    try {
      const filteredAttributes = Object.fromEntries(
        Object.entries(attributes).filter(([key, value]) => key && value)
      );

      await createVariant(data.productId, {
        name: data.name,
        attributes:
          Object.keys(filteredAttributes).length > 0
            ? filteredAttributes
            : undefined,
        isActive: data.isActive,
        sortOrder: data.sortOrder,
      });

      toast.success(t.toast.variantCreated);
      onOpenChange(false);
      form.reset();
      setAttributes({});
    } catch {
      toast.error(t.toast.variantCreateFailed);
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
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 max-w-[600px] overflow-hidden"
          >
            {/* Product */}
            <FormField
              control={form.control}
              name="productId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.fields.product}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-[400px]">
                        <SelectValue
                          placeholder={t.placeholders.selectProduct}
                        />
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

            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.fields.name}</FormLabel>
                  <FormControl>
                    <Input placeholder={t.placeholders.name} {...field} />
                  </FormControl>
                  <FormDescription>{t.hints.name}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Attributes */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel>{t.fields.attributes}</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddAttribute}
                >
                  {t.actions.addAttribute}
                </Button>
              </div>
              <FormDescription>{t.hints.attributes}</FormDescription>
              {Object.entries(attributes).map(([key, value], index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    placeholder={t.placeholders.attributeName}
                    value={key}
                    onChange={(e) =>
                      handleUpdateAttribute(key, e.target.value, value)
                    }
                    className="flex-1"
                  />
                  <Input
                    placeholder={t.placeholders.attributeValue}
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
                    {t.actions.removeAttribute}
                  </Button>
                </div>
              ))}
            </div>

            {/* Sort Order */}
            <FormField
              control={form.control}
              name="sortOrder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.fields.sortOrder}</FormLabel>
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
                  <FormDescription>{t.hints.sortOrder}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Active */}
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      {t.fields.isActive}
                    </FormLabel>
                    <FormDescription>{t.hints.isActive}</FormDescription>
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
                {t.submit.cancel}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? t.submit.creating : t.submit.create}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
