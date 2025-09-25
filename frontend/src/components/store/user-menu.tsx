// frontend/src/components/user-menu.tsx
import { getServerUser } from "@/lib/server-auth";
import { UserMenuClient } from "./user-menu-client";

export default async function UserMenu() {
  const user = await getServerUser();

  return <UserMenuClient user={user} />;
}
