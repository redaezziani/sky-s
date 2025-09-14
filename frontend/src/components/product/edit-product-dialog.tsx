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
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useProductsStore, type Product, type UpdateProductPayload } from "@/stores/products-store";
import { useCategoriesStore } from "@/stores/categories-store";
import { toast } from "sonner";
import { Loader } from "../loader";

interface EditProductDialogProps {
  product: Product | null;
  open: boolean;
  onClose: () => void;
}

export function EditProductDialog({ product, open, onClose }: EditProductDialogProps) {
  const { updateProduct, loading } = useProductsStore();
  const { categories, fetchCategories } = useCategoriesStore();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    shortDesc: "",
    coverImage: "",
    isActive: true,
    isFeatured: false,
    metaTitle: "",
    metaDesc: "",
    sortOrder: 0,
    categoryIds: [] as string[],
  });

  const [errors, setErrors] = useState({
    name: "",
    description: "",
    shortDesc: "",
    coverImage: "",
    metaTitle: "",
    metaDesc: "",
    sortOrder: "",
  });

  // Fetch categories when dialog opens
  useEffect(() => {
    if (open) {
      fetchCategories();
    }
  }, [open, fetchCategories]);

  // Update form when product changes
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description || "",
        shortDesc: product.shortDesc || "",
        coverImage: product.coverImage || "",
        isActive: product.isActive,
        isFeatured: product.isFeatured,
        metaTitle: product.metaTitle || "",
        metaDesc: product.metaDesc || "",
        sortOrder: product.sortOrder,
        categoryIds: product.categories?.map(cat => cat.id) || [],
      });
      // Clear errors when product changes
      setErrors({
        name: "",
        description: "",
        shortDesc: "",
        coverImage: "",
        metaTitle: "",
        metaDesc: "",
        sortOrder: "",
      });
    }
  }, [product]);

  const handleCategoryToggle = (categoryId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      categoryIds: checked
        ? [...prev.categoryIds, categoryId]
        : prev.categoryIds.filter(id => id !== categoryId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!product) return;

    // Basic validation
    const newErrors = {
      name: "",
      description: "",
      shortDesc: "",
      coverImage: "",
      metaTitle: "",
      metaDesc: "",
      sortOrder: "",
    };

    if (!formData.name.trim()) {
      newErrors.name = "Product name is required";
    }

    if (formData.name.length > 255) {
      newErrors.name = "Name is too long";
    }

    if (formData.sortOrder < 0) {
      newErrors.sortOrder = "Sort order cannot be negative";
    }

    setErrors(newErrors);

    // Check if there are any errors
    if (Object.values(newErrors).some(error => error !== "")) {
      return;
    }

    try {
      const payload: UpdateProductPayload = {
        name: formData.name,
        description: formData.description || undefined,
        shortDesc: formData.shortDesc || undefined,
        coverImage: formData.coverImage || undefined,
        isActive: formData.isActive,
        isFeatured: formData.isFeatured,
        metaTitle: formData.metaTitle || undefined,
        metaDesc: formData.metaDesc || undefined,
        sortOrder: formData.sortOrder,
        categoryIds: formData.categoryIds.length > 0 ? formData.categoryIds : undefined,
      };

      await updateProduct(product.id, payload);
      toast.success("Product updated successfully");
      onClose();
    } catch (error) {
      toast.error("Failed to update product");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>
            Update the product information and settings.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name</Label>
            <Input
              id="name"
              placeholder="Wireless Bluetooth Headphones"
              value={formData.name}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, name: e.target.value }));
                if (errors.name) {
                  setErrors(prev => ({ ...prev, name: "" }));
                }
              }}
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="shortDesc">Short Description</Label>
            <Input
              id="shortDesc"
              placeholder="Premium wireless headphones with 30h battery life"
              value={formData.shortDesc}
              onChange={(e) => setFormData(prev => ({ ...prev, shortDesc: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="High-quality wireless headphones with noise cancellation..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="resize-none"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="coverImage">Cover Image URL</Label>
            <Input
              id="coverImage"
              placeholder="https://example.com/images/headphones.jpg"
              value={formData.coverImage}
              onChange={(e) => setFormData(prev => ({ ...prev, coverImage: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="metaTitle">Meta Title (SEO)</Label>
              <Input
                id="metaTitle"
                placeholder="Best Wireless Headphones 2024"
                value={formData.metaTitle}
                onChange={(e) => setFormData(prev => ({ ...prev, metaTitle: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sortOrder">Sort Order</Label>
              <Input
                id="sortOrder"
                type="number"
                placeholder="0"
                value={formData.sortOrder}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  setFormData(prev => ({ ...prev, sortOrder: value }));
                  if (errors.sortOrder) {
                    setErrors(prev => ({ ...prev, sortOrder: "" }));
                  }
                }}
                className={errors.sortOrder ? "border-destructive" : ""}
              />
              <p className="text-xs text-muted-foreground">
                Lower numbers appear first
              </p>
              {errors.sortOrder && (
                <p className="text-sm text-destructive">{errors.sortOrder}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="metaDesc">Meta Description (SEO)</Label>
            <Textarea
              id="metaDesc"
              placeholder="Discover our premium wireless headphones with exceptional sound quality..."
              value={formData.metaDesc}
              onChange={(e) => setFormData(prev => ({ ...prev, metaDesc: e.target.value }))}
              className="resize-none"
              rows={2}
            />
          </div>

          {/* Categories */}
          <div className="space-y-2">
            <Label>Categories</Label>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded-md p-3">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={category.id}
                    checked={formData.categoryIds.includes(category.id)}
                    onCheckedChange={(checked) => handleCategoryToggle(category.id, checked as boolean)}
                  />
                  <label
                    htmlFor={category.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {category.name}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label className="text-base">Active Status</Label>
                <p className="text-sm text-muted-foreground">
                  Active products are visible to customers
                </p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label className="text-base">Featured Product</Label>
                <p className="text-sm text-muted-foreground">
                  Featured products appear prominently
                </p>
              </div>
              <Switch
                checked={formData.isFeatured}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isFeatured: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader className="mr-2 h-4 w-4" />
                  Updating...
                </>
              ) : (
                "Update Product"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
