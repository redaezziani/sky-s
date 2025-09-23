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
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & { user: User | null }) {
  const { locale } = useLocale();
  const t = getMessages(locale);

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
              <a
                href="#"
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 200 160"
                  className="h-11 w-11"
                >
                  <path
                    fill="currentColor"
                    d="M 75.36,45.39 C 80.93,35.58 86.31,26.09 92.56,15.10 C 119.73,63.00 145.09,109.48 170.40,155.88 C 169.04,157.80 167.65,157.30 166.40,157.30 C 151.24,157.35 136.08,157.24 120.92,157.43 C 118.89,157.47 117.64,156.09 116.65,153.63 C 99.72,120.88 82.67,88.19 65.56,55.54 C 64.37,53.63 64.13,52.28 65.39,50.29 C 68.18,45.21 70.61,39.92 75.36,45.39 Z"
                  />
                  <path
                    fill="currentColor"
                    d="M 15.00,157.32 C 9.54,157.33 4.58,157.33 -1.22,157.33 C 9.28,138.97 19.04,121.87 29.59,103.42 C 40.12,121.82 50.84,138.85 62.40,157.32 C 49.61,157.32 38.56,157.32 15.00,157.32 Z"
                  />
                </svg>
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
