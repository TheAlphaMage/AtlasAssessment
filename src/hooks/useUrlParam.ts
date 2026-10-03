"use client";

/**
 * Keeps one piece of page state (a tab, a filter) in the URL, e.g. /clients?tab=at-risk,
 * so the view can be bookmarked or linked from the banner. Needs a <Suspense> boundary above it.
 */
import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function useUrlParam(name: string): [string | null, (value: string | null) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setValue = useCallback(
    (value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(name, value);
      else params.delete(name);
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [name, pathname, router, searchParams],
  );

  return [searchParams.get(name), setValue];
}
