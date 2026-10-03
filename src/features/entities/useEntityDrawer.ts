"use client";

/**
 * Opens and closes the detail drawer through the URL (?open=C02), so a drawer can be shared as a link
 * and the browser's Back button closes it. Needs a <Suspense> boundary above it (Next.js rule for useSearchParams).
 */
import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export const DRAWER_PARAM = "open";

export function useEntityDrawer() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlWith = useCallback(
    (id: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (id) params.set(DRAWER_PARAM, id);
      else params.delete(DRAWER_PARAM);
      const query = params.toString();
      return query ? `${pathname}?${query}` : pathname;
    },
    [pathname, searchParams],
  );

  /** Open a drawer, adding a history entry (Back closes it). */
  const openEntity = useCallback((id: string) => router.push(urlWith(id), { scroll: false }), [router, urlWith]);
  /** Switch to another entity without adding history (used by the ← / → keys). */
  const switchEntity = useCallback((id: string) => router.replace(urlWith(id), { scroll: false }), [router, urlWith]);
  const closeEntity = useCallback(() => router.replace(urlWith(null), { scroll: false }), [router, urlWith]);

  return { openId: searchParams.get(DRAWER_PARAM), openEntity, switchEntity, closeEntity };
}
