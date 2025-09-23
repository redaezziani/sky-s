// frontend/src/components/nav-main.tsx

import Link from "next/link";
import { type Icon } from "@tabler/icons-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { usePath } from "@/hooks/use-path";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: Icon;
    active: boolean;
  }[];
}) {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => {
            const isActive = usePath(item.url);

            const linkContent = (
              <>
                {item.icon && <item.icon />}
                <span>{item.title}</span>
              </>
            );

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  tooltip={item.title}
                  asChild
                  // Conditionally apply active styles
                  className={
                    isActive
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground duration-200 ease-linear"
                      : ""
                  }
                >
                  {item.active ? (
                    // If the item is active, render a functional Link component
                    <Link href={item.url}>{linkContent}</Link>
                  ) : (
                    // If the item is NOT active, render a non-functional div with disabled styling
                    <div
                      aria-disabled="true"
                      className="cursor-not-allowed opacity-50"
                    >
                      {linkContent}
                    </div>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
