"use client";

import { useState, useEffect } from "react";
import { DataTable, TableColumn } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreHorizontal, Trash2, Edit, UserPlus, Shield } from "lucide-react";
import { useRolesStore, type Role } from "@/stores/roles-store";
import { toast } from "sonner";
import { EditRoleDialog } from "./edit-role-dialog";
import { CreateRoleDialog } from "./create-role-dialog";

interface EnhancedRoleTableProps {
  // Remove the callback props since we'll handle them internally
}

export function EnhancedRoleTable({}: EnhancedRoleTableProps) {
  const {
    roles,
    loading,
    error,
    selectedRoles,
    fetchRoles,
    deleteRole,
    bulkDeleteRoles,
    selectRole,
    clearSelection,
    clearError,
  } = useRolesStore();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<number | null>(null);

  // Clear error when component unmounts or when error changes
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  // Handle individual role deletion
  const handleDeleteRole = async () => {
    if (roleToDelete) {
      try {
        await deleteRole(roleToDelete);
        toast.success("Role deleted successfully");
        setDeleteDialogOpen(false);
        setRoleToDelete(null);
      } catch (error) {
        console.error("Failed to delete role:", error);
        toast.error("Failed to delete role");
      }
    }
  };

  // Handle bulk deletion
  const handleBulkDelete = async () => {
    if (selectedRoles.length > 0) {
      try {
        await bulkDeleteRoles(selectedRoles);
        toast.success(`${selectedRoles.length} role(s) deleted successfully`);
        setBulkDeleteDialogOpen(false);
        clearSelection();
      } catch (error) {
        console.error("Failed to delete roles:", error);
        toast.error("Failed to delete roles");
      }
    }
  };

  // Handle search with debounce
  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  // Define table columns
  const columns: TableColumn<Role>[] = [
    {
      key: "select",
      label: "Select",
      render: (role) => (
        <Checkbox
          checked={selectedRoles.includes(role.id)}
          onCheckedChange={() => selectRole(role.id)}
          aria-label="Select role"
        />
      ),
    },
    {
      key: "id",
      label: "ID",
      render: (role) => <div className="font-mono text-sm">{role.id}</div>,
    },
    {
      key: "name",
      label: "Name",
      render: (role) => (
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <div className="font-medium">{role.name}</div>
        </div>
      ),
    },
    {
      key: "users",
      label: "Users",
      render: (role) => (
        <Badge variant="outline">
          {role._count?.Users || 0} user{role._count?.Users !== 1 ? 's' : ''}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      label: "Created",
      render: (role) => {
        const date = new Date(role.createdAt);
        return (
          <div className="text-sm text-muted-foreground">
            {date.toLocaleDateString()}
          </div>
        );
      },
    },
    {
      key: "updatedAt",
      label: "Updated",
      render: (role) => {
        const date = new Date(role.updatedAt);
        return (
          <div className="text-sm text-muted-foreground">
            {date.toLocaleDateString()}
          </div>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      render: (role) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild> 
              <EditRoleDialog role={role} />
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setRoleToDelete(role.id);
                setDeleteDialogOpen(true);
              }}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <DataTable
        title="Role Management"
        data={roles}
        columns={columns}
        searchKeys={["name"]}
        searchPlaceholder="Search roles by name..."
        emptyMessage="No roles found"
        showCount={true}
        customHeader={
          <div className="flex items-center gap-2">
            {selectedRoles.length > 0 && (
              <Button
                variant="destructive"
                onClick={() => setBulkDeleteDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete Selected ({selectedRoles.length})
              </Button>
            )}
            <CreateRoleDialog />
          </div>
        }
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              role and may affect users assigned to this role.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRole}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Multiple Roles</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedRoles.length} role{selectedRoles.length !== 1 ? 's' : ''}?
              This action cannot be undone and may affect users assigned to these roles.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Roles
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
