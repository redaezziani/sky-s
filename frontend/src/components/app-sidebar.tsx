"use client";

import type * as React from "react";
import {
  IconDashboard,
  IconUsers,
  IconShield,
  IconCategory,
  IconPackage,
  IconShoppingCart,
  IconTruck,
  IconStar,
  IconChartLine,
  IconInnerShadowTop,
  IconTag,
  IconBoxSeam,
  IconClipboardList,
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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();

  const navMainData = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Users",
      url: "/dashboard/users",
      icon: IconUsers,
    },
    {
      title: "Roles",
      url: "/dashboard/roles",
      icon: IconShield,
    },
    {
      title: "Categories",
      url: "/dashboard/categories",
      icon: IconCategory,
    },
    {
      title: "Products",
      url: "/dashboard/products",
      icon: IconPackage,
    },
    {
      title: "Product Variants",
      url: "/dashboard/product-variants",
      icon: IconTag,
    },
    {
      title: "SKUs & Inventory",
      url: "/dashboard/skus",
      icon: IconBoxSeam,
    },
    {
      title: "Orders",
      url: "/dashboard/orders",
      icon: IconShoppingCart,
    },
    {
      title: "Order Items",
      url: "/dashboard/order-items",
      icon: IconClipboardList,
    },
    {
      title: "Reviews",
      url: "/dashboard/reviews",
      icon: IconStar,
    },
    {
      title: "Analytics",
      url: "/dashboard/analytics",
      icon: IconChartLine,
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
                <span className="text-base font-semibold">Store Manager</span>
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
                  name: user.name,
                  email: user.email,
                  avatar: "/avatars/default.jpg",
                }
              : {
                  name: "User",
                  email: "user@example.com",
                  avatar: "/avatars/default.jpg",
                }
          }
        />
      </SidebarFooter>
    </Sidebar>
  );
}
