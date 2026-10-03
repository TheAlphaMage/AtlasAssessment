/** Title row at the top of every page: the title, an optional ⓘ explanation, optional short meta text and actions. */
import type { ReactNode } from "react";
import { InfoTip } from "./InfoTip";

interface PageHeaderProps {
  title: string;
  /** Explanation shown in a tooltip next to the title, so the page itself stays quiet. */
  info?: ReactNode;
  /** A few muted words after the title, e.g. "43 rows · 500 t". */
  meta?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ title, info, meta, actions }: PageHeaderProps) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {info && <InfoTip label={`About ${title}`}>{info}</InfoTip>}
        {meta && <span className="ml-1 text-sm text-muted-foreground tabular-nums">{meta}</span>}
      </div>
      {actions && (
        <div className="flex items-center gap-2" data-print="hide">
          {actions}
        </div>
      )}
    </div>
  );
}
