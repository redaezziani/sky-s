// frontend/src/components/app-sidebar.tsx

'use client';

import type * as React from 'react';
import {
  IconDashboard,
  IconUsers,
  IconShield,
  IconCategory,
  IconPackage,
  IconShoppingCart,
  IconStar,
  IconChartLine,
  IconTag,
  IconBoxSeam,
  IconClipboardList,
  IconSettings,
  IconFileText,
} from '@tabler/icons-react';

const SpainIcon = () => <img src="/svgs/spain.webp" alt="Spain flag" className="w-7 aspect-video" />;
const MoroccoIcon = () => <img src="/svgs/morocco.webp" alt="Morocco flag" className="w-7 aspect-video" />;

import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { ThemeSwitcher } from '@/components/theme/theme-switcher';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

import { useTranslations } from 'next-intl';
import { useLocale } from '@/components/local-lang-swither';
import {
  authenticatedRoutes,
  roleProtectedRoutes,
} from '@/lib/routes';
import { UserRole, User } from '@/types/auth.types';

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & { user: User | null }) {
  const t = useTranslations('sidebar');
  const { locale } = useLocale();

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
    // @ts-expect-error - Role type mismatch between User.role and UserRole enum
    return allowedRoles.includes(user.role as UserRole);
  };

  const navMainData = [
    {
      title: t('links.dashboard'),
      url: '/dashboard',
      icon: IconDashboard,
      active: isRouteAccessible('/dashboard'),
    },
    {
      title: t('links.users'),
      url: '/dashboard/users',
      icon: IconUsers,
      active: isRouteAccessible('/dashboard/users'),
    },
    {
      title: t('links.roles'),
      url: '/dashboard/roles',
      icon: IconShield,
      active: isRouteAccessible('/dashboard/roles'),
    },
    {
      title: t('links.categories'),
      url: '/dashboard/categories',
      icon: IconCategory,
      active: isRouteAccessible('/dashboard/categories'),
    },
    {
      title: t('links.products'),
      url: '/dashboard/products',
      icon: IconPackage,
      active: isRouteAccessible('/dashboard/products'),
    },
    {
      title: t('links.productVariants'),
      url: '/dashboard/product-variants',
      icon: IconTag,
      active: isRouteAccessible('/dashboard/product-variants'),
    },
    {
      title: t('links.skus'),
      url: '/dashboard/skus',
      icon: IconBoxSeam,
      active: isRouteAccessible('/dashboard/skus'),
    },
    {
      title: t('links.orders'),
      url: '/dashboard/orders',
      icon: IconShoppingCart,
      active: isRouteAccessible('/dashboard/orders'),
    },
    {
      title: t('links.orderItems'),
      url: '/dashboard/order-items',
      icon: IconClipboardList,
      active: isRouteAccessible('/dashboard/order-items'),
    },
    {
      title: t('links.reviews'),
      url: '/dashboard/reviews',
      icon: IconStar,
      active: false,
    },
    {
      title: t('links.analytics'),
      url: '/dashboard/analytics',
      icon: IconChartLine,
      active: isRouteAccessible('/dashboard/analytics'),
    },
    {
      title: t('links.logs'),
      url: '/dashboard/logs',
      icon: IconFileText,
      active: isRouteAccessible('/dashboard/logs'),
    },
    {
      title: t('links.lots'),
      url: '/dashboard/lots',
      icon: SpainIcon,
      active: isRouteAccessible('/dashboard/lots'),
    },
    {
      title: t('links.lotArrivals'),
      url: '/dashboard/lot-arrivals',
      icon: MoroccoIcon,
      active: isRouteAccessible('/dashboard/lot-arrivals'),
    },
    {
      title: t('links.settings'),
      url: '/dashboard/settings',
      icon: IconSettings,
      active: isRouteAccessible('/dashboard/settings'),
    },
  ];

  return (
    <Sidebar
      side={locale === 'ar' ? 'right' : 'left'}
      collapsible="offcanvas"
      {...props}
    >
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
                {/* <svg
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
                </svg> */}
                <img src="/icon.png" alt="Store Manager" className="h-6" />
                <span className="text-base text-primary font-semibold">
                  {t('storeManager')}
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
        <div className="flex items-center justify-between px-2 py-2">
          <ThemeSwitcher />
        </div>
        <NavUser
          user={
            user
              ? {
                  name: user.name ?? t('user'),
                  email: user.email,
                  avatar: '/avatars/default.jpg',
                }
              : {
                  name: t('user'),
                  email: 'user@example.com',
                  avatar: '/avatars/default.jpg',
                }
          }
        />
      </SidebarFooter>
    </Sidebar>
  );
}
