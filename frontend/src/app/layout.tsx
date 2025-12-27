export const metadata = {
  title: 'ダッシュボード | マイアプリ',
  description: 'ストア管理用の管理者ダッシュボードです',
};
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { Geist, Geist_Mono } from 'next/font/google';
import { getUserLocale } from '@/services/locale';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const messages = await getMessages();
  const locale = await getUserLocale();

  return (
    <html lang={locale}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
            <Toaster />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
