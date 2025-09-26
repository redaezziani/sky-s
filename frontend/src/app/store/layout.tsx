import Header from "@/components/store/header";
import { getServerUser } from "@/lib/server-auth";
export const metadata = {
  title: "ダッシュボード | マイアプリ",
  description: "ストア管理用の管理者ダッシュボードです",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerUser();
  return (
    <div
      className={`relative flex flex-col gap-4 justify-start items-center  min-h-screen  pt-16`}
    >
      <Header user={user} />
      {children}
    </div>
  );
}
