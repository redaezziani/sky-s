"use client";

import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { useLocale as useNextIntlLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Locale } from "@/lib/locale";

// Locales list
const localesList: { key: Locale; label: string }[] = [
  { key: "en", label: "EN" },
  { key: "es", label: "ES" },
  { key: "fr", label: "FR" },
];

// ---------- Locale Switcher ----------
export type LocaleSwitcherProps = {
  className?: string;
};

export const LocaleSwitcher = ({ className }: LocaleSwitcherProps) => {
  const currentLocale = useNextIntlLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClick = useCallback(
    (newLocale: Locale) => {
      // Remove current locale prefix from pathname
      const pathWithoutLocale = pathname.replace(/^\/(en|es|fr)/, '');
      // Navigate to new locale
      router.push(`/${newLocale}${pathWithoutLocale || '/'}`);
    },
    [pathname, router]
  );

  if (!mounted) return null;

  return (
    <div
      className={cn(
        "relative isolate flex h-8  rounded-full bg-background p-1 ring-1 ring-border",
        className
      )}
    >
      {localesList.map(({ key, label }) => {
        const isActive = key === currentLocale;
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
