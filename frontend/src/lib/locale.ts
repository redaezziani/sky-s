import { useEffect, useState } from "react";

// src/lib/locale.ts
export type Locale = "en" | "ja" | "fr" | "ar";
export const DEFAULT_LOCALE: Locale = "en";

export function getMessages(locale: Locale) {
  try {
    return require(`../messages/${locale}.json`);
  } catch {
    return require("../messages/en.json");
  }
}

// Hook for reading locale anywhere
export const useLocale = (): Locale => {
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const saved = (localStorage.getItem("locale") as Locale) || DEFAULT_LOCALE;
    setLocale(saved);
  }, []);

  return locale;
};