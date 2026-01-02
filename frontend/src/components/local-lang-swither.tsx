"use client";

import { motion } from "motion/react";
import { useCallback, useEffect, useState, useTransition } from "react";
import { useLocale as useNextIntlLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { Locale } from "@/lib/locale";
import { setUserLocale } from "@/services/locale";

// Locales list with native labels
const localesList: {
  key: Locale;
  label: string;
  nativeLabel: string;
}[] = [
  { key: "en", label: "EN", nativeLabel: "إن" },
  { key: "es", label: "ES", nativeLabel: "إس" },
  { key: "fr", label: "FR", nativeLabel: "فر" },
  { key: "ar", label: "AR", nativeLabel: "عر" },
];

// ---------- Locale Switcher ----------
export type LocaleSwitcherProps = {
  className?: string;
};

// ---------- useLocale Hook ----------
export const useLocale = () => {
  const locale = useNextIntlLocale() as Locale;
  return { locale };
};

export const LocaleSwitcher = ({ className }: LocaleSwitcherProps) => {
  const currentLocale = useNextIntlLocale() as Locale;
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClick = useCallback(
    (newLocale: Locale) => {
      startTransition(async () => {
        await setUserLocale(newLocale);
      });
    },
    []
  );

  if (!mounted) return null;

  return (
    <div
      className={cn(
        "relative isolate flex h-8  rounded-full bg-background p-1 ring-1 ring-border",
        className
      )}
    >
      {localesList.map(({ key, label, nativeLabel }) => {
        const isActive = key === currentLocale;
        const displayLabel = currentLocale === "ar" ? nativeLabel : label;
        return (
          <button
            key={key}
            type="button"
            aria-label={label}
            className="relative h-6 w-6 rounded-full"
            onClick={() => handleClick(key)}
            disabled={isPending}
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
              {displayLabel}
            </span>
          </button>
        );
      })}
    </div>
  );
};
