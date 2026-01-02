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

function NavMenuItem({ item }: { item: { title: string; url: string; icon?: Icon; active: boolean } }) {
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
        className={
          isActive
            ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground duration-200 ease-linear"
            : ""
        }
      >
        {item.active ? (
          <Link href={item.url}>{linkContent}</Link>
        ) : (
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
}

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
          {items.map((item) => (
            <NavMenuItem key={item.title} item={item} />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
