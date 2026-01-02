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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCategoriesStore, type Category, type UpdateCategoryPayload } from "@/stores/categories-store";
import { toast } from "sonner";
import { Loader } from "../loader";
import { useLocale } from "@/components/local-lang-swither";
import { getMessages } from "@/lib/locale";

interface EditCategoryDialogProps {
  category: Category | null;
  open: boolean;
  onClose: () => void;
}

export function EditCategoryDialog({ category, open, onClose }: EditCategoryDialogProps) {
  const { updateCategory, categories, loading } = useCategoriesStore();
  const { locale } = useLocale();
  const lang = getMessages(locale);
  const t = lang.pages?.categories?.dialogs?.editCategory || {};

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    parentId: "none",
    isActive: true,
    sortOrder: 0,
  });

  const [errors, setErrors] = useState({
    name: "",
    description: "",
    parentId: "",
    sortOrder: "",
  });

  // Update form when category changes
  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || "",
        parentId: category.parentId || "none",
        isActive: category.isActive,
        sortOrder: category.sortOrder,
      });
      // Clear errors when category changes
      setErrors({
        name: "",
        description: "",
        parentId: "",
        sortOrder: "",
      });
    }
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!category) return;

    // Basic validation
    const newErrors = {
      name: "",
      description: "",
      parentId: "",
      sortOrder: "",
    };

    if (!formData.name.trim()) {
      newErrors.name = t.errors?.nameRequired || "Category name is required";
    }

    if (formData.name.length > 100) {
      newErrors.name = t.errors?.nameTooLong || "Name is too long";
    }

    if (formData.sortOrder < 0) {
      newErrors.sortOrder = t.errors?.sortOrderNegative || "Sort order cannot be negative";
    }

    setErrors(newErrors);

    // Check if there are any errors
    if (Object.values(newErrors).some(error => error !== "")) {
      return;
    }

    try {
      const payload: UpdateCategoryPayload = {
        name: formData.name,
        description: formData.description || undefined,
        parentId: formData.parentId === "none" ? undefined : formData.parentId,
        isActive: formData.isActive,
        sortOrder: formData.sortOrder,
      };

      await updateCategory(category.id, payload);
      toast.success(t.toast?.success || "Category updated successfully");
      onClose();
    } catch (error) {
      toast.error(t.toast?.failed || "Failed to update category");
    }
  };

  // Get potential parent categories (excluding current category and its children)
  const getAvailableParents = () => {
    if (!category) return categories;
    
    // Filter out the current category and its children to prevent circular references
    return categories.filter(cat => 
      cat.id !== category.id && 
      cat.parentId !== category.id &&
      !cat.parentId // Only show root categories as potential parents for simplicity
    );
  };

  const availableParents = getAvailableParents();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t.title || "Edit Category"}</DialogTitle>
          <DialogDescription>
            {t.description || "Update the category information. Be careful when changing parent relationships."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t.fields?.name || "Category Name"}</Label>
            <Input
              id="name"
              placeholder={t.placeholders?.name || "Electronics"}
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
            <Label htmlFor="description">{t.fields?.description || "Description"}</Label>
            <Textarea
              id="description"
              placeholder={t.placeholders?.description || "Electronic devices and accessories"}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="parentId">{t.fields?.parent || "Parent Category"}</Label>
              <Select
                value={formData.parentId || "none"}
                onValueChange={(value) => setFormData(prev => ({ ...prev, parentId: value === "none" ? "" : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t.placeholders?.parent || "Select parent category"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t.placeholders?.parent || "Select parent category (optional)"}</SelectItem>
                  {availableParents.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sortOrder">{t.fields?.sortOrder || "Sort Order"}</Label>
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
                {t.fields?.sortOrderDescription || "Lower numbers appear first"}
              </p>
              {errors.sortOrder && (
                <p className="text-sm text-destructive">{errors.sortOrder}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base">{t.fields?.isActive || "Active Status"}</Label>
              <p className="text-sm text-muted-foreground">
                {t.fields?.isActiveDescription || "Active categories are visible to customers"}
              </p>
            </div>
            <Switch
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              {t.actions?.cancel || "Cancel"}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader className="mr-2 h-4 w-4" />
                  {t.actions?.updating || "Updating..."}
                </>
              ) : (
                t.actions?.update || "Update Category"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
