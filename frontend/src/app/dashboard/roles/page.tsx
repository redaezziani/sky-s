"use client";

import { PermissionsMatrix } from "@/components/role/permissions-matrix";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Users } from "lucide-react";
import { useTranslations } from "next-intl";

export default function RolesPage() {
  const t = useTranslations("permissions.page");

  return (
    <section className="flex flex-col gap-6 w-full px-6 py-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
      </div>

      <Tabs defaultValue="permissions" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            {t("tabPermissions")}
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t("tabUsers")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="permissions" className="mt-6">
          <PermissionsMatrix />
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t("comingSoon")}</p>
            <p className="text-sm">{t("manageFromUsers")}</p>
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
}
