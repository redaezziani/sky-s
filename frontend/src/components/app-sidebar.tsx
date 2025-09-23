// frontend/src/components/app-sidebar.tsx

"use client";

import type * as React from "react";
import {
  IconDashboard,
  IconUsers,
  IconShield,
  IconCategory,
  IconPackage,
  IconShoppingCart,
  IconStar,
  IconChartLine,
  IconInnerShadowTop,
  IconTag,
  IconBoxSeam,
  IconClipboardList,
  IconSettings2,
} from "@tabler/icons-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";

import { getMessages } from "@/lib/locale";
import { useLocale } from "@/components/local-lang-swither";
import {
  publicRoutes,
  authenticatedRoutes,
  roleProtectedRoutes,
} from "@/lib/routes";
import { UserRole, User } from "@/types/auth.types";

export function AppSidebar({
  user, // <-- Now only use the `user` prop passed from the server
  ...props
}: React.ComponentProps<typeof Sidebar> & { user: User | null }) {
  // We no longer need the `useAuth` hook here for user data
  const { locale } = useLocale();
  const t = getMessages(locale);

  // Helper function to check if a route is accessible based on the user's role
  const isRouteAccessible = (url: string) => {
    if (!user) return false;
    if (authenticatedRoutes.includes(url)) {
      return true;
    }
    const allowedRoles =
      roleProtectedRoutes[url as keyof typeof roleProtectedRoutes];
    if (!allowedRoles) {
      return true;
    }
    return allowedRoles.includes(user.role as UserRole);
  };

  const navMainData = [
    {
      title: t.sidebar.links.dashboard,
      url: "/dashboard",
      icon: IconDashboard,
      active: isRouteAccessible("/dashboard"),
    },
    {
      title: t.sidebar.links.users,
      url: "/dashboard/users",
      icon: IconUsers,
      active: isRouteAccessible("/dashboard/users"),
    },
    {
      title: t.sidebar.links.roles,
      url: "/dashboard/roles",
      icon: IconShield,
      active: isRouteAccessible("/dashboard/roles"),
    },
    {
      title: t.sidebar.links.categories,
      url: "/dashboard/categories",
      icon: IconCategory,
      active: isRouteAccessible("/dashboard/categories"),
    },
    {
      title: t.sidebar.links.products,
      url: "/dashboard/products",
      icon: IconPackage,
      active: isRouteAccessible("/dashboard/products"),
    },
    {
      title: t.sidebar.links.productVariants,
      url: "/dashboard/product-variants",
      icon: IconTag,
      active: isRouteAccessible("/dashboard/product-variants"),
    },
    {
      title: t.sidebar.links.skus,
      url: "/dashboard/skus",
      icon: IconBoxSeam,
      active: isRouteAccessible("/dashboard/skus"),
    },
    {
      title: t.sidebar.links.orders,
      url: "/dashboard/orders",
      icon: IconShoppingCart,
      active: isRouteAccessible("/dashboard/orders"),
    },
    {
      title: t.sidebar.links.orderItems,
      url: "/dashboard/order-items",
      icon: IconClipboardList,
      active: isRouteAccessible("/dashboard/order-items"),
    },
    {
      title: t.sidebar.links.reviews,
      url: "/dashboard/reviews",
      icon: IconStar,
      active: false,
    },
    {
      title: t.sidebar.links.analytics,
      url: "/dashboard/analytics",
      icon: IconChartLine,
      active: isRouteAccessible("/dashboard/analytics"),
    },
    {
      title: t.sidebar.links.settings,
      url: "/dashboard/settings",
      icon: IconSettings2,
      active: isRouteAccessible("/dashboard/settings"),
    },
  ];

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">
                  {t.sidebar.storeManager}
                </span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navMainData} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser
          user={
            user
              ? {
                  name: user.name ?? t.sidebar.user,
                  email: user.email,
                  avatar: "/avatars/default.jpg",
                }
              : {
                  name: t.sidebar.user,
                  email: "user@example.com",
                  avatar: "/avatars/default.jpg",
                }
          }
        />
      </SidebarFooter>
    </Sidebar>
  );
}
