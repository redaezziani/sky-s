"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Locale, DEFAULT_LOCALE } from "@/lib/locale";

type LocaleContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export const LocaleProvider = ({ children }: { children: React.ReactNode }) => {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const saved = (localStorage.getItem("locale") as Locale) || DEFAULT_LOCALE;
    setLocaleState(saved);
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("locale", newLocale);
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
};

export const useLocaleContext = (): LocaleContextType => {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocaleContext must be used within a LocaleProvider");
  }
  return context;
};
