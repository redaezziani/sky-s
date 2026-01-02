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
import { MoreHorizontal, Trash2 } from "lucide-react";
import { useUsersStore, type User } from "@/stores/users-store";
import { toast } from "sonner";
import { CreateUserDialog } from "@/components/user/create-user-dialog";
import { EditUserDialog } from "@/components/user/edit-user-dialog";
import PaginationTable from "@/components/pagination-table";
import { IconCircleCheckFilled } from "@tabler/icons-react";
import { useSearchQuery } from "@/hooks/use-search-query";
import { useLocale } from "@/components/local-lang-swither";
import { getMessages } from "@/lib/locale";

type EnhancedUserTableProps = Record<string, never>;

export function EnhancedUserTable({}: EnhancedUserTableProps) {
     const [search, setSearch] = useSearchQuery("q", 400);
  const {
    users,
    loading,
    error,
    selectedUsers,
    total,
    currentPage,
    pageSize,
    totalPages,
    fetchUsers,
    deleteUser,
    bulkDeleteUsers,
    selectUser,
    clearSelection,
    clearError,
    setPage,
    setPageSize,
    toggleUserStatus,
  } = useUsersStore();
  const { locale } = useLocale();
  const lang = getMessages(locale);
  const t = lang.pages?.users?.components?.userTable || {};

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Show error toast
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const handleDeleteUser = async (id: string) => {
    try {
      await deleteUser(id);
      toast.success(t.toast?.deleted || "User deleted successfully");
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (error) {
      toast.error(t.toast?.deleteFailed || "Failed to delete user");
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await toggleUserStatus(id);
      toast.success(t.toast?.statusUpdated || "User status updated successfully");
    } catch (error) {
      toast.error(t.toast?.statusUpdateFailed || "Failed to update user status");
    }
  };

  const handleBulkDelete = async () => {
    try {
      await bulkDeleteUsers(selectedUsers);
      toast.success(
        t.toast?.bulkDeleted?.replace('{0}', String(selectedUsers.length)) ||
        `${selectedUsers.length} users deleted successfully`
      );
      setBulkDeleteDialogOpen(false);
    } catch (error) {
      toast.error(t.toast?.bulkDeleteFailed || "Failed to delete users");
    }
  };

  const columns: TableColumn<User>[] = [
    {
      key: "select",
      label: t.table?.select || "Select",
      render: (user) => (
        <Checkbox
          checked={selectedUsers.includes(user.id)}
          onCheckedChange={() => selectUser(user.id)}
          aria-label={t.table?.selectRow || "Select user"}
        />
      ),
    },
    {
      key: "name",
      label: t.table?.name || "Name",
      render: (user) => <div className="font-medium">{user.name}</div>,
    },
    {
      key: "email",
      label: t.table?.email || "Email",
      render: (user) => (
        <div className="text-sm text-muted-foreground">{user.email}</div>
      ),
    },
    {
      key: "role",
      label: t.table?.role || "Role",
      render: (user) => (
        <Badge
          variant={
            user.role === "ADMIN" ? "secondary" :
            user.role === "MODERATOR" ? "secondary" : "secondary"
          }
        >
          {user.role}
        </Badge>
      ),
    },
    {
      key: "status",
      label: t.table?.status || "Status",
      render: (user) => (
        <div className="flex items-center gap-2">
          <Badge variant={user.isActive ? "secondary" : "secondary"}>
            {user.isActive ? (t.table?.active || "Active") : (t.table?.inactive || "Inactive")}
          </Badge>
          {user.isEmailVerified && (
             <Badge variant={"secondary"}>
            {user.isEmailVerified ? <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400" /> : <IconCircleCheckFilled className="fill-red-500 dark:fill-red-400" /> }
          {user.isEmailVerified ? (t.table?.emailVerified || "Email Verified") : (t.table?.emailUnverified || "Email Unverified")}
        </Badge>
          )}
        </div>
      ),
    },
    {
      key: "stats",
      label: t.table?.activity || "Activity",
      render: (user) => (
        <div className="text-xs text-muted-foreground">
          {user._count && (
            <div>
              {t.table?.orders || "Orders"}: {user._count.orders} | {t.table?.reviews || "Reviews"}: {user._count.reviews}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "lastLogin",
      label: t.table?.lastLogin || "Last Login",
      render: (user) => {
        const date = user.lastLoginAt ? new Date(user.lastLoginAt) : null;
        return (
          <div className="text-sm text-muted-foreground">
            {date ? date.toLocaleDateString() : (t.table?.never || "Never")}
          </div>
        );
      },
    },
    {
      key: "createdAt",
      label: t.table?.created || "Created",
      render: (user) => {
        const date = new Date(user.createdAt);
        return (
          <div className="text-sm text-muted-foreground">
            {date.toLocaleDateString()}
          </div>
        );
      },
    },
    {
      key: "actions",
      label: t.table?.actions || "Actions",
      render: (user) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">{t.table?.openMenu || "Open menu"}</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
             <EditUserDialog
                user={editingUser}
              />
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleToggleStatus(user.id)}>
              {user.isActive ? (t.table?.deactivate || "Deactivate") : (t.table?.activate || "Activate")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setUserToDelete(user.id);
                setDeleteDialogOpen(true);
              }}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t.table?.delete || "Delete"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
  useEffect(() => {
    fetchUsers({ search });
  }, [search, fetchUsers]);

  return (
    <div className="space-y-4">
      <DataTable
        title={t.title || "User Management"}
        data={users}
        columns={columns}
        searchKeys={["name", "email", "role"]}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t.table?.searchPlaceholder || "Search users by name, email, or role..."}
        emptyMessage={t.table?.empty || "No users found"}
        showCount={true}
        customHeader={
          <div className="flex items-center gap-2">
            {selectedUsers.length > 0 && (
              <Button
                variant="destructive"
                onClick={() => setBulkDeleteDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                {t.table?.deleteSelected?.replace('{0}', String(selectedUsers.length)) ||
                  `Delete Selected (${selectedUsers.length})`}
              </Button>
            )}
            <CreateUserDialog />
          </div>
        }
      />
      {/* Single Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.dialogs?.deleteTitle || "Are you sure?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.dialogs?.deleteDesc || "This action cannot be undone. This will permanently delete the user."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.dialogs?.cancel || "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => userToDelete && handleDeleteUser(userToDelete)}
            >
              {t.dialogs?.delete || "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Dialog */}
      <AlertDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t.dialogs?.bulkDeleteTitle?.replace('{0}', String(selectedUsers.length)) ||
                `Delete ${selectedUsers.length} users?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t.dialogs?.bulkDeleteDesc || "This action cannot be undone. This will permanently delete the selected users."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.dialogs?.cancel || "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete}>
              {t.dialogs?.deleteAll || "Delete All"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pagination */}
      {total > 0 && (
        <PaginationTable
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={total}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}
    </div>
  );
}
