"use client";

import { useEffect } from "react";
import { useUsersStore, type User } from "@/stores/users-store";
import { EnhancedUserTable } from "@/components/user/enhanced-user-table";

export default function UsersPage() {
  const { fetchUsers } = useUsersStore();
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <section className="flex flex-col gap-4 w-full px-6 py-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Users Management</h1>
          <p className="text-muted-foreground">
            Manage your application users and their roles
          </p>
        </div>
      </div>

      {/* <EnhancedUserTable /> */}
      <EnhancedUserTable />
    </section>
  );
}
