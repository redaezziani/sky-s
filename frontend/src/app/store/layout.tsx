import Header from "@/components/store/header";
export const metadata = {
  title: "ダッシュボード | マイアプリ",
  description: "ストア管理用の管理者ダッシュボードです",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`relative flex flex-col gap-4 justify-start items-center  min-h-screen  pt-16`}
    >
      <Header />
      {children}
    </div>
  );
}
