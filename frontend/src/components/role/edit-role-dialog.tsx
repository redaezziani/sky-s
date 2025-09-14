"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Edit, Shield } from "lucide-react";
import { useRolesStore, type Role, type UpdateRolePayload } from "@/stores/roles-store";
import { toast } from "sonner";
import { Loader } from "../loader";

interface EditRoleDialogProps {
  role: Role;
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
}

export function EditRoleDialog({
  role,
  trigger,
  isOpen: externalIsOpen,
  onClose: externalOnClose,
}: EditRoleDialogProps) {
  const { updateRole, loading } = useRolesStore();
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  // Use external state if provided, otherwise use internal state
  const isDialogOpen =
    externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsDialogOpen =
    externalOnClose !== undefined
      ? (open: boolean) => {
          if (!open) externalOnClose();
        }
      : setInternalIsOpen;

  // Form state
  const [formData, setFormData] = useState<UpdateRolePayload>({
    name: role.name,
  });

  // Form errors
  const [errors, setErrors] = useState<{
    name?: string;
  }>({});

  // Update form data when role prop changes
  useEffect(() => {
    setFormData({
      name: role.name,
    });
    setErrors({});
  }, [role]);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!formData.name?.trim()) {
      newErrors.name = "Role name is required";
    } else if (formData.name.length < 2) {
      newErrors.name = "Role name must be at least 2 characters";
    } else if (formData.name.length > 50) {
      newErrors.name = "Role name must be less than 50 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await updateRole(role.id, formData);
      toast.success("Role updated successfully");
      handleClose();
    } catch (error) {
      console.error("Failed to update role:", error);
      toast.error("Failed to update role");
    }
  };

  // Handle dialog close
  const handleClose = () => {
    setFormData({ name: role.name });
    setErrors({});
    setIsDialogOpen(false);
  };

  // Handle input changes
  const handleInputChange = (field: keyof UpdateRolePayload, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <div className="flex items-center w-full">
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </div>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Edit Role
          </DialogTitle>
          <DialogDescription>
            Update the role information. This will affect all users assigned to this role.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Role Name</Label>
            <Input
              id="edit-name"
              placeholder="Enter role name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="bg-muted/50 p-3 rounded-md">
            <div className="text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Role ID:</span>
                <span className="font-mono">{role.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Users:</span>
                <span>{role._count?.Users || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Created:</span>
                <span>{new Date(role.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ?   <span className="flex items-center">
                               <Loader size={16} />
                                <span className="ml-2">
                                  Updating...
                                </span>
                            </span>: "Update Role"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
