"use client";

/** The warning strip at the top of every page. It can be dismissed until the plan's message changes. */
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TriangleAlert, X } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { PlanResult } from "@/lib/domain/types";
import { buildBanner } from "./buildBanner";

const STORAGE_KEY = "atlas-banner-dismissed";
/** Pages that already explain the issue in full, or need the space (chat), skip the banner. */
const PAGES_WITHOUT_BANNER = ["/local-market", "/assistant", "/data-health"];

export function GlobalBanner({ result }: { result: PlanResult }) {
  const pathname = usePathname();
  const banner = buildBanner(result);
  const message = banner ? `${banner.title} ${banner.description}` : "";
  const [dismissedMessage, setDismissedMessage] = useState<string | null>(null);

  // Remember the dismissal for this browser tab only. Storage can be blocked, so failures are ignored.
  useEffect(() => {
    try {
      setDismissedMessage(sessionStorage.getItem(STORAGE_KEY));
    } catch {}
  }, []);

  function dismiss() {
    setDismissedMessage(message);
    try {
      sessionStorage.setItem(STORAGE_KEY, message);
    } catch {}
  }

  if (!banner || dismissedMessage === message || PAGES_WITHOUT_BANNER.includes(pathname)) return null;

  return (
    <Alert variant="warning" className="mb-5 flex items-center gap-2.5 px-3 py-1.5 animate-in fade-in-0 slide-in-from-top-1">
      <TriangleAlert className="shrink-0" />
      <p className="min-w-0 flex-1 truncate">
        <span className="font-medium">{banner.title}</span>
        <span className="text-muted-foreground"> · {banner.description}</span>
      </p>
      <Button asChild size="xs" variant="ghost" data-print="hide">
        <Link href={banner.actionHref}>{banner.actionLabel} →</Link>
      </Button>
      <Button size="icon-xs" variant="ghost" onClick={dismiss} aria-label="Dismiss" data-print="hide">
        <X />
      </Button>
    </Alert>
  );
}
