"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

export function useSearchQuery(param: string = "q", debounceMs: number = 400) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // initialize state from URL
  const [query, setQuery] = useState(searchParams.get(param) || "");

  // sync state when URL changes
  useEffect(() => {
    setQuery(searchParams.get(param) || "");
  }, [searchParams, param]);

  // update URL (debounced)
  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());

      if (query) {
        params.set(param, query);
      } else {
        params.delete(param);
      }

      router.replace(`${pathname}?${params.toString()}`);
    }, debounceMs);

    return () => clearTimeout(timeout);
  }, [query, debounceMs, pathname, router, searchParams, param]);

  return [query, setQuery] as const;
}
