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
import { useLocale } from "@/components/local-lang-swither"; // LocaleProvider hook

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();

  // ✅ use reactive locale
  const { locale } = useLocale();
  const t = getMessages(locale);

  const navMainData = [
    { title: t.sidebar.links.dashboard, url: "/dashboard", icon: IconDashboard },
    { title: t.sidebar.links.users, url: "/dashboard/users", icon: IconUsers },
    { title: t.sidebar.links.roles, url: "/dashboard/roles", icon: IconShield },
    { title: t.sidebar.links.categories, url: "/dashboard/categories", icon: IconCategory },
    { title: t.sidebar.links.products, url: "/dashboard/products", icon: IconPackage },
    { title: t.sidebar.links.productVariants, url: "/dashboard/product-variants", icon: IconTag },
    { title: t.sidebar.links.skus, url: "/dashboard/skus", icon: IconBoxSeam },
    { title: t.sidebar.links.orders, url: "/dashboard/orders", icon: IconShoppingCart },
    { title: t.sidebar.links.orderItems, url: "/dashboard/order-items", icon: IconClipboardList },
    { title: t.sidebar.links.reviews, url: "/dashboard/reviews", icon: IconStar },
    { title: t.sidebar.links.analytics, url: "/dashboard/analytics", icon: IconChartLine },
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
                <span className="text-base font-semibold">{t.sidebar.storeManager}</span>
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
