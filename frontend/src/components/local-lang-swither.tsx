//local-lang-provider.tsx

"use client";

import { useControllableState } from "@radix-ui/react-use-controllable-state";
import { motion } from "motion/react";
import { useCallback, useEffect, useState, createContext, useContext } from "react";
import { cn } from "@/lib/utils";
import { Locale, DEFAULT_LOCALE } from "@/lib/locale";

// Locales list
const localesList: { key: Locale; label: string }[] = [
  { key: "en", label: "EN" },
  { key: "ja", label: "JA" },
];

// ---------- Locale Context ----------
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

export const useLocale = (): LocaleContextType => {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used inside LocaleProvider");
  return context;
};

// ---------- Locale Switcher ----------
export type LocaleSwitcherProps = {
  className?: string;
};

export const LocaleSwitcher = ({ className }: LocaleSwitcherProps) => {
  const { locale, setLocale } = useLocale();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClick = useCallback(
    (newLocale: Locale) => {
      setLocale(newLocale);
    },
    [setLocale]
  );

  if (!mounted) return null;

  return (
    <div
      className={cn(
        "relative isolate flex h-8 rounded-full bg-background p-1 ring-1 ring-border",
        className
      )}
    >
      {localesList.map(({ key, label }) => {
        const isActive = key === locale;
        return (
          <button
            key={key}
            type="button"
            aria-label={label}
            className="relative h-6 w-6 rounded-full"
            onClick={() => handleClick(key)}
          >
            {isActive && (
              <motion.div
                className="absolute inset-0 rounded-full bg-secondary"
                layoutId="activeLocale"
                transition={{ type: "spring", duration: 0.5 }}
              />
            )}
            <span
              className={cn(
                "relative z-10 m-auto flex h-full w-full items-center justify-center text-xs font-medium",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
