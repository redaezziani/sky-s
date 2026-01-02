'use client';

import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { ModeToggle } from './theme-btn';
import { LocaleSwitcher } from './local-lang-swither';
import { useTranslations } from 'next-intl';

export function SiteHeader() {
  const pathname = usePathname();
  const t = useTranslations('sidebar');

  // Map of routes to translation keys
  const routeToTranslationKey: Record<string, string> = {
    '/dashboard': 'links.dashboard',
    '/dashboard/users': 'links.users',
    '/dashboard/roles': 'links.roles',
    '/dashboard/categories': 'links.categories',
    '/dashboard/products': 'links.products',
    '/dashboard/product-variants': 'links.productVariants',
    '/dashboard/skus': 'links.skus',
    '/dashboard/orders': 'links.orders',
    '/dashboard/order-items': 'links.orderItems',
    '/dashboard/reviews': 'links.reviews',
    '/dashboard/analytics': 'links.analytics',
    '/dashboard/settings': 'links.settings',
  };

  // Get the page title dynamically from the current pathname
  const title = useMemo(() => {
    // Check if we have a direct match for the pathname
    if (routeToTranslationKey[pathname]) {
      return t(routeToTranslationKey[pathname]);
    }

    // Handle dynamic routes (e.g., /dashboard/products/123)
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length >= 2) {
      const baseRoute = `/${segments.slice(0, 2).join('/')}`;
      if (routeToTranslationKey[baseRoute]) {
        return t(routeToTranslationKey[baseRoute]);
      }
    }

    // Fallback to dashboard
    return t('links.dashboard');
  }, [pathname, t]);

  return (
    <header className="flex justify-between h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex  md:w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{title}</h1>
      </div>
      <div className=" mx- flex px-2 items-center gap-2">
        <ModeToggle />
        <LocaleSwitcher />
      </div>
    </header>
  );
}
