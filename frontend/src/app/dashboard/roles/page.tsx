"use client";

import { useEffect } from "react";
import { useRolesStore } from "@/stores/roles-store";
import { EnhancedRoleTable } from "@/components/role/enhanced-role-table";

export default function RolesPage() {
  const { fetchRoles } = useRolesStore();

  // Fetch roles on component mount
  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  return (
    <section className="flex flex-col gap-4 w-full px-6 py-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Roles Management</h1>
          <p className="text-muted-foreground">
            Manage user roles and permissions to control access levels throughout the system
          </p>
        </div>
      </div>

      <EnhancedRoleTable />
    </section>
  );
}
