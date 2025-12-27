'use server';

import { cookies } from 'next/headers';
import { Locale, DEFAULT_LOCALE } from '@/lib/locale';

const COOKIE_NAME = 'NEXT_LOCALE';

export async function getUserLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  return (cookieStore.get(COOKIE_NAME)?.value as Locale) || DEFAULT_LOCALE;
}

export async function setUserLocale(locale: Locale) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, locale, {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: '/',
  });
}
